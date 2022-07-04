import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import {v4 as uuid} from 'uuid';
import {MongoClient, ObjectId} from 'mongodb';

dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());
//DataBase
let dbMyWallet;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect().then(() => {
    dbMyWallet = mongoClient.db("my-wallet-data-base");
})

//Route
server.post('/sign-up', async (request, response) => {
    const body = request.body;
    
    //Schema
    const regexName = /[a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ]\ [a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ]/;
    const regexPassword = /[a-zA-Z0-9]{8,}/ 
    const validationSchema = joi.object({
        name: joi.string().pattern(regexName).required(),
        email: joi.string().email().required(),
        password: joi.string().pattern(regexPassword).required()
    })
    const validation = validationSchema.validate(body, {abortEarly: false});

    //Controller
    if(!validation.error){
        const encryptPassword = bcrypt.hashSync(body.password, 11);
        const newUser = {
            name: body.name,
            email: body.email,
            password: encryptPassword
        }

        try{
            const equalName = await dbMyWallet.collection('users').findOne({name: body.name});
            const equalEmail = await dbMyWallet.collection('users').findOne({email: body.email});

            if(equalName){
                return response.status(409).send('User name already in use.');
            } 
            if(equalEmail){
                return response.status(409).send('User email already in use.')
            }

            await dbMyWallet.collection('users').insertOne(newUser);
            return response.status(200).send(`Everything ok! Welcome ${body.name}!`)
            
        } catch(error){
            return response.status(500).send('Server error :(.')
        }
    } else {
        const errorData = validation.error.details;

        errorData.map(error => {
            if(error.context.key === 'name'){
                return response.status(401).send('Please, use first name and last name only.')
            }

            if(error.context.key === 'email'){
                return response.status(401).send('You must use a valid email format.')
            }

            if(error.context.key === 'password'){
                return response.status(401).send('Password must have at least 8 digits.')
            }
        })
    }
})

//Route
server.post('/sign-in', async (request, response) => {
    const body = request.body;
    
    //Schema
    const regexPassword = /[a-zA-Z0-9]{8,}/ 
    const validationSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().pattern(regexPassword).required()
    })
    const validation = validationSchema.validate(body, {abortEarly: false});

    //Controller
    if(!validation.error){
        try{
            const validUser = await dbMyWallet.collection('users').findOne({email: body.email});
            const checkPassword = bcrypt.compareSync(body.password, validUser.password);
            if(validUser && checkPassword){
                const token = uuid();
                const userId = validUser._id;
                await dbMyWallet.collection('sessions').insertOne({name: validUser.name, userId, token})
                return response.status(200).send({name: validUser.name, email: validUser.email, token});
            } else {
                return response.status(409).send('Invalid email or password.')
            }
        } catch(error){
            return response.status(409).send('Invalid email or password.')
        }
    } else {
        return response.status(409).send('Invalid email or password.')
    }
})

//Route
server.post('/transactions', async (request, response) => {
    const body = request.body;
    const authorization = request.headers.authorization;
    const token = authorization?.replace(/Bearer |'/g, '');
    const date = dayjs().format('DD/MM');
    
    //Schema
    const regexMoney = /[0-9]\.[0-9]{2}/;
    const regexDescription = /[a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ]{3,}/
    const transactionSchema = joi.object({
        value: joi.string().pattern(regexMoney).required(),
        description: joi.string().pattern(regexDescription).required(),
        type: joi.any().valid('deposit', 'withdraw').required()
    });
    const validation = transactionSchema.validate(body, {abortEarly: false});
    
    //Controller
    if(!validation.error){
        try {
            const user = await dbMyWallet.collection('sessions').findOne({token});
            const newTransaction = {userId: user.userId, name: user.name, date, ...body};
            const register = await dbMyWallet.collection('transactions').insertOne(newTransaction);
            const newTransactionData = {id: register.insertedId, name: user.name, date, ...body}
            return response.status(200).send(newTransactionData);
        } catch(error){
            return response.status(500).send('Server error :(.')
        }
    } else {
        const errorData = validation.error.details;
        errorData.map(error => {
            if(error.context.key === 'value'){
                return response.status(401).send('Money value must be like "...xx.xx"');
            } else if(error.context.key === 'description'){
                return response.status(401).send('Description must be a string with at leat 4 characters.');
            } else if(error.context.key === 'type'){
                return response.status(401).send('Type must be either "deposit" or "withdraw".');
            }
        })
    }
})

//Route
server.get('/transactions', async (request, response) => {
    const authorization = request.headers.authorization;
    const token = authorization?.replace(/Bearer |'/g, '');
    
    //Controller
    try{
        const user = await dbMyWallet.collection('sessions').findOne({token});
        const userId = user.userId;
        const userTransactions = await dbMyWallet.collection('transactions').find({userId}).toArray();
        if(userTransactions.length > 0){
            const transactionsList = [];
            userTransactions.map(t => {
                delete t.userId;
                transactionsList.push(t);
            })
            return response.status(200).send(transactionsList);
        } else {
            return response.status(200).send(userTransactions);
        }
    }catch(error){
        return response.status(500).send('Server error :/')
    }
})

//Route
server.delete('/transactions/:id', async (request, response) => {
    const authorization = request.headers.authorization;
    const token = authorization?.replace(/Bearer |'/g, '');
    const id = request.params.id;

    //Controller
    try {
        const user = await dbMyWallet.collection('sessions').findOne({token});
        const userName = user.name;
        const transaction = await dbMyWallet.collection('transactions').findOne({_id: new ObjectId(id)});
        const transactionName = transaction.name;

        if(userName === transactionName){
            await dbMyWallet.collection('transactions').deleteOne({_id: new ObjectId(id)})
            return response.status(200).send('Register was deleted successfully.')
        } else {
            return response.status(401);
        }
    } catch(error){
        response.status(404).send(`Message not found.`)
    }
})

server.put('/transactions/:id', async (request, response) => {
    const authorization = request.headers.authorization;
    const body = request.body;
    const id = request.params.id;
    const token = authorization?.replace(/Bearer |'/g, '');
    
    try {
        const user = await dbMyWallet.collection('sessions').findOne({token});
        const transaction = await dbMyWallet.collection('transactions').findOne({_id: new ObjectId(id)});
        if(user.name === transaction.name){
            await dbMyWallet.collection('transactions')
                            .updateOne({_id: new ObjectId(id)}, 
                                       {$set: {value: body.value, 
                                               description: body.description}})
            return response.status(200).send('Register updated successfully.');
        } else {
            return response.status(401);
        }

    } catch(error){
        return response.status(500).send('Server error :(.')
    }

})

server.listen(5000)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import bcrypt from "bcrypt";
import {MongoClient} from "mongodb";

dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());
//DataBase
let dbMyWallet;
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017");
mongoClient.connect().then(() => {
    dbMyWallet = mongoClient.db("my-wallet-data-base");
})

//Route
server.post('/sign-up', async (request, response) => {
    const body = request.body;
    
    //Schema
    const regexName = /[a-zA-Z0-9]\ [a-zA-Z0-9]/;
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

server.listen(5000) 
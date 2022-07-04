import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from 'dayjs';
import {MongoClient, ObjectId} from 'mongodb';

dotenv.config();

let dbMyWallet;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect().then(() => {
    dbMyWallet = mongoClient.db("my-wallet-data-base");
})

export async function postTransaction(request, response){
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
}

export async function getTransaction(request, response){
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
}

export async function deleteTransaction(request, response){
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
        response.status(404).send(`Register not found.`)
    }
}

export async function updateTransaction(request, response){
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

}
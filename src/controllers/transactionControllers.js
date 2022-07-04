import dotenv from 'dotenv';
import dayjs from 'dayjs';
import {MongoClient, ObjectId} from 'mongodb';
dotenv.config();

let dbMyWallet;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect().then(() => {
    dbMyWallet = mongoClient.db(process.env.MONGO_DATABASE);
})

export async function postTransaction(request, response){
    const body = request.body;
    const authorization = request.headers.authorization;
    const token = authorization?.replace(/Bearer |'/g, '');
    const date = dayjs().format('DD/MM');
    
    try {
        const user = await dbMyWallet.collection('sessions').findOne({token});
        const newTransaction = {userId: user.userId, name: user.name, date, ...body};
        const register = await dbMyWallet.collection('transactions').insertOne(newTransaction);
        const newTransactionData = {id: register.insertedId, name: user.name, date, ...body}
        return response.status(200).send(newTransactionData);
    } catch(error){
        return response.status(500).send('Server error :(.')
    }
}

export async function getTransaction(request, response){
    const authorization = request.headers.authorization;
    const token = authorization?.replace(/Bearer |'/g, '');
    
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
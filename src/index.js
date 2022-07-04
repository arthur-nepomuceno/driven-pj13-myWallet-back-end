import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';
import { signUp, signIn} from './controllers/userControllers.js';
import { postTransaction, getTransaction, deleteTransaction, updateTransaction} from './controllers/transactionControllers.js';


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

server.post('/sign-up', signUp);

server.post('/sign-in', signIn);

server.post('/transactions', postTransaction);

server.get('/transactions', getTransaction);

server.delete('/transactions/:id', deleteTransaction);

server.put('/transactions/:id', updateTransaction);

const PORT = process.env.PORT || 5000;
server.listen(PORT)
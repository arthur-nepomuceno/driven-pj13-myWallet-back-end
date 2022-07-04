import express from 'express';
import cors from 'cors';
import userRouter from './routers/userRouter.js';
import transactionsRouter from './routers/transactionRouter.js';

const server = express();
server.use(cors());
server.use(express.json());

server.use(userRouter);
server.use(transactionsRouter);

const PORT = process.env.PORT || 5000;
server.listen(PORT)
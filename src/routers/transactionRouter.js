import express from "express";
import { validatePostTransaction } from "../middlewares/validatePostTransaction.js";
import { postTransaction, getTransaction, deleteTransaction, updateTransaction} from '../controllers/transactionControllers.js';

const transactionsRouter = express.Router();
transactionsRouter.post('/transactions', validatePostTransaction, postTransaction);
transactionsRouter.get('/transactions', getTransaction);
transactionsRouter.delete('/transactions/:id', deleteTransaction);
transactionsRouter.put('/transactions/:id', updateTransaction);

export default transactionsRouter;
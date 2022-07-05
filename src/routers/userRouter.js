import express from 'express';
import { validateSignUp } from '../middlewares/validateSignUp.js';
import { validateSignIn } from '../middlewares/validateSignIn.js';
import { signUp, signIn} from '../controllers/userControllers.js';
 
const userRouter = express.Router();
userRouter.post('/sign-up', validateSignUp, signUp);
userRouter.post('/sign-in', validateSignIn, signIn);

export default userRouter;
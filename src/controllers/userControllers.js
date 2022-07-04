import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import {v4 as uuid} from 'uuid';
import {MongoClient} from 'mongodb';
dotenv.config();

let dbMyWallet;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect().then(() => {
    dbMyWallet = mongoClient.db(process.env.MONGO_DATABASE);
})


export async function signUp(request, response){
    const body = request.body;

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
}

export async function signIn (request, response){
    const body = request.body;

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
}
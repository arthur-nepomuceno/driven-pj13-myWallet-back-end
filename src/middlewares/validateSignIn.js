import joi from 'joi';

export async function validateSignIn(request, response, next){
    const body = request.body;
    
    const regexPassword = /[a-zA-Z0-9]{8,}/ 
    const validationSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().pattern(regexPassword).required()
    })
    const validation = validationSchema.validate(body, {abortEarly: false});

    if(validation.error){
        return response.status(409).send('Invalid email or password.')
    }

    next();
}
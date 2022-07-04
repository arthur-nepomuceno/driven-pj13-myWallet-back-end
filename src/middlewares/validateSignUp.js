import joi from 'joi';

export async function validateSignUp(request, response, next){
    const body = request.body;
    
    const regexName = /[a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ]\ [a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ]/;
    const regexPassword = /[a-zA-Z0-9]{8,}/ 
    const validationSchema = joi.object({
        name: joi.string().pattern(regexName).required(),
        email: joi.string().email().required(),
        password: joi.string().pattern(regexPassword).required()
    })
    const validation = validationSchema.validate(body, {abortEarly: false});

    if(validation.error){
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

    next();
}
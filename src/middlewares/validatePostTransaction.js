import joi from 'joi';

export async function validatePostTransaction(request, response, next){
    const body = request.body;

    const regexMoney = /[0-9]\.[0-9]{2}/;
    const regexDescription = /[a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ]{3,}/
    const transactionSchema = joi.object({
        value: joi.string().pattern(regexMoney).required(),
        description: joi.string().pattern(regexDescription).required(),
        type: joi.any().valid('deposit', 'withdraw').required()
    });
    const validation = transactionSchema.validate(body, {abortEarly: false});

    if(validation.error){
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

    next();
}
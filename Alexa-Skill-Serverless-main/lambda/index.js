const Alexa = require('ask-sdk-core');
const axios = require('axios');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const bucketName = '9fce09a0-e9f7-42d6-9742-d379618c2c3b-us-east-1';
const fileKey = 'filmes-salvos.json'

const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0ODExN2VmMmYyZmY4YWZkZWQ1NDc0M2JiNDhhNTMxNSIsIm5iZiI6MTcxOTEwMTQ3Ni4zOTIxNjgsInN1YiI6IjYyYWI2YzNlMDNiZjg0MDA2MTk5YTU2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.99KRpkJ_-qrWQPh6dlVMVAJUXFP_HVhGva46Bwgb4TI'

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Tudo bem, podemos falar sobre isso o dia inteiro';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const FilmesEmCartazIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Filmeintent';
    },
    async handle(handlerInput) {
        try {
            const options = {
                method: 'GET',
                url: 'https://api.themoviedb.org/3/trending/movie/day?language=pt-BR',
                headers: {
                    accept: 'application/json',
                    Authorization: 'Bearer ' + apiKey
                }
            };
            
            const response = await axios.request(options);
            const filmes = response.data.results
                                .map(obj => obj.title)
                                .slice(0, 3)
            const speakOutput = `Aqui estão alguns filmes em tendência: ${filmes.join(', ')}. \nGostaria de salvar esses filmes para assistir mais tarde?`;
            
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            sessionAttributes.filmes = filmes;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Você gostaria de salvar esses filmes?')
                .getResponse();
                
        } catch (error) {
            
            const speakOutput = 'Desculpe, houve um problema ao buscar os filmes em tendência. ' + error;
        
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};

const FilmesSalvosIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Salvosintent';
    },
    async handle(handlerInput) {
        try {
            const s3Params = {
                Bucket: bucketName,
                Key: fileKey
            };

            const data = await s3.getObject(s3Params).promise();
            const filmes = JSON.parse(data.Body.toString('utf-8')).filmes;

            const speakOutput = `Você salvou os seguintes filmes: ${filmes.join(', ')}`;

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        } catch (error) {
            const speakOutput = 'Desculpe, houve um problema ao buscar os filmes salvos. ' + error;

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};

const YesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
    },
    async handle(handlerInput) {
        try {
            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            const filmes = sessionAttributes.filmes || [];
            const speakOutput = 'Filmes salvos: ' + filmes.join(', ');
    
            const s3Params = {
                Bucket: bucketName,
                Key: fileKey,
                Body: JSON.stringify({ filmes }),
                ContentType: 'application/json'
            };

            await s3.putObject(s3Params).promise();
    
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        } catch (error) {
            
            const speakOutput = 'Desculpe, houve um problema. ' + error;
        
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};

const NoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Entendido, não salvarei os filmes';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        FilmesEmCartazIntentHandler,
        YesIntentHandler,
        NoIntentHandler,
        FilmesSalvosIntentHandler
        )
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();
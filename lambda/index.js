const Alexa = require('ask-sdk-core');
const axios = require('axios');

const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYzYxY2M5MGQ3MDAyMDk0NGZmOGJiODc1YjE3NTAzYiIsIm5iZiI6MTczMzk1MTAwMC4zOTkwMDAyLCJzdWIiOiI2NzU5ZmUxODlhMjBmMmZiOTg5NDk5NjIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.b4f4y8OwrhX0oLxTRp7clfJVDKyYQveyE_hENEQQ1fM';

const AWS = require("aws-sdk");
const ddbAdapter = require('ask-sdk-dynamodb-persistence-adapter');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Bem-vindo à Skill Filmes Atuais. Diga "ajuda" para saber como usar essa Skill.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Diga "ajuda" para saber como usar essa Skill.')
            .getResponse();
    }
};

const FilmesEmAltaIntentHandler = {
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
            const filmes = response.data.results.map(obj => obj.title).slice(0, 3);

            const speakOutput = `Os filmes em alta atualmente são: ${filmes.join(', ')}. <break time="200ms"/>
            Se quiser saber mais sobre algum filme você pode dizer o nome dele para mais informações. <break time="200ms"/>
            Se quiser salvar algum filme basta dizer "salvar" e logo depois falar o nome do filme.`;

            const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            sessionAttributes.filmes = filmes;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(`Se quiser saber mais sobre algum filme você pode dizer o nome dele para mais informações. <break time="200ms"/>
                 Se quiser salvar algum filme basta dizer "salvar" e logo depois falar o nome do filme.`)
                .getResponse();
        } catch (error) {
            console.error(error);
            const speakOutput = 'Desculpe, não consegui buscar os filmes no momento.';

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};

const SalvarFilmeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SalvarFilmeIntent';
    },
    async handle(handlerInput) {
        const filme = Alexa.getSlotValue(handlerInput.requestEnvelope, "filme");
        
        if (!filme) {
            const speakOutput = 'Desculpe, não consegui entender o nome do filme. Pode tentar novamente e dizer o nome completo do filme?';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Diga o nome do filme para salvar.')
                .getResponse();
        }
        
        try {
           
            const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

        
            if (!persistentAttributes.filmes) {
                persistentAttributes.filmes = [];
            }

        
            if (!persistentAttributes.filmes.includes(filme)) {
                persistentAttributes.filmes.push(filme);
            }

        
            handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
            await handlerInput.attributesManager.savePersistentAttributes();

            const speakOutput = `O filme ${filme} foi salvo na sua lista.`;

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Deseja saber mais sobre algum filme? Diga o nome do filme.')
                .getResponse();
        } catch (error) {
            console.error('Erro ao salvar o filme:', error);
            const speakOutput = 'Desculpe, houve um problema ao salvar o filme. Tente novamente mais tarde.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Deseja saber mais sobre algum filme? Diga o nome do filme.')
                .getResponse();
        }
    }
};



const DetalhesFilmeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DetalhesFilmeIntent';
    },
    async handle(handlerInput) {
        const filmeSlot = handlerInput.requestEnvelope.request.intent.slots.filme.value;

        if (!filmeSlot) {
            const speakOutput = 'Não há informações disponíveis para esse filme. Diga um filme válido.';

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Diga o nome de um filme válido para ver suas informações.')
                .getResponse();
        }

        try {
            const options = {
                method: 'GET',
                url: `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(filmeSlot)}&language=pt-BR`,
                headers: {
                    accept: 'application/json',
                    Authorization: 'Bearer ' + apiKey
                }
            };

            const response = await axios.request(options);
            const filme = response.data.results[0];

            if (filme) {
                
                let dataFormatada = 'uma data não especificada';
                if (filme.release_date) {
                    const [ano, mes, dia] = filme.release_date.split('-');
                    dataFormatada = `${dia}/${mes}/${ano}`;
                }
                
                const speakOutput = `O filme ${filme.title} foi lançado em ${dataFormatada}. 
                Sinopse: ${filme.overview}. <break time="200ms"/>
                Se quiser saber mais sobre algum filme você pode dizer o nome dele para mais informações. <break time="200ms"/>
                Se quiser salvar algum filme basta dizer "salvar" e logo depois falar o nome do filme.`;

                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt('Deseja salvar esse filme? Diga "salvar" e logo em seguida o nome do filme')
                    .getResponse();
            } else {
                const speakOutput = 'Não encontrei informações sobre esse filme. Deseja buscar outro? Diga o nome do filme em alta';

                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt('Diga o nome de outro filme para buscar.')
                    .getResponse();
            }
        } catch (error) {
            console.error(error);
            const speakOutput = 'Houve um problema ao buscar informações sobre o filme. Tente novamente mais tarde.';

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};

const FilmesSalvosIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FilmesSalvosIntent';
    },
    async handle(handlerInput) {
        try {
         
            const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

        
            if (persistentAttributes.filmes && persistentAttributes.filmes.length > 0) {
                const filmesSalvos = persistentAttributes.filmes.join(', ');

                const speakOutput = `Os filmes salvos na sua lista são: ${filmesSalvos}. 
                Deseja saber mais sobre algum desses filmes? Basta dizer o nome do filme.`;

                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt('Diga o nome de um dos filmes para saber mais informações.')
                    .getResponse();
            } else {
                const speakOutput = 'Você ainda não salvou nenhum filme. Para salvar um filme, diga "salvar" seguido do nome do filme.';

                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt('Diga "salvar" seguido do nome de um filme para começar.')
                    .getResponse();
            }
        } catch (error) {
            console.error('Erro ao recuperar os filmes salvos:', error);

            const speakOutput = 'Houve um problema ao recuperar seus filmes salvos. Tente novamente mais tarde.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};

const RemoverFilmeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RemoverFilmeIntent';
    },
    async handle(handlerInput) {
        const filme = Alexa.getSlotValue(handlerInput.requestEnvelope, "filme");

        if (!filme) {
            const speakOutput = 'Desculpe, não consegui entender o nome do filme. Pode tentar novamente?';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Diga "remover" e em seguida o nome do filme para remover com sucesso.')
                .getResponse();
        }

        try {
      
            const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

            if (!persistentAttributes.filmes || persistentAttributes.filmes.length === 0) {
                const speakOutput = 'Você não possui filmes salvos para remover.';
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt('Diga "salvar" seguido do nome de um filme para adicionar à sua lista.')
                    .getResponse();
            }

            const filmeIndex = persistentAttributes.filmes.indexOf(filme);

            if (filmeIndex === -1) {
                const speakOutput = `O filme ${filme} não está na sua lista de favoritos. Tente remover um filme que já tenha sido salvo.`;
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt('Diga o nome de um filme que já esteja na sua lista.')
                    .getResponse();
            }

            persistentAttributes.filmes.splice(filmeIndex, 1);

            handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
            await handlerInput.attributesManager.savePersistentAttributes();

            const speakOutput = `O filme ${filme} foi removido da sua lista de favoritos.`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Deseja saber mais sobre outro filme ou salvar um novo filme?')
                .getResponse();
        } catch (error) {
            console.error('Erro ao remover o filme:', error);
            const speakOutput = 'Desculpe, houve um problema ao remover o filme. Tente novamente mais tarde.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};




const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = `Você pode perguntar pelos filmes em alta, buscar informações sobre um filme específico ou salvar um filme em uma lista de favoritos.  <break time="200ms"/>
        Diga o nome do filme para saber mais informações sobre <break time="50ms"/> ou diga "filmes em alta". <break time="200ms"/>
        Se quiser já salvar um filme específico, diga "salvar" e logo em seguida o nome do filme. <break time="200ms"/>
        Se quiser ver seus filmes salvos diga "filmes salvos" <break time="200ms"/>
        Se quiser remover um filme da lista diga "remover" e logo em seguida o nome do filme` ;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Até mais!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(error);
        const speakOutput = 'Desculpe, não consegui processar sua solicitação. Tente novamente.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        FilmesSalvosIntentHandler,
        LaunchRequestHandler,
        FilmesEmAltaIntentHandler,
        SalvarFilmeIntentHandler,
        DetalhesFilmeIntentHandler,
        RemoverFilmeIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withPersistenceAdapter(
        new ddbAdapter.DynamoDbPersistenceAdapter({
            tableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
            createTable: false,
            dynamoDBClient: new AWS.DynamoDB({apiVersion: 'latest', region: process.env.DYNAMODB_PERSISTENCE_REGION})
        })
    )
    .lambda();

# Como usar o projeto!

Clique em Teste > Alexa Simulator e selecione o input.

## Fluxo de execução

1. Mande alguma frase que inclua "filmes atuais", você irá receber uma mensagem de Bem vindo e poderá digitar no input "ajuda" para ver as funcionalidades da Skill.

   1. Isso significa que você conseguiu entrar na Skill corretamente e irá conseguir usá-la.
2. Agora envie "filmes em alta".

   1. Nesse momento ele irá fazer uma conexão com The Movie DB para solicitar os 3 primeiros filmes em alta.
   2. Ele irá te falar quais são os filmes em alta e te dar instruções para saber mais sobre algum filme ou salvar algum deles na lista de favoritos.
3. Caso deseje salvar, diga "salvar" e logo depois o nome do filme.

   1. Nesse momento o código irá fazer uma conexão com o DynamoDB e irá armazenar o filme em uma lista.
4. Caso deseje ver informações detalhadas de algum filme basta dizer o nome do filme.

   1. Nesse momento o código irá fazer uma conexão com a API do The Movie DB novamente para buscar as informações do filme solicitado e informá-las ao usuário.
5. Caso deseje ver seus filmes salvos basta dizer "filmes salvos".

   1. Nesse momento o código irá consultar a lista armazenada no DynamoDB e irá retornar os filmes da lista para o usuário.
6. Caso deseje remover um filme da lista basta dizer "remover" e logo em seguida o nome do filme.

   1. Nesse momento o código irá consultar a lista armazenada no DynamoDB e irá verificar se o filme informado existe na lista. Se sim, ele remove o filme da lista.

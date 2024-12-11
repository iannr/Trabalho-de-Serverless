# Como usar o projeto!

Clique em Teste > Alexa Simulator e selecione o input.

## Fluxo para exibir/salvar filmes

1. Mande alguma frase que inclua "filmes atuais", você irá receber "Tudo bem, podemos falar sobre isso o dia inteiro".

   1. Isso significa que você conseguiu entrar na Skill corretamente.
2. Agora envie "melhores filmes".

   1. Nesse momento ele irá fazer uma conexão com The Movie DB para solicitar os 3 primeiros filmes em alta.
   2. Após isso, ele irá perguntar se deseja salvar.
3. Caso deseje salvar, diga "sim".

   1. Nesse momento o código irá fazer uma conexão com um bucket S3 e armazenar a lista de filmes demonstradas.

## Fluxo para imprimir filmes salvos

1. Mande alguma frase que inclua "filmes atuais", você irá receber "Tudo bem, podemos falar sobre isso o dia inteiro".
   1. Isso significa que você conseguiu entrar na Skill corretamente.
2. Agora envie "assitir depois".
   1. Nesse momento o código irá fazer conexão com o bucket S3, receber os arquivos com os filmes e imprimir.

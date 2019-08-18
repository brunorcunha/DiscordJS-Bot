# DiscordJS-Bot

Bot para Discord feito com Discord.JS. 

## Configurando

Para criar um bot, acessa o [portal do desenvolvedor Discord](https://discordapp.com/developers/applications/), crie um aplicativo e depois crie um bot.

Com o bot criado, pegue o token e coloque no arquivo de configuração da pasta `config/token.js` seguindo o exemplo:

```
module.exports = {
  token: 'SEU_TOKEN_AQUI'
}
```

## Colocando o bot em um servidor

Na pagina de desenvolvedor Discord, acesse a opção `OAuth2`. 
* Role até `OAUTH2 URL GENERATOR` 
* Em `SCOPES`, selecione `bot`. 
* Será gerado um link, copie e cole no navegador.
* No link aparecerá os servidores onde você é ADMINISTRADOR. Selecione um servidor e clique em `autorizar`.

## Executando o bot

Na pasta do projeto você pode executar:

```
npm start
```

O bot será executado e aparecerá uma mensagem no console confirmando o login.

## Comandos do BOT de MÚSICA

```
/join
Bot entra no canal de voz.

/leave
Bot sai do canal de voz.

/play [pesquisa]
Busca no Youtube os vídeos correspondentes e exibe numa lista.

/pause
Pausa a música atual.

/resume
Continua a reprodução de uma música pausada.

/nowplaying
Mostra a música atualmente em reprodução.

/next
/skip
Para a reprodução da música atual e vai para próxima, se houver.

/volume [numero de 1 a 200]
Altera o volume do bot.

/list
Lista todas as músicas da Playlist.

/clear 
Apaga todas as músicas da Playlist.

/repeat
/loop [all ou song ou none]
Coloca/Retira uma música ou uma Playlist do loop.

/reset
Limpa a Playlist e desconecta do chat de voz.
```
const Discord = require('discord.js')
const client = new Discord.Client()
const musicbot = require('./musicbot.js')

const token = require('./config/token.js').token

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  client.user.setPresence({
    game: { name: 'as mãos pro alto', url: '', type: 'STREAMING' },
    status: 'online'
  })
  functions.setClient(client)
})

client.on('message', (msg) => {
  if (msg.author.bot) return

  const message = msg.content.trim()
  const prefix = '/'
  const command = message.substring(prefix.length).split(/[ \n]/)[0].trim()
  const suffix = message.substring(prefix.length + command.length).trim()
  const args = message.slice(prefix.length + command.length).trim().split(/ +/g)

  if (message.startsWith(prefix) && msg.channel.type === 'text') {
    if (musicbot[command]) {
      return musicbot[command](msg, suffix, args)
    }
  }
})

client.login(token)

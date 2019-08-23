const Discord = require('discord.js')
const emoji = require('discord-emoji')
const ytdl = require('ytdl-core')
const { YTSearcher } = require('ytsearcher')

const YtToken = require('./config/token.js').yt
const searcher = new YTSearcher(YtToken)

let playlist = {
  songs: new Array(),
  last: null,
  loop: 'none',
  volume: 10
}
let client = null

const embedCard = {
  selectOption: (res) => {
    const embed = new Discord.RichEmbed()
    embed.setColor('DARK_PURPLE')
    embed.setDescription('Escolhe a música, piranha:')
    for (let x = 0; x < 5; x++) {
      embed.addField(`Opção ${x + 1}`, `${tratarString(res.currentPage[x].title)}`)
    }
    return embed
  },
  mount: (obj) => {
    obj = {
      type: '',
      msg: '',
      cor: 'GREEN',
      ...obj
    }
    const embed = new Discord.RichEmbed()
    let req = client.users.get(obj.video.requester)
    embed.setColor(obj.cor)
    embed.setDescription(`[${tratarString(obj.video.title)}](${obj.video.url})`)
    embed.setFooter(`Adicionado por ${req ? req.username : 'Ninguém'}`, req ? req.displayAvatarURL : null)
    if (obj.msg) embed.setAuthor(obj.msg)
    if (obj.type === 'thumb') embed.setThumbnail(`https://img.youtube.com/vi/${obj.video.id}/maxresdefault.jpg`)
    if (obj.type === 'big') embed.setImage(`https://img.youtube.com/vi/${obj.video.id}/maxresdefault.jpg`)
    return embed
  },
  videoCardPlaying: (video) => {
    return embedCard.mount({
      video,
      type: 'big',
      msg: 'Tocando agora'
    })
  },
  videoCardPlaylist: (video) => {
    return embedCard.mount({
      video,
      cor: 'GOLD',
      type: 'thumb',
      msg: 'Adicionado a fila'
    })
  }
}
const tratarString = (str) =>
  str
    .replace(/\\/g, '\\\\')
    .replace(/\`/g, '\\`')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')

let musicbot = {
  getVoiceConnection: async (msg) => {
    if (msg && msg.member && msg.member.voiceChannel) return await msg.member.voiceChannel.join()
    return null
  },
  search: async (msg, search) => {
    let msg2
    try {
      let res = await searcher.search(search, { type: 'video' })
      if (!res) return null

      const embed = embedCard.selectOption(res)
      msg2 = await msg.channel.send({ embed })

      const options = [
        emoji.symbols.one,
        emoji.symbols.two,
        emoji.symbols.three,
        emoji.symbols.four,
        emoji.symbols.five,
        emoji.symbols.x
      ]
      new Promise(async (resolve) => {
        try {
          await msg2.react(options[0])
          await msg2.react(options[1])
          await msg2.react(options[2])
          await msg2.react(options[3])
          await msg2.react(options[4])
          await msg2.react(options[5])
        } catch (error) {
          console.log(msg)
          console.log(error)
        }
        resolve()
      })

      const filter = (reaction, user) => options.includes(reaction.emoji.name) && user.id === msg.author.id

      let collected = await msg2.awaitReactions(filter, {
        max: 1,
        time: 30000,
        errors: [
          'time'
        ]
      })
      msg2.delete()
      const reaction = collected.first()

      switch (reaction.emoji.name) {
        case options[0]:
          return res.currentPage[0]
        case options[1]:
          return res.currentPage[1]
        case options[2]:
          return res.currentPage[2]
        case options[3]:
          return res.currentPage[3]
        case options[4]:
          return res.currentPage[4]
      }
      return null
    } catch (e) {
      if (msg2) msg2.delete()
      console.log(msg)
      console.error(e)
    }
  },
  updatePositions: () => {
    setTimeout(() => {
      let mm = 0
      let newsongs = []
      playlist.songs.forEach((s) => {
        try {
          if (s.position !== mm) s.position = mm
          newsongs.push(s)
          mm++
        } catch (e) {
          console.log(e)
        }
      })
      playlist.songs = newsongs
      if (playlist.last) playlist.last.position = 0
    }, 2000)
  },
  emptyPlaylist: () => {
    playlist = { songs: [], last: null, loop: 'none', volume: 10 }
  },
  updatePresence: () => {
    if (playlist.songs.length > 0 && playlist.last) {
      client.user.setPresence({
        game: {
          name: `🎵 ${playlist.last.title}`,
          type: 'LISTENING'
        },
        status: 'online'
      })
    } else {
      client.user.setPresence({
        game: { name: 'xvideos.com', url: 'http://xvideos.com', type: 'STREAMING' },
        status: 'online'
      })
    }
  },
  note: (type, text) => {
    switch (type) {
      case 'wrap':
        let ntext = text
          .replace(/`/g, '`' + String.fromCharCode(8203))
          .replace(/@/g, '@' + String.fromCharCode(8203))
          .replace(client.token, 'REMOVED')
        return '```\n' + ntext + '\n```'
      case 'note':
        return ':musical_note: ' + text.replace(/`/g, '`' + String.fromCharCode(8203))
      case 'search':
        return ':mag: ' + text.replace(/`/g, '`' + String.fromCharCode(8203))
      case 'fail':
        return ':no_entry_sign: ' + text.replace(/`/g, '`' + String.fromCharCode(8203))
      case 'font':
        return tratarString(text)
          .replace(/`/g, '`' + String.fromCharCode(8203))
          .replace(/@/g, '@' + String.fromCharCode(8203))
        console.error(new Error(`${type} é um tipo inválido.`))
    }
  }
}

const commands = {
  setClient: (c) => {
    client = c
  },
  next: (msg, suffix, args) => commands.skip(msg, suffix, args),
  repeat: (msg, suffix, args) => commands.loop(msg, suffix, args),
  teste: async (msg, suffix, args) => {
    const embed = new Discord.RichEmbed()
    embed.setDescription('Teste para mudar esse conteúdo')
    let msg2 = await msg.channel.send({ embed })

    await msg2.react(emoji.symbols.rewind)
    await msg2.react(emoji.symbols.fast_forward)

    const filter = msg2.createReactionCollector(
      (reaction, user) =>
        [
          emoji.symbols.fast_forward,
          emoji.symbols.rewind
        ].includes(reaction.emoji.name) && user.id === msg.author.id
    )

    filter.on('collect', (reaction) => {
      if (reaction.emoji.name === emoji.symbols.fast_forward) {
        embed.setDescription('ALTEREI A DESCRIÇÃO')
        embed.setFooter('E ADICIONEI UM FOOTER')
        msg2.edit(embed)
      } else if (reaction.emoji.name === emoji.symbols.rewind) {
        embed.setDescription('ALTEREI 2')
        embed.setFooter('ALTEREI 2')
        msg2.edit(embed)
      }
    })
  },
  play: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    if (!suffix) return msg.channel.send(musicbot.note('fail', 'Kd o nome da música, viado?'))

    let searchstring = suffix.trim()
    let msgProcurando = await msg.channel.send(musicbot.note('search', `\`Procurando: ${searchstring}\``))

    let res = await musicbot.search(msg, searchstring)
    msgProcurando.delete()
    if (!res) return

    res.requester = msg.author.id
    res.channelURL = `https://www.youtube.com/channel/${res.channelId}`
    res.queuedOn = new Date().toLocaleDateString('pt-BR', { weekday: 'long', hour: 'numeric' })
    res.requesterAvatarURL = msg.author.displayAvatarURL
    res.position = playlist.songs.length ? playlist.songs.length : 0
    playlist.songs.push(res)

    try {
      let embed
      if (playlist.songs.length === 1) {
        commands.executePlaylist(msg)
      } else {
        embed = embedCard.videoCardPlaylist(res)
        msg.channel.send({ embed })
      }
    } catch (e) {
      console.error(e)
    }
  },
  list: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    if (playlist.songs.length <= 0) return msg.channel.send(musicbot.note('fail', 'Playlist vazia!'))

    let newSongs = playlist.songs
      .map((video, index) => `${video.position + 1}: ${tratarString(video.title)}`)
      .join('\n')
    const embed = new Discord.RichEmbed()
    embed.setAuthor('Playlist')
    embed.setColor('BLUE')
    embed.setDescription(newSongs)
    return msg.channel.send({ embed })
  },
  nowplaying: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    if (playlist.songs.length <= 0) return msg.channel.send(musicbot.note('note', 'Playlist vazia.'))

    if (playlist.last) {
      const embed = embedCard.videoCardPlaying(playlist.last)
      msg.channel.send({ embed })
    }
  },
  volume: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    let voiceConnection = await musicbot.getVoiceConnection(msg)
    if (!voiceConnection) {
      return msg.channel.send(musicbot.note('fail', 'Não consigo entrar no chat de voz, bonita!'))
    }

    if (!suffix || isNaN(suffix)) return msg.channel.send(musicbot.note('fail', 'Coloca o valor do volume, lezada!'))
    suffix = parseInt(suffix)
    if (suffix > 200) suffix = 200
    else if (suffix < 1) suffix = 1

    playlist.volume = suffix
    msg.channel.send(musicbot.note('note', `Volume atualizado para ${suffix}%.`))

    const dispatcher = voiceConnection.player.dispatcher
    if (!dispatcher) return
    dispatcher.setVolume(suffix / 100)
  },
  skip: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    let voiceConnection = await musicbot.getVoiceConnection(msg)
    if (!voiceConnection) {
      return msg.channel.send(musicbot.note('fail', 'Não consigo entrar no chat de voz, bonita!'))
    }

    const dispatcher = voiceConnection.player.dispatcher
    if (dispatcher && !dispatcher.paused) {
      dispatcher.end()
    }
  },
  pause: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    let voiceConnection = await musicbot.getVoiceConnection(msg)
    if (!voiceConnection) {
      return msg.channel.send(musicbot.note('fail', 'Não consigo entrar no chat de voz, bonita!'))
    }

    const dispatcher = voiceConnection.player.dispatcher
    if (dispatcher && !dispatcher.paused) {
      dispatcher.pause()
      msg.channel.send(musicbot.note('note', 'Playlist pausada.'))
    }
  },
  resume: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    let voiceConnection = await musicbot.getVoiceConnection(msg)
    if (!voiceConnection) {
      return msg.channel.send(musicbot.note('fail', 'Não consigo entrar no chat de voz, bonita!'))
    }

    const dispatcher = voiceConnection.player.dispatcher
    if (dispatcher && dispatcher.paused) {
      dispatcher.resume()
      msg.channel.send(musicbot.note('note', 'Playlist retomada.'))
    }
  },
  join: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    let voiceConnection = await musicbot.getVoiceConnection(msg)
    if (!voiceConnection) {
      return msg.channel.send(musicbot.note('fail', 'Não consigo entrar no chat de voz, bonita!'))
    }
  },
  leave: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    let voiceConnection = await musicbot.getVoiceConnection(msg)
    if (!voiceConnection) {
      return msg.channel.send(musicbot.note('fail', 'Não consigo entrar no chat de voz, bonita!'))
    }

    if (voiceConnection.player.dispatcher) voiceConnection.player.dispatcher.end()
    voiceConnection.disconnect()
  },
  clear: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    musicbot.emptyPlaylist()
    msg.channel.send(musicbot.note('note', 'Playlist apagada!'))
  },
  loop: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    let voiceConnection = await musicbot.getVoiceConnection(msg)
    if (!voiceConnection) {
      return msg.channel.send(musicbot.note('fail', 'Não consigo entrar no chat de voz, bonita!'))
    }

    let suf = suffix.trim()
    if (
      !suf ||
      ![
        'all',
        'song',
        'none'
      ].includes(suf)
    )
      playlist.loop = 'all'
    else playlist.loop = suf

    switch (playlist.loop) {
      case 'all':
        return msg.channel.send(musicbot.note('note', 'Repetindo a playlist toda :repeat:'))
      case 'song':
        return msg.channel.send(musicbot.note('note', 'Repetindo a música atual :repeat_one:'))
      case 'none':
        return msg.channel.send(musicbot.note('note', 'Repetição desativada :arrow_forward:'))
    }
    const dispatcher = voiceConnection.player.dispatcher
    if (dispatcher && dispatcher.paused) {
      dispatcher.resume()
    }
  },
  reset: async (msg, suffix, args) => {
    if (!msg.member.voiceChannel) return msg.channel.send(musicbot.note('fail', `A bonita nem ta no chat de voz.`))

    let voiceConnection = await musicbot.getVoiceConnection(msg)
    if (!voiceConnection) {
      return msg.channel.send(musicbot.note('fail', 'Não consigo entrar no chat de voz, bonita!'))
    }

    musicbot.emptyPlaylist()
    musicbot.updatePresence()
    const dispatcher = voiceConnection.player.dispatcher
    if (dispatcher) {
      dispatcher.end()
    }
    return voiceConnection.disconnect()
  },
  executePlaylist: async (msg) => {
    let voiceConnection = await musicbot.getVoiceConnection(msg)
    if (!voiceConnection) {
      return msg.channel.send(musicbot.note('fail', 'Não consigo entrar no chat de voz, bonita!'))
    }

    if (playlist.songs.length == 0) {
      musicbot.updatePresence()
      if (voiceConnection) return voiceConnection.disconnect()
      return
    }

    let video

    if (!playlist.last) {
      video = playlist.songs[0]
    } else {
      if (playlist.loop === 'all') {
        video = playlist.songs.find((s) => s.position === playlist.last.position + 1)
        if (!video || !video.url) video = playlist.songs[0]
      } else if (playlist.loop === 'song') {
        video = playlist.last
      } else {
        video = playlist.songs.find((s) => s.position == playlist.last.position)
      }
    }

    if (!video) {
      video = playlist.songs ? playlist.songs[0] : false
      if (!video) commands.reset()
    }

    if ((playlist.last && playlist.loop !== 'song') || (!playlist.last && video)) {
      const embed = embedCard.videoCardPlaying(video)
      msg.channel.send({ embed })
    }

    try {
      playlist.last = video
      musicbot.updatePresence()

      let dispatcher = voiceConnection.playStream(ytdl(video.url, { filter: 'audioonly' }), {
        bitrate: '120000',
        seek: 1,
        volume: playlist.volume / 100
      })

      voiceConnection.on('error', (error) => {
        console.error(error)
        if (msg && msg.channel) msg.channel.send(musicbot.note('fail', `Eita guei, deu algum babado com a playlist...`))
      })

      dispatcher.on('error', (error) => {
        console.error(error)
        if (msg && msg.channel)
          msg.channel.send(musicbot.note('fail', `Meu pai amado, deu algum babado com a música...`))
      })

      dispatcher.on('end', () => {
        setTimeout(() => {
          let loop = playlist.loop

          if (voiceConnection && voiceConnection.channel.members.size <= 1) {
            commands.reset()
          }

          if (playlist.songs.length > 0) {
            if (!loop || loop === 'none') {
              playlist.songs.shift()
              musicbot.updatePositions()
              commands.executePlaylist(msg)
            } else if (loop === 'all' || loop === 'song') {
              commands.executePlaylist(msg)
            }
          } else if (playlist.songs.length <= 0) {
            commands.reset()
          }
        }, 1250)
      })
    } catch (error) {
      console.log(msg)
      console.log(error)
    }
  }
}

module.exports = commands

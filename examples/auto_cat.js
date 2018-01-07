'use strict'

// const fs = require('fs')
// const path = require('path')
const SteamConfig = require('../index.js')
const BB = require('bluebird')
const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const cli = require('cli')
const WebRequest = require('web-request')
const fxp = require('fast-xml-parser')

let steam = new SteamConfig()
let options = cli.parse({
  path: ['p', 'Path to Steam installation.', 'path', null],
  user: ['u', 'User to auto-categorize games for.', 'string', null],
  developer: ['d', 'Add name of developer as a category', 'boolean', 'false'],
  publisher: ['b', 'Add name of publisher as a category', 'boolean', 'false'],
  metacritic: ['m', 'Add metacritic score as a category', 'boolean', 'false'],
  noMeta: ['n', 'Make a "No Metacritic" category', 'boolean', 'false'],
  tags: ['t', 'Categorize by popular tags', 'boolean', 'false'],
  numTags: ['g', 'Number of tags to use', 'number', 3]
})

async function run () {
  let user = {}
  let gamesList = null

  if (options.path === null) {
    let installPath = steam.detectPath()
    console.info('Trying to find default path to Steam...')

    if (installPath !== null) {
      console.info(`Found at ${installPath}`)
      steam.setInstallPath(installPath)
    } else {
      process.error('Couldn\'t find default path to Steam.')
      process.exit(1)
    }
  }

  await steam.loadRegistryLM()
  await steam.loadLoginusers()

  let userKeys = Object.keys(steam.loginusers.users)

  if (options.user === null) {
    try {
      options.user = await steam.detectUser()
    } catch (err) {
      if (err.message.indexOf('cannot auto-detect') !== -1 || err.message.indexOf('no users') !== -1) {
        console.error(err.message)
        process.exit(1)
      } else {
        console.error(err)
        process.exit(1)
      }
    }
  }

  for (let i = 0; i < userKeys.length; i += 1) {
    if (steam.loginusers.users[userKeys[ i ]].AccountName === options.user || steam.loginusers.users[userKeys[ i ]].PersonaName === options.user) {
      console.info(`User: ${steam.loginusers.users[userKeys[ i ]].PersonaName}`)
      user = Object.assign({}, steam.loginusers.users[userKeys[ i ]])
      options.user = '' + user.AccountName
    }
  }

  if (user === '') {
    console.error('No user set.')
    process.exit(1)
  }

  try {
    if (fs.existsSync(path.join(__dirname, 'data', `${user.accountID}-games.json`))) {
      console.info('Loading cached game list...')
      gamesList = JSON.parse('' + await fs.readFileAsync(path.join(__dirname, 'data', `${user.accountID}-games.json`)))
    } else {
      console.info('Loading game list from internet...')
      let result = await WebRequest.get(`https://steamcommunity.com/profiles/${user.id64}/games/?tab=all&xml=1`)
      if (result.content.indexOf('The specified profile could not be found.') !== -1) {
        console.error('User not found...')
        process.exit(1)
      }
      gamesList = fxp.parse(result.content).gamesList.games.game
      if (!fs.existsSync(path.join(__dirname, 'data'))) {
        fs.mkdirSync(path.join(__dirname, 'data'))
      }
      await fs.writeFileAsync(path.join(__dirname, 'data', `${user.accountID}-games.json`), JSON.stringify(gamesList, null, 2))
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  console.info(gamesList.length)
}

run()

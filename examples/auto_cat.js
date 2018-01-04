'use strict'

// const fs = require('fs')
// const path = require('path')
const SteamConfig = require('../index.js')

let steam = new SteamConfig()

function getPlatformName () {
  let p = ''

  Object.assign(p, '' + require('os').platform())

  switch (p) {
    case 'linux':
      return 'Linux'
    case 'win32':
      return 'Windows'
    case 'darwin':
      return 'macOS'
    default:
      throw new Error(`Invalid platform ${p}`)
  }
}

function parseArgs () {
  if (process.argv.length === 2) {
    console.error('See "Usage" -- need args.')
    process.exit(1)
  }

  let args = process.argv.splice(2)
  let i
  let commands = {}

  for (i = 0; i < args.length; i += 1) {
    let arg = args[ i ].trim()
    if (arg === '--path' || arg === '-p') {
      if ((args.length - 1) < (i + 1)) {
        console.error('No path in args.')
        process.exit(1)
      } else {
        commands[ 'path' ] = args[ ++i ].trim()
      }
    } else if (arg === '--developer' || arg === '--dev' || arg === '-d') {
      commands[ 'developer' ] = 'true'
    } else if (arg === '--publisher' || arg === '--pub' || arg === '-u') {
      commands[ 'publisher' ] = 'true'
    } else if (arg === '--date' || arg === '--year' || arg === '-y') {
      commands[ 'date' ] = 'true'
    } else if (arg === '--metacritic' || arg === '--meta' || arg === '-m') {
      commands[ 'metacritic' ] = 'true'
    } else if (arg === '--no-metacritic' || arg === '--no-meta' || arg === '-n') {
      if ((args.length - 1) < (i + 1)) {
        console.error('See usage -- "no-meta" command has no mode argument.')
        process.exit(1)
      } else {
        console.info(args.length, i + 1)
        arg = args[ ++i ].trim()
        if (arg === 'ignore') {
          commands[ 'no-meta' ] = 'ignore'
        } else if (arg === 'categorize' || arg === 'cat') {
          commands[ 'no-meta' ] = 'cat'
        } else {
          console.error(`See usage -- invalid no-metacritic mode: ${arg}.`)
          process.exit(1)
        }
      }
    } else {
      console.error(`See usage -- invalid argument: ${arg}.`)
      process.exit(1)
    }
  }

  return commands
}

async function run () {
  let args = {}
  let installPath = null

  Object.assign(args, parseArgs())
  console.info(JSON.stringify(args, null, 2))
  if (!!+1 === true) { // eslint-disable-line no-constant-condition
    process.exit(1)
  }

  try {
    if (!args.hasOwnProperty('path')) {
      console.info('No path set; trying to find default...')
      installPath = steam.detectPath()
    } else {
      installPath = args.path
    }
    if (installPath !== null) {
      console.info(`Found default path to Steam for ${getPlatformName()}`)
      steam.setInstallPath(installPath)
    } else {
      console.error('Couldn\'t find default path to Steam.')
      process.exit(1)
    }
    await steam.loadRegistryLM()
    await steam.loadLoginusers()

    steam.setUser()

    if (steam.user === null) {
      console.error(`Error: No user associated with the Steam installation @ ${steam.loc}`)
      process.exit(1)
    }

    applyCats(args)
  } catch (err) {
    console.error(err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

async function applyCats (how) {
  try {
    if (!how.hasOwnProperty('path')) {
      how[ 'path' ] = steam.detectPath()
    }

    steam.setInstallPath(how.path)
    await steam.loadRegistryLM()
    await steam.loadLoginusers()
    steam.setUser()

    if (steam.user === null) {
      console.error(`Error: No user associated with the Steam installation @ ${steam.loc}`)
      process.exit(1)
    }

    await steam.loadSharedconfig()
    await steam.loadAppinfo()

    let sharedEntries = Object.keys(steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps)
    let appinfoEntries = []
    let missing = []
    let i
    let index
    let cats = []

    for (i = 0; i < steam.appinfo.length; i++) {
      appinfoEntries[ i ] = steam.appinfo[ i ].appid
    }

    for (i = 0; i < sharedEntries.length; i++) {
      index = appinfoEntries.indexOf(sharedEntries[ i ])
      if (index === -1) {
        missing.push(sharedEntries[ i ])
      } else {
        if (how.developer) {
          cat = steam.appinfo[appinfoEntries[ index ]].extended.developer
        }

        if (how.publisher) {}
      }
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()

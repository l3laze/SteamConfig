'use strict'

const fs = require('fs')
const path = require('path')
const SteamConfig = require('../index.js')

let steam = new SteamConfig()

function parseArgs () {
  if (process.argv.length === 2) {
    console.error('See "Usage" -- need args')
    process.exit(1)
  } else if (process.argv.length % 2 !== 0) {
    console.error(`See "Usage" -- wrong number of args ${process.argv.length}`)
    process.exit(1)
  }

  let args = process.argv.splice(2)
  let i
  let commands = {}

  for (i = 0; i < args.length; i += 2) {
    let arg = args[ i ].trim()
    if (arg === '-mode' || arg === '--m') {
      arg = args[ i + 1 ].trim()

      if (arg === 'backup' || arg === 'b') {
        commands[ 'mode' ] = 'backup'
      } else if (arg === 'restore' || arg === 'r') {
        commands[ 'mode' ] = 'restore'
      } else {
        console.error(`See usage -- invalid mode: ${args[ i ]}`)
        process.exit(1)
      }
    } else if (arg === '-path' || arg === '--p') {
      arg = args[ i + 1 ].trim()

      if (!fs.existsSync(arg)) {
        console.error(`Bad path -- Can't find part/all of ${arg}`)
        process.exit(1)
      }

      commands[ 'path' ] = arg
    } else {
      console.error(`See usage -- invalid command: ${arg}`)
      process.exit(1)
    }
  }

  return commands
}

async function restoreCats () {
  let backCats = JSON.parse('' + fs.readFileSync(path.join(__dirname, 'catbackup.json')))
  await steam.loadSharedconfig()
  let scApps = Object.keys(steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps)

  Object.keys(backCats).forEach(function (appid) {
    if (scApps.includes(appid) === false) {
      steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[ appid ] = {}
    }

    if (backCats[ appid ].tags) {
      steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[ appid ].tags = backCats[ appid ].tags
    }

    if (backCats[ appid ].Hidden) {
      steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps[ appid ].Hidden = backCats[ appid ].Hidden
    }
  })

  steam.saveTextVDF(path.join(__dirname, 'sharedconfig.vdf'), steam.sharedconfig)
}

async function run () {
  let apps = []
  let appKeys = []
  let cats = {}
  let tags = []
  let catted = 0
  let hidden = 0
  let fav = 0
  let args = {}
  let installPath = null

  Object.assign(args, parseArgs())
  console.info(JSON.stringify(args, null, 2))

  try {
    if (!args.hasOwnProperty('path')) {
      console.info('No path set; trying to find default...')
      installPath = steam.detectPath()
    } else {
      installPath = args.path
    }
    if (installPath !== null) {
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
  } catch (err) {
    console.error(err.message)
    console.error(err.stack)
    process.exit(1)
  }

  if (args.mode === 'backup') {
    await steam.loadSharedconfig()
    Object.assign(apps, steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps)
    Object.assign(appKeys, Object.keys(apps))

    Object.keys(apps).forEach(function (app) {
      let props = Object.getOwnPropertyNames(apps[ app ])
      props.forEach(function (prop) {
        if (prop !== 'tags' && prop !== 'Hidden') {
          delete apps[ app ][ prop ]
        } else if (prop === 'tags') {
          Object.values(apps[ app ][ prop ]).forEach(function (t) {
            if (t === 'favorite') {
              fav += 1
            } else if (!tags.includes(t)) {
              tags.push(t)
            }
          })
          catted += 1
        } else if (prop === 'Hidden') {
          hidden += 1
        }

        cats[ `${app}` ] = apps[ app ]
      })
    })

    console.info(`App Entriess:\t${appKeys.length}`)
    console.info(`Hidden:\t\t${hidden}`)
    console.info(`Categorized:\t${catted}`)
    console.info(`Favorites:\t${fav}`)
    console.info(`Categories:\t${tags.length}\t${tags.join(', ')}`)

    await fs.writeFileSync(path.join(__dirname, 'catbackup.json'), JSON.stringify(cats, null, 2))
  } else if (args.mode === 'restore') {
    restoreCats()
  }

  let splitArgs = args.mode.split('')

  console.info(`...${splitArgs[ 0 ].toUpperCase() + splitArgs.splice(1, splitArgs.length).join('').toLowerCase()} complete.`)
}

run()

'use strict'

const fs = require('fs')
const path = require('path')
const SteamConfig = require('../index.js')

let steam = new SteamConfig()

function parseArgs () {
  if (process.argv.length === 2) {
    console.error('See "Usage" -- need args')
    process.exit(1)
  } else if (process.argv.length !== 3) {
    console.error(`See "Usage" -- wrong number of args ${process.argv.length}`)
  }

  let runMode = process.argv[ 2 ].trim()

  if (runMode === '--b' || runMode === '-backup') {
    return { mode: 'backup' }
  } else if (runMode === '--r' || runMode === '-restore') {
    return { mode: 'restore' }
  } else {
    console.error(`See "Usage" -- Invalid mode ${runMode}.`)
  }
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

  Object.assign(args, parseArgs())

  try {
    steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
    await steam.loadRegistryLM()
    await steam.loadLoginusers()
    await steam.loadAppinfo()

    steam.setUser()

    if (steam.user === null) {
      console.error(`Error: No user associated with the Steam installation @ ${steam.loc}`)
      process.exit(1)
    }

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
  } catch (err) {
    console.error(err.message)
    console.error(err.stack)
    process.exit(1)
  }

  console.info(`App Entriess:\t${appKeys.length}`)
  console.info(`Hidden:\t\t${hidden}`)
  console.info(`Categorized:\t${catted}`)
  console.info(`Favorites:\t${fav}`)
  console.info(`Categories:\t${tags.length}\t${tags.join(', ')}`)

  if (args.mode === 'backup') {
    await fs.writeFileSync(path.join(__dirname, 'catbackup.json'), JSON.stringify(cats, null, 2))
  } else if (args.mode === 'restore') {
    restoreCats()
  }

  let splitArgs = args.mode.split('')

  console.info(`...${splitArgs[ 0 ].toUpperCase() + splitArgs.splice(1, splitArgs.length).join('').toLowerCase()} complete.`)
}

run()

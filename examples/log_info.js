'use strict'

const BB = require('bluebird').Promise
const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const SteamConfig = require('../index.js')
let steam = new SteamConfig()

async function run () {
  try {
    steam.setInstallPath(steam.detectPath())
    await steam.loadRegistry()
    await steam.loadLoginusers()
    steam.setUser(await steam.detectUser())
    await steam.loadLibraryfolders()
    await steam.loadSteamapps()
    await steam.loadConfig()
    await steam.loadLibraryfolders()
    await steam.loadSteamapps()
    await steam.loadAppinfo()
    await steam.loadAppinfo2()
    await steam.loadPackageinfo()

    if (steam.user === null) {
      throw new Error(`There is no user associated with the Steam installation @ ${steam.loc}`)
    }

    await steam.loadSharedconfig()
    await steam.loadLocalconfig()
    await steam.loadShortcuts()
    await steam.loadShortcuts2()
  } catch (err) {
    if ((err.message.indexOf('Failed to load ') !== -1 || err.message.indexOf('Failed to save ')) && err.message.indexOf(' because ') !== -1) {
      console.error(err.message)
    } else {
      console.error(err)
    }
    process.exit(1)
  }

  logData()
}

async function getCatInfo () {
  let cats = []
  let catted = 0
  let apps
  let keys
  apps = Object.assign({}, steam.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps)
  keys = Object.keys(apps)
  apps = keys.map(function (k) {
    return apps[ k ]
  })

  catted = apps.reduce(function (accumulator, current, index, array) {
    return accumulator + (current.hasOwnProperty('tags') ? 1 : 0)
  }, 0)

  apps.forEach(function (current, index, array) {
    if (current.hasOwnProperty('tags')) {
      for (let cat in current.tags) {
        if (cats.includes(current.tags[ cat ]) === false) {
          cats.push(current.tags[ cat ])
        }
      }
    }
  })

  return [cats, catted]
}

async function logData () {
  try {
    let cachePath = path.join(__dirname, 'data')
    let catData = await getCatInfo()
    console.info(`Install location:\t${steam.loc}`)
    console.info(`Users:\t\t\t${Object.keys(steam.loginusers.users).length}`)
    console.info(`Active Steam user:\t${steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser}`)
    console.info(`Library Folders:\t${steam.nondefaultLibraryfolders.length + 1}`)
    console.info(`Apps:\t\t\t${steam.steamapps.length + (steam.shortcuts !== null ? Object.keys(steam.shortcuts.shortcuts).length : 0)}`)
    console.info(`Steam apps:\t\t${steam.steamapps.length}`)
    if (steam.shortcuts !== null) {
      console.info(`Shortcuts1:\t\t${Object.keys(steam.shortcuts.shortcuts).length}`)
    }
    if (steam.shortcuts2 !== null) {
      console.info(`Shortcuts2:\t\t${Object.keys(steam.shortcuts2.shortcuts).length}`)
    }
    console.info(`Appinfo1 Entries:\t${steam.appinfo.length}`)
    console.info(`Appinfo2 Entries:\t${steam.appinfo2.apps.length}`)
    if (catData[ 0 ].length !== 0 && catData[ 1 ] !== 0) {
      console.info(`Categorized Apps:\t${catData[ 1 ]}`)
      console.info(`Categories:\t\t${catData[ 0 ].length} (${catData[ 0 ].join(', ')})`)
    }
    if (steam.packageinfo) {
      console.info(`Packageinfo Entries:\t${steam.packageinfo.packages.length}`)
      let filePath = path.join(cachePath, 'packageinfo.json')
      if (!fs.existsSync(filePath)) {
        await fs.writeFileAsync(filePath, JSON.stringify(steam.packageinfo, null, 2))
      }
    }
    if (steam.appinfo) {
      let filePath = path.join(cachePath, 'appinfo1.json')
      if (fs.existsSync(filePath)) {
        await fs.writeFileAsync(filePath, JSON.stringify(steam.appinfo, null, 2))
      }
    }
    if (steam.appinfo2) {
      let filePath = path.join(cachePath, 'appinfo2.json')
      if (fs.existsSync(filePath)) {
        await fs.writeFileAsync(filePath, JSON.stringify(steam.appinfo2.apps, null, 2))
      }
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()

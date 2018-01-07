'use strict'

const SteamConfig = require('../index.js')

let steam = new SteamConfig()

async function run () {
  try {
    steam.setInstallPath(steam.detectPath())
    await steam.loadRegistryLM()
    await steam.loadLoginusers()
    steam.setUser()
    await steam.loadLibraryfolders()
    await steam.loadSteamapps()
    await steam.loadConfig()
    await steam.loadLibraryfolders()
    await steam.loadSteamapps()
    await steam.loadAppinfo()
    // await steam.loadPackageinfo()

    if (steam.user === null) {
      throw new Error(`There is no user associated with the Steam installation @ ${steam.loc}`)
    }

    await steam.loadSharedconfig()
    await steam.loadLocalconfig()
    await steam.loadShortcuts()
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

run()

function logData () {
  console.info(`Install location:\t${steam.loc}`)
  console.info(`Active user:\t${steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser}`)
  console.info(`Users:\t\t\t${Object.keys(steam.loginusers.users).length}`)
  console.info(`Current User:\t\t${steam.user.PersonaName} (${steam.user.AccountName})`)
  console.info(`Library Folders:\t${steam.nondefaultLibraryfolders.length + 1}`)
  console.info(`Apps:\t\t\t${steam.steamapps.length + Object.keys(steam.shortcuts.shortcuts).length}`)
  console.info(`Steam apps:\t\t${steam.steamapps.length}`)
  console.info(`Non-Steam:\t\t${Object.keys(steam.shortcuts.shortcuts).length}`)
  console.info(`Appinfo Entries:\t${steam.appinfo.length}`)
}

process.on('uncaughtException', (err) => {
  console.error(err)
  console.error(err.captureStackTrace())
  process.exit(1)
})

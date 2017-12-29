const SteamConfig = require('./index.js')
const SteamID = require('steamid')

var steam = new SteamConfig()

async function run () {
  try {
    steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
    await steam.loadRegistryLM()
    await steam.loadLoginusers()
    await steam.loadConfig()
    await steam.loadLibraryfolders()
    await steam.loadSteamapps()
    await steam.loadAppinfo()
    // await steam.loadPackageinfo();

    setUser()

    if (steam.user === null) {
      console.info(`No user associated with the Steam installation @ ${steam.loc}`)
      process.exit(1)
    }

    await steam.loadSharedconfig()
    await steam.loadLocalconfig()
    await steam.loadShortcuts()
  } catch (err) {
    console.error(err.message)
    console.error((err.code ? err.captureStackTrace() : err.stack))
    process.exit(1)
  }

  logData()
}

run()

function setUser () {
  var userKeys = Object.keys(steam.loginusers.users)

  userKeys.forEach(function (item, index, array) {
    if (steam.loginusers.users[ item ].AccountName === steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser) {
      steam.user = {}
      Object.assign(steam.user, steam.loginusers.users[ item ])
      steam.user[ 'accountID' ] = ('' + new SteamID(item).accountid)
    }
  })
}

function logData () {
  console.info(`Install location:\t${steam.loc}`)
  console.info(`Users:\t\t\t${Object.keys(steam.loginusers.users).length}`)
  console.info(`Current User:\t\t${steam.user.PersonaName} (${steam.user.AccountName})`)
  console.info(`Library Folders:\t${steam.nondefaultLibraryfolders.length + 1}`)
  console.info(`Apps:\t\t\t${steam.steamapps.length + Object.keys(steam.shortcuts.shortcuts).length}`)
  console.info(`Steam apps:\t\t${steam.steamapps.length}`)
  console.info(`Non-Steam:\t\t${Object.keys(steam.shortcuts.shortcuts).length}`)
  console.info(`Appinfo Entries:\t${steam.appinfo.length}`)
}

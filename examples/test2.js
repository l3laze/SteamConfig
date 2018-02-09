'use strict'

const path = require('path')
const SteamConfig = require('../index2.js')

let steamcon

async function run () {
  steamcon = new SteamConfig()
  try {
    /*
     * Set the root path of the Steam installation.
     */
    steamcon.root = steamcon.detectRoot()

    /*
     * Enable the cache and set it's path, and set appendApps so that all
     *  apps can be loaded rather than just single libraries.
     */
    steamcon.cacheEnabled = true
    steamcon.cachePath = path.join(__dirname, 'data')
    steamcon.appendApps = true

    /*
     *
     */
    await steamcon.load(steamcon.getPath('skins'))
    await steamcon.load(steamcon.getPath('registry'))
    await steamcon.load(steamcon.getPath('loginusers'))
    await steamcon.load(steamcon.getPath('libraryfolders'))
    await steamcon.load(steamcon.getPath('steamapps'))
    await steamcon.load(steamcon.getPath('extraSteamApps'))
    await steamcon.requestTags()

    /*
     * Get the current user, or attempt to get the only user if none
     *  is currently set.
     */
    let keys = Object.keys(steamcon.loginusers.users)
    let user = steamcon.detectUser()

    if (user === null && keys.length > 1) {
      throw new Error('There is no current user, and there are 2 or more users associated with this Steam installation. Cannot detect user.')
    }

    for (let k of keys) {
      if (steamcon.loginusers.users[ k ].AccountName === user) {
        steamcon.user = {
          id64: k,
          accountId: steamcon.getAccountId(k),
          accountName: user,
          personaName: steamcon.loginusers.users[ k ].PersonaName
        }

        break
      }
    }

    /*
     * Load some data using the SteamConfig.paths getters/setters to get
     *  platform-and-installtion-specific paths to the data.
     */
    await steamcon.load(steamcon.getPath('sharedconfig'))
    await steamcon.load(steamcon.getPath('appinfo'))
    await steamcon.load(steamcon.getPath('shortcuts'))
    await steamcon.requestOwnedApps()

    /*
     * Access the "Registry" data to find the current skin by folder name
     *  (the same as Steam does) & the current user by account name.
     */
    let currentSkin = steamcon.registry.Registry.HKCU.Software.Valve.Steam.SkinV4

    console.info(`Cache Enabled:\t\t${steamcon.cacheEnabled}`)
    console.info(`Root:\t\t\t${steamcon.root}`)
    console.info(`Skins:\t\t\t${steamcon.skins.length}`)
    console.info(`Current Skin:\t\t${currentSkin !== '' ? currentSkin : 'Default'}`)
    console.info(`Users:\t\t\t${Object.keys(steamcon.loginusers.users).length}`)
    console.info(`Current User:\t\t${steamcon.user.personaName} (${steamcon.user.accountName}, ${steamcon.user.id64}, ${steamcon.user.accountId})`)
    console.info(`Steam Library Folders:\t${steamcon.extraLibraries.length + 1} (including default)`)
    console.info(`User's Non-Steam Apps:\t${steamcon.shortcuts.shortcuts.length}`)
    console.info(`Installed Apps:\t\t${steamcon.steamapps.length}`)
    console.info(`User's Owned Apps:\t${steamcon.user.owned.length}`)
    console.info(`User's Cat'd Apps:\t${Object.keys(steamcon.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps).length}`)
    console.info(`Steam Tags:\t\t${steamcon.tags.length}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
run()

process.on('unhandledException', (reason, p) => {
  console.error(`Unhandled rejection at: ${p}reason ${reason}.`)
  process.exit(1)
})

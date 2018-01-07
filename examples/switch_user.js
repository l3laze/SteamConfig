'use strict'

const SteamConfig = require('../index.js')

let cli = require('cli')
let options = cli.parse({
  path: ['p', 'Path to Steam installation.', 'path', null],
  user: ['u', 'User to switch to by account name or display name.', 'string', null]
})

let steam = new SteamConfig()

async function run () {
  let installPath = null
  if (options.path === null) {
    console.info('Trying to find default path to Steam...')
    installPath = steam.detectPath()
    if (installPath !== null) {
      steam.setInstallPath(installPath)
    } else {
      process.error('Couldn\'t find default path to Steam.')
      process.exit(1)
    }
  }

  await steam.loadRegistryLM()
  await steam.loadLoginusers()

  let userKeys = Object.keys(steam.loginusers.users)

  if (options.user === null && userKeys.length > 2) {
    console.error(`There are ${userKeys.length} users associated with this Steam installation; can't auto-switch.`)
    process.exit(1)
  }

  for (let i = 0; i < userKeys.length; i++) {
    if (options.user !== null) {
      if (steam.loginusers.users[userKeys[ i ]].AccountName === options.user || steam.loginusers.users[userKeys[ i ]].PersonaName === options.user) {
        steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser = steam.loginusers.users[userKeys[ i ]].AccountName
        await steam.saveTextVDF(steam.getPathTo('registry'), steam.registry)
        console.info(`Switched to ${steam.loginusers.users[userKeys[ i ]].PersonaName}.`)
        process.exit(0)
      }
    } else if (steam.loginusers.users[userKeys[ i ]].AccountName !== steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser) {
      steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser = steam.loginusers.users[userKeys[ i ]].AccountName
      await steam.saveTextVDF(steam.getPathTo('registry'), steam.registry)
      console.info(`Switched to ${steam.loginusers.users[userKeys[ i ]].PersonaName}.`)
      process.exit(0)
    }
  }
}

run()

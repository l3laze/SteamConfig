'use strict'

const pjoin = require('path').join
const name = 'Steam-Config.test'
const debug = require('ebug')(name)

debug('%s is running..', name)

// To keep Standard from complaining because of the IIFE..
; // eslint-disable-line

(async function () {
  const SteamConfig = require('./../src/index.js')
  const writeFileSync = require('fs').writeFileSync

  try {
    SteamConfig.platform = 'mac'
    SteamConfig.arch = '64'
    SteamConfig.accountId = '107311984'
    SteamConfig.id64 = '76561198067577712'
    SteamConfig.rootPath = SteamConfig.getPath('root')
    SteamConfig.mode = 'append'

    debug(`platform: ${SteamConfig.platform}`)
    debug(`arch: ${SteamConfig.arch}`)

    debug(`rootPath: ${SteamConfig.rootPath}`)

    debug(`id64: ${SteamConfig.id64}`)
    debug(`accountId: ${SteamConfig.accountId}`)

    SteamConfig.load('appinfo')

    debug(`appinfo: ${Object.keys(SteamConfig.appinfo).length} entries`)

    SteamConfig.load('config')

    debug(`config: ${typeof SteamConfig.config !== 'undefined'}`)

    SteamConfig.load('libraryfolders')

    debug(`libraryfolders: ${typeof SteamConfig.libraryfolders !== 'undefined'}`)

    SteamConfig.load('localconfig')

    debug(`localconfig: ${typeof SteamConfig.localconfig !== 'undefined'}`)

    SteamConfig.load('loginusers')

    debug(`loginusers: ${typeof SteamConfig.loginusers !== 'undefined'}`)

    SteamConfig.load('packageinfo')

    debug(`packageinfo: ${Object.keys(SteamConfig.packageinfo).length} entries`)

    SteamConfig.load('registry')

    debug(`registry: ${typeof SteamConfig.registry !== 'undefined'}`)

    SteamConfig.load('sharedconfig')

    debug(`sharedconfig: ${typeof SteamConfig.sharedconfig !== 'undefined'}`)

    SteamConfig.load('shortcuts')

    debug(`shortcuts: ${SteamConfig.shortcuts.length}`)

    SteamConfig.load('steamapps')

    debug(`steamapps: ${SteamConfig.steamapps.length}`)

    SteamConfig.load('steamapps', '/Users/tmshvr/Desktop/Games')

    debug(`steamapps: ${SteamConfig.steamapps.length}`)

    SteamConfig.load('skins')

    debug(`skins: ${SteamConfig.skins.length}`)

    await SteamConfig.requestPopularTags({
      force: false,
      cacheDir: pjoin(__dirname, 'cache'),
      timeout: 6000
    })
    await SteamConfig.requestStoreData('218620', {
      force: false,
      cacheDir: pjoin(__dirname, 'cache'),
      timeout: 6000
    })
    await SteamConfig.requestOwnedApps(SteamConfig.id64, {
      force: false,
      cacheDir: pjoin(__dirname, 'cache'),
      timeout: 6000
    })

    writeFileSync(pjoin(__dirname, 'appinfo.json'), '' + SteamConfig.stringify(SteamConfig.appinfo, true))

    debug('%s is finished.', name)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}())

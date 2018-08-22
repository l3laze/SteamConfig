'use strict'

const pjoin = require('path').join

const name = 'SteamConfig-web-test'
const debug = require('ebug')(name)

// To keep Standard from complaining because of the IIFE..
; // eslint-disable-line

(async function () {
  const SteamConfig = require('./../src/index.js')

  try {
    debug('%s is running..', name)

    const cacheDir = pjoin(__dirname, '..')

    debug('cacheDir: %s', cacheDir)

    SteamConfig.accountId = '107311984'
    SteamConfig.id64 = '76561198067577712'

    const storeData = await SteamConfig.requestStoreData('218620', {
      force: false,
      cacheDir: pjoin(__dirname, '..'),
      timeout: 6000
    })
    const tags = await SteamConfig.requestPopularTags({
      force: false,
      cacheDir: pjoin(__dirname, '..'),
      timeout: 6000
    })
    const owned = await SteamConfig.requestOwnedApps(SteamConfig.id64, {
      force: false,
      cacheDir: pjoin(__dirname, '..'),
      timeout: 6000
    })

    console.info(`Store page Genres for Payday 2 [${storeData.genres.join(', ')}]`)
    console.info(`# of popular tags: ${Object.keys(tags).length}`)
    console.info(`Owned apps: ${owned.length}`)

    debug('%s is finished.', name)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}())

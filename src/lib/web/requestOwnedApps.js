'use strict'

const fxp = require('fast-xml-parser')
const { fs, path, fetch, userAgent, verifyOptions } = require('./web-common.js')
const debug = require('ebug')('SteamConfig.requestOwnedApps')

async function requestOwnedApps (id64, options) {
  let data
  let owned = []

  options = verifyOptions(options)

  const filePath = path.join(options.cacheDir, `owned-${id64}.json`)

  debug('Cache file: %s', path.basename(filePath))

  if (options.force === false && fs.existsSync(filePath)) {
    debug('Loading %s\'s owned apps from cache.', id64)
    owned = JSON.parse('' + fs.readFileSync(filePath))
  } else {
    debug('Requesting %s\'s owned apps from web.', id64)
    data = await fetch(`https://steamcommunity.com/profiles/${id64}/games/?tab=all&xml=1`, {
      timeout: options.timeout,
      headers: {
        'User-Agent': userAgent
      }
    })

    data = await fxp.parse(await data.text()).gamesList.games.game

    data.forEach(item => owned.push(item.appID))

    owned = owned.sort((a, b) => { return a - b })
      .map(item => '' + item)

    fs.writeFileSync(filePath, JSON.stringify(owned, null, '\t'))
  }

  debug('%s owns %s apps', id64, owned.length)

  return owned
}

module.exports = {
  requestOwnedApps
}

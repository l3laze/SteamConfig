'use strict'

const { fs, path, fetch, userAgent, verifyOptions } = require('./web-common.js')
const debug = require('ebug')('SteamConfig.requestPopularTags')

async function requestPopularTags (options = { force: false, cacheDir: path.join(__dirname, 'cache'), timeout: 5000 }) {
  let data
  let tags

  options = verifyOptions(options)

  const filePath = path.join(options.cacheDir, 'tags.json')

  debug('Cache file: %s', path.basename(filePath))

  if (options.force === false && fs.existsSync(filePath)) {
    debug('Loading tags from cache.')
    tags = JSON.parse('' + fs.readFileSync(filePath))
  } else {
    debug('Requesting tags from web.')
    data = await fetch('https://store.steampowered.com/tagdata/populartags/english', {
      timeout: options.timeout,
      headers: {
        'User-Agent': userAgent
      }
    })
    tags = {}

    data = await data.text()

    JSON.parse('' + data).forEach(item => {
      tags[ item.tagid ] = item.name
    })

    fs.writeFileSync(filePath, JSON.stringify(tags, null, '\t'))
  }

  debug('Got %s tags', Object.keys(tags).length)

  return tags
}

module.exports = {
  requestPopularTags
}

'use strict'

const { fs, path, fetch, userAgent, verifyOptions } = require('./web-common.js')
const { extract } = require('./extract.js')
const name = 'SteamConfig.requestStoreData'
const debug = require('ebug')(name)

async function parseGenres (data) {
  let genreData = await extract(data, {start: '<b>Genre:</b>', end: '<br>'})

  genreData = genreData.split('\n')
    .filter(g => g.trim() !== '')[ 0 ] // Remove lines full of whitespace
    .split(', ') // Split up "list"
    .map(d => { // Parse genre link text
      let start = d.indexOf('">')

      if (start !== -1) {
        start += 2
      }

      let end = d.indexOf('</a', start)

      d = d.substring(start, end)

      return d
    })

  return genreData
}

async function parseRequirements (data) {
  let depth = 0
  let requirementData = await extract(data, { start: '<h2>System Requirements</h2>', end: "var $Tabs = $J('.sysreq_tab');" })

  requirementData = requirementData.split(/[\r|\n|\t]+/)
  requirementData = requirementData.slice(0, requirementData.length - 3)
    // requirementData = requirementData.slice(1, requirementData.length - 4)
    .reduce((text, line) => {
      text += '\n'
      line = line.trim()

      if (line === '') {
        depth = depth + 0 // Just something to fill the space.
      } else if (/^<(strong|div|ul|li)/.test(line) && !/<\/(strong|div|ul|li)/.test(line)) {
        // debug('opening line %s', line)
        depth++
        text += ' '.repeat(depth) + line
      } else if (/^<\/(strong|div|ul|li)/.test(line)) {
        // debug('closing line %s', line)
        depth--
        if (depth < 0) {
          depth = 0
        }
        text += ' '.repeat(depth) + line
      } else if (line === '<br>') {
        // debug('self-closing br %s', line)
        text += ' '.repeat(depth) + line
      } else {
        // debug('text line %s', line)
        text += ' '.repeat(depth + 1) + line
      }
      return text
    })

  return requirementData
}

async function requestStoreData (appid, options) {
  let data = {}
  let tmp = {}

  options = verifyOptions(options)

  const filePath = path.join(options.cacheDir, 'storeData.json')

  debug('Cache file: %s', path.basename(filePath))

  if (!fs.existsSync(options.cacheDir)) {
    fs.mkdirSync(options.cacheDir)
  }

  if (options.force === false && fs.existsSync(filePath)) {
    debug('Loading %s\'s Store data from cache.', appid)
    tmp = JSON.parse('' + fs.readFileSync(filePath))
    debug('Cached Data: [ %s ]', tmp[ appid ].genres.join(', '))
  }

  if (typeof tmp[ appid ] === 'undefined') {
    debug('Requesting %s\'s store data from web.', appid)
    try {
      data = await fetch(`https://store.steampowered.com/app/${appid}/`, {
        credentials: 'include',
        headers: {
          cookie: 'birthtime=189324001', // 1/1/1976 @ 12:00:01 AM
          'User-Agent': userAgent
        },
        timeout: options.timeout
      })

      data = '' + await data.text()

      if (fs.existsSync(filePath)) {
        tmp = JSON.parse('' + fs.readFileSync(filePath))
      }

      tmp[ appid ] = {
        genres: await parseGenres(data),
        requirements: await parseRequirements(data)
      }

      debug('Store Data: [ %s ]', tmp[ appid ].genres.join(', '))

      fs.writeFileSync(filePath, JSON.stringify(tmp, null, '\t'))
    } catch (err) {
      throw err
    }
  }

  debug('%s\'s genres: %s', appid, tmp[ appid ].genres)

  return tmp[ appid ]
}

module.exports = {
  requestStoreData
}

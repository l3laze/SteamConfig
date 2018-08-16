'use strict'

const fetch = require('node-fetch')
const path = {
  join: require('path').join,
  dirname: require('path').dirname,
  basename: require('path').basename
}
const fs = {
  readFileSync: require('fs').readFileSync,
  writeFileSync: require('fs').writeFileSync,
  existsSync: require('fs').existsSync,
  mkdirSync: require('fs').mkdirSync
}

const userAgent = 'steam-config/0.1 (https://github.com/l3laze/steam-config; l3l_aze@yahoo.com)'

const defaultTimeout = 6000

function verifyOptions (options) {
  if (typeof options.cacheDir === 'undefined') {
    options.cacheDir = path.join(__dirname, 'cache')
  }

  if (typeof options.force === 'undefined' || typeof options.force !== 'boolean') {
    options.force = false
  }

  if (typeof options.timeout === 'undefined') {
    options.timeout = defaultTimeout
  }

  if (typeof options.timeout !== 'number') {
    const tmpTimeout = parseInt(options.timeout)

    if (!isNaN(tmpTimeout)) {
      options.timeout = tmpTimeout
    } else {
      options.timeout = defaultTimeout
    }
  }

  return options
}

module.exports = {
  fs,
  path,
  fetch,
  userAgent,
  verifyOptions
}

'use strict'

const homedir = require('os').homedir()
const platformPaths = require('./platformPaths.js')

function getSteamFilePath (name, platform, arch, accountId) {
  if (platform === 'win32') {
    return ('' + platformPaths[ platform ][ arch ][ name ]).replace('accountId', accountId)
  } else {
    return ('' + platformPaths[ platform ][ name ]).replace('~', homedir).replace('accountId', accountId)
  }
}

module.exports = {
  getSteamFilePath
}

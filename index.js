'use strict'

const BB = require('bluebird').Promise
const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const VDF = require('simple-vdf2')
const BVDF = require('binary-vdf')
const SVDF = BB.promisifyAll(require('steam-shortcut-editor'))
const SteamID = require('steamid')

const platform = require('os').platform()
const arch = require('os').arch()
const home = require('os').homedir()

function SteamConfig () {
  this.loc = null
  this.user = null
  this.nondefaultLibraryfolders = null

  this.registry = null
  this.config = null
  this.loginusers = null
  this.libraryfolders = null
  this.steamapps = null
  this.userdata = null
  this.appinfo = null
  this.packageinfo = null
  this.sharedconfig = null
  this.localconfig = null
  this.shortcuts = null
}

function getLine (err) {
  let stack = err.stack.split('\n')
  let line = stack[1 + 1].split(':')
  return parseInt(line[line.length - 2], 10)
}

async function loadTextVDF (filePath) {
  if (typeof filePath !== 'string') {
    throw new TypeError(`Failed to load filePath because it is invalid -- type is "${typeof filePath}", but should be "string".`)
  } else {
    let data = ''

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Failed to load ${filePath} because it does not exist.`)
      }

      data = '' + await fs.readFileAsync(filePath)
      data = await VDF.parse(data)
    } catch (err) {
      let reason = ''

      if (err.code === 'ENOENT') {
        reason = 'it does not exist.'
      } else if (err.code === 'EACCES') {
        reason = 'it is not accessible.'
      } else if (err.message.indexOf('VDF.') !== -1) { // VDF.parse or VDF.stringify
        if ((err.message.indexOf('invalid syntax') + err.message.indexOf('open parentheses somewhere')) > -1) {
          reason = 'the data is invalid (parsing error).'
        }
      } else {
        reason = `${err.message} ("${err.code || err.name || 'error'}")`
      }

      throw new Error(`Failed to load ${filePath} as a text VDF file because ${reason}.`)
    }

    return data
  }
}

async function loadBinaryVDF (filePath, btype) {
  let data
  let stream

  if (filePath === null) {
    throw new TypeError(`Failed to load filePath because it is invalid -- type is "${typeof filePath}", but it should be "string".`)
  } else if (!fs.existsSync(filePath)) {
    throw new Error(`Failed to load ${filePath} because it does not exist.`)
  }

  if (typeof btype !== 'string') {
    throw new Error(`Failed to load ${filePath} because btype is invalid -- type is "${typeof btype}", but it should be "string".`)
  } else {
    btype = btype.toLowerCase()
  }

  if (btype !== 'appinfo' && btype !== 'packageinfo' && btype !== 'shortcuts') {
    throw new Error(`Failed to load ${filePath} because btype is invalid -- the format "${btype}" is not recognized.`)
  } else if (btype === 'packageinfo') {
    throw new Error(`Failed to load ${filePath} because ${btype} is not currently supported.`)
  } else {
    if (btype === 'appinfo') {
      try {
        stream = await fs.createReadStream(filePath)
        data = await BVDF.readAppInfo(stream)
        return data
      } catch (err) {
        let reason = ''
        if (err.message.indexOf('Unhandled entry type: ') !== -1) {
          reason = 'the data is invalid (parsing error).'
        } else if (err.message.indexOf('Invalid file signature') !== -1) {
          reason = 'the file signature is invalid (parsing error).'
        } else {
          reason = `${err.message} ("${err.code || err.name || 'error'}")`
        }
        throw new Error(`Failed to load ${filePath} as ${btype} because ${reason}.`)
      }
    } else if (btype === 'shortcuts') {
      try {
        data = SVDF.parseFileAsync(filePath, { autoConvertArrays: true, autoConvertBooleans: true, dateProperties: [ 'LastPlayTime' ] })
      } catch (err) {
        let reason = ''
        if (err.message.indexOf('encountered error while handling property: ') !== -1) {
          reason = 'the data is invalid (parsing error).'
        } else {
          reason = `${err.message} ("${err.code || err.name || 'error'}")`
        }
        throw new Error(`Failed to load ${filePath} as ${btype} because ${reason}`)
      }

      return data
    }
  }
}

async function saveTextVDF (filePath, data) { // eslint-disable-line no-unused-vars
  if (typeof filePath !== 'string') {
    throw new TypeError(`Failed to save filePath because it is invalid -- type is "${typeof filePath}", but should be "string".`)
  } else if (typeof data !== 'object') {
    throw new TypeError(`Failed to save ${filePath} because the data is invalid -- type is "${typeof data}", but should be "object".`)
  } else {
    try {
      await fs.writeFileAsync(filePath, VDF.stringify(data, true))
    } catch (err) {
      let reason = ''

      if (err.code === 'EACCES') {
        reason = 'it is not accessible.'
      } else if ((err.message.indexOf('First input parameter is not an object') + err.message.indexOf('a key has value of type other than string or object')) !== -1) {
        reason = 'the data is invalid (parsing error)'
      } else {
        reason = `${err.message} ("${err.code || err.name || 'error'}")`
      }

      throw new Error(`Failed to save ${filePath} because ${reason}.`)
    }
  }
}

SteamConfig.prototype.setInstallPath = function setInstallPath (dir) {
  if (typeof dir !== 'string') {
    throw new TypeError(`Failed to setInstallPath because it is invalid -- type is "${typeof dir}", but should be "string".`)
  } else if (!fs.existsSync(dir)) {
    throw new Error(`Failed to setInstallPath to ${dir} because it does not exist.`)
  } else {
    this.loc = '' + dir
  }
}

SteamConfig.prototype.loadRegistryLM = async function loadRegistryLM () {
  let filePath = path.join(this.loc, 'registry.vdf')
  let data

  data = await loadTextVDF(filePath)
  this.registry = data
}

SteamConfig.prototype.loadAppinfo = async function loadAppinfo () {
  let filePath = path.join(this.loc, 'appcache', 'appinfo.vdf')

  this.appinfo = await loadBinaryVDF(filePath, 'appinfo')
}

/*
 * Currently not supported -- need a parser for packageinfo.vdf.
 *
 */
SteamConfig.prototype.loadPackageinfo = async function loadPackageinfo () {
  let filePath = path.join(this.loc, 'appcache', 'packageinfo.vdf')

  this.packageinfo = await loadBinaryVDF(filePath)
}

SteamConfig.prototype.loadConfig = async function loadConfig () {
  let filePath = path.join(this.loc, 'config', 'config.vdf')

  this.config = await loadTextVDF(filePath)
}

SteamConfig.prototype.loadLoginusers = async function loadLoginusers () {
  let filePath = path.join(this.loc, 'config', 'loginusers.vdf')

  this.loginusers = await loadTextVDF(filePath)

  let userKeys = Object.keys(this.loginusers.users)
  let i

  try {
    for (i = 0; i < userKeys.length; i += 1) {
      this.loginusers.users[userKeys[ i ]][ 'accountID' ] = ('' + new SteamID(userKeys[ i ]).accountid)
      this.loginusers.users[userKeys[ i ]][ 'id64' ] = userKeys[ i ]
    }
  } catch (err) {
    if (err.message.indexOf('Unknown SteamID input format ') !== -1) {
      throw new Error(`Failed to load loginusers because ${this.loginusers.users[userKeys[ i ]].PersonaName}'s accountid could not be calculated (parsing error)'.`)
    }
  }
}

SteamConfig.prototype.loadLibraryfolders = async function loadLibraryfolders () {
  let filePath = path.join(this.loc, 'steamapps', 'libraryfolders.vdf')
  let i

  this.libraryfolders = await loadTextVDF(filePath)
  this.nondefaultLibraryfolders = []

  let libs = Object.keys(this.libraryfolders.LibraryFolders)

  for (i = 0; i < libs.length; i++) {
    if (libs[ i ] !== 'TimeNextStatsReport' && libs[ i ] !== 'ContentStatsID') {
      this.nondefaultLibraryfolders.push(this.libraryfolders.LibraryFolders[libs[ i ]])
    }
  }
}

SteamConfig.prototype.loadSteamapps = async function loadSteamapps () {
  let apps
  let x, y
  let files
  let libs = []

  try {
    Object.assign(libs, this.nondefaultLibraryfolders)

    libs.push(this.loc)

    apps = []

    for (x = 0; x < libs.length; x += 1) {
      try {
        files = await fs.readdirAsync(path.join(libs[ x ], 'steamapps'))
      } catch (err) {
        if (err.code && err.code === 'ENOENT') {
          // ... Ignore nonexistent library folders; they may be on an external drive that's not attached.
        } else {
          throw new Error(`${err.message.toLowerCase()} ("${err.code || err.name || 'error'}" @ line ${getLine(err)})`)
        }
      }

      for (y = 0; y < files.length; y += 1) {
        if (path.extname(files[ y ]) === '.acf') {
          apps.push(await loadTextVDF(path.join(libs[ x ], 'steamapps', files[ y ])))
        }
      }
    }
  } catch (err) {
    let reason = ''

    if (err.message.indexOf('ENOENT') !== -1) {
      reason = ` ${path.join(libs[ x ], 'steamapps', files[ y ])} does not exist.`
    } else {
      reason = `: ${err.message.toLowerCase()} ("${err.code || err.name || 'error'}" @ line ${getLine(err)})`
    }

    throw new Error(`Failed to load steamapps because${reason}.`)
  }

  this.steamapps = apps
}

SteamConfig.prototype.loadSharedconfig = async function loadSharedconfig () {
  if (this.user === null) {
    throw new Error('Failed to load sharedconfig because user is not defined.')
  }

  let filePath = path.join(this.loc, 'userdata', this.user.accountID, '7', 'remote', 'sharedconfig.vdf')

  this.sharedconfig = await loadTextVDF(filePath)
}

SteamConfig.prototype.loadLocalconfig = async function loadLocalconfig () {
  if (this.user === null) {
    throw new Error('Failed to load localconfig because user is not defined.')
  }

  let filePath = path.join(this.loc, 'userdata', this.user.accountID, 'config', 'localconfig.vdf')

  this.localconfig = await loadTextVDF(filePath)
}

SteamConfig.prototype.loadShortcuts = async function loadShortcuts () {
  if (this.user === null) {
    throw new Error('Failed to load shortcuts because user is not defined.')
  }

  let filePath = path.join(this.loc, 'userdata', this.user.accountID, 'config', 'shortcuts.vdf')

  if (fs.existsSync(filePath)) { // Ignore if it doesn't exist because if there's not been any non-Steam games added, it won't.
    try {
      this.shortcuts = await loadBinaryVDF(filePath, 'shortcuts')
    } catch (err) {
      let reason = ''

      if (err.message.indexOf('ENOENT')) {
        reason = ' it does not exist'
      } else if (err.message.indexOf('EACCES')) {
        reason = ' it cannot be accessed'
      } else {
        reason = `: ${err.message.toLowerCase()} ("${err.code || err.name || 'error'}" @ line ${getLine(err)})`
      }

      throw new Error(`Failed to load shortcuts as a text VDF file because${reason}.`)
    }
  }
}

SteamConfig.prototype.setUser = function setUser () {
  if (this.loginusers === null || this.loginusers.hasOwnProperty('users') === false) {
    throw new Error('Cannot set user before loginusers is loaded.')
  } else if (this.registry === null) {
    throw new Error('Cannot set user before registry is loded.')
  }

  if (this.registry.Registry.HKCU.Software.Valve.Steam.hasOwnProperty('AutoLoginUser') === false) {
    this.registry.Registry.HKCU.Software.Valve.Steam[ 'AutoLoginUser' ] = ''
  }

  let userKeys = Object.keys(this.loginusers.users)
  let index

  for (index = 0; index < userKeys.length; index += 1) {
    if (this.loginusers.users[userKeys[ index ]].AccountName === this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser) {
      this.user = {}
      Object.assign(this.user, this.loginusers.users[userKeys[ index ]])
    }
  }
}

SteamConfig.prototype.detectPath = function detectPath () {
  let detected = null

  if (platform === 'win32') {  // TODO: Windows
    if (arch === 'x64') {
      detected = path.join('C:\\', 'Program Files (x86)', 'Steam')
    } else if (arch === 'x86') {
      detected = path.join('C:\\', 'Program Files', 'Steam')
    }
  } else if (platform === 'linux') {
    detected = path.join(home, '.local', 'steam') // TODO: Linux
  } else if (platform === 'darwin') {
    detected = path.join(home, 'Library', 'Application Support', 'Steam')
  }

  try {
    if (!fs.existsSync(detected)) {
      detected = null
    }
  } catch (err) {
    let reason = ''

    if (err.code === 'ENOENT') {
      reason = 'the default path does not exist (partial).'
    } else if (err.code === 'EACCES') {
      reason = 'the default path is not accessible.'
    } else if (err.message.indexOf('') !== -1) {
      reason = ''
    } else {
      reason = `: ${err.message.toLowerCase()} ("${err.code || err.name || 'error'}" @ line ${getLine(err)})`
    }

    throw new Error(`Failed to detect path because ${reason}.`)
  }

  return detected
}

SteamConfig.prototype.getPathTo = function (what) {
  if (typeof what !== 'string') {
    throw new Error(`Unknown path type: ${what}.`)
  } else if (this.loc === null) {
    throw new Error('The path to Steam must be set before getPathTo can be used.')
  }

  if (what === 'registry') {
    return path.join(this.loc, 'registry.vdf')
  } else if (what === 'appinfo') {
    return path.join(this.loc, 'appcache', 'appinfo.vdf')
  } else if (what === 'config') {
    return path.join(this.loc, 'config', 'config.vdf')
  } else if (what === 'loginusers') {
    return path.join(this.loc, 'config', 'loginusers.vdf')
  } else if (what === 'steamapps') {
    return path.join(this.loc, 'steamapps')
  } else if (what === 'sharedconfig') {
    if (this.user !== null && this.user.hasOwnProperty('accountID')) {
      return path.join(this.loc, 'userdata', this.user.accountID, '7', 'remote', 'sharedconfig.vdf')
    } else {
      throw new Error('User must be set before getPathTo can get be used for sharedconfig.vdf.')
    }
  } else if (what === 'localconfig') {
    if (this.user !== null && this.user.hasOwnProperty('accountID')) {
      return path.join(this.loc, 'userdata', this.user.accountID, 'config', 'localconfig.vdf')
    } else {
      throw new Error('User must be set before getPathTo can be used for localconfig.vdf.')
    }
  }
}

SteamConfig.prototype.detectUser = async function detectUser () {
  let detected = null

  if (this.loc === null) {
    throw new Error('The path to Steam must be set before the user can be detected.')
  } else if (this.registry === null) {
    throw new Error('The registry must be loaded before the user can be detected.')
  } else if (this.loginusers === null) {
    throw new Error('The loginusers must be loaded before the user can be detected.')
  }

  let userKeys = Object.keys(this.loginusers.users)

  if (userKeys.length === 0) {
    throw new Error('There are no users associated with this Steam installation.')
  } else if (userKeys.length === 1) {
    detected = this.loginusers.users[userKeys[ 0 ]].AccountName
  } else {
    throw new Error(`There are ${userKeys.length} users associated with this Steam installation; cannot auto-detect the user.`)
  }

  return detected
}

module.exports = SteamConfig

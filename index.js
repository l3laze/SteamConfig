/**
 * @file index.js
 * @author Tom <l3l_aze@yahoo.com>
 */

'use strict'

const BB = require('bluebird').Promise
const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const VDF = require('simple-vdf2')
const BVDF = require('binary-vdf')
const BVDF2 = require('./bvdf.js')
const SVDF = BB.promisifyAll(require('steam-shortcut-editor'))
const SteamID = require('steamid')
const {Registry} = require('rage-edit')

const winreg = new Registry('HKCU\\Software\\Valve\\Steam')

/**
 * Represents the configuration of the Steam client.
 * @constructor
 * @property {string} loc - The install location of the Steam client.
 * @property {string} user - The user for SteamConfig to load/save Steam configuration data for.
 * @property {string} nondefaultLibraryfolders - The non-default Steam Library Folders for this installation.
 * @property {string} registry - The value of the Windows Registry, or Steam/registry.vdf on Linux/Mac.
 * @property {string} config - The value of the file Steam/config/config.vdf.
 * @property {string} loginusers - The value of the file Steam/config/loginusers.vdf.
 * @property {string} libraryfolders - The value of the file Steam/steamapps/libraryfolders.vdf.
 * @property {string} steamapps - Array of the appmanifest_#.acf file(s) from Steam/steamapps.
 * @property {string} appinfo - The value of the Binary VDF file Steam/appcache/appinfo.vdf.
 * @property {string} sharedconfig - The value of the file Steam/userdata/{accountID}/7/remote/sharedconfig.vdf.
 * @property {string} localconfig - The value of the file Steam/userdata/{accountID}/config/sharedconfig.vdf.
 * @property {string} shortcuts - The value of the file Steam/userdata/{accountID}/config/shortcuts.vdf.
 * @property {string} platform - The current platform (OS) -- darwin = macOS, linux = Linux, win32 = Windows.
 * @property {string} arch - The current architecture (32 or 64-bit) -- ia32 = x86, ia64 = x64ia32.
 * @property {string} home - The home directory for the system; based on platform.
 */
function SteamConfig () {
  this.loc = null
  this.user = null
  this.nondefaultLibraryfolders = null

  this.registry = null
  this.config = null
  this.loginusers = null
  this.libraryfolders = null
  this.steamapps = null
  this.appinfo = null
  this.packageinfo = null
  this.sharedconfig = null
  this.localconfig = null
  this.shortcuts = null

  this.platform = require('os').platform()
  this.arch = require('os').arch()
  this.home = require('os').homedir()
}

/**
 * Parses the error stack to find the previous line in the stack.
 * @internal
 * @returns {number} The
 */
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
        reason = 'it does not exist'
      } else if (err.code === 'EACCES') {
        reason = 'it is not accessible'
      } else if (err.message.toLowerCase().indexOf('vdf') !== -1) { // VDF.parse or VDF.stringify
        if ((err.message.indexOf('invalid syntax') + err.message.indexOf('open parentheses somewhere')) > -1) {
          reason = 'the data is invalid (parsing error)'
        } else if (err.message.indexOf('does not exist') !== -1) {
          reason = 'it does not exist'
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
  } else {
    let data
    let stream

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
    } else if (btype === 'packageinfo') {
      try {
        stream = fs.createReadStream(filePath)
        data = BVDF.readPackageInfo(stream)
        return data
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}

SteamConfig.prototype.saveTextVDF = async function saveTextVDF (filePath, data) { // eslint-disable-line no-unused-vars
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

SteamConfig.prototype.saveBinaryVDF = async function saveBinaryVDF (filePath, data, btype) {
  if (typeof filePath !== 'string') {
    throw new TypeError(`Failed to save filePath because it is invalid -- type is "${typeof filePath}", but should be "string".`)
  }

  if (typeof data !== 'object') {
    throw new TypeError(`Failed to save ${filePath} because the data is invalid -- type is "${typeof data}", but should be "object".`)
  }

  if (typeof btype !== 'string') {
    throw new Error(`Failed to save ${filePath} because btype is invalid -- type is "${typeof btype}", but it should be "string".`)
  } else {
    btype = btype.toLowerCase()

    if (btype !== 'appinfo' && btype !== 'packageinfo' && btype !== 'shortcuts') {
      throw new Error(`Failed to save ${filePath} because btype is invalid -- it is ${btype}, but it should be 'appinfo', 'packageinfo', or 'shortcuts'.`)
    } else if (btype !== 'shortcuts') {
      throw new Error(`${btype} cannot currently be saved -- no implementation.`)
    }
  }

  try {
    if (btype === 'shortcuts') {
      data = await SVDF.writeBufferAsync(data)
    }

    await fs.writeFileAsync(filePath, data)
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

SteamConfig.prototype.setInstallPath = function setInstallPath (dir) {
  if (typeof dir !== 'string') {
    throw new TypeError(`Failed to setInstallPath because it is invalid -- type is "${typeof dir}", but should be "string".`)
  } else if (!fs.existsSync(dir)) {
    throw new Error(`Failed to setInstallPath to ${dir} because it does not exist.`)
  } else {
    this.loc = '' + dir
  }
}

SteamConfig.prototype.loadRegistry = async function loadRegistry () {
  let data

  if (this.platform === 'darwin') {
    let filePath = path.join(this.loc, 'registry.vdf')

    data = await loadTextVDF(filePath)
  } else if (this.platform === 'linux') {
    let filePath = path.join(this.loc, '..', 'registry.vdf')

    data = await loadTextVDF(filePath)
  } else if (this.platform === 'win32') {
    data = {
      'Registry': {
        'HKCU': {
          'Software': {
            'Valve': {
              'Steam': {
                'language': await winreg.get('language'),
                'RunningAppID': await winreg.get('RunningAppID'),
                'Apps': await winreg.get('Apps'),
                'AutoLoginUser': await winreg.get('AutoLoginUser'),
                'RememberPassword': await winreg.get('RememberPassword'),
                'SourceModInstallPath': await winreg.get('SourceModInstallPath'),
                'AlreadyRetriedOfflineMode': await winreg.get('AlreadyRetriedOfflineMode'),
                'StartupMode': await winreg.get('StartupMode'),
                'SkinV4': await winreg.get('SkinV4')
              }
            }
          }
        }
      }
    }
    // throw new Error('This platform is not currently supported.')
  }

  this.registry = data
}

SteamConfig.prototype.saveRegistry = async function saveRegistry () {
  if (this.platform === 'darwin' || this.platform === 'linux') {
    await fs.writeFileAsync(this.getPathTo('registry'), VDF.stringify(this.registry, true))
  } else if (this.platform === 'win32') {
    winreg.set('language', this.registry.Registry.HKCU.Software.Valve.Steam.language)
    winreg.set('AutoLoginUser', this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser)
    winreg.set('RememberPassword', this.registry.Registry.HKCU.Software.Valve.Steam.RememberPassword)
    winreg.set('SkinV4', this.registry.Registry.HKCU.Software.Valve.Steam.SkinV4)
  }
}

SteamConfig.prototype.loadAppinfo = async function loadAppinfo () {
  let filePath = path.join(this.loc, 'appcache', 'appinfo.vdf')

  this.appinfo = await loadBinaryVDF(filePath, 'appinfo')
}

/**
 * Load the binary VDF file packageinfo.vdf
 * @method
 */
SteamConfig.prototype.loadPackageinfo = async function loadPackageinfo () {
  // throw new Error('Parsing packageinfo is not currently supported.')
  let filePath = path.join(this.loc, 'appcache', 'packageinfo.vdf')

  let buf = Buffer.from(await fs.readFileAsync(filePath))
  let off = 0
  let pinfo = {
    signature: {
      v1: null,
      magic: null,
      v2: null
    },
    universe: null,
    packages: null
  }

  pinfo.signature.v1 = `0x${buf.readUInt8(off).toString(16)}`
  pinfo.signature.magic = `0x${buf.readUInt16LE(off += 1).toString(16)}`
  pinfo.signature.v2 = `0x${buf.readUInt8(off += 2).toString(16)}`
  pinfo.universe = buf.readUInt32LE(off += 1)
  pinfo.packages = BVDF2.parsePackageInfo(buf.slice(off))

  this.packageinfo = pinfo
}

/**
 * Load the binary VDF file packageinfo.vdf
 * @method
 */
SteamConfig.prototype.loadAppinfo2 = async function loadAppinfo2 () {
  // throw new Error('Parsing packageinfo is not currently supported.')
  let filePath = path.join(this.loc, 'appcache', 'appinfo.vdf')

  let buf = Buffer.from(await fs.readFileAsync(filePath))
  let off = 0
  let ainfo = {
    signature: {
      v1: `0x${buf.readUInt8(off).toString(16)}`,
      magic: `0x${buf.readUInt16LE(off += 1).toString(16)}`,
      v2: `0x${buf.readUInt8(off += 2).toString(16)}`
    },
    universe: buf.readUInt32LE(off += 1),
    apps: BVDF2.parseAppInfo(buf.slice(off))
  }

  this[ 'appinfo2' ] = ainfo
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

  if (fs.existsSync(filePath)) {
    this.libraryfolders = await loadTextVDF(filePath)
    this.nondefaultLibraryfolders = []

    let libs = Object.keys(this.libraryfolders.LibraryFolders)

    for (i = 0; i < libs.length; i++) {
      if (libs[ i ] !== 'TimeNextStatsReport' && libs[ i ] !== 'ContentStatsID') {
        this.nondefaultLibraryfolders.push(this.libraryfolders.LibraryFolders[libs[ i ]])
      }
    }
  }
}

SteamConfig.prototype.loadSteamapps = async function loadSteamapps () {
  let apps = []
  let x, y
  let files
  let libs = []

  try {
    Object.assign(libs, this.nondefaultLibraryfolders)

    libs.push(this.loc)

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

SteamConfig.prototype.loadShortcuts2 = async function loadShortcuts2 () {
  let filePath = path.join(this.loc, 'userdata', this.user.accountID, 'config', 'shortcuts.vdf')

  let buf = Buffer.from(await fs.readFileAsync(filePath))
  let off = 0
  this.shortcuts2 = BVDF2.parseShortcuts(buf.slice(off))
}

SteamConfig.prototype.setUser = function setUser (toUser) {
  if (toUser === undefined || typeof toUser !== 'string') {
    throw new Error(`Invalid type for toUser: ${typeof touser}; should be 'string'.`)
  } else if (this.loginusers === null || this.loginusers.hasOwnProperty('users') === false) {
    throw new Error('Cannot set user before loginusers is loaded.')
  }

  if (this.registry.Registry.HKCU.Software.Valve.Steam.hasOwnProperty('AutoLoginUser') === false) {
    this.registry.Registry.HKCU.Software.Valve.Steam[ 'AutoLoginUser' ] = ''
  }

  let userKeys = Object.keys(this.loginusers.users)

  for (let index = 0; index < userKeys.length; index += 1) {
    if (this.loginusers.users[userKeys[ index ]].AccountName === toUser) {
      this.user = Object.assign({}, this.loginusers.users[userKeys[ index ]])
    }
  }
}

SteamConfig.prototype.detectPath = function detectPath () {
  let detected = null

  if (this.platform.indexOf('win32') !== -1) {
    if (this.arch === 'ia32') {
      detected = path.join('C:\\', 'Program Files (x86)', 'Steam')
    } else {
      detected = path.join('C:\\', 'Program Files', 'Steam')
    }
  } else if (this.platform === 'linux') {
    detected = path.join(this.home, '.steam', 'steam')
  } else if (this.platform === 'darwin') {
    detected = path.join(this.home, 'Library', 'Application Support', 'Steam')
  }

  try {
    if (detected !== null && !fs.existsSync(detected)) {
      detected = null
      throw new Error('the default path does not exist.')
    }

    if (detected === null) {
      throw new Error('the current platform is not supported.')
    }
  } catch (err) {
    let reason = ''

    if (err.code === 'ENOENT') {
      reason = 'the default path does not exist (partial).'
    } else if (err.code === 'EACCES') {
      reason = 'the default path is not accessible.'
    } else {
      reason = `${err.message.toLowerCase()} ("${err.code || err.name || 'error'}" @ line ${getLine(err)})`
    }

    throw new Error(`Failed to detect path because ${reason}.`)
  }

  return detected
}

SteamConfig.prototype.getPathTo = function (what) {
  if (typeof what !== 'string') {
    throw new Error(`Invalid path type: ${typeof what}; should be a string.`)
  } else if (this.loc === null) {
    throw new Error('The path to Steam must be set before getPathTo can be used.')
  }

  if (what === 'registry') {
    if (this.platform === 'darwin') {
      return path.join(this.loc, 'registry.vdf')
    } else if (this.platform === 'linux') {
      return path.join(this.loc, '..', 'registry.vdf')
    }
  } else if (what === 'appinfo') {
    return path.join(this.loc, 'appcache', 'appinfo.vdf')
  } else if (what === 'packageinfo') {
    return path.join(this.loc, 'appcache', 'packageinfo.vdf')
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
      throw new Error('User must be set before getPathTo can find sharedconfig.vdf.')
    }
  } else if (what === 'localconfig') {
    if (this.user !== null && this.user.hasOwnProperty('accountID')) {
      return path.join(this.loc, 'userdata', this.user.accountID, 'config', 'localconfig.vdf')
    } else {
      throw new Error('User must be set before getPathTo can find localconfig.vdf.')
    }
  } else if (what === 'shortcuts') {
    if (this.user !== null && this.user.hasOwnProperty('accountID')) {
      return path.join(this.loc, 'userdata', this.user.accountID, 'config', 'shortcuts.vdf')
    } else {
      throw new Error('User must be set before getPathTo can find shortcuts.vdf.')
    }
  } else {
    throw new Error(`Unknown file for getPathTo: ${what}`)
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

  if (this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser) {
    detected = this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser
  } else if (userKeys.length === 1) {
    detected = this.loginusers.users[userKeys[ 0 ]].AccountName
  } else if (userKeys.length > 1) {
    throw new Error(`There are ${userKeys.length} users associated with this Steam installation and no current user; cannot auto-detect the user.`)
  } else {
    throw new Error('There are no users associated with this Steam installation.')
  }

  return detected
}

module.exports = SteamConfig

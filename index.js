/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 *
 * @requires {@link https://www.npmjs.com/package/cuint|cuint}
 * @requires {@link https://www.npmjs.com/package/bluebird|bluebird}
 * @requires {@link https://www.npmjs.com/package/rage-edit|rage-edit}
 * @requires {@link https://www.npmjs.com/package/simple-vdf2|simple-vdf2}
 * @requires {@link https://www.npmjs.com/package/web-request|web-request}
 * @requires {@link https://www.npmjs.com/package/fast-xml-parser|fast-xml-parser}
 */

'use strict'

const BB = require('bluebird').Promise
const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const TVDF = require('simple-vdf2')
const BVDF = require('./bvdf.js')
const UInt64 = require('cuint').UINT64
const WebRequest = require('web-request')
const FXP = require('fast-xml-parser')
const {Registry} = require('rage-edit')

/**
 * SteamConfig constructor.
 * @constructor
 * @property {string} rootPath        - The install location of the Steam client.
 * @property {string} user            - The user for SteamConfig to load/save Steam configuration data for.
 * @property {string} extraLibraries  - The non-default Steam Library Folders for this installation.
 *
 * @property {string} registry        - The value of the Windows Registry, or Steam/registry.vdf on Linux/Mac.
 * @property {string} config          - The value of the file Steam/config/config.vdf.
 * @property {string} loginusers      - The value of the file Steam/config/loginusers.vdf.
 * @property {string} libraryfolders  - The value of the file Steam/steamapps/libraryfolders.vdf.
 * @property {string} steamapps       - Array of the appmanifest_#.acf file(s) from Steam/steamapps.
 * @property {string} appinfo         - The value of the Binary VDF file Steam/appcache/appinfo.vdf.
 * @property {string} sharedconfig    - The value of the file Steam/userdata/{accountID}/7/remote/sharedconfig.vdf.
 * @property {string} localconfig     - The value of the file Steam/userdata/{accountID}/config/sharedconfig.vdf.
 * @property {string} shortcuts       - The value of the file Steam/userdata/{accountID}/config/shortcuts.vdf.
 * @property {string} platform        - The current platform (OS) -- darwin = macOS, linux = Linux, win32 = Windows.
 * @property {string} arch            - The current architecture (32 or 64-bit) -- ia32 = x86, ia64 = x64ia32.
 * @property {string} home            - The home directory for the system; based on platform.
 */
function SteamConfig () {
  this.rootPath = null
  this.user = null
  this.extraLibraries = null

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

  this.os = require('os').platform()
  this.arch = require('os').arch()
  this.home = require('os').homedir()
}

/*
 * Internal method to load a text-based VDF file.
 */
async function loadTextVDF (file) {
  let data

  try {
    data = TVDF.parse('' + await fs.readFileAsync(file))
  } catch (err) {
    throw new Error(err)
  }

  return data
}

/*
 * Internal method to load some binary VDF files.
 */
async function loadBinaryVDF (file) {
  let data

  try {
    switch (path.basename(file)) {
      case 'appinfo.vdf':
        data = await BVDF.parseAppInfo(Buffer.from(await fs.readFileAsync(file)))
        break

      case 'packageinfo.vdf':
        data = await BVDF.parsePackageInfoBuffer.from(await fs.readFileAsync(file))
        break

      case 'shortcuts.vdf':
        data = await BVDF.parseShortcuts(Buffer.from(await fs.readFileAsync(file)))
        break

      default:
        throw new Error(`Cannot parse unknown binary file ${file}.`)
    }
  } catch (err) {
    throw new Error(err)
  }

  return data
}

/**
 * Load a file based on it's path.
 * @method
 * @async
 * @param which {string} - The path to the file.
 */
SteamConfig.prototype.load = async function load (file) {
  if (!file || file === '' || file === null) {
    throw new Error(`Cannot load() nothing.`)
  } else if (typeof which !== 'string') {
    throw new Error(`Invalid argument type ${typeof file} for load().`)
  } else if (file === 'steamapps') {
    try {
      let apps
      let lib

      if (typeof which === 'string') {
        file = [file]
      }

      for (lib of file) {
        // Ignore non-default libs that don't exist because they may be on an external drive that's not connected.
        if (fs.existsSync(lib)) {
          apps = await loadApps(lib)

          if (this.appendApps && this.steamapps) {
            this.steamapps = this.steamapps.concat(apps)
          } else {
            this.steamapps = apps
          }
        }
      }
    } catch (err) {
      throw new Error(err)
    }
  } else {
    try {
      if (file.indexOf('sharedconfig.vdf') !== -1) {
        this.sharedconfig = await loadTextVDF(file)
      } else if (file.indexOf('appinfo.vdf') !== -1) {
        this.appinfo = await loadBinaryVDF(file)
      } else if (file.indexOf('config.vdf') !== -1) {
        this.config = await loadTextVDF(file)
      } else if (file.indexOf('libraryfolders.vdf') !== -1) {
        let data = await loadTextVDF(file)
        let keys = Object.keys(data.LibraryFolders)
        let libs = []

        for (let l of keys) {
          if (l !== 'ContentStatsID' && l !== 'TimeNextStatsReport') {
            libs.push(data.LibraryFolders[ l ])
          }
        }

        this.extraLibraries = libs
      } else if (file.indexOf('localconfig.vdf') !== -1) {
        this.localconfig = await loadTextVDF(file)
      } else if (file.indexOf('loginusers.vdf') !== -1) {
        this.loginusers = await loadTextVDF(file)
      } else if (file.indexOf('registry') !== -1) {
        this.registry = await loadRegistry()
      } else if (file.indexOf('shortcuts.vdf') !== -1) {
        this.shortcuts = await loadBinaryVDF(file)
      } else if (file.indexOf('skins') !== -1) {
        let skins
        let data = await fs.readdirAsync(file)

        skins = data.filter(s => {
          if (s.indexOf('.txt') === -1 && s.indexOf('.DS_Store') === -1) {
            return true
          }
        })
        this.skins = skins
      } else {
        throw new Error(`Cannot load unknown file ${file}.`)
      }
    } catch (err) {
      throw new Error(err)
    }
  }
}

/**
 * Save a file based on it's path from {@link steamConfig.getPath(which)}
 * @method
 * @async
 */
SteamConfig.prototype.save = async function save () {

}

SteamConfig.prototype.setInstallPath = function setInstallPath (dir) {
  if (typeof dir !== 'string') {
    throw new TypeError(`Invalid arg dir for setInstallPath -- type is "${typeof dir}", but should be "string".`)
  } else if (!fs.existsSync(dir)) {
    throw new Error(`Cannot setInstallPath to ${dir} because it does not exist.`)
  } else {
    this.rootPath = '' + dir
  }
}

async function loadRegistry () {
  let data

  if (this.platform === 'darwin') {
    let filePath = path.join(this.loc, 'registry.vdf')

    data = await loadTextVDF(filePath)
  } else if (this.platform === 'linux') {
    let filePath = path.join(this.loc, '..', 'registry.vdf')

    data = await loadTextVDF(filePath)
  } else if (this.platform === 'win32') {
    const winreg = new Registry('HKCU\\Software\\Valve\\Steam')
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
  const winreg = new Registry('HKCU\\Software\\Valve\\Steam')
  if (this.platform === 'darwin' || this.platform === 'linux') {
    await fs.writeFileAsync(this.getPathTo('registry'), TVDF.stringify(this.registry, true))
  } else if (this.platform === 'win32') {
    winreg.set('language', this.registry.Registry.HKCU.Software.Valve.Steam.language)
    winreg.set('AutoLoginUser', this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser)
    winreg.set('RememberPassword', this.registry.Registry.HKCU.Software.Valve.Steam.RememberPassword)
    winreg.set('SkinV4', this.registry.Registry.HKCU.Software.Valve.Steam.SkinV4)
  }
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
  let detected

  try {
    switch (this.os) {
      case 'linux':
        detected = path.join(this.home, '.steam', 'steam')

        break
      case 'darwin':
        detected = path.join(this.home, 'Library', 'Application Support', 'Steam')

        break
      case 'win32':
        if (this.arch === 'ia32') {
          detected = path.join('C:\\', 'Program Files (x86)', 'Steam')
        } else {
          detected = path.join('C:\\', 'Program Files', 'Steam')
        }

        break
      default:
        throw new Error(`The OS ${this.os} is not supported.`)
    }
  } catch (err) {
    throw new Error(err)
  }

  if (detected && !fs.existsSync(detected)) {
    throw new Error('The default path does not exist.')
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
  let user = null

  if (this.registry && (user = this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser) !== '') {
    return user
  }

  return null
}

/*
 * Internal method to get a user's accountId from their unique 64-bit SteamID.
 */
function getAccountIdFromId64 (id64) {
  try {
    return (new UInt64(id64, 10).toNumber() & 0xFFFFFFFF) >>> 0
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = SteamConfig

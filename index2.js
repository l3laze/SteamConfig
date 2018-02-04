/**
 * @file index2.js
 * @author Tom <l3l_aze@yahoo.com>
 */

'use strict'

const BB = require('bluebird').Promise
const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const FXP = require('fast-xml-parser')
const WebRequest = require('web-request')
const OS = require('os')
const UInt64 = require('cuint').UINT64
const TVDF = require('simple-vdf2')
const BVDF = require('./bvdf.js')
const {Registry} = require('rage-edit')

/**
 * SteamConfig constructor. If running on Windows, will initialize an instance of the chunk of the registry that is needed.
 * @constructor
 */
function SteamConfig () {
  if (OS.platform() === 'win32') {
    try {
      internal[ 'winreg' ] = new Registry('HKCU\\Software\\Valve\\Steam')
    } catch (err) {
      throw new Error()
    }
  }
}

/**
 * The paths to the Steam data that SteamConfig can manage.
 * @constant
 */
const steamPaths = {
  get appinfo () {
    return path.join(internal.rootPath, 'appcache', 'appinfo.vdf')
  },
  get config () {
    return path.join(internal.rootPath, 'config', 'config.vdf')
  },
  get libraryfolders () {
    return path.join(internal.rootPath, 'steamapps', 'libraryfolders.vdf')
  },
  get localconfig () {
    return path.join(internal.rootPath, 'userdata', `${internal.user.accountId}`, 'config', 'localconfig.vdf')
  },
  get loginusers () {
    return path.join(internal.rootPath, 'config', 'loginusers.vdf')
  },
  get registry () {
    if (internal.os === 'linux' || internal.os === 'darwin') {
      return path.join(internal.rootPath, 'registry.vdf')
    } else {
      return 'winreg'
    }
  },
  get sharedconfig () {
    return path.join(internal.rootPath, 'userdata', `${internal.user.accountId}`, '7', 'remote', 'sharedconfig.vdf')
  },
  get shortcuts () {
    return path.join(internal.rootPath, 'userdata', `${internal.user.accountId}`, 'config', 'shortcuts.vdf')
  },
  get skins () {
    switch (internal.os) {
      case 'darwin':
        return path.join(internal.rootPath, 'Steam.AppBundle', 'Steam', 'Contents', 'MacOS', 'skins')

      case 'linux':
      case 'win32':
        return path.join(internal.rootPath, 'skins')
    }
  },
  get steamapps () {
    return path.join(internal.rootPath, 'steamapps')
  },
  get extraLibraries () {
    return internal.extraLibraries
  },
  get extraLibrariesSteamApps () {
    let appPaths = Array.from(internal.extraLibraries.map(l => path.join(l, 'steamapps')))

    return appPaths
  }
}

/*
 * Internal values for SteamConfig. The getters/setters of
 *  SteamConfig.prototype are a proxy to access/modify them.
 */
let internal = {
  arch: OS.arch(),
  cache: {
    enabled: false,
    folder: null
  },
  home: OS.homedir(),
  extraLibraries: [],
  os: OS.platform(),
  rootPath: null,
  appendApps: false,

  appinfo: null,
  config: null,
  libraryfolders: null,
  localconfig: null,
  loginusers: null,
  packageinfo: null,
  registry: null,
  shortcuts: null,
  sharedconfig: null,
  skins: null,
  steamapps: null,
  user: null
}

/**
 * Internal property getters and setters.
 */
SteamConfig.prototype = {
  get paths () {
    return steamPaths
  },

  set paths (val) {
    // Just ignore it. User(s) should not be able to modify paths.
  },

  get root () {
    return internal.rootPath
  },

  set root (val) {
    internal.rootPath = val
  },

  get arch () {
    return internal.arch
  },

  get os () {
    return internal.os
  },

  get home () {
    return internal.home
  },

  get user () {
    return internal.user
  },

  set user (val) {
    internal.user = val
  },

  get cacheEnabled () {
    return internal.cache.enabled
  },

  set cacheEnabled (val) {
    internal.cache.enabled = val
  },

  get cachePath () {
    return internal.cache.folder
  },

  set cachePath (val) {
    internal.cache.folder = val
  },

  get appendApps () {
    return internal.appendApps
  },

  set appendApps (val) {
    internal.appendApps = val
  },

  get appinfo () {
    return internal.appinfo
  },

  get config () {
    return internal.config
  },

  get libraryfolders () {
    return internal.libraryfolders
  },

  get extraLibraries () {
    return internal.extraLibraries
  },

  get localconfig () {
    return internal.localconfig
  },

  get loginusers () {
    return internal.loginusers
  },

  get packageinfo () {
    return internal.packageinfo
  },

  get registry () {
    return internal.registry
  },

  get shortcuts () {
    return internal.shortcuts
  },

  get sharedconfig () {
    return internal.sharedconfig
  },

  get skins () {
    return internal.skins
  },

  get steamapps () {
    return internal.steamapps
  }
}

/**
 * Load a file based on it's path from SteamConfig.paths.
 * @method
 * @arg which -- The path, from SteamConfig.paths, to load the file from.
 */
SteamConfig.prototype.load = async function load (which) {
  if (which && ((typeof which === 'string' && which.indexOf('steamapps') !== -1 && which.indexOf('libraryfolders.vdf') === -1) ||
      (which.constructor === Array && which[ 0 ].indexOf('steamapps') !== -1))) {
    try {
      let apps
      let lib

      if (typeof which === 'string') {
        which = [which]
      }

      for (lib of which) {
        // Ignore non-default libs that don't exist because they may be on an external drive that's not connected.
        if (fs.existsSync(lib)) {
          apps = await loadApps(lib)

          if (internal.appendApps && internal.steamapps) {
            internal.steamapps = internal.steamapps.concat(apps)
          } else {
            internal.steamapps = apps
          }
        }
      }
    } catch (err) {
      throw new Error(err)
    }
  } else {
    try {
      if (which.indexOf('sharedconfig.vdf') !== -1) {
        internal.sharedconfig = await loadTextVDF(which)
      } else if (which.indexOf('appinfo.vdf') !== -1) {
        internal.appinfo = await loadBinaryVDF(which)
      } else if (which.indexOf('config.vdf') !== -1) {
        internal.config = await loadTextVDF(which)
      } else if (which.indexOf('libraryfolders.vdf') !== -1) {
        let data = await loadTextVDF(which)
        let keys = Object.keys(data.LibraryFolders)
        let libs = []

        for (let l of keys) {
          if (l !== 'ContentStatsID' && l !== 'TimeNextStatsReport') {
            libs.push(data.LibraryFolders[ l ])
          }
        }

        internal.extraLibraries = libs
      } else if (which.indexOf('localconfig.vdf') !== -1) {
        internal.localconfig = await loadTextVDF(which)
      } else if (which.indexOf('loginusers.vdf') !== -1) {
        internal.loginusers = await loadTextVDF(which)
      } else if (which.indexOf('registry') !== -1) {
        internal.registry = await loadRegistry(this.paths.registry)
      } else if (which.indexOf('shortcuts.vdf') !== -1) {
        internal.shortcuts = await loadBinaryVDF(which)
      } else if (which.indexOf('skins') !== -1) {
        let skins
        let data = await fs.readdirAsync(which)

        skins = data.filter(s => {
          if (s.indexOf('.txt') === -1 && s.indexOf('.DS_Store') === -1) {
            return true
          }
        })
        internal.skins = skins
      } else {
        throw new Error(`Unknown file: ${which}. Cannot load.`)
      }
    } catch (err) {
      throw new Error(err)
    }
  }
}

/**
 * Save a file based on it's path from SteamConfig.paths.
 * @method
 */
SteamConfig.prototype.save = function save () {

}

/**
 * Attempt to detect the root installation path based on platform-specific default installation locations.
 * @method
 */
SteamConfig.prototype.detectRoot = function detectRoot () {
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

/**
 * Attempt to detect the current user based on Registry.HKCU.Software.Valve.Steam.AutoLoginUser.
 * @method
 */
SteamConfig.prototype.detectUser = function detectUser () {
  let user = null

  if (this.registry && (user = this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser) !== '') {
    return user
  }

  return user
}

/**
 * Request a user's list of owned apps from the internet.
 * @method
 */
SteamConfig.prototype.requestOwnedApps = async function requestOwnedApps (force) {
  let data
  let cacheFile

  try {
    if (!this.user) {
      throw new ReferenceError('The user has not been defined yet (@requestOwnedApps).')
    }

    if (this.cacheEnabled) {
      cacheFile = path.join(this.cachePath, `owned-${this.user.accountId}.json`)

      if (!fs.existsSync(this.cachePath)) {
        fs.mkdirSync(this.cachePath)
      }
    }

    if (this.cacheEnabled && (this.cachePath && fs.existsSync(this.cachePath)) && (cacheFile && fs.existsSync(cacheFile)) && !force) {
      data = JSON.parse(await fs.readFileAsync(cacheFile))
    } else {
      data = await WebRequest.get(`https://steamcommunity.com/profiles/${this.user.id64}/games/?tab=all&xml=1`)
      data = FXP.parse(data.content).gamesList.games.game

      if (this.cacheEnabled) {
        await fs.writeFileAsync(cacheFile, JSON.stringify(data))
      }
    }
  } catch (err) {
    throw new Error(err)
  }

  this.user[ 'owned' ] = data
}

/**
 * Request a list of the popular tags from the internet.
 * @method
 */
SteamConfig.prototype.requestPopularTags = async function requestPopularTags (force) {
  let data
  let cacheFile = path.join(this.cachePath, `tags.json`)

  try {
    if (this.cacheEnabled) {
      if (!fs.existsSync(this.cachePath)) {
        fs.mkdirSync(this.cachePath)
      }

      cacheFile = path.join(this.cachePath, `tags.json`)
    }

    if (this.cacheEnabled && (this.cachePath && fs.existsSync(this.cachePath)) && (cacheFile && fs.existsSync(cacheFile)) && !force) {
      data = JSON.parse(await fs.readFileAsync(cacheFile))
    }

    if (this.cacheEnabled && (this.cachePath && fs.existsSync(this.cachePath)) && (cacheFile && fs.existsSync(cacheFile)) && !force) {
      data = JSON.parse(await fs.readFileAsync(cacheFile))
    } else {
      data = await WebRequest.get('https://store.steampowered.com/tagdata/populartags/english')
      data = JSON.parse(data.message.body)

      if (this.cacheEnabled) {
        await fs.writeFileAsync(cacheFile, JSON.stringify(data))
      }
    }
  } catch (err) {
    throw new Error(err)
  }

  this.tags = data
}

/**
 * Get the name of a tag from the list of tags using it's id.
 * @method
 */
SteamConfig.prototype.getTagById = function getTagById (id) {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid arg id for getTabById. Should be a string.')
  }

  let data

  for (let i = 0; i < this.tags.length; i += 1) {
    if (this.tags[ i ].tagid === id) {
      data = this.tags[ i ].name
      break
    }
  }

  if (data) {
    return data
  }

  throw new Error(`Unknown tag id: ${id}. Can't getTagById.`)
}

/**
 * Add a category to a given app entry if it does not exist.
 * @method
 */
SteamConfig.prototype.addCategory = function addCategory (app, cat) {
  let cats = Object.values(app.tags)
  let index = cats.length || 0

  if (cats.includes(cat) === false) {
    app.tags[ index ] = cat
  }

  return app
}

/**
 * Remove a category from a given app entry if it does exist.
 * @method
 */
SteamConfig.prototype.removeCategory = function removeCategory (app, cat) {
  let tags = Object.values(app.tags)
  let index = -1

  if ((index = tags.indexOf(cat)) !== -1) {
    tags = tags.splice(index, index + 1)
    app.tags = {}

    for (let i = 0; i < tags.length; i += 1) {
      app.tags[ i ] = tags[ i ]
    }
  }

  return app
}

/**
 * Get the accountId portion of a user's 64-bit account number from loginusers.vdf.
 * @method
 */
SteamConfig.prototype.getAccountId = function getAccountId (id64) {
  let data
  try {
    data = getAccountIdFromId64(id64)
  } catch (err) {
    throw new Error(err)
  }

  return data
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

/*
 * Internal method to load the registry entries either from registry.vdf on Linux/Mac, or the Registry on Windows.
 */
async function loadRegistry () {
  let data

  try {
    if (internal.os === 'darwin') {
      let filePath = path.join(internal.rootPath, 'registry.vdf')

      data = await loadTextVDF(filePath)
    } else if (internal.os === 'linux') {
      let filePath = path.join(internal.rootPath, '..', 'registry.vdf')

      data = await loadTextVDF(filePath)
    } else if (internal.os === 'win32') {
      data = {
        'Registry': {
          'HKCU': {
            'Software': {
              'Valve': {
                'Steam': {
                  'language': await internal.winreg.get('language'),
                  'RunningAppID': await internal.winreg.get('RunningAppID'),
                  'Apps': await internal.winreg.get('Apps'),
                  'AutoLoginUser': await internal.winreg.get('AutoLoginUser'),
                  'RememberPassword': await internal.winreg.get('RememberPassword'),
                  'SourceModInstallPath': await internal.winreg.get('SourceModInstallPath'),
                  'AlreadyRetriedOfflineMode': await internal.winreg.get('AlreadyRetriedOfflineMode'),
                  'StartupMode': await internal.winreg.get('StartupMode'),
                  'SkinV4': await internal.winreg.get('SkinV4')
                }
              }
            }
          }
        }
      }
    } else {
      throw new Error('This platform is not currently supported.')
    }
  } catch (err) {
    throw new Error(err)
  }

  return data
}

/*
 * Internal method to save the registry entries either to registry.vdf on Linux/Mac, or the Registry on Windows.
 */
async function saveRegistry () {
}

/*
 * Internal method to load all of the appmanifest_#.acf files from a given Steam Library Folder.
 */
async function loadApps (lib) {
  let apps

  try {
    apps = await fs.readdirAsync(lib)

    apps = apps.filter(a => {
      if (a.indexOf('.acf') !== -1) {
        return a
      }
    })
  } catch (err) {
    throw new Error(err)
  }

  return apps
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

/*
 * To keep es-lint from whining about it not being used.
 */
if (false) { // eslint-disable-line no-constant-condition
  saveRegistry()
}

module.exports = SteamConfig

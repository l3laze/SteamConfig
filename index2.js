/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
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
 * @throws {Error} - If there's an error creating the registry instance on Windows.
 */
function SteamConfig () {
  if (OS.platform() === 'win32') {
    try {
      internal[ 'winreg' ] = new Registry('HKCU\\Software\\Valve\\Steam')
    } catch (err) {
      throw new Error(err)
    }
  }
}

/*
 * Internal values for SteamConfig. The getters/setters of SteamConfig.prototype are a proxy to access/modify them.
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

SteamConfig.prototype = {
  /**
   * Get the path to the root of the Steam installation.
   * @method
   * @access public
   * @returns {String} - The path to the root of the Steam folder.
   */
  get root () {
    return internal.rootPath
  },

  /**
   * Set the path to the root of the Steam installation.
   * @method
   * @access public
   * @param {String} - The path to the root of the Steam folder.
   */
  set root (val) {
    internal.rootPath = val
  },

  /**
   * Get the current machine's architecture (ia32 = 32-bit or ia64 = 64-bit).
   * @method
   * @access public
   * @returns {String} - ia32 (32-bit) or ia64 (64-bit).
   */
  get arch () {
    return internal.arch
  },

  /**
   * Get the current machine's platform (OS).
   * @method
   * @access public
   * @returns {String} - The name of the platform (linux, darwin = mac, win32 = windows)
   */
  get os () {
    return internal.os
  },

  /**
   * Get the user's home directory.
   * @method
   * @access public
   * @returns {String} - The path to the user's home directory.
   */
  get home () {
    return internal.home
  },

  /**
   * Get the currently-set SteamConfig user.
   * @method
   * @access public
   * @returns {Object} - The current user.
   */
  get user () {
    return internal.user
  },

  /**
   * Set the user for SteamConfig.
   * @method
   * @access public
   * @param {Object} - The user to set.
   */
  set user (val) {
    internal.user = val
  },

  /**
   * Get current state of the cache -- enabled or disabled.
   * @method
   * @access public
   * @returns {Boolean} - True if the cache is enabled, otherwise false.
   */
  get cacheEnabled () {
    return internal.cache.enabled
  },

  /**
   * Set the state of the cache.
   * @method
   * @access public
   * @param {Boolean} - True to enable the cache, false to disable it.
   */
  set cacheEnabled (val) {
    internal.cache.enabled = val
  },

  /**
   * Get the path to the cache.
   * @method
   * @access public
   * @returns {String} - The path to the cache.
   */
  get cachePath () {
    return internal.cache.folder
  },

  /**
   * Set the path to the cache.
   * @method
   * @access public
   * @param {String} - The new path to the cache.
   */
  set cachePath (val) {
    internal.cache.folder = val
  },

  /**
   * Get the current state of "appendApps" -- enabled or disabled.
   *  This will cause `this.load(this.steamapps | this.extraSteamApps)` to append rather than create a new list, allowing loading of all of the steamapps folders at once.
   * @method
   * @access public
   * @returns {Boolean}
   */
  get appendApps () {
    return internal.appendApps
  },

  /**
   * Set the state of "appendApps" -- enabled or disabled.
   * @method
   * @access public
   * @param {Boolean} - True to enable appending of loaded apps, false to disable.
   */
  set appendApps (val) {
    internal.appendApps = val
  },

  /**
   * Get the path to the file Steam/appcache/appinfo.vdf.
   * @method
   * @access public
   * @returns {String} - The path to the file.
   */
  get appinfo () {
    return internal.appinfo
  },

  /**
   * Get the path to the file Steam/config/config.vdf
   * @method
   * @access public
   * @returns {String} - The path to the file.
   */
  get config () {
    return internal.config
  },

  /**
   * Get the path to the file Steam/steamapps/libraryfolders.vdf
   * @method
   * @access public
   * @returns {String} - The path to the file.
   */
  get libraryfolders () {
    return internal.libraryfolders
  },

  /**
   * Get the path(s) to any non-default Steam Library Folders.
   * @method
   * @access public
   * @returns {String} - The path(s) to the folders.
   */
  get extraLibraries () {
    return internal.extraLibraries
  },

  /**
   * Get the path(s) to the file Steam/userdata/{user.accountId}/config/localconfig.vdf.
   * @method
   * @access public
   * @returns {String} - The path to the file.
   */
  get localconfig () {
    return internal.localconfig
  },

  /**
   * Get the path to the file Steam/config/loginusers.vdf
   * @method
   * @access public
   * @returns {String} - The path to the file.
   */
  get loginusers () {
    return internal.loginusers
  },

  /**
   * Get the path to the file Steam/appcache/packageinfo.vdf
   * @method
   * @access public
   * @returns {String} - The path to the file.
   */
  get packageinfo () {
    return internal.packageinfo
  },

  /**
   * Get the platform-specific path to the registry.
   * @method
   * @access public
   * @returns {String} - Windows: "winreg". Linux & Mac: The path to the file.
   */
  get registry () {
    return internal.registry
  },

  /**
   * Get the path to the file Steam/userdata/{accountId}/config/shortcuts.vdf.
   * @method
   * @access public
   * @returns {String} - The path to the file.
   */
  get shortcuts () {
    return internal.shortcuts
  },

  /**
   * Get the path to the file Steam/userdata/{accountId}/7/remote/sharedconfig.vdf.
   * @method
   * @access public
   * @returns {String} - The path to the file.
   */
  get sharedconfig () {
    return internal.sharedconfig
  },

  /**
   * Get the platform-specific path to the "skins" folder.
   * @method
   * @access public
   * @return {String} - The path to the folder.
   */
  get skins () {
    return internal.skins
  },

  /**
   * Get the path to the default Steam/steamapps Steam Library folder.
   * @method
   * @access public
   * @returns {String} - The path to the folder.
   */
  get steamapps () {
    return internal.steamapps
  }
}

/**
 * Get the paths to files specific to a platform/installation/user.
 * @method
 * @param which {string} - A Steam config file by name to get the path to.
 */
SteamConfig.prototype.getPath = function getPath (which) { // eslint-disable-line no-unused-vars
  switch (which) {
    case 'appinfo':
      return path.join(internal.rootPath, 'appcache', 'appinfo.vdf')
    case 'config':
      return path.join(internal.rootPath, 'config', 'config.vdf')
    case 'libraryfolders':
      return path.join(internal.rootPath, 'steamapps', 'libraryfolders.vdf')
    case 'localconfig':
      return path.join(internal.rootPath, 'userdata', `${internal.user.accountId}`, 'config', 'localconfig.vdf')
    case 'loginusers':
      return path.join(internal.rootPath, 'config', 'loginusers.vdf')
    case 'registry':
      if (internal.os === 'linux' || internal.os === 'darwin') {
        return path.join(internal.rootPath, 'registry.vdf')
      } else {
        return 'winreg'
      }
    case 'sharedconfig':
      return path.join(internal.rootPath, 'userdata', `${internal.user.accountId}`, '7', 'remote', 'sharedconfig.vdf')
    case 'shortcuts':
      return path.join(internal.rootPath, 'userdata', `${internal.user.accountId}`, 'config', 'shortcuts.vdf')
    case 'skins':
      switch (internal.os) {
        case 'darwin':
          return path.join(internal.rootPath, 'Steam.AppBundle', 'Steam', 'Contents', 'MacOS', 'skins')

        case 'linux':
        case 'win32':
          return path.join(internal.rootPath, 'skins')
        default:
          throw new Error(`The platform ${internal.os} is not currently supported.`)
      }
    case 'steamapps':
      return path.join(internal.rootPath, 'steamapps')
    case 'extraLibraries':
      return internal.extraLibraries
    case 'extraSteamApps':
      return Array.from(internal.extraLibraries.map(l => path.join(l, 'steamapps')))
    default:
      throw new Error(`Cannot find unknown path ${which}.`)
  }
}

/**
 * Load a file based on it's path from {@link steamConfig.getPath(which)}.
 * @method
 * @async
 * @param which {string} - The path to the file.
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
        internal.registry = await loadRegistry()
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
        throw new Error(`Cannot load unknown file ${which}.`)
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
 * Attempt to detect the current user based on `Registry.HKCU.Software.Valve.Steam.AutoLoginUser`.
 * @method
 */
SteamConfig.prototype.detectUser = function detectUser () {
  let user = null

  if (this.registry && (user = this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser) !== '') {
    return user
  }

  return null
}

/**
 * Request a user's list of owned apps from the internet.
 * @method
 * @async
 * @param force {boolean} - Force request to get a new copy instead of using a cached copy.
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
 * @async
 * @param force {boolean} - Force request to get a new copy instead of using a cached copy.
 */
SteamConfig.prototype.requestTags = async function requestTags (force) {
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
 * @param id {string|number} - The tag id to get the name of.
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
 * @param app {object} - The app to add the category to.
 * @param cat {string} - The category to add.
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
 * @param app {object} - The app to remove the category from.
 * @param cat {string} - The category to remove.
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
 * @param id64 {string|number} - The user's 64-bit Steam ID.
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
async function saveRegistry () { // eslint-disable-line no-unused-vars
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

module.exports = SteamConfig

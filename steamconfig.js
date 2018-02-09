/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 * @module SteamConfig
 * @requires {@link https://www.npmjs.com/package/cuint|cuint}
 * @requires {@link https://www.npmjs.com/package/bluebird|bluebird}
 * @requires {@link https://www.npmjs.com/package/rage-edit|rage-edit}
 * @requires {@link https://www.npmjs.com/package/simple-vdf2|simple-vdf2}
 * @requires {@link https://www.npmjs.com/package/web-request|web-request}
 * @requires {@link https://www.npmjs.com/package/fast-xml-parser|fast-xml-parser}
 */

'use strict'

const BB = require('bluebird').Promise
const OS = require('os')
const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const FXP = require('fast-xml-parser')
const WebRequest = require('web-request')
const UInt64 = require('cuint').UINT64
const TVDF = require('simple-vdf2')
const BVDF = require('./bvdf.js')
const {Registry} = require('rage-edit')
const SteamPaths = require('./steampaths.js')

/**
 * @constructor
 * @export
 * @property {Path}             rootPath        - The root of the Steam installation.
 * @property {Object}           user            - Current user.
 * @property {Array}            libraries       - A Path-type entry for each of the non-default Steam Library Folders of the Steam installation.
 * @property {Boolean}          appendToApps    - Whether to append apps or destroy the old data each time a single steamapps folder is loaded.
 * @property {Boolean}          cacheEnabled    - The current cache setting. Enabled = true, disabled = false.
 * @property {Path}             cacheFolder     - Path to use for the cache folder.
 *
 * @property {Object}           appinfo         - Steam/appcache/appinfo.vdf.
 * @property {Object}           config          - Steam/config/config.vdf.
 * @property {Object}           libraryfolders  - Steam/steamapps/libraryfolders.vdf.
 * @property {Object}           localconfig     - Steam/userdata/{user.accountId}.localconfig.vdf as an object.
 * @property {Object}           loginusers      - Steam/config/loginusers.vdf as an object.
 * @property {Object}           packageinfo     - Steam/appcache/packageinfo.vdf as an object.
 * @property {Object}           registry        - Platform-specific: On Linux/Mac: registry.vdf as an object. On Windows: Registry as an object.
 * @property {Object}           shortcuts       - Steam/userdata/{this.user.accountId}/config/shortcuts.vdf as an object.
 * @property {Object}           sharedconfig    - Steam/userdata/{this.user.accountId}/7/remote/sharedconfig.vdf as an object.
 * @property {Array}            skins           - Platform-specific skins folder entries (that are skins) as an array.
 * @property {Array}            steamapps       - The appmanifest files of Steam/steamapps as an array.
 */
function SteamConfig () {
  this.rootPath = null
  this.user = null
  this.libraries = []
  this.appendToApps = false
  this.cacheEnabled = false
  this.cacheFolder = null

  this.arch = require('os').arch()
  this.os = require('os').platform()
  this.homeDir = require('os').homedir()

  this.appinfo = null
  this.config = null
  this.libraryfolders = null
  this.localconfig = null
  this.loginusers = null
  this.packageinfo = null
  this.registry = null
  this.shortcuts = null
  this.sharedconfig = null
  this.skins = null
  this.steamapps = null

  if (this.os === 'win32') {
    try {
      this[ 'winreg' ] = new Registry('HKCU\\Software\\Valve\\Steam')
    } catch (err) {
      throw new Error(err)
    }
  }
}

/**
 * Load a Steam file by name.
 * @method
 */
SteamConfig.prototype.load = async function (names) {
  if (!names || ((typeof names !== 'string' || names === '') && (typeof names !== 'object' || names.constructor !== Array))) {
    throw new Error(`Invalid arg for load: Value ${names} with type ${typeof names}.`)
  }

  names = prepareFileNames(names)

  let file
  let name

  for (name of names) {
    if (typeof name === 'string' && name === 'steamapps') {
      name = ['library', this.getPath(name)]
    }

    if (typeof name === 'object' && name.constructor === Array) {
      file = name[ 1 ]
      name = name[ 0 ]
    } else if (!SteamPaths[ name ]) {
      throw new Error(`Cannot load unknown file ${name}.`)
    }

    try {
      if (!this.rootPath) {
        this.rootPath = this.detectRoot()
      }

      if ((name === 'shortcuts' || name === 'localconfig' || name === 'sharedconfig') && !this.user) {
        this.user = this.detectUser()
      }

      if (!file) {
        file = this.getPath(name)
      }

      if (!fs.existsSync(file)) {
        throw new Error(`Cannot load ${name} because ${file} does not exist.`)
      }

      switch (name) {
        case 'appinfo':
          this.appinfo = await BVDF.parseAppInfo(Buffer.from(await fs.readFileAsync(file)))
          break

        case 'packageinfo':
          this.packageinfo = await BVDF.parsePackageInfo(Buffer.from(await fs.readFileAsync(file)))
          break

        case 'shortcuts':
          this.shortcuts = await BVDF.parseShortcuts(Buffer.from(await fs.readFileAsync(file)))
          break

        case 'skins':
          this.skins = await loadSkins(file)
          break

        case 'library':
          if (this.appendToApps && this.steamapps) {
            this.steamapps.concat(await loadApps(file))
          } else {
            this.steamapps = await loadApps(file)
          }
          break

        default:
          this[ name ] = await TVDF.parse('' + await fs.readFileAsync(file))
          break
      }

      file = undefined

      afterLoad(this, name)
    } catch (err) {
      throw new Error(err)
    }
  }
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
        detected = path.join(this.homeDir, '.steam', 'steam')
        break

      case 'darwin':
        detected = path.join(this.homeDir, 'Library', 'Application Support', 'Steam')
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

  if (!this.loginusers) {
    throw new Error(`The "loginusers" file must be loaded before the user can be detected.`)
  } else if (!this.registry) {
    throw new Error(`The "registry" (registry file on Linux/Mac) must be loaded before the user can be detected.`)
  } else {
    user = this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser
  }

  if (user !== '') {
    for (let luser in this.loginusers.users) {
      if (this.loginusers.users[ luser ].AccountName === user) {
        return {
          accountId: '' + getAccountIdFromId64(luser),
          id64: luser,
          accountName: this.loginusers.users[ luser ].AccountName,
          displayName: this.loginusers.users[ luser ].PersonaName
        }
      }
    }
  } else if (this.loginusers.users.length === 1) {
    let keys = Object.keys(this.loginusers.users)

    return {
      accountId: '' + getAccountIdFromId64(keys[ 0 ]),
      id64: keys[ 0 ],
      accountName: this.loginusers.users[keys[ 0 ]].AccountName,
      displayName: this.loginusers.users[keys[ 0 ]].PersonaName
    }
  } else {
    user = null
  }

  console.info(`Detected user: ${user}`)

  return user
}

/**
 * Get the path to a named Steam file.
 * @method
 * @returns {Path} - The path to the file.
 */
SteamConfig.prototype.getPath = function getPath (name) {
  if (!name || name === '' || typeof name !== 'string') {
    return null
  }

  switch (name) {
    case 'appinfo':
      return path.join(this.rootPath, 'appcache', 'appinfo.vdf')
    case 'config':
      return path.join(this.rootPath, 'config', 'config.vdf')
    case 'libraryfolders':
      return path.join(this.rootPath, 'steamapps', 'libraryfolders.vdf')
    case 'localconfig':
      return path.join(this.rootPath, 'userdata', this.user.accountId, 'config', 'localconfig.vdf')
    case 'loginusers':
      return path.join(this.rootPath, 'config', 'loginusers.vdf')
    case 'packageinfo':
      return path.join(this.rootPath, 'appcache', 'packageinfo.vdf')
    case 'registry':
      if (this.os === 'win32') {
        return 'winreg'
      } else if (this.os === 'darwin') {
        return path.join(this.rootPath, 'registry.vdf')
      } else if (this.os === 'linux') {
        return path.join(this.rootPath, '..', 'registry.vdf')
      } else {
        throw new Error(`Your OS, ${this.os}, is not currently supported.`)
      }
    case 'shortcuts':
      return path.join(this.rootPath, 'userdata', this.user.accountId, 'config', 'shortcuts.vdf')
    case 'sharedconfig':
      return path.join(this.rootPath, 'userdata', this.user.accountId, '7', 'remote', 'sharedconfig.vdf')
    case 'skins':
      if (this.os === 'win32' || this.os === 'linux') {
        return path.join(this.rootPath, 'skins')
      } else if (this.os === 'darwin') {
        return path.join(this.rootPath, 'Steam.AppBundle', 'Steam', 'Contents', 'MacOS', 'skins')
      } else {
        throw new Error(`Your OS, ${this.os}, is not currently supported.`)
      }
    case 'steamapps':
      return path.join(this.rootPath, 'steamapps')
  }
}

/**
 * Request a user's list of owned apps from the internet.
 * @method
 * @async
 * @param force {boolean} - Force request to get a new copy instead of using a cached copy.
 */
SteamConfig.prototype.requestOwnedApps = async function requestOwnedApps (force = false) {
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
SteamConfig.prototype.requestTags = async function requestTags (force = false) {
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
 * Get a log of a sample of the data that exists.
 * @method
 */
SteamConfig.prototype.logData = function logData () {
  let logData = ''
  if (this.rootPath) {
    logData += `Root\t${this.rootPath}\n`
  }

  logData += `Users\t\tCurrent User\n`

  if (this.user) {
    logData += this.user.displayName
  }
}

async function loadApps (library) {
  let apps

  try {
    apps = await fs.readdirAsync(library)

    apps = apps.filter(item => {
      if (item.indexOf('.acf') !== -1) {
        return item
      }
    })

    apps = Promise.all(apps.map(async function loadAppData(item) {
      item = '' + await fs.readFileAsync(path.join(library, item))
      item = TVDF.parse(item)
      return item
    }))

    return apps
  } catch (err) {
    throw new Error(err)
  }
}

async function loadSkins (folder) {
  let skins

  try {
    skins = await fs.readdirAsync(folder)

    return skins.filter(function loadSkinData(item) {
      if (item.indexOf('.txt') === -1 && item.indexOf('.DS_Store') === -1) {
        return item
      }
    })
  } catch (err) {
    throw new Error(err)
  }
}

function prepareFileNames (names) {
  if (typeof names === 'string') {
    if (names === 'all') {
      names = Object.values(SteamPaths).filter(function filterFileName (item) {
        if (item !== 'all') {
          return item
        }
      })
    } else {
      names = [names]
    }
  }

  let name
  let first = []
  let last = []

  for (name of names) {
    if (typeof name === 'string' && name === 'sharedconfig' || name === 'localconfig' || name === 'shortcuts') {
      last.push(name)
    } else {
      first.push(name)
    }
  }

  return first.concat(last)
}

function getAccountIdFromId64 (id64) {
  try {
    return (new UInt64(id64, 10).toNumber() & 0xFFFFFFFF) >>> 0
  } catch (err) {
    throw new Error(err)
  }
}

function afterLoad (sc, name) {
  switch(name) {
    case 'libraryfolders':
      sc.libraries = Object.keys(sc.libraryfolders.LibraryFolders).filter(function filterLibs (item) {
        if (item !== 'TimeNextStatsReport' && item !== 'ContentStatsID') {
          return item
        }
      }).map(function mapLibs (item) {
        return sc.libraryfolders.LibraryFolders[ item ]
      })
  }
}

module.exports = {
  SteamConfig,
  SteamPaths
}

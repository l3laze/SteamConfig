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

const fs = require('bluebird').Promise.promisifyAll(require('fs'))
const path = require('path')
const TVDF = require('simple-vdf2')
const {Registry} = require('rage-edit')
const BVDF = require('./../bvdf.js')

const getAccountIdFromId64 = require('../steamdata-utils.js').getAccountIdFromId64

const arch = require('os').arch()
const os = require('os').platform()
const homeDir = require('os').homedir()

/**
 * @class
 * @name SteamConfig
 *
 * @property {Path} rootPath - The root of the Steam installation.
 * @property {Object} user - Current user.
 * @property {Array} libraries - A Path-type entry for each of the non-default Steam Library Folders of the Steam installation.
 * @property {Boolean} appendToApps - Whether to append apps or destroy the old data each time a single steamapps folder is loaded.
 *
 * @property {Object} appinfo - Steam/appcache/appinfo.vdf.
 * @property {Object} config - Steam/config/config.vdf.
 * @property {Object} libraryfolders - Steam/steamapps/libraryfolders.vdf.
 * @property {Object} localconfig - Steam/userdata/{user.accountId}.localconfig.vdf as an object.
 * @property {Object} loginusers - Steam/config/loginusers.vdf as an object.
 * @property {Object} packageinfo - Steam/appcache/packageinfo.vdf as an object.
 * @property {Object} registry - Platform-specific: On Linux/Mac: registry.vdf as an object. On Windows: Registry as an object.
 * @property {Object} shortcuts - Steam/userdata/{this.user.accountId}/config/shortcuts.vdf as an object.
 * @property {Object} sharedconfig - Steam/userdata/{this.user.accountId}/7/remote/sharedconfig.vdf as an object.
 * @property {Array} skins - Platform-specific skins folder entries (that are skins) as an array.
 * @property {Array} steamapps - The appmanifest files of Steam/steamapps as an array.
 * @throws {Error} - If there is an error creating an instance of the Windows Registry, when running on Windows.
 */
function SteamConfig () {
  this.rootPath = null
  this.user = null
  this.libraries = []
  this.appendToApps = false

  this.arch = arch
  this.os = os
  this.homeDir = homeDir

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
 * Load a Steam file/path by name, including storing the data in it's place on this instance of SteamConfig.
 *  Pre-processes arguments using the internal function [prepareFileNames](global.html#prepareFileNames) to ensure proper load order.
 *  The internal function [afterLoad](global.html#afterLoad) is run on each file after it's been loaded to automatically
 *    handle loading some data such as the locations of non-default Steam Library Folders in the file `libraryfolers.vdf`.
 * @method
 * @async
 * @param {String|Array} names - A string for a single file/path, or an array for a collection of files/paths or the special 'library' entries for non-default Steam Library Folders which will be an entry like `['library', {path}]`.
 * @throws {Error} - If names is an invalid arg (non-String & non-Array), or any of the entries are not a valid file/path as per [SteamPaths](global.html#SteamPaths).
 * @see [SteamPaths](global.html#SteamPaths), [prepareFileNames](#~prepareFileNames)
 */
SteamConfig.prototype.load = async function load (names) {
  if (!names || ((typeof names !== 'string' || names === '') && (typeof names !== 'object' || names.constructor !== Array))) {
    throw new Error(`Invalid arg for SteamConfig.load: Value ${names} with type ${typeof names}.`)
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
        throw new Error('The user must be set before user-specific data can be loaded.')
      }

      if (!file) {
        file = this.getPath(name)
      }

      if (!fs.existsSync(file) && name !== 'shortcuts') {
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
          if (fs.existsSync(file)) {
            this.shortcuts = await BVDF.parseShortcuts(Buffer.from(await fs.readFileAsync(file)))
          } else {
            this.shortcuts = {shortcuts: []}
          }
          break

        case 'skins':
          this.skins = await loadSkins(file)
          break

        case 'library':
          let apps
          if (this.appendToApps === true && this.steamapps !== null) {
            apps = await loadApps(file)
            this.steamapps = this.steamapps.concat(apps)
          } else {
            apps = await loadApps(file)
            this.steamapps = apps
          }
          break

        default:
          this[ name ] = await TVDF.parse('' + await fs.readFileAsync(file))
          break
      }

      file = undefined

      afterLoad(this, name)
    } catch (err) {
      throw new Error(err.message += `; while load()ing '${name}'`)
    }
  }
}

/**
 *
 */
SteamConfig.prototype.save = async function save (name) {
  if (!name || typeof name !== 'string') {
    throw new Error(`Cannot save data for invalid path ${name}.`)
  }

  switch (name) {
    case 'registry':
      await saveRegistry(this)
      break

    case 'localconfig':
    case 'config':
    case 'sharedconfig':
    case 'loginusers':
      await fs.writeFileAsync(this.getPath(name), TVDF.stringify(this[ name ], true))
      break
  }
}

/**
 *
 */
SteamConfig.prototype.saveApp = async function saveApp (appid) {
  let app = (this.steamapps.filter(app => app.AppState.appid === appid))[ 0 ] || undefined

  if (!app) {
    throw new Error(`There is no app with the appid ${appid}.`)
  }

  if (!fs.existsSync(app.filePath)) {
    throw new Error(`The file ${app.filePath} does not exist. If it is on an external drive make sure it's properly plugged in and mounted.`)
  }

  let data = TVDF.parse(await fs.readFileAsync(app.filePath))
  data.AppState.AutoUpdateBehavior = app.AppState.AutoUpdateBehavior
  data.AppState.StateFlags = app.AppState.StateFlags
  data.AppState.BytesToDownload = app.AppState.BytesToDownload
  data.AppState.BytesDownloaded = app.AppState.BytesDownloaded
}

/**
 * Attempt to set the root installation path to Steam.
 * @method
 * @param {Path} toPath - The path to set as the root to Steam.
 * @throws {Error} - If the argument toPath is undefined or an empty 'string', or if toPath does not exist.
 */
SteamConfig.prototype.setRoot = function setRoot (toPath) {
  if (!toPath || toPath === '') {
    throw new Error(`Cannot set rootPath to an undefined/empty value: ${toPath}.`)
  }

  if (!fs.existsSync(toPath)) {
    throw new Error(`Cannot set rootPath to ${toPath} because it does not exist.`)
  }

  this.rootPath = toPath
}

/**
 * Attempt to detect the root installation path based on platform-specific default installation locations.
 * @method
 * @throws {Error} - If the current OS is not supported.
 * @returns {Path} - The detected path, or null if the default path is not found.
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
    detected = null
  }

  return detected
}

/**
 * Attempt to set the current user based on an identifier (detected based on id64, accountId, PersonaName, or AccountName).
 * @method
 * @param {String} identifier - The value to detect as the user.
 * @throws {Error} - If loginusers has not been loaded yet, or the user is not found, or there are multiple users found.
 */
SteamConfig.prototype.setUser = function setUser (identifier) {
  if (!this.loginusers) {
    throw new Error('loginusers.vdf must be loaded before a user can be set.')
  }

  if (typeof identifier !== 'number' && typeof identifier !== 'string') {
    throw new Error(`Invalid identifier for setUser: ${typeof identifier}. Should be a 'number' or a 'string'.`)
  } else if (typeof identifier === 'number') {
    identifier = '' + identifier
  }

  let accountId
  let matched = Object.keys(this.loginusers.users).filter(user => {
    accountId = getAccountIdFromId64(user)
    return (user === identifier || accountId === identifier || this.loginusers.users[ user ].AccountName === identifier || this.loginusers.users[ user ].PersonaName === identifier)
  })

  if (matched.length === 0) {
    throw new Error(`Couldn't find the user related to '${identifier}'.`)
  } else if (matched.length > 1) {
    throw new Error(`Found multiple users related to '${identifier}'; use something more specific to select the desired user such as their SteamID64.`)
  } else {
    this.user = {
      accountId: accountId,
      id64: matched[ 0 ],
      accountName: this.loginusers.users[matched[ 0 ]].AccountName,
      displayName: this.loginusers.users[matched[ 0 ]].PersonaName
    }
  }
}

/**
 * Attempt to detect the current user based on `Registry.HKCU.Software.Valve.Steam.AutoLoginUser`.
 * @method
 * @returns {Object} - The detected user, or null if none is found.
 * @throws {Error} - If loginusers or the registry have not been loaded yet.
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

  return user
}

/**
 * Get the path to a named Steam file.
 * @method
 * @param {String} name - The name of a known Steam configuration file/path, as per [SteamPaths](global.html#SteamPaths)
 * @returns {Path} - The path to the file., or null
 * @throws {Error} - If the path is not known, or if name is an invalid argument.
 */
SteamConfig.prototype.getPath = function getPath (name) {
  if (!name || name === '' || typeof name !== 'string') {
    throw new Error(`Cannot get ${name} with type ${typeof name}. This should be type 'string', and one of the values from SteamPaths.`)
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
    default:
      throw new Error(`Unknown path: ${name}.`)
  }
}

/**
 * Get a log of a sample of the data that exists.
 * @method
 */
SteamConfig.prototype.logData = function logData (asType) {
  if (typeof asType !== 'string') {
    throw new Error(`Invalid argument for logData ${typeof asType}; should be a string.`)
  } else {
    asType = asType.toLowerCase()
  }

  if (asType !== 'object' && asType !== 'string') {
    throw new Error(`Unknown type for logData: ${asType}. Should be 'string' or 'object'.`)
  }

  let logData = {}

  logData.rootPath = this.rootPath || null
  logData.users = Object.keys(this.loginusers ? this.loginusers.users : [])
  logData.skins = this.skins || []
  logData.libraries = this.libraries || []
  logData.steamapps = this.steamapps || []
  logData.appStatus = {
    okay: (this.steamapps ? this.steamapps : []).filter(item => {
      if (item.AppState.StateFlags === '4') {
        return item
      }
    }) || 0,
    update: (this.steamapps ? this.steamapps : []).filter(item => {
      if (item.AppState.StateFlags === '6') {
        return item
      }
    }) || 0,
    installing: (this.steamapps ? this.steamapps : []).filter(item => {
      if (item.AppState.StateFlags === '1026' || item.AppState.StateFlags === '1542') {
        return item
      }
    }) || 0,
    useless: (this.steamapps ? this.steamapps : []).filter(item => {
      if (item.AppState.StateFlags !== '4' && item.AppState.StateFlags !== '6' && item.AppState.StateFlags !== '1542' && item.AppState.StateFlags !== '1026') {
        return item
      }
    }) || 0
  }
  logData.currentUser = {
    id64: this.user ? this.user.id64 : 0,
    accountId: this.user ? this.user.accountId : 0,
    accountName: this.user ? this.user.accountName : 'Hello',
    personaName: this.user ? this.user.displayName : 'World!',
    level: this.localconfig && this.localconfig.UserLocalConfigStore.Software.Valve.Steam.PlayerLevel ? this.localconfig.UserLocalConfigStore.Software.Valve.Steam.PlayerLevel : '0/Limited',
    owned: this.user && this.user.owned ? this.user.owned : [],
    categorized: Object.values(this.sharedconfig && this.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps ? this.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps : []).filter(item => item.tags || item.Hidden || false),
    shortcuts: this.shortcuts ? this.shortcuts.shortcuts : []
  }
  logData.provider = 'Brought to you by: A LOT of coffee'

  if (asType === 'object') {
    return logData
  } else if (asType === 'string') {
    let logStr = ''

    logStr += `--- Root --> ${logData.rootPath}\n`
    logStr += '------------------ Steam Installation Status ------------------\n'
    logStr += 'Users\tSkins\tLibraries\tInstalled Apps\n'
    logStr += `  ${logData.users.length}\t  ${logData.skins.length}\t  ${logData.libraries.length} + 1\t\t     ${logData.steamapps.length}\n`
    logStr += `--------------------- Installed App Status --------------------\n`
    logStr += `Playable    Update\tInstalling\tUseless\n`
    logStr += `   ${logData.appStatus.okay.length}\t       ${logData.appStatus.update.length}\t     ${logData.appStatus.installing.length}\t\t   ${logData.appStatus.useless.length}\n`
    logStr += `------------------------- User Status -------------------------\n`
    logStr += `    SteamID64   \taccountID\t  account\tlevel\n`
    logStr += `${logData.currentUser.id64}\t${logData.currentUser.accountId}\t${logData.currentUser.accountName}\t  ${logData.currentUser.level}\n`
    logStr += `---------------------------------------------------------------\n`
    logStr += `Owned Apps\t  Categorized + Hidden\t  Shortcuts\n`
    logStr += `   ${logData.currentUser.owned.length}\t\t\t  ${logData.currentUser.categorized.length}\t\t      ${logData.currentUser.shortcuts.length}\n`
    logStr += `---------------------------------------------------------------\n`
    logStr += `-------------- Brought to you by: A LOT of coffee -------------`

    return logStr
  }
}

/**
 * Internal method to load app data from a library folder.
 * @name loadApps
 * @function
 * @async
 * @param {Path} library - The path to the library to load the appmanifest_\###.acf files from.
 * @return {Array} - The app data as an Array of Objects.
 * @throws {Error} - If there is an error loading the app data.
 */
async function loadApps (library) {
  let apps

  try {
    apps = await fs.readdirAsync(library)

    apps = apps.filter(item => {
      if (item.indexOf('.acf') !== -1) {
        return item
      }
    })

    apps = await Promise.all(apps.map(async function loadAppData (item) {
      item = '' + await fs.readFileAsync(path.join(library, item))
      item = TVDF.parse(item)
      return item
    }))

    return apps
  } catch (err) {
    throw new Error(err)
  }
}

/**
 * Internal method to load skin names.
 * @name loadSkins
 * @function
 * @async
 * @param {Path} folder - The folder to get the skin names from.
 * @return {Array} - The names of the skins as an Array of Strings.
 * @throws {Error} - If there is an error loading the skin data.
 */
async function loadSkins (folder) {
  let skins

  try {
    skins = await fs.readdirAsync(folder)

    return skins.filter(function loadSkinData (item) {
      if (item.indexOf('.txt') === -1 && item.indexOf('.DS_Store') === -1) {
        return item
      }
    })
  } catch (err) {
    throw new Error(err)
  }
}

/**
 * Internal function to properly organize names array so that user-specific data is loaded/saved last.
 * @name prepareFileNames
 * @function
 * @param {Array} names - The Array of String|Array entries that [load](module-SteamConfig-SteamConfig.html#load) or [save](module-Steamconfig-SteamConfig.html#load) called with.
 * @return {Array} - The names Array, after organization.
 */
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
    if (typeof name === 'string' && (name === 'sharedconfig' || name === 'localconfig' || name === 'shortcuts')) {
      last.push(name)
    } else {
      first.push(name)
    }
  }

  return first.concat(last)
}

/**
 * Internal function to do some special handling after loading specific files.
 * So far it only handles "libraryfolders" by setting sc.libraries to the list of entries.
 * @name afterLoad
 * @function
 * @param {SteamConfig} sc - An instance of SteamConfig.
 * @param {String} name - The name of the file that was loaded without the extension (as from [SteamPaths](module-SteamPaths.html).
 */
function afterLoad (sc, name) {
  switch (name) {
    case 'libraryfolders':
      sc.libraries = Object.keys(sc.libraryfolders.LibraryFolders).filter(function filterLibs (item) {
        if (item !== 'TimeNextStatsReport' && item !== 'ContentStatsID') {
          return item
        }
      }).map(function mapLibs (item) {
        return sc.libraryfolders.LibraryFolders[ item ]
      })
      break

    default:
      break
  }
}

/*
 *
 */
async function saveRegistry (steamConfig) {
  const winreg = new Registry('HKCU\\Software\\Valve\\Steam')
  if (steamConfig.os === 'darwin' || steamConfig.os === 'linux') {
    await fs.writeFileAsync(steamConfig.getPath('registry'), TVDF.stringify(steamConfig.registry, true))
  } else if (steamConfig.os === 'win32') {
    winreg.set('language', steamConfig.registry.Registry.HKCU.Software.Valve.Steam.language)
    winreg.set('AutoLoginUser', steamConfig.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser)
    winreg.set('RememberPassword', steamConfig.registry.Registry.HKCU.Software.Valve.Steam.RememberPassword)
    winreg.set('SkinV4', steamConfig.registry.Registry.HKCU.Software.Valve.Steam.SkinV4)
  }
}

/**
 * A set of strings representing the Steam configuration files SteamConfig can handle.
 * @constant
 * @property {String} all - All of the files. Handled specially by [load](SteamConfig#load)
 * @property {String} appinfo - appinfo => /appcache/appinfo.vdf
 * @property {String} config - config => /config/config.vdf
 * @property {String} libraryfolders - libraryfolders => /steamapps/libraryfolders.vdf
 * @property {String} localconfig - localconfig => /userdata/{accountId}/config/localconfig.vdf
 * @property {String} packageinfo - packageinfo => /appcache/packageinfo.vdf
 * @property {String} registry - registry => ../registry.vdf on Linux, /registry.vdf on Mac or winreg on Windows.
 * @property {String} shortcuts - shortcuts => /userdata/{accountId}/config/shortcuts.vdf
 * @property {String} sharedconfig - sharedconfig => userdata/{accountId}/7/remote/sharedconfig.vdf
 * @property {String} skins - skins => skins/ on Linux or Winows, /Steam.AppBundle/Steam/Contents/MacOS/skins on Mac.
 * @property {String} steamapps - steamapps => /steamapps/
 * @property {String} library - library => {aSteamLibraryFolder}/steamapps/
 */
const SteamPaths = {
  all: 'all',

  appinfo: 'appinfo',
  config: 'config',
  libraryfolders: 'libraryfolders',
  localconfig: 'localconfig',
  loginusers: 'loginusers',
  // packageinfo: 'packageinfo',
  registry: 'registry',
  shortcuts: 'shortcuts',
  sharedconfig: 'sharedconfig',
  skins: 'skins',
  steamapps: 'steamapps'
}

module.exports = {
  SteamConfig,
  SteamPaths
}

'use strict'

const BB = require('bluebird').Promise
const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const VDF = require('simple-vdf2')
const BVDF = require('./mybinvdf.js')
const SVDF = BB.promisifyAll(require('steam-shortcut-editor'))
const SteamID = require('steamid')

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

async function loadTextVDF (filePath) {
  if (typeof filePath !== 'string') {
    throw new TypeError(`Wrong type for "filePath"; expected a string, but got a ${typeof filePath}.`)
  } else if (!fs.existsSync(filePath)) {
    throw new ReferenceError(`${filePath} does not exist (ENOENT).`)
  } else {
    let data = '' + await fs.readFileAsync(filePath)
    data = await VDF.parse(data)
    return data
  }
}

async function loadBinaryVDF (filePath, btype) {
  let data

  if (filePath === null) {
    throw new TypeError(`Wrong type for "filePath"; expected a string, but got a ${typeof filePath}.`)
  } else if (!fs.existsSync(filePath)) {
    throw new ReferenceError(`${filePath} does not exist (ENOENT).`)
  } else if (typeof btype !== 'string') {
    throw new TypeError(`Wrong type for "btype"; expected a string, but got a ${typeof btype}.`)
  } else if (btype !== 'appinfo' && btype !== 'packageinfo' && btype !== 'shortcuts') {
    throw new Error(`The format ${btype} is unknown.`)
  } else if (btype !== 'appinfo' && btype !== 'shortcuts') {
    throw new Error(`The format ${btype} is not currently supported.`)
  } else {
    if (btype === 'appinfo') {
      data = await fs.readFileAsync(filePath)
      data = await BVDF.readAppInfo(data)
      return data
    } else if (btype === 'shortcuts') {
      return SVDF.parseFileAsync(filePath, { autoConvertArrays: true, autoConvertBooleans: true, dateProperties: [ 'LastPlayTime' ] })
    }
  }
}

SteamConfig.prototype.loadTextVDF = loadTextVDF

SteamConfig.prototype.loadBinaryVDF = loadBinaryVDF

// eslint-disable-line no-unused-vars
SteamConfig.prototype.saveTextVDF = async function saveTextVDF (filePath, data) {
  if (!filePath || filePath === null) {
    throw new Error(`Bad "filePath" for saveTextVDF.`)
  } else {
    fs.writeFileAsync(filePath, VDF.stringify(data, true))
  }
}

SteamConfig.prototype.setInstallPath = function setInstallPath (dir) {
  if (typeof dir !== 'string') {
    throw new TypeError(`Wrong type for "dir"; expected a string, but got a ${typeof dir}.`)
  } else if (!fs.existsSync(dir)) {
    throw new ReferenceError(`${dir} does not exist (ENOENT).`)
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

  SteamConfig.prototype.loadPackageinfo = async function loadPackageinfo () {
    let filePath = path.join(this.loc, 'appcache', 'packageinfo.vdf')

    this.packageinfo = await loadBinaryVDF(filePath)
  }
 */

SteamConfig.prototype.loadConfig = async function loadConfig () {
  let filePath = path.join(this.loc, 'config', 'config.vdf')

  this.config = await loadTextVDF(filePath)
}

SteamConfig.prototype.loadLoginusers = async function loadLoginusers () {
  let filePath = path.join(this.loc, 'config', 'loginusers.vdf')

  this.loginusers = await loadTextVDF(filePath)
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
  let files = await fs.readdirAsync(path.join(this.loc, 'steamapps'))
  let libs = []

  Object.assign(libs, this.nondefaultLibraryfolders)

  libs.push(this.loc)

  apps = []

  for (x = 0; x < libs.length; x += 1) {
    files = await fs.readdirAsync(path.join(libs[ x ], 'steamapps'))

    for (y = 0; y < files.length; y += 1) {
      if (path.extname(files[ y ]) === '.acf') {
        apps.push(await loadTextVDF(path.join(libs[ x ], 'steamapps', files[ y ])))
      }
    }
  }

  this.steamapps = apps
}

SteamConfig.prototype.loadSharedconfig = async function loadSharedconfig () {
  let filePath = path.join(this.loc, 'userdata', this.user.accountID, '7', 'remote', 'sharedconfig.vdf')

  this.sharedconfig = await loadTextVDF(filePath)
}

SteamConfig.prototype.loadLocalconfig = async function loadLocalconfig () {
  let filePath = path.join(this.loc, 'userdata', this.user.accountID, 'config', 'localconfig.vdf')

  this.localconfig = await loadTextVDF(filePath)
}

SteamConfig.prototype.loadShortcuts = async function loadShortcuts () {
  let filePath = path.join(this.loc, 'userdata', this.user.accountID, 'config', 'shortcuts.vdf')

  try {
    this.shortcuts = await loadBinaryVDF(filePath, 'shortcuts')
  } catch (err) {
    this.shortcuts = { shortcuts: [] }
  }
}

SteamConfig.prototype.setUser = function setUser () {
  let userKeys = Object.keys(this.loginusers.users)
  let index

  for (index = 0; index < userKeys.length; index += 1) {
    if (this.loginusers.users[userKeys[ index ]].AccountName === this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser) {
      this.user = {}
      Object.assign(this.user, this.loginusers.users[userKeys[ index ]])
      this.user[ 'accountID' ] = ('' + new SteamID(userKeys[ index ]).accountid)
    }
  }
}

module.exports = SteamConfig

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
    var data = '' + await fs.readFileAsync(filePath)
    return VDF.parse(data)
  }
}

async function loadBinaryVDF (filePath, btype) {
  var data

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
      return BVDF.readAppInfo(data)
    } else if (btype === 'shortcuts') {
      data = SVDF.parseFileAsync(filePath, { autoConvertArrays: true, autoConvertBooleans: true, dateProperties: [ 'LastPlayTime' ] })
      return data
    }
  }
}

/*
  async function saveTextVDF (filePath, data) {
  if (filePath === null) {
    throw new Error(`null "filePath" for saveTextVDF.`)
  } else if (!fs.existsSync(filePath)) {
    throw new Error(`Couldn't find ${filePath} to save as text VDF (ENOENT).`)
  } else {
    fs.writeFileAsync(filePath, VDF.stringify(data, true))
  }
}
*/

SteamConfig.prototype.loadTextVDF = loadTextVDF

SteamConfig.prototype.loadBinaryVDF = loadBinaryVDF

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
  var filePath = path.join(this.loc, 'registry.vdf')
  var data

  data = await loadTextVDF(filePath)
  this.registry = data
}

SteamConfig.prototype.loadAppinfo = async function loadAppinfo () {
  var filePath = path.join(this.loc, 'appcache', 'appinfo.vdf')

  this.appinfo = await loadBinaryVDF(filePath, 'appinfo')
}

/*
 * Currently not supported -- need a parser for packageinfo.vdf.
 *

  SteamConfig.prototype.loadPackageinfo = async function loadPackageinfo () {
    var filePath = path.join(this.loc, 'appcache', 'packageinfo.vdf')

    this.packageinfo = await loadBinaryVDF(filePath)
  }
 */

SteamConfig.prototype.loadConfig = async function loadConfig () {
  var filePath = path.join(this.loc, 'config', 'config.vdf')

  this.config = await loadTextVDF(filePath)
}

SteamConfig.prototype.loadLoginusers = async function loadLoginusers () {
  var filePath = path.join(this.loc, 'config', 'loginusers.vdf')

  this.loginusers = await loadTextVDF(filePath)
}

SteamConfig.prototype.loadLibraryfolders = async function loadLibraryfolders () {
  var filePath = path.join(this.loc, 'steamapps', 'libraryfolders.vdf')
  var i

  this.libraryfolders = await loadTextVDF(filePath)
  this.nondefaultLibraryfolders = []

  var libs = Object.keys(this.libraryfolders.LibraryFolders)

  for (i = 0; i < libs.length; i++) {
    if (libs[ i ] !== 'TimeNextStatsReport' && libs[ i ] !== 'ContentStatsID') {
      this.nondefaultLibraryfolders.push(libs[ i ])
    }
  }
}

SteamConfig.prototype.loadSteamapps = async function loadSteamapps () {
  var filePath = path.join(this.loc, 'steamapps')
  var apps
  var files = await fs.readdirAsync(filePath)
  var f

  apps = []

  for (f in files) {
    if (path.extname(files[ f ]) === '.acf') {
      apps.push(await loadTextVDF(path.join(filePath, files[ f ])))
    }
  }

  this.steamapps = apps
}

SteamConfig.prototype.loadSharedconfig = async function loadSharedconfig () {
  var filePath = path.join(this.loc, 'userdata', this.user.accountID, '7', 'remote', 'sharedconfig.vdf')

  this.sharedconfig = await loadTextVDF(filePath)
}

SteamConfig.prototype.loadLocalconfig = async function loadLocalconfig () {
  var filePath = path.join(this.loc, 'userdata', this.user.accountID, 'config', 'localconfig.vdf')

  this.localconfig = await loadTextVDF(filePath)
}

SteamConfig.prototype.loadShortcuts = async function loadShortcuts () {
  var filePath = path.join(this.loc, 'userdata', this.user.accountID, 'config', 'shortcuts.vdf')

  this.shortcuts = await loadBinaryVDF(filePath, 'shortcuts')
}

SteamConfig.prototype.setUser = function setUser () {
  var userKeys = Object.keys(this.loginusers.users)

  userKeys.forEach(function (item, index, array) {
    if (this.loginusers.users[ item ].AccountName === this.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser) {
      Object.assign(this.user, this.loginusers.users[ item ])
      this.user[ 'accountID' ] = ('' + new SteamID(item).accountid)
    }
  })
}

module.exports = SteamConfig

'use strict'

const fs = require('fs')
const path = require('path')
const homedir = require('os').homedir()
const TVDF = require('simple-vdf2')
const BVDF = require('./lib/bvdf/index.js')
const SteamWebUtils = require('./lib/web/index.js')
const SteamPaths = require('./lib/filepaths/index.js')
const name = 'SteamConfig'
const debug = require('ebug')(name)

debug('Initializing %s', name)

function getPlatform () {
  const p = require('os').platform()

  if (p === 'darwin') {
    debug('Platform: %s', p)

    return 'mac'
  } else if (p === 'android') {
    return 'linux'
  } else {
    return p
  }
}

const platform = getPlatform()
const arch = require('os').arch()

function parseAppInfo (file) {
  let item
  let application
  let games = []
  let data = BVDF.appinfo.parse(file)

  for (item of data) {
    if (parseInt(item.entries.appid) < 70) {
      application = {
        appid: item.entries.appid,
        name: typeof item.entries.common !== 'undefined' && typeof item.entries.common.name !== 'undefined' ? item.entries.common.name : '[No Name]'
      }
    } else if (item.entries && item.entries.common && item.entries.common.type.toLowerCase() === 'game' && item.entries.common.name && item.entries.extended) {
      application = {
        appid: item.entries.appid,
        name: item.entries.common.name,
        oses: item.entries.common.oslist || item.entries.extended.validoslist || [],
        controller: item.entries.common.controller_support || '',
        metacritic: item.entries.common.metacritic_score || '',
        developer: item.entries.extended.developer || '',
        publisher: item.entries.extended.publisher || '',
        languages: (typeof item.entries.extended.languages !== 'undefined' ? item.entries.extended.languages : (typeof item.entries.common.languages !== 'undefined' ? Object.keys(item.entries.common.languages) : [])),
        dlc: typeof item.entries.extended.listofdlc !== 'undefined' ? item.entries.extended.listofdlc : [],
        homepage: item.entries.extended.homepage || ''
      }

      if (application.dlc.length === 0) {
        delete application.dlc
      }

      games.push(application)
    }
  }

  fs.writeFileSync(path.join(homedir, 'Desktop', 'appinfo.vdf'), JSON.stringify(data, null, 4))

  return data
}

function parsePackageInfo (file) {
  let data = BVDF.packageinfo.parse(file)
  let entryKeys
  let item

  for (item of data) {
    entryKeys = Object.keys(item.entries)

    if (entryKeys.length === 1 && isNaN(parseInt(entryKeys[ 0 ])) === false) {
      item.entries = Object.assign({}, item.entries[entryKeys[ 0 ]])
    }

    if (typeof item.id === 'undefined') {
      item.id = item.entries.packageid
    }

    if (item.id !== item.entries.packageid) {
      item.id = item.entries.packageid
    }
  }

  return data
}

function parseShortcuts (file) {
  let data = BVDF.shortcuts.parse(file)

  return data
}

let SteamConfig = ((function () {
  let obj = {}

  obj.getPath = function (name) {
    return SteamPaths.getSteamFilePath(name, this.platform, this.arch, this.accountId)
  }

  obj.load = function load (name, options) {
    let file = path.join(this.rootPath, this.getPath(name))
    let data

    if (!/appinfo|packageinfo|shortcuts|skins|steamapps/.test(name)) {
      data = fs.readFileSync(file)

      this[ name ] = TVDF.parse('' + data)
    } else if (name === 'steamapps') {
      let data

      if (typeof extra === 'object' && typeof options.filePath !== 'undefined') {
        file = path.join(options.filePath)
      }

      data = fs.readdirSync(file).filter((item) => item.indexOf('.acf') > -1)

      data.map((item) => {
        return {
          file,
          data: TVDF.parse('' + fs.readFileSync(path.join(file, item)))
        }
      })

      debug('Loaded apps: %s', data.length)

      if (this.mode === 'append') {
        this[ name ] = this[ name ].concat(data)
      } else if (this.mode === 'overwrite') {
        this[ name ] = data
      } else {
        throw new Error(`Unknown mode '${this.mode}.'`)
      }
    } else if (name === 'skins') {
      let data = fs.readdirSync(file).filter((item) => item.charAt(0) !== '.' && item.indexOf('.txt') === -1)

      this[ name ] = data
    } else {
      data = fs.readFileSync(file)

      if (name === 'appinfo') {
        this[ name ] = parseAppInfo(data)
      } else if (name === 'packageinfo') {
        this[ name ] = parsePackageInfo(data)
      } else if (name === 'shortcuts') {
        this[ name ] = parseShortcuts(data)
      }
    }

    return data
  }

  obj.save = function save (name, options) {
    let file = (typeof options === 'object' && typeof options.filePath !== 'undefined') ? options.file : path.join(this.rootPath, this.getPath(name))
    let data = fs.readFileSync(file)
    let origLength = 0 + data.length

    data = TVDF.parse('' + data)
    data = Object.assign(data, this[ name ])
    data = TVDF.stringify(data, true)

    debug(`Saving Text VDF file "${name}" to ${file} @ ${data.length} (old = ${origLength}) bytes`)

    fs.writeFileSync(file, data)
  }

  obj.requestStoreData = SteamWebUtils.requestStoreData

  obj.requestPopularTags = SteamWebUtils.requestPopularTags

  obj.requestOwnedApps = SteamWebUtils.requestOwnedApps

  obj.stringify = TVDF.stringify

  obj.platform = platform
  obj.arch = arch

  obj.appinfo = {}
  obj.config = {}
  obj.libraryfolders = {}
  obj.loginusers = {}
  obj.localconfig = {}
  obj.sharedconfig = {}
  obj.shortcuts = {}
  obj.steamapps = []

  obj.id64 = -1
  obj.accountId = -1

  obj.rootPath = obj.getPath('root', obj.platform, obj.arch, '107311984')

  /*
   * append: Add loaded steamapps to internal list.
   * overwrite: Overwrite internal steamapps list with any loaded data.
   */
  obj.mode = 'append'

  return obj
})())

module.exports = SteamConfig

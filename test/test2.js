/* eslint-env mocha */
'use strict'

const path = require('path')
const SteamConfig = require('../src/steamconfig.js').SteamConfig
const steamPaths = require('../src/steamconfig.js').SteamPaths
const utils = require('../steamdata-utils') // eslint-disable-line no-unused-vars
const Dummy = require('steam-dummy')

const expect = require('chai').expect // eslint-disable-line no-unused-vars
const should = require('chai').should() // eslint-disable-line no-unused-vars

let dumbe = new Dummy()

let steam
let pathTo = path.join(__dirname, 'Dummy')

dumbe.makeDummy(pathTo)

console.info('Dummy data created.')

describe('SteamConfig', function () {
  beforeEach(function (done) {
    steam = new SteamConfig()
    done()
  })

  afterEach(function (done) {
    steam = undefined
    done()
  })

  describe('#detectRoot ()', function () {
    it('should detect the default path on a compatible OS', function () {
      try {
        let detected = steam.detectRoot()
        if (detected === null) {
          throw new Error('Path to Steam was not found.')
        }
      } catch (err) {
        throw new Error(err)
      }
    })
  })
})

describe('SteamConfig', function () {
  beforeEach(function (done) {
    try {
      steam = new SteamConfig()
      steam.rootPath = pathTo
      done()
    } catch (err) {
      done(err)
    }
  })

  afterEach(function (done) {
    steam = undefined
    done()
  })

  describe('#detectUser ()', function () {
    it('should detect the current user if one is set', async function () {
      try {
        await steam.load(steamPaths.loginusers)
        await steam.load(steamPaths.registry)
        let user = steam.detectUser()
        if (user === null && steam.registry.Registry.HKCU.Software.Valve.Steam.AutoLoginUser !== '') {
          throw new Error('Failed to detect user, but one exists.')
        }
      } catch (err) {
        throw new Error(err)
      }
    })
  })

  describe('#getPath (name)', function () {
    it('should return the path to known Steam files', function () {
      try {
        let file = steam.getPath(steamPaths.loginusers)

        if (file !== path.join(pathTo, 'loginusers.vdf')) {
          throw new Error()
        }
      } catch (err) {
        return err
      }
    })

    it('should throw an error for invalid/unknown paths', async function () {
      try {
        let data = await steam.getPath('Hello, world!')  // eslint-disable-line no-unused-vars
        data = undefined
      } catch (err) {
        if (err.message.indexOf('Unknown path') === -1) {
          throw new Error(err)
        }
      }
    })
  })

  describe('#logData (asType)', function () {
    it('should return a \'string\' or an \'object\'', function () {
      try {
        let str = steam.logData('string')
        let obj = steam.logData('object')

        if (typeof str !== 'string') {
          throw new Error(`Invalid return type from logData for 'string': ${typeof str}.`)
        }
        if (typeof obj !== 'object') {
          throw new Error(`Invalid return type from logData for 'object': ${typeof obj}.`)
        }
      } catch (err) {
        throw new Error(err)
      }
    })

    it('should throw an error for an invalid argument', function () {
      try {
        steam.logData(['Batman'])
        throw new Error('It did not throw an error for an invalid argument.')
      } catch (err) {
        if (err.message.indexOf('It did not throw an error for an invalid argument.') !== -1) {
          throw new Error(err)
        }
      }
    })
  })

  describe('#load (names)', function () {
    it('should accept a string or array as it\'s argument', async function () {
      await steam.load('config')
      await steam.load([
        steamPaths.registry,
        steamPaths.loginusers
      ])

      steam.config.should.be.a('object').with.property('InstallConfigStore')
      steam.loginusers.should.be.a('object').with.property('users')
    })

    it('should throw an error for an invalid argument', async function () {
      try {
        await steam.load({
          file: 'Hello, world!'
        })
        throw new Error('It did not throw an error for an invalid argument.')
      } catch (err) {
        if (err.message.indexOf('It did not throw an error for an invalid argument.') !== -1) {
          throw new Error(err)
        }
      }
    })
  })

  describe('#steamdata-utils.getAccountIdFromId64 (id64)', function () {
    it('should return a \'string\' that is the accountId', function () {
      try {
        let aid = utils.getAccountIdFromId64('76561198067577712')

        if (typeof aid !== 'string') {
          throw new Error(`Invalid return type from getAccountIdFromId64: ${typeof aid}.`)
        }
        if (aid !== '107311984') {
          throw new Error(`Invalid return value from getAccountIdFromId64 for '76561198067577712': ${aid}. Should be '107311984'`)
        }
      } catch (err) {
        throw new Error(err)
      }
    })

    it('should throw an error for an invalid argument', function () {
      try {
        let aid = utils.getAccountIdFromId64('76561198067577712')
        aid = utils.getAccountIdFromId64('dirtyhippie')

        if (typeof aid !== 'string') {
          throw new Error(`Invalid return type from getAccountIdFromId64: ${typeof aid}.`)
        }
        throw new Error('It did not throw an error for an invalid argument.')
      } catch (err) {
        if (err.message.indexOf('It did not throw an error for an invalid argument.') === -1 && err.message.indexOf('Invalid argument type for getAccountIdFromId64') === -1) {
          throw new Error(err)
        }
      }
    })
  })

  describe('#steamdata-utils.getAccountIdFromId64 (id64)', function () {
    it('should return a \'string\' that is the accountId', function () {
      try {
        let aid = utils.getAccountIdFromId64('76561198067577712')

        if (typeof aid !== 'string') {
          throw new Error(`Invalid return type from getAccountIdFromId64: ${typeof aid}.`)
        }
        if (aid !== '107311984') {
          throw new Error(`Invalid return value from getAccountIdFromId64 for '76561198067577712': ${aid}. Should be '107311984'`)
        }
      } catch (err) {
        throw new Error(err)
      }
    })

    it('should throw an error for an invalid argument', function () {
      try {
        let aid = utils.getAccountIdFromId64('76561198067577712')
        aid = utils.getAccountIdFromId64('dirtyhippie')

        if (typeof aid !== 'string') {
          throw new Error(`Invalid return type from getAccountIdFromId64: ${typeof aid}.`)
        }
        throw new Error('It did not throw an error for an invalid argument.')
      } catch (err) {
        if (err.message.indexOf('It did not throw an error for an invalid argument.') === -1 && err.message.indexOf('Invalid argument type for getAccountIdFromId64') === -1) {
          throw new Error(err)
        }
      }
    })
  })

  describe('#steamdata-utils.getAccountIdFromId64 (id64)', function () {
    it('should return a \'string\' that is the accountId', function () {
      try {
        let aid = utils.getAccountIdFromId64('76561198067577712')

        if (typeof aid !== 'string') {
          throw new Error(`Invalid return type from getAccountIdFromId64: ${typeof aid}.`)
        }
        if (aid !== '107311984') {
          throw new Error(`Invalid return value from getAccountIdFromId64 for '76561198067577712': ${aid}. Should be '107311984'`)
        }
      } catch (err) {
        throw new Error(err)
      }
    })

    it('should throw an error for an invalid argument', function () {
      try {
        let aid = utils.getAccountIdFromId64('76561198067577712')
        aid = utils.getAccountIdFromId64('dirtyhippie')

        if (typeof aid !== 'string') {
          throw new Error(`Invalid return type from getAccountIdFromId64: ${typeof aid}.`)
        }
        throw new Error('It did not throw an error for an invalid argument.')
      } catch (err) {
        if (err.message.indexOf('It did not throw an error for an invalid argument.') === -1 && err.message.indexOf('Invalid argument type for getAccountIdFromId64') === -1) {
          throw new Error(err)
        }
      }
    })
  })
})

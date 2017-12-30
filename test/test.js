/* eslint-env mocha */
'use strict'

const path = require('path')
const SteamConfig = require('../index.js')
// const assert = require('assert')

var steam

describe('SteamConfig', function () {
  beforeEach(function (done) {
    steam = new SteamConfig()
    done()
  })

  describe('#setInstallPath()', function () {
    it('should accept a string value as the argument', function (done) {
      try {
        steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      } catch (err) {
        return done(err)
      }
      done()
    })

    it('should not accept a non-string value as the argument', function (done) {
      try {
        steam.setInstallPath(8675309)
      } catch (err) {
        return done()
      }
      done(1)
    })
  })

  describe('#loadTextVDF()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should accept a string value as the argument', function (done) {
      try {
        steam.loadTextVDF(path.join(steam.loc, 'registry.vdf'))
      } catch (err) {
        return done(err)
      }
      done()
    })

    it('should not accept a non-string value as the argument', function (done) {
      try {
        steam.loadTextVDF(8675309).catch(function (err) {
          if (err) {
            // ...
          }
          return done()
        })
      } catch (err) {
        return done(err)
      }
    })
  })

  describe('#loadBinaryVDF()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should accept a string value as the argument', function (done) {
      try {
        steam.loadBinaryVDF(path.join(steam.loc, 'appcache', 'appinfo.vdf')).catch(function (err) {
          if (err) {
            // ...
          }
          return done()
        })
      } catch (err) {
        return done(err)
      }
    })

    it('should not accept a non-string value as the argument', function (done) {
      try {
        steam.loadBinaryVDF(path.join(steam.loc, 'appcache', 'appinfo.vdf')).catch(function (err) {
          if (err) {
            // ...
          }
          return done()
        })
      } catch (err) {
        return done(err)
      }
    })
  })

  describe('#loadRegistryLM()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should populate steam.registry with an Object', function (done) {
      try {
        steam.loadRegistryLM().catch(function (err) {
          return done(err)
        })
      } catch (err) {
        return done(err)
      }
      if (typeof steam.registry !== 'object') {
        done(new Error('Failed to load registry.vdf'))
      } else {
        done()
      }
    })
  })

  describe('#loadAppinfo()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should populate steam.appinfo with an Object', function (done) {
      try {
        steam.loadAppinfo().catch(function (err) {
          return done(err)
        })
      } catch (err) {
        return done(err)
      }
      if (typeof steam.appinfo !== 'object') {
        done(new Error('Failed to load appinfo.vdf'))
      } else {
        done()
      }
    })
  })

  describe('#loadConfig()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should populate steam.config with an Object', function (done) {
      try {
        steam.loadConfig().catch(function (err) {
          return done(err)
        })
      } catch (err) {
        return done(err)
      }
      if (typeof steam.config !== 'object') {
        done(new Error('Failed to load config.vdf'))
      } else {
        done()
      }
    })
  })

  describe('#loadLoginusers()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should populate steam.loginusers with an Object', function (done) {
      try {
        steam.loadLoginusers().catch(function (err) {
          return done(err)
        })
      } catch (err) {
        return done(err)
      }
      if (typeof steam.loginusers !== 'object') {
        done(new Error('Failed to load loginusers.vdf'))
      } else {
        done()
      }
    })
  })

  describe('#loadLibraryFolders()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should populate steam.libraryfolders with an Object', function (done) {
      try {
        steam.loadLibraryfolders().catch(function (err) {
          return done(err)
        })
      } catch (err) {
        return done(err)
      }
      if (typeof steam.libraryfolders !== 'object') {
        done(new Error('Failed to load libraryfolders.vdf'))
      } else {
        done()
      }
    })
  })

  describe('#loadSteamapps()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should populate steam.steamapps with an Array', function (done) {
      try {
        steam.loadSteamapps().catch(function (err) {
          return done(err)
        })
      } catch (err) {
        return done(err)
      }
      if (steam.steamapps && (typeof steam.steamapps !== 'object' || steam.steamapps.constructor !== Array)) {
        done(new Error('Failed to load /steamapps/ folder contents'))
      } else {
        done()
      }
    })
  })

  describe('#loadSharedconfig()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should populate steam.sharedconfig with an Object', async function () {
      try {
        await steam.loadLocalconfig().catch(function (err) {
          return err
        })
      } catch (err) {
        return err
      }
      if (typeof steam.sharedconfig !== 'object') {
        return new Error('Failed to load sharedconfig.vdf')
      } else {
      }
    })
  })

  describe('#loadLocalconfig()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should populate steam.localconfig with an Object', async function () {
      try {
        await steam.loadLocalconfig().catch(function (err) {
          return err
        })
      } catch (err) {
        return err
      }
      if (typeof steam.localconfig !== 'object') {
        return new Error('Failed to load localconfig.vdf')
      } else {
      }
    })
  })

  describe('#loadShortcuts()', function () {
    beforeEach(function (done) {
      steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      done()
    })

    it('should populate steam.shortcuts with an Object', async function () {
      try {
        await steam.loadShortcuts().catch(function (err) {
          return err
        })
      } catch (err) {
        return err
      }
      if (typeof steam.shortcuts !== 'object') {
        return new Error('Failed to load shortcuts.vdf')
      } else {
      }
    })
  })
})

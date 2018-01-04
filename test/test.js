/* eslint-env mocha */
'use strict'

const path = require('path')
const SteamConfig = require('../index.js')

var steam

describe('SteamConfig', function () {
  beforeEach(function (done) {
    steam = new SteamConfig()
    done()
  })

  afterEach(function (done) {
    steam = undefined
    done()
  })

  describe('#detectPath()', function () {
    it('should detect the default path on a compatible OS', function (done) {
      try {
        let detected = steam.detectPath()
        if (detected === null) {
          throw new Error('Path to Steam was not found.')
        }
      } catch (err) {
        return done(err)
      }
      done()
    })
  })

  describe('#setInstallPath()', function () {
    it('should accept a string value as the argument', function (done) {
      try {
        let detected = steam.detectPath()
        if (detected === null) {
          throw new Error('Path to Steam was not found.')
        }
        steam.setInstallPath(detected)
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
})

describe('SteamConfig', function () {
  beforeEach(function (done) {
    try {
      steam = new SteamConfig()
      let detected = steam.detectPath()
      if (detected === null) {
        throw new Error('Path to Steam was not found.')
      }
      steam.setInstallPath(detected)
      done()
    } catch (err) {
      done(err)
    }
  })

  afterEach(function (done) {
    steam = undefined
    done()
  })

  describe('#loadTextVDF()', function () {
    it('should accept a string value as the argument', async function () {
      try {
        await steam.loadTextVDF(path.join(steam.loc, 'registry.vdf'))
      } catch (err) {
        return err
      }
    })

    it('should not accept a non-string value as the argument', async function () {
      try {
        await steam.loadTextVDF(8675309)
      } catch (err) {
        return err
      }
    })
  })

  describe('#saveTextVDF()', function () {
    it('should accept a string value as the data argument', async function () {
      try {
        await steam.saveTextVDF(path.join(steam.loc, 'registry.vdf'), steam.loadTextVDF(path.join(steam.loc, 'registry.vdf')))
      } catch (err) {
        return err
      }
    })

    it('should not accept a non-string value as the data argument', async function () {
      try {
        await steam.saveTextVDF(path.join(steam.loc, 'registry.vdf'), 8675309)
      } catch (err) {
        return err
      }
    })
  })

  describe('#loadBinaryVDF()', function () {
    it('should accept a string value as the argument', async function () {
      try {
        await steam.loadBinaryVDF(path.join(steam.loc, 'appcache', 'appinfo.vdf'))
      } catch (err) {
        return err
      }
    })

    it('should not accept a non-string value as the argument', async function () {
      try {
        await steam.loadBinaryVDF(path.join(steam.loc, 'appcache', 'appinfo.vdf'))
      } catch (err) {
        return err
      }
    })
  })

  describe('#loadRegistryLM()', function () {
    it('should populate steam.registry with an Object', async function () {
      try {
        await steam.loadRegistryLM()
      } catch (err) {
        return err
      }
      if (typeof steam.registry !== 'object') {
        return new Error('Failed to load registry.vdf')
      }
    })
  })

  describe('#loadConfig()', function () {
    it('should populate steam.config with an Object', async function () {
      try {
        await steam.loadConfig().catch(function (err) {
          return err
        })
      } catch (err) {
        return err
      }
      if (typeof steam.config !== 'object') {
        return new Error('Failed to load config.vdf')
      }
    })
  })

  describe('#loadLoginusers()', function () {
    it('should populate steam.loginusers with an Object', async function () {
      try {
        await steam.loadLoginusers().catch(function (err) {
          return err
        })
      } catch (err) {
        return err
      }
      if (typeof steam.loginusers !== 'object') {
        return new Error('Failed to load loginusers.vdf')
      }
    })
  })

  describe('#setUser()', function () {
    it('should set steam.user to the current user of the client', async function () {
      try {
        await steam.loadRegistryLM()
        await steam.loadLoginusers()
        steam.setUser()
      } catch (err) {
        return err
      }
      if (typeof steam.user !== 'object') {
        return new Error('Failed to set user')
      }
    })
  })

  describe('#loadLibraryFolders()', function () {
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

  describe('#loadAppinfo()', function () {
    it('should populate steam.appinfo with an Object', async function () {
      this.slow(3000)
      try {
        await steam.loadAppinfo()
      } catch (err) {
        return err
      }
      if (typeof steam.appinfo !== 'object') {
        return new Error('Failed to load appinfo.vdf')
      }
    })
  })
})

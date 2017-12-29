/* eslint-env mocha */

const path = require('path')
const SteamConfig = require('../index.js')
// const assert = require('assert')

var steam = new SteamConfig()

describe('SteamConfig', function () {
  describe('#setInstallPath()', function () {
    it('should accept a string value as the argument', function (done) {
      try {
        steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
      } catch (err) {
        done(err)
      }
      done()
    })

    it('should not accept a non-string value as the argument', function (done) {
      try {
        steam.setInstallPath(8675309)
      } catch (err) {
        done()
      }
    })
  })

  describe('#loadTextVDF()', function () {
    it('should accept a string value as the argument', function (done) {
      try {
        steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
        steam.loadTextVDF(path.join(steam.loc, 'registry.vdf'))
      } catch (err) {
        done()
      }
    })

    it('should not accept a non-string value as the argument', function (done) {
      try {
        steam.setInstallPath('/Users/tmshvr/Library/Application Support/Steam')
        steam.loadTextVDF(8675309)
      } catch (err) {
        done()
      }
    })
  })
})

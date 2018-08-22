'use strict'

const debug = require('ebug')('SteamConfig-backup')
const sc = require('./../src/index.js')

try {
  console.info('root: ', sc.getPath('root', sc.platform, sc.arch, ''))

  const loginusers = sc.load('loginusers')

  console.info('%O', loginusers)
} catch (err) {
  console.error(err)
}
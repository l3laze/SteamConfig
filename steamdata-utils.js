/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 *
 * @requires {@link https://www.npmjs.com/package/bluebird|bluebird}
 */

'use strict'

const BB = require('bluebird').Promise
const fs = BB.promisifyAll(require('fs')) // eslint-disable-line no-unused-vars
const path = require('path') // eslint-disable-line no-unused-vars
const fetch = BB.promisifyAll(require('node-fetch'))

exports.requestGenres = async function requestGenres (appid) {
  let res
  let genres = []
  let index

  res = await fetch(`http://store.steampowered.com/app/${appid}/`, {
    credentials: 'include',
    headers: {
      cookie: 'birthtime=189324001' // 1/1/1976 @ 12:00:01 AM
    }
  })

  res = '' + await res.text()

  index = res.indexOf('<div class="details_block">')

  do {
    index = res.indexOf('http://store.steampowered.com/genre/', index) // 36 characters

    if (index === -1) {
      break
    }

    index += 36

    genres.push(res.substring(index, res.indexOf('/', index)))
  } while (true)

  return genres
}

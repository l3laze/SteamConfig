'use strict'

const BB = require('bluebird').Promise
const fs = BB.promisifyAll(require('fs'))
const cli = require('cli')

async function run () {
  let options = cli.parse({
    class: ['c', 'The base class', 'string', null],
    md: ['m', 'The .md source file', 'path', null],
    js: ['j', 'The .js source file', 'path', null]
  })
  let funcs = []
  let index = 0

  if (!options.class || options.class === '') {
    throw new Error('You must provide a base class.')
  } else if (!options.md || options.md === '') {
    throw new Error('You must provide a .md file.')
  } else if (!options.js || options.js === '') {
    throw new Error('You must provide a .js file.')
  }

  if (!fs.existsSync(options.js)) {
    throw new Error(`${options.js} does not exist.`)
  } else if (!fs.existsSync(options.md)) {
    throw new Error(`${options.md} does not exist.`)
  }

  if (options.class && options.md && options.js) {
    if (fs.existsSync(options.js)) {
      let modified = 0
      let data = '' + await fs.readFileAsync(options.js)
      data = data.replace('\r\n', '\n').split('\n')

      for (let i = 0; i < data.length; i += 1) {
        index = data[ i ].indexOf('async function ')

        if (index !== -1) {
          index += 15
          funcs.push(data[ i ].substring(index, data[ i ].indexOf(' ', index + 1)))
        }
      }

      console.info(`Found ${funcs.length} async functions total in ${options.js}.`)

      data = ('' + await fs.readFileAsync(options.md)).replace('\r\n', '\n').split('\n')

      for (let x = 0; x < data.length; x += 1) {
        for (let y = 0; y < funcs.length; y += 1) {
          index = data[ x ].indexOf(`### ${options.class}.${funcs[ y ]}`)

          if (index !== -1) {
            data[ x ] =
              data[ x ].slice(0, data[ x ].indexOf('###') + 3) +
              ' `async`' +
              data[ x ].slice(data[ x ].indexOf('###') + 3)
            modified += 1
            console.info(`Modified: ${data[ x ].trim()}`)
          }

          index = data[ x ].indexOf(`* [.${funcs[ y ]}`)

          if (index !== -1) {
            data[ x ] =
              data[ x ].slice(0, data[ x ].indexOf('*') + 1) +
              ' `async` ' +
              data[ x ].slice(data[ x ].indexOf('*') + 1)
            modified += 1
            console.info(`Modified: ${data[ x ].trim()}`)
          }
        }
      }
      console.info(`${modified} entries changed.`)
      await fs.writeFileAsync(options.md, data.join('\n'))
    }
  }
}

try {
  run()
} catch (err) {
  console.error(err)
  process.exit(1)
}

/*
 * async function functionName
 * (#SteamConfig+functionName) `async`
 * ### steamConfig.functionName(...args) `async`
 */

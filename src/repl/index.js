/*
 * A "simple" NodeJS REPL for a custom CLI app using NodeJS's own repl module
 *  (https://nodejs.org/api/repl.html) with custom commands, autocomplete for
 *  custom commands, persistent command history & "command history compression"
 *  (won't keep multiple instances in a row of the same command in the history)
 *
 * Author: l3l_aze <at> Yahoo! (dot) com
 */

'use strict'

const fs = require('fs')
const path = require('path')
// const platform = require('os').platform()

// Needed for command-line parser, etc...
const pj = {
  name: 'steamconfig-repl',
  version: '1.0.0',
  description: 'A REPL for the SteamConfig project https://github.com/l3laze/SteamConfig.\n\tA simple NodeJS REPL https://nodejs.org/api/repl.html with an instance of the\n\tSteamConfig library attached as the variable `.SteamConfig`. Allows easy\n\ttesting/usage directly from the command-line.'
}

// Debug setup
const name = 'steamconfig-repl'
const debug = require('ebug')(name)

// CLI setup
const cmdo = require('cmdo')(pj, 'man')
const options = cmdo.parse({
  debug: [ 'd', 'Enable debug mode without using environment var', 'boolean', false ],
  fullErrors: [ 'e', 'Show full error messages.', 'boolean', false ],
  help: [ 'h', 'Show this help message', 'boolean', false ],
  historyFile: [ 'f', 'Command history file', 'path', '.history' ],
  historyLimit: [ 'l', 'Command history limit', 'int', 1000 ],
  saveAllCommands: [ 'a', 'Save all commands in history', 'boolean', false ],
  uniqueCommands: [ 'u', 'Only save unique commands in history', 'boolean', false ],
  version: [ 'v', 'Show version number', 'boolean', false ]
})

// Fast stop without starting REPL if help or version message is being printed.
if (options.version || options.help) {
  if (options.version) {
    console.info(`Version: ${options.version}\n`)
  }

  if (options.help) {
    console.info(cmdo.help)
  }

  process.exit(0)
}

debug('\noptions: %s', JSON.stringify(options, null, 2))

// REPL custom command setup
const fullCommands = {
  'clear': 'clear the screen.',
  'exit': 'Exit the REPL.',
  'SteamConfig': 'Attached instance of SteamConfig.',
  'SteamConfig.load': 'Load a Steam configuration file.',
  'SteamConfig.save': 'Save a Steam configuration file.',
  'SteamConfig.requestOwnedApps': 'Request a list of a user\'s owned apps.',
  'SteamConfig.requestPopularTags': 'Request the list of popular Steam tags.',
  'SteamConfig.requestStoreData': 'Scrape the genres and system requirements from an apps Store page.'
}
const commands = Object.keys(fullCommands)

// Create REPL
const SteamConfig = require('./index.js') // Custom module being attached
const repl = require('repl')
const server = repl.start({
  prompt: '$> ',
  terminal: true, // Set to true to enable command history
  ignoreUndefined: true
})

server.context.SteamConfig = SteamConfig

if (options.debug) {
  process.env.DEBUG = name.trim()
}

// Custom 'eval' for REPL, to handle custom commands
function customEval (cmd, callback) {
  let result
  cmd = cmd.trim()

  // Calling eval with an empty line below in the default case will cause it to be saved in command history.
  if (cmd === '') {
    return undefined
  }

  switch (cmd) {
    case 'clear':
      process.stdout.cursorTo(0, 0) // Move to top line of terminal
      process.stdout.clearLine()
      process.stdout.clearScreenDown()
      server.lines.push(cmd) // Save known command in history
      break

    case 'exit':
      server.lines.push(cmd) // Save command in history when successful
      server.emit('exit') // Rather than process.exit, because that will just quit the program immediately.
      break

    default:
      // Wrapped in try/catch to prevent errors from stopping the REPL
      try {
        result = eval(cmd) // eslint-disable-line

        // Print result of mathematical formulas, etc
        if (typeof result !== 'undefined' && typeof result.then === 'undefined') {
          console.info(result)
        }
      } catch (err) {
        if (typeof options.fullErrors !== 'undefined' && options.fullErrors === false) {
          // Single-line error messages like 'ReferenceError: ls is not defined'
          console.error(err.constructor.name + ': ' + err.message)
        } else {
          console.error(err)
        }
      } finally {
        // Save command in history when successful, or when set to save all commands.
        if (typeof result !== 'undefined' || options.saveAllCommands) {
          server.lines.push(cmd)
        }
      }
  }

  return result
}

// Autocomplete-with-tab setup
function customAutocomplete (line, callback) { // non-async version crashes when used.
  const hits = commands.filter(c => c.indexOf(line) === 0)

  callback(null, [ hits.length > 0 ? hits : commands, line ])
}

function loadHistory (file) {
  let data

  if (fs.existsSync(file)) {
    data = ('' + fs.readFileSync(file))
      .split('\n')
      .filter(line => line.trim())
      .reverse()

    debug('Loaded history: %s entries', data.length)

    return data
  } else {
    console.info(`Failed to load history from ${file}: file not found`)
    return []
  }
}

// Setup REPL
function init () {
  if (process.env.DEBUG) {
    process.stdout.write('\n') // So The next debug line doesn't split into two lines, and doesn't start on the prompt line
  }

  debug('Intializing %s', name)
  // debug('options: %s', JSON.stringify(options, null, 2))

  const replHistoryFile = path.join(options.historyFile)

  server.eval = customEval
  server.completer = customAutocomplete

  // Save command history when exiting
  server.on('exit', () => {
    // server.lines = commands used in current session
    let data = server.lines
    let current = loadHistory(replHistoryFile)

    debug('Closing %s...saving history', name)

    // Do not try to save history when there have been no commands run
    if (data.length > 0) {
      debug('Session history: %s', data.length)
      debug('Old history: %s', typeof current !== 'undefined' ? current.length : 0)

      data = data.concat(current)

      if (typeof options.uniqueCommands !== 'undefined' && options.uniqueCommands === true) {
        // Only save unique commands
        const unique = {}
        let notUnique = 0

        data.forEach(item => {
          item = item.trim()

          if (typeof unique[ item ] === 'undefined') {
            unique[ item ] = true
          } else {
            notUnique++
          }
        })

        data = Object.keys(unique)

        debug('Removed %d non-unique commands', notUnique)
      }

      fs.writeFileSync(replHistoryFile, data.join('\n') + '\n')
    }

    process.exit()
  })

  // Obviously we don't want to try to load non-existent history.
  if (fs.existsSync(replHistoryFile)) {
    debug(`Found ${replHistoryFile}`)

    loadHistory(replHistoryFile)
      .map(line => server.history.push(line))
  }

  debug('%s ready', name)

  // Otherwise the last debug call there leaves the user at a non-prompt which will change when arrow up/down is pressed.
  if (process.env.DEBUG) {
    process.stdout.write(server._prompt)
  }
}

init()

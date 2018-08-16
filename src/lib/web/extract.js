'use strict'

async function extract (data, options) {
  const tmp = {start: 0, end: 0}

  if (typeof options.inclusive === 'undefined') {
    options.inclusive = false
  }

  tmp.start = data.indexOf(options.start)

  if (tmp.start === -1) {
    tmp.start = 0
  }

  if (options.inclusive === false) {
    tmp.start += options.start.length
  }

  if (options.end) {
    tmp.end = data.indexOf(options.end, tmp.start)
  } else {
    tmp.end = data.length
  }

  if (tmp.end === -1) {
    tmp.end = 0
  }

  if (options.inclusive) {
    tmp.end += options.end.length
  }

  return data.substring(tmp.start, tmp.end)
}

module.exports = {
  extract
}

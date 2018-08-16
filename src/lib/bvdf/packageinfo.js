'use strict'

const { readBinaryKVEntries } = require('./readBinaryKVEntries.js')

// Read a single app entry, returning its id, name and key-value entries
function readPackageEntry (buf) {
  let off = 0

  const id = buf.readUInt32LE(off)
  off += 4

  off += 20 // Skip SHA1 hash

  const changeNum = buf.readUInt32LE(off) // eslint-disable-line
  off += 4

  const [entries, entriesSize] = readBinaryKVEntries(buf.slice(off))

  off += entriesSize

  return [{id, entries}, off]
}

// Read a collection of package entries
function readPackageEntries (buf) {
  const entries = []

  try {
    // Package entry collection is terminated by 0xFFFFFFFF
    for (let off = 0; buf.readUInt32LE(off) !== 0xFFFFFFFF; ++off) {
      let [entry, size] = readPackageEntry(buf.slice(off))

      entries.push(entry)

      off += size
    }
  } catch (err) {
    if (err.toString().indexOf('RangeError') === -1) {
      throw err
    }
  }

  return entries
}

function parse (buf) {
  if (buf.readUInt8(1) !== 0x55 || buf.readUInt8(2) !== 0x56) {
    throw new Error('Invalid file signature')
  }

  return readPackageEntries(buf.slice(8))
}

module.exports = {
  parse
}

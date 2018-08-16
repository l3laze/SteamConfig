'use strict'

const { readNullTerminatedString } = require('./readNullTerminatedString.js')
const { readBinaryKVEntries } = require('./readBinaryKVEntries.js')

// Read a single app entry, returning its id, name and key-value entries
function readAppEntry (buf) {
  let off = 0

  const id = buf.readUInt32LE(off)

  off += 49 // Skip a bunch of fields we don't care about

  const [name, nameSize] = readNullTerminatedString(buf.slice(off))

  off += nameSize

  const [entries, entriesSize] = readBinaryKVEntries(buf.slice(off))

  off += entriesSize

  return [{id, name, entries}, off]
}

// Read a collection of app entries
function readAppEntries (buf) {
  const entries = []

  // App entry collection is terminated by null dword
  for (let off = 0; buf.readUInt32LE(off) !== 0x00000000; ++off) {
    let [entry, size] = readAppEntry(buf.slice(off))

    entries.push(entry)

    off += size
  }

  return entries
}

// Read header and app entries from binary VDF Buffer
function parse (buf) {
  // First byte varies across installs, only the 2nd and 3rd seem consistent
  if (buf.readUInt8(1) !== 0x44 || buf.readUInt8(2) !== 0x56) {
    throw new Error('Invalid file signature')
  }

  return readAppEntries(buf.slice(8))
}

module.exports = {
  parse
}

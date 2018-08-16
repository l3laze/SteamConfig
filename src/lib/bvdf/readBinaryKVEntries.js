'use strict'

const { readNullTerminatedString } = require('./readNullTerminatedString.js')

// Read a collection of key-value entries, returning the collection and bytes
// read
function readBinaryKVEntries (buf, isEntry = false) {
  let off = 0

  if (isEntry) {
    let type = buf.readUInt8(off)

    off += 1

    let [key, keySize] = readNullTerminatedString(buf.slice(off))

    off += keySize

    switch (type) {
      case 0x00: // Nested entries
        let [kvs, kvsSize] = readBinaryKVEntries(buf.slice(off))

        return [key, kvs, off + kvsSize]

      case 0x01: // String
        let [str, strSize] = readNullTerminatedString(buf.slice(off))

        return [key, str, off + strSize]

      case 0x02: // Int
        return [key, buf.readUInt32LE(off), off + 4]

      default:
        return [key, undefined, off]
    }
  } else {
    const entries = {}

    // Entry collection is terminated by 0x08 byte
    for (; buf.readUInt8(off) !== 0x08;) {
      let [key, val, size] = readBinaryKVEntries(buf.slice(off), true)

      entries[key] = val

      off += size
    }

    return [entries, off + 1]
  }
}

module.exports = {
  readBinaryKVEntries
}

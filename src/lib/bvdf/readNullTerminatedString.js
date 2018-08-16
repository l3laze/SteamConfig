'use strict'

// Read a null-terminated UTF-8 string from a Buffer, returning the string and
// the number of bytes read
function readNullTerminatedString (buf) {
  let size = 0

  while (buf.readUInt8(size++) !== 0x00) {
    continue
  }

  let str = buf.toString('utf8', 0, size - 1)

  return [str, size]
}

module.exports = {
  readNullTerminatedString
}

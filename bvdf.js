const long = require('long') // eslint-disable-line no-unused-vars
const ByteBuffer = require('bytebuffer')

const Type = {
  None: 0,
  String: 1,
  Int32: 2,
  Float32: 3,
  Pointer: 4,
  WideString: 5,
  Color: 6,
  UInt64: 7,
  End: 8
}

exports.parse = function (data) {
  let buffer
  let len = data.length

  buffer = ByteBuffer.wrap(data, 'hex', true).resize(len)
  buffer.LE(true)
  data = []

  if (buffer.constructor !== ByteBuffer) {
    buffer = ByteBuffer.wrap(buffer)
  }

  while (true) {
    try {
      let pid = ByteBuffer.fromUTF8(buffer.readCString()).toString('hex') // eslint-disable-line no-unused-vars
      let hash = [buffer.readUint32(), buffer.readUint32(), buffer.readUint32(), buffer.readUint32(), buffer.readUint32()].toString(16)
      data.push(parseEntry(buffer, hash))
    } catch (err) {
      if (err.message.indexOf('Index out of range') !== -1 && err.message.indexOf(len) !== -1) {
        break
      }
      console.error(err)
      process.exit(1)
    }
  }

  return data
}

function parseEntry (buffer) {
  let object = {}

  while (true) {
    let type = buffer.readUint8()

    if (type === Type.End) {
      break
    }
    let name = buffer.readCString()

    switch (type) {
      case Type.None:
        object[name] = parseEntry(buffer)
        break

      case Type.String:
        object[name] = buffer.readCString()
        break

      case Type.WideString:
        object[name] = buffer.readCString()
        break

      case Type.Int32:
      case Type.Color:
      case Type.Pointer:
        object[name] = buffer.readInt32()
        break

      case Type.UInt64:
        object[name] = buffer.readUint64()
        break

      case Type.Float32:
        object[name] = buffer.readFloat()
        break
    }
  }

  return object
}

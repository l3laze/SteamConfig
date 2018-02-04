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

exports.parseAppInfo = function (data) {
  let buffer
  let len = data.length
  let first = true

  buffer = ByteBuffer.wrap(data, 'hex', true).resize(len)
  buffer.LE(true)
  data = []

  do {
    try {
      let aid = buffer.readUint32().toString(10) // eslint-disable-line no-unused-vars
      if (aid === 0x00000000) {
        return data
      }

      let skip = (first ? 49 : 48)
      let skipped = []
      first = false
      do {
        skipped.push(buffer.readUint8())
      } while ((skip -= 1) !== 0)
      /*
        let size = buffer.readUint32() // eslint-disable-line no-unused-vars
        let state = buffer.readUint32() // eslint-disable-line no-unused-vars
        let updated = new Date(buffer.readUint32() * 1000).toString()
        let accessToken = buffer.readUint64() // eslint-disable-line no-unused-vars
        let sha1 = []
        do {
          sha1.push(buffer.readUint8())
        } while (sha1.length < 20)

        ({
          appid: aid,
          sizeOf: size,
          infoState: state,
          lastUpdated: updated,
          token: accessToken,
          hash: sha1,
          change: changeNumber
        })
      */

      let info = exports.decode(buffer)

      if (info.config && info.config.steamcontrollertemplateindex && info.config.steamcontrollertemplateindex < 0) {
        /*
         * Based on https://stackoverflow.com/a/28519774/7665043
         */
        info.config.steamcontrollertemplateindex += (1 << 30) * 4
      }
      data.push({
        'id': info.appid,
        'name': 'appinfo',
        'entries': info
      })
    } catch (err) {
      if (err.message.indexOf('Illegal offset') !== -1 && err.message.indexOf(len) !== -1) {
        break
      } else {
        console.error(`Parsed: ${data.length}`)
        console.error(err)
        process.exit(1)
      }
    }
  } while (true)

  return data
}

exports.parsePackageInfo = function (data) {
  let buffer
  let len = data.length

  buffer = ByteBuffer.wrap(data, 'hex', true).resize(len)
  data = []

  while (true) {
    try {
      let pid = buffer.readCString().toString() // eslint-disable-line no-unused-vars
      let hash = [buffer.readUint32(), buffer.readUint32(), buffer.readUint32(), buffer.readUint32(), buffer.readUint32()].toString(16) // eslint-disable-line no-unused-vars
      let tmp = exports.decode(buffer)
      data.push(tmp)
    } catch (err) {
      if (err.message.indexOf('Index out of range') !== -1 && err.message.indexOf(len) !== -1) {
        break
      } else {
        console.error(err)
        process.exit(1)
      }
    }
  }

  return data
}

exports.parseShortcuts = function (data) {
  let autoConvert = {
    booleans: [
      'IsHidden', 'AllowDesktopConfig', 'AllowOverlay', 'OpenVR'
    ],
    timestamps: [
      'LastPlayTime'
    ],
    arrays: [
      'tags'
    ]
  }

  data = exports.decode(ByteBuffer.wrap(data, 'hex', true).resize(data.length))
  data = convertData(Object.values(data.shortcuts), autoConvert)

  return {shortcuts: data}
// returnexports.decode(ByteBuffer.wrap(data, 'hex', true).resize(data.length)), autoConvert)
}

exports.decode = function decode (buffer) {
  let object = {}

  do {
    let type = buffer.readUint8()

    if (type === Type.End) {
      break
    }

    let name = buffer.readCString()

    switch (type) {
      case Type.None:
        object[name] = exports.decode(buffer)
        break

      case Type.String:
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
  } while (true)

  return object
}

function convertData (data, conversion) {
  for (let bool of conversion.booleans) {
    data.map(item => {
      item[ bool ] = (item[ bool ] === 1 ? true : false) // eslint-disable-line no-unneeded-ternary

      return item
    })
  }

  for (let time of conversion.timestamps) {
    data.map(item => {
      if (item[ time ] === 0) {
        item[ time ] = 'Never'
        return item
      } else {
        item[ time ] = new Date(item[ time ] * 1000).toString()
        return item
      }
    })
  }

  for (let list of conversion.arrays) {
    data.map(item => {
      item[ list ] = Object.values(item[ list ])

      return item
    })
  }

  return data
}

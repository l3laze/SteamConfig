/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 * @module bvdf
 * Based on [seishun's node-steam/lib/VDF.js](https://github.com/seishun/node-steam).
 * @requires [bytebuffer.js](https://www.npmjs.com/package/bytebuffer)
 *
 */

/**
 * @package
 * @enum {Number}
 * @property {Number} None - No type/start of table/end of data value.
 * @property {Number} String - Null-terminated string value.
 * @property {Number} Int32 - A 32-bit int value.
 * @property {Number} Float32 - A 32-bit float value.
 * @property {Number} WideString - A null-terminated string value (should be double-null?)
 * @property {Number} Color - An RGB color as a 32-bit int value.
 * @property {Number} UInt64 - A 64-bit int value.
 * @property {Number} End - End of table/end of data value.
 */
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

/**
 * Parse the data of appinfo.vdf.
 * @function
 * @export
 * @param {String|Buffer} data - The file data to parse.
 * @returns {Array} - An array of appinfo entries as anonymous Objects.
 * @throws {Error} - If there is an error parsing the data.
 */
function parseAppInfo (data) {
  let buffer
  let len = data.length
  let first = true

  buffer = ByteBuffer.wrap(data, 'hex', true).resize(len)
  buffer.LE(true)
  data = []

  do {
    try {
      let aid = buffer.readUint32().toString(10)
      if (aid === 0x00000000) {
        return data
      }

      let skip = (first ? 49 : 48)
      let skipped = []
      first = false
      do {
        skipped.push(buffer.readUint8())
      } while ((skip -= 1) !== 0)
      /* @ignore
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

      let info
      info = decode(buffer)

      if (info.config && info.config.steamcontrollertemplateindex && info.config.steamcontrollertemplateindex < 0) {
        /* @ignore
         * Based on https://stackoverflow.com/a/28519774/7665043
         * Fixes some signed int values that are too big for JS being stored as unsigned int (negative) values.
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
        // Ignore; parser doesn't handle EOF, so this is how it's handled.
        break
      } else {
        // It's a real error otherwise.
        throw new Error(err)
      }
    }
  } while (true)

  return data
}

/**
 * Parse the data of packageinfo.vdf.
 * @function
 * @export
 * @param {String|Buffer} data - The file data to parse.
 * @returns {Array} - An array of packageinfo entries as anonymous Objects.
 * @throws {Error} - If there is an error parsing the data.
 */
function parsePackageInfo (data) {
  let buffer
  let len = data.length

  buffer = ByteBuffer.wrap(data, 'hex', true).resize(len)
  data = []

  while (true) {
    try {
      let pid = buffer.readCString().toString() // package id
      let hash = [
        buffer.readUint32(),
        buffer.readUint32(),
        buffer.readUint32(),
        buffer.readUint32(),
        buffer.readUint32()
      ].toString(16)
      let tmp = decode(buffer)
      data.push(tmp)
    } catch (err) {
      if (err.message.indexOf('Index out of range') !== -1 && err.message.indexOf(len) !== -1) {
        break
      } else {
        throw new Error(err)
      }
    }
  }

  return data
}

/**
 * Parse the data of shortcuts.vdf. Auto-converts some data to timestamps/arrays/etc.
 * @function
 * @export
 * @param {String|Buffer} data - The file data to parse.
 * @returns {Array} - An array of shortcut entries as anonymous Objects.
 * @throws {Error} - If there is an error parsing the data.
 */
function parseShortcuts (data) {
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

  data = decode(ByteBuffer.wrap(data, 'hex', true).resize(data.length))
  data = convertData(Object.values(data.shortcuts), autoConvert)

  return {shortcuts: data}
  // return decode(ByteBuffer.wrap(data, 'hex', true).resize(data.length)), autoConvert)
}

/**
 * Parse the binary VDF data of buffer.
 * @function
 * @export
 * @param {ByteBuffer} data - The data to parse.
 * @returns {Object} - The parsed data as a JS object.
 * @throws {Error} - If there is an error parsing the data.
 */
function decode (buffer) {
  let object = {}

  do {
    let type = buffer.readUint8()

    if (type === Type.End) {
      break
    }

    let name = buffer.readCString()

    switch (type) {
      case Type.None:
        object[name] = decode(buffer)
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

/**
 * Convert parts of data to another type/value -- Timestamp, Boolean, Array, etc.
 * @function
 * @param {String|Buffer} data - The file data to parse.
 * @param {DataConversion} conversion - The conversions to apply to data.
 * @returns {Array} - An array of appinfo entries as anonymous Objects.
 * @throws {Error} - If there is an error parsing the data.
 */
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


/**
 * @typedef {Object} DataConversion
 * @property {Array} booleans - The names of some boolean values to convert.
 * @property {Array} timestamps - The names of some timestamp values to convert.
 * @property {Array} arrays - The names of some arrays to convert.
 */

exports.parseAppInfo = parseAppInfo
exports.parsePackageInfo = parsePackageInfo
exports.parseShortcuts = parseShortcuts
exports.decode = decode

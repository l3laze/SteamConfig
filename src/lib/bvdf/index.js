module.exports = {
  appinfo: require('./appinfo.js'),
  packageinfo: require('./packageinfo.js'),
  shortcuts: {
    parse: require('./readBinaryKVEntries.js').readBinaryKVEntries
  }
}

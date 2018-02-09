/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 * @module SteamPaths
 */

'use strict'

/**
 * A set of strings representing the Steam configuration files SteamConfig can handle.
 * @const
 * @name SteamPaths
 * @property {String} all             - All of the files. Handled specially by {@link SteamConfig#load}
 * @property {String} appinfo         - appinfo => /appcache/appinfo.vdf
 * @property {String} config          - config => /config/config.vdf
 * @property {String} libraryfolders  - libraryfolders => /steamapps/libraryfolders.vdf
 * @property {String} localconfig     - localconfig => /userdata/{accountId}/config/localconfig.vdf
 * @property {String} packageinfo     - packageinfo => /appcache/packageinfo.vdf
 * @property {String} registry        - registry => ../registry.vdf on Linux, /registry.vdf on Mac or winreg on Windows.
 * @property {String} shortcuts       - shortcuts => /userdata/{accountId}/config/shortcuts.vdf
 * @property {String} sharedconfig    - sharedconfig => userdata/{accountId}/7/remote/sharedconfig.vdf
 * @property {String} skins           - skins => skins/ on Linux or Winows, /Steam.AppBundle/Steam/Contents/MacOS/skins on Mac.
 * @property {String} steamapps       - steamapps => /steamapps/
 * @property {String} library         - library => {aSteamLibraryFolder}/steamapps/
 */
const SteamPaths = {
  all: 'all',

  appinfo: 'appinfo',
  config: 'config',
  libraryfolders: 'libraryfolders',
  localconfig: 'localconfig',
  loginusers: 'loginusers',
  packageinfo: 'packageinfo',
  registry: 'registry',
  shortcuts: 'shortcuts',
  sharedconfig: 'sharedconfig',
  skins: 'skins',
  steamapps: 'steamapps'
}

module.exports = SteamPaths

'use strict'

module.exports = {
  mac: {
    root: '~/Library/Application Support/Steam',
    appinfo: '/appcache/appinfo.vdf',
    config: '/config/config.vdf',
    libraryfolders: '/steamapps/libraryfolders.vdf',
    localconfig: '/userdata/accountId/config/localconfig.vdf',
    loginusers: '/config/loginusers.vdf',
    packageinfo: '/appcache/packageinfo.vdf',
    registry: '/registry.vdf',
    sharedconfig: '/userdata/accountId/7/remote/sharedconfig.vdf',
    shortcuts: '/userdata/accountId/config/shortcuts.vdf',
    steamapps: '/steamapps',
    skins: '/Steam.AppBundle/Steam/Contents/MacOS/skins'
  },
  linux: {
    root: '~/.steam',
    appinfo: '/steam/appcache/appinfo.vdf',
    config: '/steam/config/config.vdf',
    libraryfolders: '/steam/steamapps/libraryfolders.vdf',
    localconfig: '/steam/userdata/accountId/config/localconfig.vdf',
    loginusers: '/steam/config/loginusers.vdf',
    packageinfo: '/appcache/packageinfo.vdf',
    registry: '/registry.vdf',
    sharedconfig: '/steam/userdata/accountId/7/remote/sharedconfig.vdf',
    shortcuts: '/steam/userdata/accountId/config/shortcuts.vdf',
    steamapps: '/steam/steamapps',
    skins: '/skins'
  },
  win32: {
    'x64': {
      root: 'C:\\Program Files (x86)\\Steam',
      appinfo: '/appcache/appinfo.vdf',
      config: '/config/config.vdf',
      libraryfolders: '/steamapps/libraryfolders.vdf',
      localconfig: '/userdata/accountId/config/localconfig.vdf',
      loginusers: '/config/loginusers.vdf',
      packageinfo: '/appcache/packageinfo.vdf',
      registry: 'winreg',
      sharedconfig: '/userdata/accountId/7/remote/sharedconfig.vdf',
      shortcuts: '/userdata/accountId/config/shortcuts.vdf',
      steamapps: '/steamapps',
      skins: '/skins'
    },
    'x86': {
      root: 'C:\\Program Files\\Steam',
      appinfo: '/appcache/appinfo.vdf',
      config: '/config/config.vdf',
      libraryfolders: '/steamapps/libraryfolders.vdf',
      localconfig: '/userdata/accountId/config/localconfig.vdf',
      loginusers: '/config/loginusers.vdf',
      packageinfo: '/appcache/packageinfo.vdf',
      registry: 'winreg',
      sharedconfig: '/userdata/accountId/7/remote/sharedconfig.vdf',
      shortcuts: '/userdata/accountId/config/shortcuts.vdf',
      steamapps: '/steamapps',
      skins: '/skins'
    }
  }
}

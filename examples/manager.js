'use strict'

const path = require('path')
const fs = require('fs')
const SteamConfig = require('../index.js')
const cli = require('cli')

/*
 * Slightly increased console width for 'cli' because
 *  it defaults to 70/25, which is often too small.
 */
cli.width = 80
cli.option_width = 35

let options = cli.parse({
  path: ['p', 'Path to Steam installation.', 'path', null],
  user: ['u', 'User to switch to by account name or display name.', 'string', null],
  backup: ['b', 'Backup mode', 'boolean', false],
  restore: ['r', 'Restore mode', 'boolean', false],
  everything: ['e', 'Short for every "include" flag', 'boolean', false],
  config: ['c', 'Include config.vdf.', 'boolean', false],
  loginusers: ['l', 'Include loginusers.vdf.', 'boolean', false],
  registry: ['g', 'Include the registry, or registry.vdf.', 'boolean', false],
  libraryfolders: ['f', 'Include libraryfolders.vdf.', 'boolean', false],
  sharedconfig: ['a', 'Include sharedconfig.vdf.', 'boolean', false],
  localconfig: ['o', 'Include localconfig.vdf.', 'boolean', false],
  shortcuts: ['s', 'Include shortcuts.vdf.', 'boolean', false]
})

let steam = new SteamConfig()

async function run () {
  let original
  let backup = {
    arch: steam.arch,
    platform: steam.platform
  }

  try {
    let installPath = null
    if (options.path === null) {
      console.info('Trying to find default path to Steam...')
      installPath = steam.detectPath()
      if (installPath !== null) {
        console.info(`Found default path: ${installPath}.`)
        steam.setInstallPath(installPath)
      } else {
        process.error('Couldn\'t find default path to Steam.')
        process.exit(1)
      }
    }

    await steam.loadRegistry()
    await steam.loadLoginusers()

    if (options.everything) {
      options.config = true
      options.loginusers = true
      options.registry = true
      options.libraryfolders = true
      options.sharedconfig = true
      options.localconfig = true
      options.shortcuts = true
    }

    if (options.user === null) {
      console.info('No user set; trying to detect current Steam user...')
      steam.setUser(await steam.detectUser())
      console.info(`Found user: ${steam.user.AccountName}.`)
    } else {
      await steam.setUser(options.user)
    }

    if (options.backup === false && options.restore === false) {
      console.error('No mode set...nothing to do!')
      process.exit(0)
    }

    if (options.backup === false && options.restore === false) {
      console.error('No mode set...nothing to do!')
      process.exit(0)
    }

    if (options.config === false &&
        options.loginusers === false &&
        options.registry === false &&
        options.libraryfolders === false &&
        options.sharedconfig === false &&
        options.localconfig === false &&
        options.shortcuts === false) {
      console.error('No targets set...nothing to do!')
      process.exit(0)
    } else {
      console.info(JSON.stringify(options, null, 2))
    }

    if (options.backup) {
      original = await saveOriginal()

      console.info(`Backing up data for ${steam.user.AccountName}.`)
      if (options.config) {
        await steam.loadConfig()

        backup[ 'config' ] = {
          'InstallConfigStore': {
            'Software': {
              'Valve': {
                'Steam': {
                  'AutoUpdateWindowEnabled': steam.config.InstallConfigStore.Software.Valve.Steam.AutoUpdateWindowEnabled,
                  'Accounts': steam.config.InstallConfigStore.Software.Valve.Steam.Accounts,
                  'NoSavePersonalInfo': steam.config.InstallConfigStore.Software.Valve.Steam.NoSavePersonalInfo,
                  'MaxServerBrowserPingsPerMin': steam.config.InstallConfigStore.Software.Valve.Steam.MaxServerBrowserPingsPerMin,
                  'DownloadThrottleKbps': steam.config.InstallConfigStore.Software.Valve.Steam.DownloadThrottleKbps,
                  'AllowDownloadsDuringGameplay': steam.config.InstallConfigStore.Software.Valve.Steam.AllowDownloadsDuringGameplay,
                  'StreamingThrottleEnabled': steam.config.InstallConfigStore.Software.Valve.Steam.StreamingThrottleEnabled,
                  'ClientBrowserAuth': steam.config.InstallConfigStore.Software.Valve.Steam.ClientBrowserAuth
                }
              }
            },
            'Music': {
              'MusicVolume': steam.config.InstallConfigStore.Music.MusicVolume,
              'CrawlSteamInstallFolders': steam.config.InstallConfigStore.Music.CrawlSteamInstallFolders,
              'PauseOnVoiceChat': steam.config.InstallConfigStore.Music.PauseOnVoiceChat,
              'PlaylistNowPlayingNotification': steam.config.InstallConfigStore.Music.PlaylistNowPlayingNotification,
              'MusicPlayerVisible': steam.config.InstallConfigStore.Music.MusicPlayerVisible
            }
          }
        }
      }

      if (options.loginusers) {
        let loginusers = steam.loginusers
        let userKeys = Object.keys(loginusers)

        for (let i = 0; i < userKeys.length; i += 1) {
          delete loginusers[userKeys[ i ]].Timestamp
        }

        backup[ 'loginusers' ] = loginusers
      }

      if (options.registry) {
        backup[ 'registry' ] = {
          'Registry': {
            'HKCU': {
              'Software': {
                'Valve': {
                  'Steam': {
                    language: steam.registry.Registry.HKCU.Software.Valve.Steam.language
                  }
                }
              }
            }
          }
        }
      }

      if (options.libraryfolders) {
        await steam.loadLibraryfolders()

        backup[ 'libraryfolders' ] = steam.libraryfolders

        delete backup.libraryfolders.TimeNextStatsReport
        delete backup.libraryfolders.ContentStatsID
      }

      if (options.sharedconfig) {
        await steam.loadSharedconfig()

        backup[ 'sharedconfig' ] = steam.sharedconfig

        delete backup.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.DesktopShortcutCheck
        delete backup.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.StartMenuShortcutCheck
        delete backup.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.SSAVersion
      }

      if (options.localconfig) {
        await steam.loadLocalconfig()

        backup[ 'localconfig' ] = steam.localconfig

        delete backup.localconfig.UserLocalConfigStore.broadcast.Permissions
        delete backup.localconfig.UserLocalConfigStore.broadcast.FirstTimeComplete
        delete backup.localconfig.UserLocalConfigStore.ParentalSettings
        delete backup.localconfig.UserLocalConfigStore.broadcast.FirstTimeComplete

        let friends = Object.assign({}, backup.localconfig.UserLocalConfigStore.friends)

        delete backup.localconfig.UserLocalConfigStore.friends

        backup.localconfig.UserLocalConfigStore[ 'friends' ] = {
          'VoiceReceiveVolume': friends.VoiceReceiveVolume,
          'Notifications_ShowIngame': friends.Notifications_ShowIngame,
          'Sounds_PlayIngame': friends.Sounds_PlayIngame,
          'Notifications_ShowOnline': friends.Notifications_ShowOnline,
          'Sounds_PlayOnline': friends.Sounds_PlayOnline,
          'Notifications_ShowMessage': friends.Notifications_ShowMessage,
          'Sounds_PlayMessage': friends.Sounds_PlayMessage,
          'AutoSignIntoFriends': friends.AutoSignIntoFriends,
          'ShowTimeInChatLogCheck': friends.ShowTimeInChatLogCheck,
          'AlwaysNewChatWindow': friends.AlwaysNewChatWindow,
          'Notifications_EventsAndAnnouncements': friends.Notifications_EventsAndAnnouncements,
          'Sounds_EventsAndAnnouncements': friends.Sounds_EventsAndAnnouncements,
          'ChatFlashMode': friends.ChatFlashMode,
          'PersonaStateDesired': friends.PersonaStateDesired
        }

        delete backup.localconfig.UserLocalConfigStore.Licenses
        delete backup.localconfig.UserLocalConfigStore.apptickets
        delete backup.localconfig.UserLocalConfigStore.AppInfoChangeNumber
        delete backup.localconfig.UserLocalConfigStore.CloudKey
        delete backup.localconfig.UserLocalConfigStore.CloudKeyCRC
        delete backup.localconfig.UserLocalConfigStore.Software
        delete backup.localconfig.UserLocalConfigStore.News.Messages
        delete backup.localconfig.UserLocalConfigStore.depots
        delete backup.localconfig.UserLocalConfigStore.offline
      }

      if (options.shortcuts) {
        await steam.loadShortcuts()

        backup[ 'shortcuts' ] = steam.shortcuts
      }

      fs.writeFileSync(path.join(__dirname, 'data', `backup-${steam.user.accountID}.json`), JSON.stringify(backup, null, 2))
    } else if (options.restore) {
      let restoring = path.join(__dirname, 'data', `backup-${steam.user.accountID}.json`)
      original = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', `original-${steam.user.accountID}.json`)))

      if (fs.existsSync(restoring) === false) {
        console.error(`There is no backup for ${steam.user.AccountName} to restore data from.`)
        process.exit(1)
      }

      console.info(`Restoring data for ${steam.user.AccountName}.`)

      let data = JSON.parse(fs.readFileSync(restoring))

      if (options.config && data.hasOwnProperty('config')) {
        await steam.loadConfig()

        steam.config.InstallConfigStore.Software.Valve.Steam.AutoUpdateWindowEnabled = data.config.InstallConfigStore.Software.Valve.Steam.AutoUpdateWindowEnabled
        steam.config.InstallConfigStore.Software.Valve.Steam.Accounts = data.config.InstallConfigStore.Software.Valve.Steam.Accounts
        steam.config.InstallConfigStore.Software.Valve.Steam.NoSavePersonalInfo = data.config.InstallConfigStore.Software.Valve.Steam.NoSavePersonalInfo
        steam.config.InstallConfigStore.Software.Valve.Steam.MaxServerBrowserPingsPerMin = data.config.InstallConfigStore.Software.Valve.Steam.MaxServerBrowserPingsPerMin
        steam.config.InstallConfigStore.Software.Valve.Steam.DownloadThrottleKbps = data.config.InstallConfigStore.Software.Valve.Steam.DownloadThrottleKbps
        steam.config.InstallConfigStore.Software.Valve.Steam.AllowDownloadsDuringGameplay = data.config.InstallConfigStore.Software.Valve.Steam.AllowDownloadsDuringGameplay
        steam.config.InstallConfigStore.Software.Valve.Steam.StreamingThrottleEnabled = data.config.InstallConfigStore.Software.Valve.Steam.StreamingThrottleEnabled
        steam.config.InstallConfigStore.Software.Valve.Steam.ClientBrowserAuth = data.config.InstallConfigStore.Software.Valve.Steam.ClientBrowserAuth

        steam.config.InstallConfigStore.Music.MusicVolume = data.config.InstallConfigStore.Music.MusicVolume
        steam.config.InstallConfigStore.Music.CrawlSteamInstallFolders = data.config.InstallConfigStore.Music.CrawlSteamInstallFolders
        steam.config.InstallConfigStore.Music.PauseOnVoiceChat = data.config.InstallConfigStore.Music.PauseOnVoiceChat
        steam.config.InstallConfigStore.Music.PlaylistNowPlayingNotification = data.config.InstallConfigStore.Music.PlaylistNowPlayingNotification
        steam.config.InstallConfigStore.Music.MusicPlayerVisible = data.config.InstallConfigStore.Music.MusicPlayerVisible
      }

      if (options.loginusers && data.hasOwnProperty('loginusers')) {
        let loginusers = data.loginusers
        let userKeys = Object.keys(loginusers)

        for (let i = 0; i < userKeys.length; i += 1) {
          if (steam.loginusers.users.hasOwnProperty(userKeys[ i ])) {
            steam.loginusers.users[userKeys[ i ]].RememberPassword = data.loginusers.users[userKeys[ i ]].RememberPassword
            steam.loginusers.users[userKeys[ i ]].WantsOfflineMode = data.loginusers.users[userKeys[ i ]].WantsOfflineMode
            steam.loginusers.users[userKeys[ i ]].SkipOfflineModeWarning = data.loginusers.users[userKeys[ i ]].SkipOfflineModeWarning
          }
        }
      }

      if (options.registry && data.hasOwnProperty('registry')) {
        steam.registry.Registry.HKCU.Software.Valve.Steam.language = data.registry.Registry.HKCU.Software.Valve.Steam.language
      }

      if (options.libraryfolders && data.hasOwnProperty('libraryfolders')) {
        await steam.loadLibraryfolders()

        let dLibs = Object.values(data.libraryfolders)
        let cLibs = Object.values(steam.libraryfolders) || []

        cLibs = cLibs.map(function (lib) {
          if (lib !== 'TimeNextStatsReport' && lib !== 'ContentStatsID') {
            return lib
          }
        })

        for (let x = 0; x < dLibs.length; x += 1) {
          if (cLibs.includes(dLibs[ x ])) {
            steam.libraryfolders[ cLibs.length ] = dLibs[ x ]
          }
        }
      }

      if (options.sharedconfig && data.hasOwnProperty('sharedconfig')) {
        await steam.loadSharedconfig()

        steam.sharedconfig = Object.assign(data.sharedconfig, steam.sharedconfig)
      }

      if (options.localconfig && data.hasOwnProperty('localconfig')) {
        await steam.loadLocalconfig()

        steam.localconfig.UserLocalConfigStore.broadcast = Object.assign(steam.localconfig.UserLocalConfigStore.broadcast, data.localconfig.UserLocalConfigStore.broadcast)
        steam.localconfig.UserLocalConfigStore.friends = Object.assign(steam.localconfig.UserLocalConfigStore.friends, data.localconfig.UserLocalConfigStore.friends)
        steam.localconfig.UserLocalConfigStore.friends = Object.assign(steam.localconfig.UserLocalConfigStore.friends, data.localconfig.UserLocalConfigStore.friends)
        steam.localconfig.UserLocalConfigStore[ 'StartupState.Friends' ] = data.localconfig.UserLocalConfigStore[ 'StartupState.Friends' ]
        steam.localconfig.UserLocalConfigStore.News = Object.assign(steam.localconfig.UserLocalConfigStore.News, data.localconfig.UserLocalConfigStore.News)
        steam.localconfig.UserLocalConfigStore.HideSharingNotifications = data.localconfig.UserLocalConfigStore.HideSharingNotifications

        if (data.platform !== steam.platform) {
          delete steam.localconfig.UserLocalConfigStore.system.PushToTalkKey
        }

        steam.localconfig.UserLocalConfigStore.system = Object.assign(steam.localconfig.UserLocalConfigStore.system, data.localconfig.UserLocalConfigStore.system)
      }

      if (options.shortcuts && data.hasOwnProperty('shortcuts')) {
        await steam.loadShortcuts()

        if (data.platform === steam.platform) {
          steam.shortcuts.shortcuts = Object.assign(steam.shortcuts.shortcuts, data.shortcuts.shortcuts)
        }
      }

      let restored = Object.assign({}, steam)
      let temp = restored.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps

      delete restored.steamapps
      delete restored.userdata
      delete restored.appinfo
      delete restored.packageinfo

      restored.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps = {}

      if (JSON.stringify(original) !== JSON.stringify(restored)) {
        console.error('Restored data is invalid...')
      } else {
        console.error('Restored data is okay.')
      }

      restored.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps = temp

      fs.writeFileSync(path.join(__dirname, 'data', `restore-${steam.user.accountID}.json`), JSON.stringify(restored, null, 2))
      await steam.saveBinaryVDF(steam.getPathTo('shortcuts'), steam.shortcuts, 'shortcuts')
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

async function saveOriginal () {
  steam.setInstallPath(steam.detectPath())
  await steam.loadConfig()
  await steam.loadLoginusers()
  await steam.loadRegistry()
  steam.setUser(await steam.detectUser())
  await steam.loadLibraryfolders()
  await steam.loadSharedconfig()
  await steam.loadLocalconfig()
  await steam.loadShortcuts()

  delete steam.steamapps
  delete steam.userdata
  delete steam.appinfo
  delete steam.packageinfo

  fs.writeFileSync(path.join(__dirname, 'data', `original-${steam.user.accountID}.json`), JSON.stringify(steam, null, 2))

  return Object.assign({}, steam)
}

run()

/**
 * @author Tom <l3l&#95;aze&#64;yahoo&#46;com>
 */

/**
 *
 */
function SteamSettings () {
  this.language = new SettingVal('language', 'list', languages)
  this.autoLoginUser = new SettingVal('AutoLoginUser', 'string')
  this.registryRememberPassword = new SettingVal('RememberPassword', 'boolean')
  this.alreadyRetriedOfflineMode = new SettingVal('AlreadyRetriedOfflineMode', 'boolean')
  this.loginusersRememberPassword = new SettingVal('RememberPassword', 'boolean')
  this.wantsOfflineMode = new SettingVal('WantsOfflineMode', 'boolean')
  this.skipOfflineModeWarning = new SettingVal('SkipOfflineModeWarning', 'boolean')
  this.autoUpdateWindowEnabled = new SettingVal('AutoUpdateWindowEnabled', 'boolean')
  this.disableShaderCache = new SettingVal('DisableShaderCache', 'boolean')
  this.noSavePersonalInfo = new SettingVal('NoSavePersonalInfo', 'boolean')
  this.MaxServerBrowserPingsPerMin = new SettingVal('MaxServerBrowserPingsPerMin', 'list', [
    0, 5000, 3000, 1500, 1000, 500, 250
  ])
  this.downloadThrottleKbps = new SettingVal('DownloadThrottleKbps', 'hash', {
    'None': 0,
    '16 KB/s': 128,
    '32 KB/s': 256,
    '48 KB/s': 384,
    '64 KB/s': 512,
    '96 KB/s': 768,
    '128 KB/s': 1024,
    '192 KB/s': 1536,
    '256 KB/s': 2048,
    '384 KB/s': 3072,
    '512 KB/s': 4096,
    '768 KB/s': 6144,
    '1000 KB/s (1 MB/s)': 8000,
    '1000 KB/s': 8000,
    '1 MB/s': 8000,
    '1.5 MB/s': 12000,
    '2 MB/s': 16000,
    '3 MB/s': 24000,
    '5 MB/s': 40000,
    '7 MB/s': 56000,
    '10 MB/s': 80000,
    '25 MB/s': 200000
  })
  this.allowDownloadsDuringGameplay = new SettingVal('AllowDownloadsDuringGameplay', 'boolean')
  this.streamingThrottleEnabled = new SettingVal('StreamingThrottleEnabled', 'boolean')
  this.clientBrowserAuth = new SettingVal('ClientBrowserAuth', 'boolean')
  this.musicVolume = new SettingVal('MusicVolume', 'range', [0, 100])
  this.crawlSteamInstallFolders = new SettingVal('CrawlSteamInstallFolders', 'boolean')
  this.crawlAtStartup = new SettingVal('CrawlAtStartup', 'boolean')
  this.pauseOnVoiceChat = new SettingVal('PauseOnVoiceChat', 'boolean')
  this.playlistNowPlayingNotification = new SettingVal('PlaylistNowPlayingNotification', 'boolean')
  this.musicPlayerVisible = new SettingVal('MusicPlayerVisible', 'boolean')
}

function SettingVal (n, t, l) {
  this.sName = n
  this.sType = t
  this.limits = l || []
}

/**
*
*/
const languages = [
  'bulgarian', 'czech', 'danish', 'dutch', 'english', 'finnish', 'french', 'german',
  'greek', 'hungarian', 'italian', 'japanese', 'koreana', 'norwegian', 'polish',
  'portuguese', 'russian', 'romanian', 'spanish', 'swedish', 'thai', 'turkish',
  'ukrainian', 'brazilian', // Portuguese-Brazil
  'schinese', // Simplified Chinese
  'tchinese' // Traditional Chinese
]

exports = {
  SteamSettings
}

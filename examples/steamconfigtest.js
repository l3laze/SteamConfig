const SteamConfig = require('../src/steamconfig.js').SteamConfig
const paths = require('../src/steamconfig.js').SteamPaths
const path = require('path')

let sc = new SteamConfig()
let requestGenres = require('../steamdata-utils.js').requestGenres
let requestOwnedApps = require('../steamdata-utils.js').requestOwnedApps
let requestTags = require('../steamdata-utils.js').requestTags

async function testRequests () {
  console.info(`HL2 genres (Action): ${await requestGenres(220, false, {enabled: true, folder: path.join(__dirname, 'cache')})}`)
  console.info(`PD2 genres (Action, RPG): ${await requestGenres('218620', false, {enabled: true, folder: path.join(__dirname, 'cache')})}`)

  console.info(`${(await requestTags(false, {enabled: true, folder: path.join(__dirname, 'cache')})).length} tags`)
}

async function run () {
  try {
    await testRequests()

    sc.setRoot(sc.detectRoot())
    sc.appendToApps = true
    await sc.load(paths.loginusers)
    sc.setUser('l3l_aze')
    await sc.load(paths.all)
    await sc.load(sc.libraries.map(function mapLibs (lib) { return ['library', lib + '/steamapps'] }))

    sc.user.owned = await requestOwnedApps(sc.user.id64, false, {enabled: true, folder: path.join(__dirname, 'cache')})

    if (sc.user.accountName === 'batman') {
      logInfo()
    } else {
      console.info(sc.logData('string'))
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()

function logInfo () {
  let skin = sc.registry.Registry.HKCU.Software.Valve.Steam.SkinV4
  skin = (skin !== '' ? skin : 'Default')
  console.info(`Root:\t\t\t${sc.rootPath}\nUsers:\t\t\t${Object.keys(sc.loginusers.users).length}`)
  console.info(`Current User:\t\t${sc.user.accountName}\nSkins:\t\t\t${sc.skins.length}\nCurrent Skin:\t\t${skin}`)
  console.info(`Libraries:\t\t${sc.libraries.length} + default`)
  console.info(`Shortcuts:\t\t${sc.shortcuts.shortcuts.length}`)
  console.info(`Installed Apps:\t\t${sc.steamapps.length}`)
  console.info(`Owned Apps:\t\t${sc.user.owned.length}`)
  console.info(`Categorized Apps:\t${Object.values(
      sc.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps
    ).filter(item => item.tags || item.Hidden).length}`)
  console.info(`App Status:\t\tPlayable  Update  Installing  Useless`)
  let apps = {
    okay: sc.steamapps.filter(item => {
      if (item.AppState.StateFlags === '4') {
        return item
      }
    }),
    update: sc.steamapps.filter(item => {
      if (item.AppState.StateFlags === '6') {
        return item
      }
    }),
    installing: sc.steamapps.filter(item => {
      if (item.AppState.StateFlags === '1026' || item.AppState.StateFlags === '1542') {
        return item
      }
    }),
    useless: sc.steamapps.filter(item => {
      if (item.AppState.StateFlags !== '4' && item.AppState.StateFlags !== '6' && item.AppState.StateFlags !== '1542' && item.AppState.StateFlags !== '1026') {
        return item
      }
    })
  }
  console.info(`\t\t\t   ${apps.okay.length}\t    ${apps.update.length}\t     ${apps.installing.length}\t\t${apps.useless.length}`)
  console.info(`Appinfo Entries:\t${sc.appinfo.length}`)
  console.info(`Packageinfo Entries:\t${sc.packageinfo.length}`)
  let badRE = /[^A-Za-z0-9]/
  let badKey
  let keys
  let wasBad = {}
  let tmp
  let filtered = sc.packageinfo.map(item => { // eslint-disable-line no-unused-vars
    keys = Object.keys(item)
    badKey = keys.filter(key => badRE.test(key))[ 0 ] || undefined

    if (badKey !== undefined) {
      tmp = item
      delete tmp[ badKey ]

      tmp = {
        [`${tmp.packageid}`]: tmp
      }

      wasBad[ item.packageid ] = item
      return tmp
    } else {
      return item
    }
  })
  console.info(`${Object.keys(wasBad).length} packageinfo entries were improperly parsed -- fixed..`)
  // console.info(filtered)
}

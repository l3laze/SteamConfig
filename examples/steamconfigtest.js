const SteamConfig = require('../src/steamconfig.js').SteamConfig
const paths = require('../src/steamconfig.js').SteamPaths

let sc = new SteamConfig()

async function run () {
  try {
    sc.rootPath = sc.detectRoot()
    sc.appendToApps = true
    await sc.load(paths.all)
    await sc.load(sc.libraries.map(function mapLibs(lib) { return ['library', lib + '/steamapps'] }))
    let skin = sc.registry.Registry.HKCU.Software.Valve.Steam.SkinV4
    skin = (skin !== '' ? skin : 'Default')

    // await sc.requestOwnedApps(false)

    console.info(`Root:\t\t\t${sc.rootPath}\nUsers:\t\t\t${Object.keys(sc.loginusers.users).length}`)
    console.info(`Current User:\t\t${sc.user.accountName}\nSkins:\t\t\t${sc.skins.length}\nCurrent Skin:\t\t${skin}`)
    console.info(`Libraries:\t\t${sc.libraries.length} + default`)
    console.info(`Installed Apps:\t\t${sc.steamapps.length}\nShortcuts:\t\t${sc.shortcuts.shortcuts.length}`)
    // console.info(`Owned Apps:\t${sc.user.owned.length}`)
    console.info(`Categorized Apps:\t${Object.values(
        sc.sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps
      ).filter(item =>item.tags || item.Hidden).length}`)
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

  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()

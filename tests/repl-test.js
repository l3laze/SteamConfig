/*
 * THIS IS NOT A TEST SCRIPT
 * It is meant to be pasted in the SteamConfig REPL after using the special '.editor' command.
 */

const path = require('path');

(async function () {
  const apps = await SteamConfig.requestOwnedApps('76561198067577712') // eslint-disable-line
  console.info(`Owned apps: ${apps.length}`)
  const storeData = []
  let a

  for (a of apps) {
    a = SteamConfig.requestStoreData(a) // eslint-disable-line
    storeData.push(a)
  }

  await Promise.all(storeData)

  require('fs').writeFileSync(path.join('./', 'requirements.html'))
}())

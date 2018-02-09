

<!-- Start steampaths.js -->

Author: Tom <l3l&#95;aze&#64;yahoo&#46;com>

## SteamPaths

A set of strings representing the Steam configuration files SteamConfig can handle.

### Properties:

* **String** *all* - All of the files. Handled specially by {@link SteamConfig#load}
* **String** *appinfo* - appinfo => /appcache/appinfo.vdf
* **String** *config* - config => /config/config.vdf
* **String** *libraryfolders* - libraryfolders => /steamapps/libraryfolders.vdf
* **String** *localconfig* - localconfig => /userdata/{accountId}/config/localconfig.vdf
* **String** *packageinfo* - packageinfo => /appcache/packageinfo.vdf
* **String** *registry* - registry => ../registry.vdf on Linux, /registry.vdf on Mac or winreg on Windows.
* **String** *shortcuts* - shortcuts => /userdata/{accountId}/config/shortcuts.vdf
* **String** *sharedconfig* - sharedconfig => userdata/{accountId}/7/remote/sharedconfig.vdf
* **String** *skins* - skins => skins/ on Linux or Winows, /Steam.AppBundle/Steam/Contents/MacOS/skins on Mac.
* **String** *steamapps* - steamapps => /steamapps/
* **String** *library* - library => {aSteamLibraryFolder}/steamapps/

<!-- End steampaths.js -->


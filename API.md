

<!-- Start steamconfig.js -->

Author: Tom <l3l&#95;aze&#64;yahoo&#46;com>

## SteamConfig

### Properties:

* **Path** *rootPath* - The root of the Steam installation.
* **Object** *user* - Current user.
* **Array** *libraries* - A Path-type entry for each of the non-default Steam Library Folders of the Steam installation.
* **Boolean** *appendToApps* - Whether to append apps or destroy the old data each time a single steamapps folder is loaded.
* **Boolean** *cacheEnabled* - The current cache setting. Enabled = true, disabled = false.
* **Path** *cacheFolder* - Path to use for the cache folder.
* **Object** *appinfo* - Steam/appcache/appinfo.vdf.
* **Object** *config* - Steam/config/config.vdf.
* **Object** *libraryfolders* - Steam/steamapps/libraryfolders.vdf.
* **Object** *localconfig* - Steam/userdata/{user.accountId}.localconfig.vdf as an object.
* **Object** *loginusers* - Steam/config/loginusers.vdf as an object.
* **Object** *packageinfo* - Steam/appcache/packageinfo.vdf as an object.
* **Object** *registry* - Platform-specific: On Linux/Mac: registry.vdf as an object. On Windows: Registry as an object.
* **Object** *shortcuts* - Steam/userdata/{this.user.accountId}/config/shortcuts.vdf as an object.
* **Object** *sharedconfig* - Steam/userdata/{this.user.accountId}/7/remote/sharedconfig.vdf as an object.
* **Array** *skins* - Platform-specific skins folder entries (that are skins) as an array.
* **Array** *steamapps* - The appmanifest files of Steam/steamapps as an array.

## load()

Load a Steam file by name.

## detectRoot()

Attempt to detect the root installation path based on platform-specific default installation locations.

## detectUser()

Attempt to detect the current user based on `Registry.HKCU.Software.Valve.Steam.AutoLoginUser`.

## getPath()

Get the path to a named Steam file.

### Return:

* **Path** - The path to the file.

## requestOwnedApps(force)

Request a user's list of owned apps from the internet.

### Params:

* *force* {boolean} - Force request to get a new copy instead of using a cached copy.

## requestTags(force)

Request a list of the popular tags from the internet.

### Params:

* *force* {boolean} - Force request to get a new copy instead of using a cached copy.

## logData()

Get a log of a sample of the data that exists.

<!-- End steamconfig.js -->


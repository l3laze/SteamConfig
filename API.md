

<!-- Start src/steamconfig.js -->

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

## `async`  load(names)

Load a Steam file/path by name, including storing the data in it's place on this instance of SteamConfig.
 Pre-processes arguments using the internal function [prepareFileNames](global.html#prepareFileNames) to ensure proper load order.
 The internal function [afterLoad](global.html#afterLoad) is run on each file after it's been loaded to automatically
   handle loading some data such as the locations of non-default Steam Library Folders in the file `libraryfolers.vdf`.

See: [SteamPaths](global.html#SteamPaths), [prepareFileNames](#~prepareFileNames)

### Params:

* **String|Array** *names* - A string for a single file/path, or an array for a collection of files/paths or the special 'library' entries for non-default Steam Library Folders which will be an entry like `['library', {path}]`.

## detectRoot()

Attempt to detect the root installation path based on platform-specific default installation locations.

### Return:

* **Path** - The detected path, or null if the default path is not found.

## detectUser()

Attempt to detect the current user based on `Registry.HKCU.Software.Valve.Steam.AutoLoginUser`.

### Return:

* **Object** - The detected user, or null if none is found.

## getPath(name)

Get the path to a named Steam file.

### Params:

* **String** *name* - The name of a known Steam configuration file/path, as per [SteamPaths](global.html#SteamPaths)

### Return:

* **Path** - The path to the file., or null

## `async`  requestOwnedApps(force)

Request the current user's list of owned apps from the internet.

### Params:

* **Boolean** *force* - Force to get a new copy instead of loading cached copy.

## `async`  requestTags(force)

Request a list of the popular tags from the internet.

### Params:

* **Boolean** *force* - Force request to get a new copy instead of using a cached copy.

### Return:

* **Array** - An Array of Strings that represents the popular tags on Steam.

## logData()

Get a log of a sample of the data that exists.

## `async`  loadApps(library)

Internal method to load app data from a library folder.

### Params:

* **Path** *library* - The path to the library to load the appmanifest_\###.acf files from.

### Return:

* **Array** - The app data as an Array of Objects.

## `async`  loadSkins(folder)

Internal method to load skin names.

### Params:

* **Path** *folder* - The folder to get the skin names from.

### Return:

* **Array** - The names of the skins as an Array of Strings.

## prepareFileNames(names)

Internal function to properly organize names array so that user-specific data is loaded last.

### Params:

* **Array** *names* - The Array of String|Array entries that [load](module-SteamConfig-SteamConfig.html#load) was called with.

### Return:

* **Array** - The names Array, after organization.

## getAccountIdFromId64(id64)

Internal function to get a user's account ID from their SteamID 64.

### Params:

* **String** *id64* - The SteamID64 of the user to calculte the Steam3:accountId of.

### Return:

* **String** - The accountId of the user.

## afterLoad(sc, name)

Internal function to do some special handling after loading specific files.
So far it only handles "libraryfolders" by setting sc.libraries to the list of entries.

### Params:

* **SteamConfig** *sc* - An instance of SteamConfig.
* **String** *name* - The name of the file that was loaded without the extension (as from [SteamPaths](module-SteamPaths.html).

## SteamPaths

A set of strings representing the Steam configuration files SteamConfig can handle.

### Properties:

* **String** *all* - All of the files. Handled specially by [load](SteamConfig#load)
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

<!-- End src/steamconfig.js -->


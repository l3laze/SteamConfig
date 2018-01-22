# API


----


[detectPath](#detectpath)

[detectUser](#detectuser)

[loadAppinfo](#loadappinfo)

[loadConfig](#loadconfig)

[loadLibraryfolders](#loadlibraryfolders)

[loadLocalConfig](#loadlocalconfig)

[loadLoginusers](#loadloginusers)

[loadRegistry](#loadregistry)

[loadSharedconfig](#loadsharedconfig)

[loadShortcuts](#loadshortcuts)

[loadSteamapps](#loadsteamapps)

[saveRegistry](#saveregistry)

[saveTextVDF](#savetextvdf)

[setInstallPath](#setinstallpath)

[setUser](#setuser)


----


# detectPath

Detect the default path to Steam for the current platform.

##### returns {`string`}

The detected path.

##### throws {`error`}

* If the current platform is not supported, or if the default path does not exist or is not accessible.


----


# detectUser

Detect the current user set in the Steam configuration, or if none is set and there is only one user associated with this account return that user.

##### returns {`string`}

The detected user.

##### throws {`error`}

If the path to Steam is not set, if registry has not been loaded, if loginusers have not been loaded, or if there are no users associated with the Steam installation.


----


# loadAppinfo

Load the file `appinfo.vdf` into the `appinfo` property of an instance of `SteamConfig`.

##### throws {`error`}

* If `appinfo.vdf` or the path to it in the current Steam installation does not exist, or the path is not accessible, or if the `node-binary-vdf` parser has a problem with the file.


----


# loadConfig

Load the file `config.vdf` into the `config` property of an instance of `SteamConfig`.

##### throws {`error`}

* If `config.vdf` or the path to it in the current Steam installation does not exist, or the path is not accessible, or if the `simple-vdf2` (text VDF) parser has a problem with the file.


----


# loadLibraryfolders

Load the file `libraryfolders.vdf` into the `libraryfolders` property of an instance of `SteamConfig`.

##### throws {`error`}

* If `libraryfolders.vdf` or the path to it in the current Steam installation does not exist, or the path is not accessible, or if the `simple-vdf2` (text VDF) parser has a problem with the file.


----


# loadLocalconfig

Load the file `localconfig.vdf` into the `localconfig` property of an instance of `SteamConfig`.

##### throws {`error`}

* If `localconfig.vdf` or the path to it in the current Steam installation does not exist, or the path is not accessible, or if the `simple-vdf2` (text VDF) parser has a problem with the file.


----


# loadLoginusers

Load the file `loginusers.vdf` into the `loginusers` property of an instance of `SteamConfig`.

##### throws {`error`}

* If `loginusers.vdf` or the path to it in the current Steam installation does not exist, or the path is not accessible, or if the `simple-vdf2` (text VDF) parser has a problem with the file.


----


# loadRegistry

Loads the file `registry.vdf` into the `registry` property of an instance of `SteamConfig` on `Mac` or `Linux`. Loads the registry into the `registry` property of an instance of `SteamConfig` on `Windows` emulating the same style as on Mac/Windows.

##### throws {`error`}

* If `registry.vdf` or the path to it in the current Steam installation does not exist, or the path is not accessible, or if the `simple-vdf2` (text VDF) parser has a problem with the file, or if `rage-edit` has a problem with the `Windows` registry.


----


# loadSharedconfig

Load the file `sharedconfig.vdf` into the `sharedconfig` property of an instance of `SteamConfig`.

##### throws {`error`}

* If `sharedconfig.vdf` or the path to it in the current Steam installation does not exist, or the path is not accessible, or if the `simple-vdf2` (text VDF) parser has a problem with the file.


----


# loadShortcuts

Load the file `shortcuts.vdf` into the `shortcuts` property of an instance of `SteamConfig`.

##### throws {`error`}

* If the path to `shortcuts.vdf` in the current Steam installation does not exist (but not if the file `shortcuts.vdf` does not exist; that just means a user has not added any non-Steam apps), or the path is not accessible, or if the `steam-shortcut-editor` (binary VDF) parser has a problem with the file.


----


# loadSteamapps

Load the `appmanifest_#.acf` file's from the `steamapps` folder, and any additional `Steam Library Folders` listed in `libraryfolders.vdf`. Stores the result in the `steamapps` property of this instance of `SteamConfig`.

##### throws {`error`}

* If the path to `steamapps` in the current Steam installation does not exist (but not if any additional `Steam Library Folders` from `libraryfolders.vdf` do not exist, as they may be on an external device that's not attached), or the path is not accessible, or if the `simple-vdf2` (text VDF) parser has a problem with any of the `appmanifest_#.acf` files..


----


# saveRegistry

Save the registry; automatically handles saving to the Windows registry or saving the file registry.vdf (Linux, Mac) based on platform.

##### throws {`error`}

* If fs.writeFileAsync has an issue saving registry.vdf, or if rage-edit has an issue with the Windows registry.


----


# saveTextVDF

`(filePath, data)`

Save data as a text VDF file.

`filePath`: The path to save the data to, including the file name.

`data`: The data to save, as an object (e.g. the `registry` property of an instance of `SteamConfig`)

##### throws {`error`}

* If part of `filePath` does not exist or is not accessible, or if `simple-vdf2.stringify(data)` has a problem with the `data`.
* If any arguments are of an invalid type.


----


# setInstallPath

`(dir)`

The path to the Steam installation.

`dir`: The path to save the data to, including the file name.

##### throws {`error`}

* If the path to `dir` does not exist, or the path is not accessible.
* If any arguments are of an invalid type.


----

# setUser

`(toUser)`

Set the user for this instance of `SteamConfig` to `toUser`.

##### throws {`error`}

* If `toUser` can not be found as a user, or if `loginusers` has not been loaded.
* If any arguments are of an invalid type.

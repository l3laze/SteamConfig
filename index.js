const BB = require( 'bluebird').Promise;
const fs = BB.promisifyAll( require( 'fs' ));
const path = require( 'path' );
const VDF = require( 'simple-vdf2' );
const BVDF = require( './mybinvdf.js' );
const SVDF = BB.promisifyAll( require( 'steam-shortcut-editor' ));

function SteamConfig( options ) {
  this.loc = null;
  this.user = null;
  this.nondefaultLibraryfolders = null;

  this.registry = null;
  this.config = null;
  this.loginusers = null;
  this.libraryfolders = null;
  this.steamapps = null;
  this.userdata = null;
  this.appinfo = null;
  this.packageinfo = null;
  this.sharedconfig = null;
  this.localconfig = null;
  this.shortcuts = null;
}

async function loadTextVDF( filePath ) {
  if( filePath === null ) {
    throw new Error( `null "filePath" for loadTextVDF.` );
  }
  else if( ! fs.existsSync( filePath )) {
    throw new Error( `Couldn't find ${ filePath } to load as text VDF (ENOENT).` );
  }
  else {
    var data = "" + await fs.readFileAsync( filePath );
    return VDF.parse( data );
  }
}

async function saveTextVDF( filePath, data ) {
  if( filePath === null ) {
    throw new Error( `null "filePath" for saveTextVDF.` );
  }
  else if( ! fs.existsSync( filePath )) {
    throw new Error( `Couldn't find ${ filePath } to save as text VDF (ENOENT).` );
  }
  else {
    fs.writeFileAsync( filePath, VDF.stringify( data, true ));
  }
}

async function loadBinaryVDF( filePath, btype ) {
  var data;
  if( filePath === null ) {
    throw new Error( `null "filePath" for loadBinaryVDF.` );
  }
  else if( ! fs.existsSync( filePath )) {
    throw new Error( `Couldn't find ${ filePath } to load as binary VDF (ENOENT).` );
  }
  else if( btype === null ) {
    throw new Error( `null btype for loadBinaryVDF.` );
  }
  else if( btype !== "appinfo" && btype !== "packageinfo" && btype !== "shortcuts" ) {
    throw new Error( `The format ${ btype } is unknown.` );
  }
  else if( btype !== "appinfo" && btype !== "shortcuts" ) {
    throw new Error( `The format ${ btype } is not currently supported.` );
  }
  else {
    data = await fs.readFileAsync( filePath );
    if( btype === "appinfo" ) {
      return BVDF.readAppInfo( data );
    }
    else if ( btype === "shortcuts" ) {
      return await SVDF.parseFileAsync( filePath, { autoConvertArrays: true, autoConvertBooleans: true, dateProperties: [ 'LastPlayTime' ]});
    }
  }
}

SteamConfig.prototype.setInstallPath = function setInstallPath( dir ) {
  if( dir === null ) {
    throw new Error( "No directory defined for install path." );
  }
  else if( ! fs.existsSync( dir )) {
    throw new Error( `Couldn't find ${ dir } (ENOENT).` );
  }
  else {
    this.loc = "" + dir;
  }
};

SteamConfig.prototype.loadRegistryLM = async function loadRegistryLM() {
  var filePath = path.join( this.loc, "registry.vdf" );

  try {
    data = await loadTextVDF( filePath );
    this.registry = data;
  }
  catch( err ) {
    if( err.code === "ENOENT" ) {
      throw new Error( `Cant find ${ filePath }!` );
    }
    else if( err.code === "EACCES" ) {
      throw new Error( `Can't access ${ filePath }!` );
    }
    else if( err.code === "EMFILE" ) {
      throw new Error( `Too many files open on system!` );
    }
    else {
      throw new Error( err.message );
    }
  }
};

SteamConfig.prototype.loadAppinfo = async function loadAppinfo() {
  var filePath = path.join( this.loc, "appcache", "appinfo.vdf" );

  try {
    this.appinfo = await loadBinaryVDF( filePath, "appinfo" );
  }
  catch( err ) {
    if( err.code === "ENOENT" ) {
      throw new Error( `Can't find ${ filePath }! ` );
    }
    else if( err.code === "EACCES" ) {
      throw new Error( `Can't access ${ filePath }!` );
    }
    else if( err.code === "EMFILE" ) {
      throw new Error( `[ERROR]: Too many files open on system!` );
    }
    else {
      throw new Error( err.message );
    }
  }
};

SteamConfig.prototype.loadPackageinfo = async function loadPackageinfo() {
  var filePath = path.join( this.loc, "appcache", "packageinfo.vdf" );

  try {
    this.packageinfo = await loadBinaryVDF( filePath );
  }
  catch( err ) {
    if( err.code === "ENOENT" ) {
      throw new Error( `Can't find ${ filePath }!` );
    }
    else if( err.code === "EACCES" ) {
      throw new Error( `Can't access ${ filePath } ` );
    }
    else if( err.code === "EMFILE" ) {
      throw new Error( `Too many files open on system!` )
    }
    else {
      throw new Error( err.message );
    }
  }
}

SteamConfig.prototype.loadConfig = async function loadConfig() {
  var filePath = path.join( this.loc, "config", "config.vdf" );

  try {
    this.config = await loadTextVDF( filePath );
  }
  catch( err ) {
    if( err.code === "ENOENT" ) {
      throw new Error( `Can't find ${ filePath }!` );
    }
    else if( err.code === "EACCES" ) {
      throw new Error( `Can't access ${ filePath } ` );
    }
    else if( err.code === "EMFILE" ) {
      throw new Error( `Too many files open on system!` )
    }
    else {
      throw new Error( err.message );
    }
  }
}

SteamConfig.prototype.loadLoginusers = async function loadLoginusers() {
  var filePath = path.join( this.loc, "config", "loginusers.vdf" );

  try {
    this.loginusers = await loadTextVDF( filePath );
  }
  catch( err ) {
    if( err.code === "ENOENT" ) {
      throw new Error( `Can't find ${ filePath }!` );
    }
    else if( err.code === "EACCES" ) {
      throw new Error( `Can't access ${ filePath } ` );
    }
    else if( err.code === "EMFILE" ) {
      throw new Error( `Too many files open on system!` )
    }
    else {
      throw new Error( err.message );
    }
  }
}

SteamConfig.prototype.loadLibraryfolders = async function loadLibraryfolders() {
  var filePath = path.join( this.loc, "steamapps", "libraryfolders.vdf" );

  try {
    this.libraryfolders = await loadTextVDF( filePath );

    this.nondefaultLibraryfolders = [];

    var libs = Object.keys( this.libraryfolders.LibraryFolders );

    for( i = 0; i < libs.length; i++ ) {
      if( libs[ i ] !== "TimeNextStatsReport" && libs[ i ] !== "ContentStatsID" ) {
        this.nondefaultLibraryfolders.push( libs[ i ]);
      }
    }
  }
  catch( err ) {
    if( err.code === "ENOENT" ) {
      throw new Error( `Can't find ${ filePath }!` );
    }
    else if( err.code === "EACCES" ) {
      throw new Error( `Can't access ${ filePath } ` );
    }
    else if( err.code === "EMFILE" ) {
      throw new Error( `Too many files open on system!` )
    }
    else {
      throw new Error( err.message );
    }
  }
}

SteamConfig.prototype.loadSteamapps = async function loadSteamapps() {
  var filePath = path.join( this.loc, "steamapps" ),
      apps;

  try {
    var files = await fs.readdirAsync( filePath );
    apps = [];

    for( f in files ) {
      if( path.extname( files[ f ]) === ".acf" ) {
        apps.push( await loadTextVDF( path.join( filePath, files[ f ])));
      }
    }

    this.steamapps = apps;
  }
  catch( err ) {
    if( err.code === "ENOENT" ) {
      throw new Error( `Can't find ${ filePath }!` );
    }
    else if( err.code === "EACCES" ) {
      throw new Error( `Can't access ${ filePath } ` );
    }
    else if( err.code === "EMFILE" ) {
      throw new Error( `Too many files open on system!` )
    }
    else {
      throw new Error( err.message );
    }
  }
}

SteamConfig.prototype.loadSharedconfig = async function loadSharedconfig() {
  var filePath = path.join( this.loc, "userdata", this.user.accountID, "7", "remote", "sharedconfig.vdf" );

  try {
    this.sharedconfig = await loadTextVDF( filePath );
  }
  catch( err ) {
    if( err.code === "ENOENT" ) {
      throw new Error( `Can't find ${ filePath }!` );
    }
    else if( err.code === "EACCES" ) {
      throw new Error( `Can't access ${ filePath } ` );
    }
    else if( err.code === "EMFILE" ) {
      throw new Error( `Too many files open on system!` )
    }
    else {
      throw new Error( err.message );
    }
  }
};

SteamConfig.prototype.loadLocalconfig = async function loadLocalconfig() {
  var filePath = path.join( this.loc, "userdata", this.user.accountID, "config", "localconfig.vdf" );

  try {
    this.localconfig = await loadTextVDF( filePath );
  }
  catch( err ) {
    if( err.code === "ENOENT" ) {
      throw new Error( `Can't find ${ filePath }!` );
    }
    else if( err.code === "EACCES" ) {
      throw new Error( `Can't access ${ filePath } ` );
    }
    else if( err.code === "EMFILE" ) {
      throw new Error( `Too many files open on system!` )
    }
    else {
      throw new Error( err.message );
    }
  }
};

SteamConfig.prototype.loadShortcuts = async function loadShortcuts() {
  var filePath = path.join( this.loc, "userdata", this.user.accountID, "config", "shortcuts.vdf" );

  try {
    this.shortcuts = await loadBinaryVDF( filePath, "shortcuts" );
  }
  catch( err ) {
    if( err.code === "ENOENT" ) {
      throw new Error( `Can't find ${ filePath }!` );
    }
    else if( err.code === "EACCES" ) {
      throw new Error( `Can't access ${ filePath } ` );
    }
    else if( err.code === "EMFILE" ) {
      throw new Error( `Too many files open on system!` )
    }
    else {
      throw new Error( err.message );
    }
  }

};

module.exports = SteamConfig;

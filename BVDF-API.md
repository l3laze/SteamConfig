

<!-- Start bvdf.js -->

Author: Tom <l3l&#95;aze&#64;yahoo&#46;com>

## Type

### Properties:

* **Number** *None* - No type/start of table/end of data value.
* **Number** *String* - Null-terminated string value.
* **Number** *Int32* - A 32-bit int value.
* **Number** *Float32* - A 32-bit float value.
* **Number** *WideString* - A null-terminated string value (should be double-null?)
* **Number** *Color* - An RGB color as a 32-bit int value.
* **Number** *UInt64* - A 64-bit int value.
* **Number** *End* - End of table/end of data value.

## parseAppInfo(data)

Parse the data of appinfo.vdf.

### Params:

* **String|Buffer** *data* - The file data to parse.

### Return:

* **Array** - An array of appinfo entries as anonymous Objects.

## parsePackageInfo(data)

Parse the data of packageinfo.vdf.

### Params:

* **String|Buffer** *data* - The file data to parse.

### Return:

* **Array** - An array of packageinfo entries as anonymous Objects.

## parseShortcuts(data)

Parse the data of shortcuts.vdf. Auto-converts some data to timestamps/arrays/etc.

### Params:

* **String|Buffer** *data* - The file data to parse.

### Return:

* **Array** - An array of shortcut entries as anonymous Objects.

## decode(data)

Parse the binary VDF data of buffer.

### Params:

* **ByteBuffer** *data* - The data to parse.

### Return:

* **Object** - The parsed data as a JS object.

## convertData(data, conversion)

Convert parts of data to another type/value -- Timestamp, Boolean, Array, etc.

### Params:

* **String|Buffer** *data* - The file data to parse.
* **DataConversion** *conversion* - The conversions to apply to data.

### Return:

* **Array** - An array of appinfo entries as anonymous Objects.

## parseAppInfo

### Properties:

* **Array** *booleans* - The names of some boolean values to convert.
* **Array** *timestamps* - The names of some timestamp values to convert.
* **Array** *arrays* - The names of some arrays to convert.

<!-- End bvdf.js -->


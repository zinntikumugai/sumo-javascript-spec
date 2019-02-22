// Sumo version 1 specification for javascript
//
// Libraries installed:
//   npm install pako
//   npm install text-encoding
//   npm install punycode
//
//   $ node -v
//   v11.10.0
//
//   $ npm list
//   ├── pako@1.0.8
//   ├── punycode@2.1.1
//   └── text-encoding@0.7.0

sumoHeader = "S";
noCompression = "0";
withGzipCompression = "1";

var pako = require('pako');
var punycode = require('punycode');
var textEncoding = require('text-encoding');
var TextEncoder = textEncoding.TextEncoder;
var TextDecoder = textEncoding.TextDecoder;

function toPuny (s) {
  output = punycode.encode(s);
  return output;
}

function fromPuny (s) {
  output = punycode.decode(s);
  return output;
}

function bLength (b) {
  output = b.length;
  return output;
}

function fromGzip (x) {
  var output = pako.inflate(x);
  return output;
}

function toGzip (x) {
  var output = pako.gzip(x);
  return output;
}

function uint8arrayToString (uint8s) {
  var output = new TextDecoder("utf-8").decode(uint8s);
  return output;
}

function stringToUint8array (string) {
  var output = new TextEncoder("utf-8").encode(string);
  return output;
}

function toHex(byteArray) {
  return Array.prototype.map.call(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function fromHex(hexString) {
  var result = [];
  while (hexString.length >= 2) {
    result.push(parseInt(hexString.substring(0, 2), 16));
    hexString = hexString.substring(2, hexString.length);
  }
  var output = new Uint8Array(result);
  return output;
}

function verifySumoHeader (s) {
  var sHeader = s.substring(0,2);
  if (sHeader == (sumoHeader.concat(noCompression))) {
    return true;
  } else if (sHeader == (sumoHeader.concat(withGzipCompression))) {
    return true;
  } else {
    return false;
  }
}

function removeSumoHeader (s) {
  output = s.substring(2);
  return output;
}

function sconcat (x, y) {
  o=x.concat(y);
  return o;
}

function noCompress (x) {
  d = [sumoHeader, noCompression, x].reduce(sconcat,"");
  p = toPuny(d);
  o = toHex(stringToUint8array(p));
  return o;
}

function compressGzip (x){
  var d = [sumoHeader, withGzipCompression, x].reduce(sconcat,"");
  var o = toHex (toGzip (toPuny (d)));
  return o;
}

function removeNonAscii (x){
  output = x.replace(/[^\x00-\x7F]/g, "");
  return output;
}

function fromHexToText (x){
  h = String(removeNonAscii(uint8arrayToString(fromHex(x))));
  p = fromPuny(h); 
  return p;
}

function fromGzipHexToText (x) {
  h = fromPuny (uint8arrayToString (fromGzip( fromHex (x))));
  return h;
}

function toSumo (x) {
  uncompressedX = noCompress (x);
  compressedX   = compressGzip (x);
  cL = bLength(compressedX);   // compressed length
  uL = bLength(uncompressedX); // uncompressed length
  if (cL < uL){
    return compressedX;
  } else {
    return uncompressedX;
  }
}

function fromSumo (x) {
  var output = "";
  try {
    output = fromHexToText (x);
  }
  catch(err) {
    try {
      output = fromGzipHexToText(x);
    }
    catch (err) {
      console.log("Could not decode SUMO", err);
    }
  }
  return output;
}

var input = "こんにちは";
console.log("Example of a short (uncompressable) string:", input);
e = toSumo (input);
console.log("Data encoded with SUMO:", e);
d = fromSumo(e);
console.log("Data decoded from SUMO:", d);
console.log("");


var input = "こんにちはこんにちはこんにちはこんにちはこんにちはこんにちはこんにちはこんにちはこんにちは";
console.log("Example of a long (compressable) string:", input);
e = toSumo (input);
console.log("Data encoded with SUMO:", e);
d = fromSumo(e);
console.log("Data decoded from SUMO:", d);
console.log("");

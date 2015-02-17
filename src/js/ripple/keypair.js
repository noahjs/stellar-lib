var sjcl = require('./utils').sjcl;

var UInt160 = require('./uint160').UInt160;
var UInt256 = require('./uint256').UInt256;
var Base    = require('./base').Base;
var Crypt   = require('./crypt.js').Crypt;

try {
  var sodium = require('sodium');
  var USE_SODIUM = true;
} catch(e) {
  var tnacl = require('tweetnacl');
  var USE_SODIUM = false;
}


/**
 * Creates an ED25519 key pair for signing.
 *
 * @param {object} naclSigningKeys
 * @constructor
 */
function KeyPair() {

}

KeyPair.from_seed_bytes_NACL = function(seed_bytes) {
  var keys = tnacl.sign.keyPair.fromSeed(new Uint8Array(seed_bytes));

  var result = new KeyPair();
  result._secret = keys.secretKey;
  result._pubkey = keys.publicKey;
  return result;
}

KeyPair.from_seed_bytes_SODIUM = function(seed_bytes){
  var seed_bits  = sjcl.codec.bytes.toBits(seed_bytes);
  var seed_hex = sjcl.codec.hex.fromBits(seed_bits);

  var keys = new sodium.Key.Sign.fromSeed( seed_hex, 'hex');
  keys.setEncoding('hex');

  var result = new KeyPair();
  result._secret = hex_to_Uint8Array( keys.secretKey.toString('hex') );
  result._pubkey = hex_to_Uint8Array( keys.publicKey.toString('hex') );

  return result;
}

KeyPair.from_seed_bytes = function(bytes) {
  if( USE_SODIUM ){
    return KeyPair.from_seed_bytes_SODIUM(bytes);
  }else{
    return KeyPair.from_seed_bytes_NACL(bytes);
  }
}

/**
 * Returns public key as a byte array.
 *
 * @private
 */
KeyPair.prototype._pub = function() {
  return this._pubkey;
};

/**
 * Returns public key in compressed format as bit array.
 *
 * @private
 */
KeyPair.prototype._pub_bits = function() {
  var pub = this._pub();

  if (!pub) {
    return null;
  }

  return sjcl.codec.bytes.toBits(pub);
};

/**
 * Returns public key as hex.
 *
 */
KeyPair.prototype.to_hex_pub = function() {
  var bits = this._pub_bits();

  if (!bits) {
    return null;
  }

  return sjcl.codec.hex.fromBits(bits).toUpperCase();
};

function SHA256_RIPEMD160(bits) {
  return Crypt.ripemd160(sjcl.hash.sha256.hash(bits));
}

KeyPair.prototype.get_address = function() {
  var bits = this._pub_bits();

  if (!bits) {
    return null;
  }

  var hash = SHA256_RIPEMD160(bits);

  var address = UInt160.from_bits(hash);
  address.set_version(Base.VER_ACCOUNT_ID);
  return address;
};

KeyPair.sign_NACL = function(hash, secret) {
  var hash_hex = UInt256.from_json(hash).to_hex();

  var sig = tnacl.sign(hex_to_Uint8Array(hash_hex), secret);
  var sig_hex = new Buffer(sig).toString('hex');

  var signed_bits = sjcl.codec.hex.toBits(sig_hex);
  return signed_bits;
}

KeyPair.sign_SODIUM = function(hash, secret) {
  var hash_hex = UInt256.from_json(hash).to_hex();

  // Secret
  var sec_hex   = Uint8Array_to_hex( secret ).slice(0, 64)

  var key = new sodium.Key.Sign.fromSeed(sec_hex, 'hex');
  var signer = new sodium.Sign(key);
  var sig = signer.sign(hash_hex, 'hex');
  var sig_hex = sig.sign.slice(0, 64).toString('hex');

  var signed_bits = sjcl.codec.hex.toBits(sig_hex);
  return signed_bits;
}

KeyPair.prototype.sign = function(hash) {
  if( USE_SODIUM ){
    return KeyPair.sign_SODIUM(hash, this._secret);
  }else{
    return KeyPair.sign_NACL(hash, this._secret);
  }
};


var Uint8Array_to_hex = function(arr) {
  var s = '';
  for (var i = 0; i < arr.length; i++) {
    s += arr[i].toString(16);
  }
  return s;
};

var hex_to_Uint8Array = function(input) {
  var raw = new Buffer(input, 'hex');
  var arr = new Uint8Array(new ArrayBuffer(raw.length));
  for(i = 0; i < raw.length; i++) {
    arr[i] = raw[i];
  }
  return arr;
};

exports.KeyPair = KeyPair;

var Stellar = require('stellar-lib');
var Seed    = Stellar.Seed;
var crypto  = require('crypto');

/** Sync */
function randomString(length, chars) {
    if(!chars) {
        chars = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';
    }
    var charsLength = chars.length;
    if(charsLength > 256) {
        throw new Error('Argument \'chars\' should not have more than 256 characters'
            + ', otherwise unpredictability will be broken');
    }
    var randomBytes = Crypto.randomBytes(length)
    var result = new Array(length);
    var cursor = 0;
    for (var i = 0; i < length; i++) {
        cursor += randomBytes[i];
        result[i] = chars[cursor % charsLength]
    };
    return result.join('');
}

var create = function( i ){
    //var rand_value = randomString( 32);
    var rand_value = 'fo83sggRc97oQR42bwdWVq6sgbmjJxwu3aBP4bJhx8qvKen6p' + i; // make it different

    var seed        = Seed.from_json( rand_value );
    var address     = seed.get_key().get_address();

    return {
        rand        : rand_value,
        secret      : seed.to_json(),
        address     : address.to_json(),
    };
}

var sign_tx = function(){
    var tx_JSON = {
        "TransactionType": "TrustSet",
        "Account": 'gHoy8MeoXXvT5JVCH3qatmLMsgkTk7vfg7',
        "LimitAmount": {
            "value" : "99000000",
            "currency" : "USD",
            "issuer" : "g9RcDwmKYuAUsotNh4wukstFCdmPqjEXFi"
        },
        "Sequence": 1,
        "Fee": 5000000,
    };
    var tx = new Stellar.Transaction();
    tx.tx_json = tx_JSON;
    tx._secret = 'sfo83sggRc97oQR42bwdWVq6sgbmjJxwu3aBP4bJhx8qvKen6p9';
    tx.remote = false; // Dont use StellarD
    tx.complete();
    tx.sign();
    var signed =  (tx.serialize().to_hex());

    return signed;
}

/*
    INIT
 */
var count = 10000;
var functionCall = create;

var times = [];
var total = new Date();
var i = 1;
do{

    console.log( "Calling " + i);

    var start = new Date();
    functionCall( i++ );
    times.push(new Date() - start);

}while( i < count );
console.log( "Reults: ");
console.log( "      Call Count:   " + count );
console.log( "      Total Time:   " + (new Date() - total)/1000 + ' seconds' );
console.log( "      Avg Response: " + average( times ) + ' milliseconds' );
console.log( "      Max Response: " + max( times )     + ' milliseconds' );


function average( arr ){
  if( arr && arr.length ){
    var sum = arr.reduce(function(a, b) { return a + b; });
    return Math.floor( sum / arr.length * 100 ) / 100;
  }else{
    return 0;
  }
}

function max( arr ){
  if( arr && arr.length ){
    return Math.max.apply(Math, arr);
  }else{
    return 0;
  }
}

/*
USE_SODIUM = true;

var tx2 = new Stellar.Transaction();
tx2.tx_json = tx_JSON;
tx2._secret = seed.to_json();
tx2.remote = false; // Dont use StellarD
tx2.complete();
var unsigned = tx2.serialize().to_hex();
tx2.sign();
var signed =  (tx2.serialize().to_hex());

var hash = crypto.createHash('md5').update(signed).digest('hex');
console.log(hash);
*/
/* eslint-disable */

const {restCalls} = require("../src/utils/DefaultRestCalls");
const parser = require('xml2js');
const CryptoJS = require('crypto-js');
const {RSAKey} = require('./rsa');
const publicKey = {
    publicKey:null,
    rsapadingtype:"1",
};
const publicSession = {
    login:'0',
    session:'',
    token1:'',
    token2:''
};

var C = CryptoJS;
var C_lib = C.lib;
var WordArray = C_lib.WordArray;
var C_algo = C.algo;

var SHA2 = C_algo.SHA256;
var HmacSHA2 = C.HmacSHA256;
var Base = C_lib.Base;

var SCRAM = C_algo.SCRAM = Base.extend({
    cfg: Base.extend({
        keySize: 8,
        hasher: SHA2,
        hmac: HmacSHA2
    }),

    init: function (cfg) {
        this.cfg = this.cfg.extend(cfg);
    },
    /**
     *  return client nonce
     */
    nonce: function () {
        lastNonce = WordArray.random(this.cfg.keySize * 4);
        return lastNonce;
    },
    /**
     * pbkdf2
     */
    saltedPassword: function (password, salt, iterations) {
        return CryptoJS.PBKDF2(password, salt, {
            keySize: this.cfg.keySize,
            iterations: iterations,
            hasher: this.cfg.hasher
        });
    },
    /**
     *   ClientKey = HMAC(saltPwd, "Client Key")
     */
    clientKey: function (saltPwd) {
        return this.cfg.hmac(saltPwd, "Client Key");
    },
    /**
     *   ServerKey = HMAC(saltPwd, "Server Key")
     */
    serverKey: function (saltPwd) {
        return this.cfg.hmac(saltPwd, "Server Key");
    },
    /**
     *   StoredKey = HASH(ClientKey)
     */
    storedKey: function (clientKey) {
        var hasher = this.cfg.hasher.create();
        hasher.update(clientKey);

        return hasher.finalize();
    },
    /**
     *   Signature = HMAC(StoredKey, AuthMessage)
     */
    signature: function (storedKey, authMessage) {
        return this.cfg.hmac(storedKey, authMessage);
    },
    /**
     *   ClientProof = ClientKey ^ ClientSignature
     */
    clientProof: function (password, salt, iterations, authMessage) {
        var spwd = this.saltedPassword(password, salt, iterations);
        var ckey = this.clientKey(spwd);
        var skey = this.storedKey(ckey);
        var csig = this.signature(skey, authMessage);

        for (var i = 0; i < ckey.sigBytes / 4; i += 1) {
            ckey.words[i] = ckey.words[i] ^ csig.words[i]
        }
        return ckey.toString();
    },
    /**
     *   ServerProof = HMAC(ServerKey, AuthMessage)
     */
    serverProof: function (password, salt, iterations, authMessage) {
        var spwd = this.saltedPassword(password, salt, iterations);
        var skey = this.serverKey(spwd);
        var sig = this.signature(skey, authMessage);
        return sig.toString();
    }
});

/**
 *   var scram = CryptoJS.SCRAM();
 */
C.SCRAM = function (cfg) {
    return SCRAM.create(cfg);
};


async function getPublicKey(session){
    if (!publicKey.publicKey){
        const resp = await restCalls.fetchData(`http://${session.url}/api/webserver/publickey`,'GET', {
            'cookie': `sessionId=${session.SesInfo}`,
            __RequestVerificationToken: session.TokInfo
        });
        const message = await parser.parseStringPromise(resp);
        publicKey.publicKey= message.response;
    }
    return publicKey.publicKey
}

function utf8Encode(string) {
    var stringTemp = string.replace(/\r\n/g, '\n');
    var utftext = '';
    for (var n = 0; n < stringTemp.length; n++) {
        var charStr = stringTemp.charCodeAt(n);
        if (charStr < 128) {
            utftext += String.fromCharCode(charStr);
        } else if ((charStr > 127) && (charStr < 2048)) {
            utftext += String.fromCharCode((charStr >> 6) | 192);
            utftext += String.fromCharCode((charStr & 63) | 128);
        } else {
            utftext += String.fromCharCode((charStr >> 12) | 224);
            utftext += String.fromCharCode(((charStr >> 6) & 63) | 128);
            utftext += String.fromCharCode((charStr & 63) | 128);
        }
    }
    return utftext;
}

function base64encode(str) {
    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var outputStr = '';
    var char1;
    var char2;
    var char3;
    var encry1;
    var encry2;
    var encry3;
    var encry4;
    var i = 0;
    var input = utf8Encode(str);
    while (i < input.length) {
        char1 = input.charCodeAt(i++);
        char2 = input.charCodeAt(i++);
        char3 = input.charCodeAt(i++);
        encry1 = char1 >> 2;
        encry2 = ((char1 & 3) << 4) | (char2 >> 4);
        encry3 = ((char2 & 15) << 2) | (char3 >> 6);
        encry4 = char3 & 63;
        if (isNaN(char2)) {
            encry3 = encry4 = 64;
        } else if (isNaN(char3)) {
            encry4 = 64;
        }
        outputStr += keyStr.charAt(encry1) + keyStr.charAt(encry2) + keyStr.charAt(encry3) + keyStr.charAt(encry4);
    }
    return outputStr;
}

async function doRSAEncrypt(session,encstring) {
    if (encstring === '') {
        return '';
    }
    let res;
    const gEncPublickey = { e: '', n: '' };
    const pubkeyKeyInfo = await getPublicKey(session);
    // eslint-disable-next-line prefer-destructuring
    gEncPublickey.n = pubkeyKeyInfo.encpubkeyn[0];
    // eslint-disable-next-line prefer-destructuring
    gEncPublickey.e = pubkeyKeyInfo.encpubkeye[0];
    var rsa = new RSAKey();
    rsa.setPublic(gEncPublickey.n, gEncPublickey.e);
    var encStr = base64encode(encstring);
    var num = encStr.length / 245;
    if (publicKey.rsapadingtype === '1') {
        num = encStr.length / 214;
     }
    var restotal = '';
    var rsan = gEncPublickey.n;
    for (var i = 0; i < num; i++) {
        if (publicKey.rsapadingtype === '1') {
        var encdata = encStr.substr(i * 214, 214);
        res = rsa.encryptOAEP(encdata);
         } else {
          var encdata = encStr.substr(i * 245, 245);
           res = rsa.encrypt(encdata);
        }
        if (res.length !== rsan.length) {
            i--;
            continue;
        }
        restotal += res;
    }
    return restotal;
}

const scram = CryptoJS.SCRAM();
const smsNonce = scram.nonce().toString();
const smsSalt = scram.nonce().toString();
const nonceStr = smsNonce + smsSalt;


function getDAesString(encrypted, keystr, ivstr) {
    var key = CryptoJS.enc.Hex.parse(keystr);
    var iv = CryptoJS.enc.Hex.parse(ivstr);
    var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Latin1);
}

function utf8to16(str) {
    var output, i, leng, unic;
    var char1, char2;
    output = "";
    leng = str.length;
    i = 0;
    while (i < leng) {
        unic = str.charCodeAt(i++);
        switch (unic >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                output += str.charAt(i - 1);
                break;
            case 12:
            case 13:
                char1 = str.charCodeAt(i++);
                output += String.fromCharCode(((unic & 0x1F) << 6) | (char1 & 0x3F));
                break;
            case 14:
                char1 = str.charCodeAt(i++);
                char2 = str.charCodeAt(i++);
                output += String.fromCharCode(((unic & 0x0F) << 12) |
                    ((char1 & 0x3F) << 6) |
                    ((char2 & 0x3F) << 0));
                break;
        }
    }
    return output;
}

function dataDecrypt(scram,smsNonce,smsSalt,nonceStr,encryptedData) {
    if (!encryptedData.response
        || !encryptedData.response.pwd
        || !encryptedData.response.hash
        || !encryptedData.response.iter) {
        throw new Error('Request error: '+JSON.stringify(encryptedData))
    }
    if (!encryptedData.response
        || encryptedData.response.pwd.length===0
        || encryptedData.response.hash.length === 0
        || encryptedData.response.iter.length === 0) {
        throw new Error('Request error: '+JSON.stringify(encryptedData))
    }
    const pwdret = {
        response:{
            pwd:encryptedData.response.pwd[0],
            hash:encryptedData.response.hash[0],
            iter:encryptedData.response.iter[0],
        }
    }
    var smsEncrypted = pwdret.response.pwd;
    var salt = CryptoJS.enc.Hex.parse(smsSalt);
    var iter = pwdret.response.iter;
    var saltedStr = scram.saltedPassword(smsNonce, salt, iter);
    saltedStr = saltedStr.toString();
    var aesKey = saltedStr.substring(0, 32);
    var aesIV = saltedStr.substring(32, 48);
    var hmacKey = saltedStr.substring(48, 64);
    var hashData = scram.signature(CryptoJS.enc.Hex.parse(smsEncrypted), CryptoJS.enc.Hex.parse(hmacKey));
    hashData = hashData.toString();
    if (pwdret.response.hash !== hashData) {
        throw new Error('UserPwd hash error');
    }
    var encrypted = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(smsEncrypted));
    var decryptedData = getDAesString(encrypted, aesKey, aesIV);
    decryptedData = utf8to16(decryptedData);
    decryptedData = decryptedData.substring(decryptedData.indexOf('<response>'));
    return decryptedData ;
}

module.exports.dataDecrypt = dataDecrypt;
module.exports.CryptoJS = CryptoJS;
module.exports.doRSAEncrypt = doRSAEncrypt;
module.exports.publicKey = publicKey;
module.exports.publicSession = publicSession;

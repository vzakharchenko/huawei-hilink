import parser from 'xml2js';

import {restCalls} from "./utils/DefaultRestCalls";

const huawei = require('../jslib/public');

export type SessionData = {
    TokInfo: string,
    SesInfo: string,
    url: string
}

type SessionData0 = {
    TokInfo: string,
    SesInfo: string
}

export async function hilinkLogin(url: string): Promise<any> {
  const resp = await restCalls.fetchData(`http://${url}/api/user/hilink_login`, 'GET');
  const message = await parser.parseStringPromise(resp);
  return message.response.hilink_login[0];
}

async function checkLogin(url: string, username: string, password: string|undefined): Promise<boolean> {
  const number = await hilinkLogin(url);
  huawei.publicSession.login = number;
  if (number === '1') {
    if (!username) {
      throw new Error('username is required');
    }
    if (!password) {
      throw new Error('password is required');
    }
  }
  return number === '1';
}


export async function logout(url: string) {
  if (huawei.publicSession.login === '1') {
    const resp = await restCalls.sendDataRaw(`http://${url}/api/user/logout`, 'POST',
            `<?xml version="1.0" encoding="UTF-8"?><request><Logout>1</Logout></request>`
            , {
              __RequestVerificationToken: `${huawei.publicSession.token2}`,
              Cookie: `${huawei.publicSession.session}`,
              _ResponseSource: 'Broswer',
            });
    huawei.publicSession.token2 = resp.headers.__requestverificationtoken;
    const message = await parser.parseStringPromise(resp.data);
    if (message.response !== 'OK') {
      throw new Error(`Logout error: ${resp}`);
    }
  }
}


export async function login(url: string, user: string, password: string|undefined) {
  if (await checkLogin(url, user, password)) {
    const cryptoJS = huawei.CryptoJS;
    const scram = cryptoJS.SCRAM();
    const firstNonce = scram.nonce().toString();
    const sd = await restCalls.fetchDataRaw(`http://${url}`, 'GET');
    let header = sd.headers['set-cookie'] || [''];
    const sd2 = await getSessionId0(url);

    const sessionSec = header[0];
    await getToken(url, sessionSec);
    const resp = await restCalls.sendDataRaw(`http://${url}/api/user/challenge_login`, 'POST',
            `<?xml version: "1.0" encoding="UTF-8"?><request><username>${user}</username><firstnonce>${firstNonce}</firstnonce><mode>1</mode></request>`,
      {
        __RequestVerificationToken: sd2.TokInfo,
        Cookie: `${sessionSec}`,
        _ResponseSource: 'Broswer',
        DNT: 1,
      });
    const challengeLogin = await parser.parseStringPromise(resp.data);

    const scarmSalt = cryptoJS.enc.Hex.parse(challengeLogin.response.salt[0]);
    const iter = challengeLogin.response.iterations[0];
    const finalNonce = challengeLogin.response.servernonce[0];
    const authMsg = `${firstNonce},${finalNonce},${finalNonce}`;
    const saltPassword = scram.saltedPassword(password, scarmSalt, iter).toString();
    const serverKey = scram.serverKey(cryptoJS.enc.Hex.parse(saltPassword)).toString();
    const clientProof = scram.clientProof(password, scarmSalt, iter, authMsg).toString();

    const resp1 = await restCalls.sendDataRaw(`http://${url}/api/user/authentication_login`, 'POST',
            `<?xml version: "1.0" encoding="UTF-8"?><request><clientproof>${clientProof}</clientproof><finalnonce>${finalNonce}</finalnonce></request>`,
      {
        Cookie: `${sessionSec}`,
        __RequestVerificationToken: resp.headers.__requestverificationtoken,
        _ResponseSource: 'Broswer',
        DNT: 1,
      });
    header = resp1.headers['set-cookie'] || [''];
    huawei.publicSession.session = header[0].replace('; path=/; HttpOnly;', '');
    huawei.publicSession.token1 = resp1.headers.__requestverificationtokenone;
    huawei.publicSession.token2 = resp1.headers.__requestverificationtokentwo;
    const data = await parser.parseStringPromise(resp1.data);
    huawei.publicKey.publicKey =
    {
      encpubkeyn: data.response.rsan,
      encpubkeye: data.response.rsae,
    };
  }
}


export async function getToken(url: string, cooke: string): Promise<any> {
  const resp = await restCalls.fetchDataRaw(`http://${url}/api/webserver/token`, 'GET',
    {
      _ResponseSource: 'Broswer',
      DNT: 1,
      Cookie: cooke,
    });
  const message = await parser.parseStringPromise(resp.data);

  return {
    token: message.response.token[0],
    resp,
  };
}

async function getSessionId0(url: string): Promise<SessionData0> {
  const resp = await restCalls.fetchData(`http://${url}/api/webserver/SesTokInfo`, 'GET');
  const message = await parser.parseStringPromise(resp);
  return {
    TokInfo: message.response.TokInfo[0],
    SesInfo: message.response.SesInfo[0],
  };
}

async function getSessionId(url: string): Promise<SessionData0> {
  return getSessionId0(url);
}

export async function startSession(url: string) {
  const session0: SessionData0 = await getSessionId(url);
  const sessionData: SessionData = {
    ...session0,
    url,
  };
  return sessionData;
}



import {startSession} from "../startSession";

const huawei = require('../../jslib/public');

export async function getSessionHeaders(url:string):Promise<any> {
  if (huawei.publicSession.login === '1') {
    return {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8;enc',
      __RequestVerificationToken: `${huawei.publicSession.token2}`,
      Cookie: `${huawei.publicSession.session}`,
      _ResponseSource: 'Broswer',
    };
  } else {
    const sessionData = await startSession(url);
    return {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8;enc',
      __RequestVerificationToken: sessionData.TokInfo,
      Cookie: `SessionId=${sessionData.SesInfo}`,
    };
  }
}

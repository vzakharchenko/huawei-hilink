import fs from "fs";

import parser from 'xml2js';

import {SessionData, startSession} from './startSession';
import {restCalls} from "./utils/DefaultRestCalls";
import {ExportFormat} from "./utils/Constants";

const huawei = require('../jslib/public');

async function saveFile(filename: string, data: string) {
  await fs.promises.writeFile(filename, data);
}

export async function getSMSByUsers(sessionData: SessionData,
                                    phone: string,
                                    pageindex: number,
                                    exportFile: string,
                                    exportFormat: ExportFormat,
                                    deleteAfter: boolean): Promise<any> {
  const number = await getSMSPages(sessionData, '', 'hide');
  const messages: any[] = [];
  for (let i = 1; i <= number; i++) {
    const newMessages = await getSMSContacts(sessionData, 1, '', 'hide');
    if (newMessages) {
      newMessages.forEach((m: any) => {
        messages.push(m);
      });
    }
  }
  if (!messages) {
    console.log(`contact ${phone} does not have messages`);
    return null;
  }
  if (!messages.find((message: any) => {
    return message.phone[0] === phone;
  })) {
    console.log(`contact ${phone} does not have messages`);
    return null;
  }
  const sessionData0 = await startSession(sessionData.url);
  const scram = huawei.CryptoJS.SCRAM();
  const smsNonce = scram.nonce().toString();
  const smsSalt = scram.nonce().toString();
  const nonceStr = smsNonce + smsSalt;
  const encrpt = await huawei.doRSAEncrypt(sessionData0, nonceStr);
  const data = await huawei.doRSAEncrypt(sessionData, `<?xml version="1.0" encoding="UTF-8"?><request><phone>${phone}</phone><pageindex>${pageindex}</pageindex><readcount>20</readcount><nonce>${encrpt}</nonce></request>`);
  const resp = await restCalls.sendData(`http://${sessionData0.url}/api/sms/sms-list-phone`, 'POST', data, {
    __RequestVerificationToken: sessionData0.TokInfo,
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8;enc',
    Cookie: `SessionId=${sessionData0.SesInfo}`,
  });
  const pwdret = await parser.parseStringPromise((resp));
  const ret = huawei.dataDecrypt(scram, smsNonce, smsSalt, nonceStr, pwdret);
  if (deleteAfter) {
    const json = await parser.parseStringPromise(ret);
    const messages0 = json.response.messages[0].message;
    for (let i = 0; i < messages0.length; i++) {
      await deleteMessage(sessionData, messages0[i].index[0]);
    }
  }
  const json = await parser.parseStringPromise(ret);
  if (exportFormat !== 'hide') {
    if (exportFormat === 'xml') {
      await saveFile(exportFile, ret);
      console.info(`xml file ${exportFile} created`);
    } else if (exportFormat === 'json') {
      await saveFile(exportFile, JSON.stringify(json));
      console.info(`json file ${exportFile} created`);
    } else {
      json.response.messages[0].message.forEach((message: any) => {
        console.log(`MessageId: ${message.index[0]} Phone: ${message.phone[0]} Message: ${JSON.stringify(message.content[0])}`);
      });
    }
  }
  return json.response.messages[0].message;
}

export async function getContactSMSPages(sessionData: SessionData,
                                         phone: string,
                                         exportFile: string,
                                         exportFormat: ExportFormat) {
  const data = await huawei.doRSAEncrypt(sessionData, `<?xml version="1.0" encoding="UTF-8"?><request><phone>${phone}</phone></request>`);
  const resp = await restCalls.sendData(`http://${sessionData.url}/api/sms/sms-count-contact`, 'POST', data, {
    __RequestVerificationToken: sessionData.TokInfo,
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8;enc',
    Cookie: `SessionId=${sessionData.SesInfo}`,
  });

  const json = await parser.parseStringPromise(resp);
  let number = Math.floor(json.response.count / 21);
  if (number > 0) {
    number += 1;
  }
  if (exportFormat !== 'hide') {
    if (exportFormat === 'xml') {
      await saveFile(exportFile, resp);
      console.info(`xml file ${exportFile} created`);
    } else if (exportFormat === 'json') {
      await saveFile(exportFile, JSON.stringify(await parser.parseStringPromise(resp)));
      console.info(`json file ${exportFile} created`);
    } else {
      console.info(`${number}`);
    }
  }
  return number;
}

export async function getSMSPages(sessionData: SessionData,
                                  exportFile: string,
                                  exportFormat: ExportFormat) {
  const resp = await restCalls.fetchData(`http://${sessionData.url}/api/sms/sms-count`, 'GET', {
    __RequestVerificationToken: sessionData.TokInfo,
    Cookie: `SessionId=${sessionData.SesInfo}`,
  });
  const json = await parser.parseStringPromise(resp);
  const number = Math.floor((json.response.LocalInbox[0] + json.response.LocalOutbox[0]) / 21);
  if (exportFormat !== 'hide') {
    if (exportFormat === 'xml') {
      await saveFile(exportFile, resp);
      console.info(`xml file ${exportFile} created`);
    } else if (exportFormat === 'json') {
      await saveFile(exportFile, JSON.stringify(await parser.parseStringPromise(resp)));
      console.info(`json file ${exportFile} created`);
    } else {
      console.info(`${number}`);
    }
  }
  return number;
}

export async function deleteMessage(sessionData: SessionData,
                                    messageId: string) {
  const sessionData0 = await startSession(sessionData.url);
  const data = `<?xml version: "1.0" encoding="UTF-8"?><request><Index>${messageId}</Index></request>`;
  const resp = await restCalls.sendData(`http://${sessionData0.url}/api/sms/delete-sms`, 'POST', data, {
    __RequestVerificationToken: sessionData0.TokInfo,
    Cookie: `SessionId=${sessionData0.SesInfo}`,
  });
  const json = await parser.parseStringPromise(resp);
  if (json.response !== 'OK') {
    throw new Error(`Delete message error: ${JSON.stringify(json)}`);
  }
  console.info('Message or Contact deleted');
}

export async function sendMessage(sessionData: SessionData,
                                  phones: string,
                                  message: string) {
  const scram = huawei.CryptoJS.SCRAM();
  const smsNonce = scram.nonce().toString();
  const smsSalt = scram.nonce().toString();
  const nonceStr = smsNonce + smsSalt;
  const encrpt = await huawei.doRSAEncrypt(sessionData, nonceStr);
  const data = await huawei.doRSAEncrypt(sessionData, `<?xml version="1.0" encoding="UTF-8"?><request><Index>-1</Index><Phones><Phone>${(phones)}</Phone></Phones><Sca></Sca><Content>${message}</Content><Length>${message.length}</Length><Reserved>1</Reserved><Date>2021-10-27 00:12:24</Date><nonce>${encrpt}</nonce></request>`);
  const resp = await restCalls.sendData(`http://${sessionData.url}/api/sms/send-sms`, 'POST', data, {
    __RequestVerificationToken: sessionData.TokInfo,
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8;enc',
    Cookie: `SessionId=${sessionData.SesInfo}`,
  });
  const json = await parser.parseStringPromise(resp);
  if (json.response !== 'OK') {
    throw new Error(`Delete message error: ${JSON.stringify(json)}`);
  }
  console.info('Message sent');
}


export async function getInBoxSMS(sessionData: SessionData,
                                  deleteAfter: boolean,
                                  exportFile: string,
                                  exportFormat: ExportFormat): Promise<any> {
  const contacts = await getSMSContacts(sessionData, 1, '', 'hide');
  const messages: any[] = [];
  if (contacts) {
    for (let i = 0; i < contacts.length; i++) {
      const phone = contacts[i].phone[0];
      const phoneMessages = await getSMSByUsers(sessionData, phone, 1, '', 'hide', deleteAfter);
      if (phoneMessages) {
        phoneMessages.filter((pm: any) => {
          return pm.curbox[0] === "0";
        }).forEach((pm: any) => {
          messages.push(pm);
        });
      }
    }
    if (exportFormat !== 'hide') {
      if (exportFormat === 'json') {
        await saveFile(exportFile, JSON.stringify(messages));
        console.info(`json file ${exportFile} created`);
      } else {
        messages.forEach((message: any) => {
          console.log(`MessageId: ${message.index[0]} Phone: ${message.phone[0]} lastMessage: ${JSON.stringify(message.content[0])}`);
        });
      }

    }

  }
}

export async function getSMSContacts(sessionData0: SessionData,
                                     pageindex: number,
                                     exportFile: string,
                                     exportFormat: ExportFormat): Promise<any> {
  const count = await getSMSPages(sessionData0, '', 'hide');
  if (count === 0) {
    console.log('huawei does not have contacts');
    return null;
  }
  const sessionData = await startSession(sessionData0.url);
  const scram = huawei.CryptoJS.SCRAM();
  const smsNonce = scram.nonce().toString();
  const smsSalt = scram.nonce().toString();
  const nonceStr = smsNonce + smsSalt;
  const encrpt = await huawei.doRSAEncrypt(sessionData, nonceStr);
  const data = await huawei.doRSAEncrypt(sessionData, `<?xml version: "1.0" encoding="UTF-8"?><request><pageindex>${pageindex}</pageindex><readcount>20</readcount><nonce>${encrpt}</nonce></request>`);
  const resp = await restCalls.sendData(`http://${sessionData.url}/api/sms/sms-list-contact`, 'POST',
        data, {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8;enc',
          __RequestVerificationToken: sessionData.TokInfo,
          Cookie: `SessionId=${sessionData.SesInfo}`,
        });
  const pwdret = await parser.parseStringPromise(resp);
  const ret = huawei.dataDecrypt(scram, smsNonce, smsSalt, nonceStr, pwdret);
  const json = await parser.parseStringPromise(ret);
  if (exportFormat !== 'hide') {
    if (exportFormat === 'xml') {
      await saveFile(exportFile, ret);
      console.info(`xml file ${exportFile} created`);
    } else if (exportFormat === 'json') {
      await saveFile(exportFile, JSON.stringify(json));
      console.info(`json file ${exportFile} created`);
    } else {
      json.response.messages[0].message.forEach((message: any) => {
        console.log(`MessageId: ${message.index[0]} Phone: ${message.phone[0]} lastMessage: ${JSON.stringify(message.content[0])}`);
      });
    }
  }
  return json.response.messages[0].message;
}

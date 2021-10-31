import fs from "fs";

import parser from "xml2js";

import {SessionData} from "./startSession";
import {restCalls} from "./utils/DefaultRestCalls";
import {ExportFormat} from "./utils/Constants";
import {getSessionHeaders} from "./utils/HuaweiUtils";

const huawei = require('../jslib/public');

type MobileStatus = 'on' | 'off';

async function saveFile(filename: string, data: string) {
  await fs.promises.writeFile(filename, data);
}

export async function controlMobileData(sessionData: SessionData, mobileStatus: MobileStatus) {
  const data = await huawei.doRSAEncrypt(sessionData, `<?xml version="1.0" encoding="UTF-8"?><request><dataswitch>${mobileStatus === 'on' ? 1 : 0}</dataswitch></request>`);
  const resp = await restCalls.sendDataRaw(`http://${sessionData.url}/api/dialup/mobile-dataswitch`, 'POST', data, await getSessionHeaders(sessionData.url));
  huawei.publicSession.token2 = resp.headers.__requestverificationtoken;
  const json = await parser.parseStringPromise(resp.data);
  if (json.response !== 'OK') {
    throw new Error(`Control Mobile Data error: ${JSON.stringify(json)}`);
  }
  console.log(`Control Mobile Data changed to ${mobileStatus}`);
}

export async function reconnect(sessionData: SessionData) {
  const data = await huawei.doRSAEncrypt(sessionData, `<?xml version: "1.0" encoding="UTF-8"?><request><ReconnectAction>1</ReconnectAction></request>`);
  const resp = await restCalls.sendDataRaw(`http://${sessionData.url}/api/net/reconnect`, 'POST', data, await getSessionHeaders(sessionData.url));
  huawei.publicSession.token2 = resp.headers.__requestverificationtoken;
  const json = await parser.parseStringPromise(resp.data);
  if (json.response !== 'OK') {
    throw new Error(`Reconnecting error: ${JSON.stringify(json)}`);
  }
  console.log('Reconnected');
}

export async function status(sessionData: SessionData, exportFile: string,
                             exportFormat: ExportFormat) {
  const resp = await restCalls.fetchData(`http://${sessionData.url}/api/monitoring/status`, 'GET', await getSessionHeaders(sessionData.url));
  if (exportFormat !== 'hide') {
    if (exportFormat === 'xml') {
      await saveFile(exportFile, resp);
      console.info(`xml file ${exportFile} created`);
    } else if (exportFormat === 'json') {
      await saveFile(exportFile, JSON.stringify(await parser.parseStringPromise(resp)));
      console.info(`json file ${exportFile} created`);
    } else {
      const json = await parser.parseStringPromise(resp);
      const response = json.response;
      Object.keys(response).forEach((key) => {
        console.info(`${key}=${response[key][0]}`);
      });
    }
  }
}

import fs from "fs";

import parser from "xml2json";

import {SessionData} from "./startSession";
import {restCalls} from "./utils/DefaultRestCalls";
import {ExportFormat} from "./utils/Constants";


type MobileStatus = 'on' | 'off';

async function saveFile(filename: string, data: string) {
  await fs.promises.writeFile(filename, data);
}

export async function controlMobileData(sessionData: SessionData, mobileStatus: MobileStatus) {
  const data = `<?xml version="1.0" encoding="UTF-8"?><request><dataswitch>${mobileStatus === 'on' ? 1 : 0}</dataswitch></request>`;
  const resp = await restCalls.sendData(`http://${sessionData.url}/api/dialup/mobile-dataswitch`, 'POST', data, {
    __RequestVerificationToken: sessionData.TokInfo,
    Cookie: `SessionId=${sessionData.SesInfo}`,
  });
  const text = parser.toJson(resp);
  const json = JSON.parse(text);
  if (json.response !== 'OK') {
    throw new Error(`Control Mobile Data error: ${text}`);
  }
  console.log(`Control Mobile Data changed to ${mobileStatus}`);
}

export async function reconnect(sessionData: SessionData) {
  const data = `<?xml version: "1.0" encoding="UTF-8"?><request><ReconnectAction>1</ReconnectAction></request>`;
  const resp = await restCalls.sendData(`http://${sessionData.url}/api/net/reconnect`, 'POST', data, {
    __RequestVerificationToken: sessionData.TokInfo,
    Cookie: `SessionId=${sessionData.SesInfo}`,
  });
  const text = parser.toJson(resp);
  const json = JSON.parse(text);
  if (json.response !== 'OK') {
    throw new Error(`Reconnecting error: ${text}`);
  }
  console.log('Reconnected');
}

export async function status(sessionData: SessionData, exportFile: string,
                             exportFormat: ExportFormat) {
  const resp = await restCalls.fetchData(`http://${sessionData.url}/api/monitoring/status`, 'GET', {
    __RequestVerificationToken: sessionData.TokInfo,
    Cookie: `SessionId=${sessionData.SesInfo}`,
  });
  if (exportFormat !== 'hide') {
    if (exportFormat === 'xml') {
      await saveFile(exportFile, resp);
      console.info(`xml file ${exportFile} created`);
    } else if (exportFormat === 'json') {
      await saveFile(exportFile, parser.toJson(resp));
      console.info(`json file ${exportFile} created`);
    } else {
      const text = parser.toJson(resp);
      const json = JSON.parse(text);
      const response = json.response;
      Object.keys(response).forEach((key) => {
        console.info(`${key}=${response[key]}`);
      });
    }
  }
}

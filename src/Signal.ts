import parser from "xml2js";

import {SessionData} from "./startSession";
import {restCalls} from "./utils/DefaultRestCalls";
import {getSessionHeaders} from "./utils/HuaweiUtils";

const huawei = require('../jslib/public');

function _4GType(data:string):string {
  if ((data === '20880800C5') || (data === '20000800C5')) { return "AUTO"; }
  const dataOut:string[] = [];
  if ((parseInt(data, 16) & 0x1) === 0x1) {
    dataOut.push("B1");
  }
  if ((parseInt(data, 16) & 0x4) === 0x4) {
    dataOut.push("B3");
  }
  if ((parseInt(data, 16) & 0x10) === 0x10) {
    dataOut.push("B5");
  }
  if ((parseInt(data, 16) & 0x40) === 0x40) {
    dataOut.push("B7");
  }
  if ((parseInt(data, 16) & 0x80) === 0x80) {
    dataOut.push("B8");
  }
  if ((parseInt(data, 16) & 0x80000) === 0x80000) {
    dataOut.push("B20");
  }
  if ((parseInt(data, 16) & 0x8000000) === 0x8000000) {
    dataOut.push("B28");
  }
  return dataOut.join('+');
}

export async function getSignalInfo(sessionData: SessionData) {
  const mode = await lteMode(sessionData);
  const resp = await restCalls.fetchDataRaw(`http://${sessionData.url}/api/device/signal`, 'GET', await getSessionHeaders(sessionData.url));
  if (resp.headers.__requestverificationtoken) {
    huawei.publicSession.token2 = resp.headers.__requestverificationtoken;
  }
  const json = await parser.parseStringPromise(resp.data);
  const vars = ['rssi', 'rsrp', 'rsrq', 'sinr', 'dlbandwidth', 'ulbandwidth', 'band', 'cell_id', 'plmn'];
  let resultString = '';
  const response = json.response;
  for (let i = 0; i < vars.length; i++) {
    resultString += ` ${vars[i]}: ${response[vars[i]][0]}`;
  }
  console.log(`LTE Band: ${_4GType(mode.LTEBand[0])}${resultString}`);
}

export async function lteMode(sessionData: SessionData) {
  const resp = await restCalls.fetchDataRaw(`http://${sessionData.url}/api/net/net-mode`, 'GET', await getSessionHeaders(sessionData.url));
  if (resp.headers.__requestverificationtoken) {
    huawei.publicSession.token2 = resp.headers.__requestverificationtoken;
  }
  const json = await parser.parseStringPromise(resp.data);
  return json.response;
}

export async function lteBand(sessionData: SessionData, band: string) {
  let ltesum:string;
  if (band.toUpperCase() === "AUTO") {
    ltesum = "7FFFFFFFFFFFFFFF";
  } else {
    const bs:string[] = band.split("+");
    let ltesum0 = 0;
    for (let i = 0; i < bs.length; i++) {
      ltesum0 += 2 ** (parseInt(bs[i], 10) - 1);
    }
    ltesum = ltesum0.toString(16);
  }
  const data = await huawei.doRSAEncrypt(sessionData, `<?xml version: "1.0" encoding="UTF-8"?><request><NetworkMode>03</NetworkMode><NetworkBand>3FFFFFFF</NetworkBand><LTEBand>${ltesum}</LTEBand></request>`);
  const resp = await restCalls.sendDataRaw(`http://${sessionData.url}/api/net/net-mode`, 'POST', data, await getSessionHeaders(sessionData.url));
  huawei.publicSession.token2 = resp.headers.__requestverificationtoken;
  const json = await parser.parseStringPromise(resp.data);
  if (json.response !== 'OK') {
    throw new Error(`LTEBand changing error: ${JSON.stringify(json)}`);
  }
  console.log(`LTEBand changed to ${_4GType((await lteMode(sessionData)).LTEBand[0])}`);
}

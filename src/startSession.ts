import parser from 'xml2json';

import {restCalls} from "./utils/DefaultRestCalls";

export type SessionData = {
    TokInfo: string,
    SesInfo: string,
    url: string
}

type SessionData0 = {
    TokInfo: string,
    SesInfo: string
}

// async function saveFile(data: SessionData) {
//     await fs.promises.writeFile(os.tmpdir() + '/huawei.tmp', JSON.stringify(data));
// }
//
// async function readFile(): Promise<SessionData> {
//     try {
//         return JSON.parse(await fs.promises.readFile(os.tmpdir() + '/huawei.tmp', 'utf-8'));
//     } catch (e) {
//         console.error("read session data error", e);
//         await fs.promises.rm(os.tmpdir() + '/huawei.tmp');
//         throw e;
//     }
// }
//
async function getSessionId(url: string): Promise<SessionData0> {
  const resp = await restCalls.fetchData(`http://${url}/api/webserver/SesTokInfo`, 'GET');
  const message = JSON.parse(parser.toJson(resp));
  return message.response;
}
//
// export async function getCurrentSession() {
//     try {
//         const session: SessionData = await readFile();
//         await startSession(session.url);
//         return await readFile();
//     } catch (e) {
//         console.error("Session file does not exist or not valid please start a new session", e);
//         throw new Error("Session Does not exist")
//     }
//
// }

export async function startSession(url: string) {
  const session0: SessionData0 = await getSessionId(url);
  const sessionData: SessionData = {
    ...session0,
    url,
  };
  return sessionData;
}



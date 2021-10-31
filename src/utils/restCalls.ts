import {AxiosPromise} from "axios";

export type HTTPMethod =
    | 'get' | 'GET'
    | 'delete' | 'DELETE'
    | 'head' | 'HEAD'
    | 'options' | 'OPTIONS'
    | 'post' | 'POST'
    | 'put' | 'PUT'
    | 'patch' | 'PATCH'
    | 'purge' | 'PURGE'
    | 'link' | 'LINK'
    | 'unlink' | 'UNLINK'

export interface RestCalls {
  fetchData(url:string, method?:HTTPMethod, headers?:any):Promise<string>;
  fetchDataRaw(url:string, method?:HTTPMethod, headers?:any):Promise<AxiosPromise>;
  sendData(url:string, method:HTTPMethod, data:string, headers?:any):Promise<string>;
  sendDataRaw(url:string, method:HTTPMethod, data:string, headers?:any):Promise<AxiosPromise>;
}

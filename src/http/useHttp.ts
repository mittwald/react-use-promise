import { AxiosRequestConfig, AxiosResponse } from "axios";
import { UseWatchResourceOptions } from "../resource/types";
import { getHttpResource } from "./getHttpResource";

export const useHttp = <T>(
  url: string,
  requestConfig?: AxiosRequestConfig,
  options?: UseWatchResourceOptions,
): AxiosResponse<T> =>
  getHttpResource<T>(url, requestConfig, options).use(options);

export const useHttpData = <T>(
  url: string,
  requestConfig?: AxiosRequestConfig,
  options?: UseWatchResourceOptions,
): T => useHttp<T>(url, requestConfig, options).data;

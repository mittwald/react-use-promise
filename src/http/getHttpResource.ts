import { AsyncResource } from "../resource/AsyncResource.js";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { getAsyncResource } from "../resource/getAsyncResource.js";
import { GetAsyncResourceOptions } from "../resource/types.js";

export const getHttpResource = <T>(
  url: string,
  requestConfig?: AxiosRequestConfig,
  options?: GetAsyncResourceOptions,
): AsyncResource<AxiosResponse<T>> => {
  const requestConfigWithDefaults = {
    method: "GET",
    url,
    ...requestConfig,
  };

  const uriTag = axios.getUri(requestConfigWithDefaults);
  const methodTag = requestConfigWithDefaults.method.toUpperCase();
  const tagsFromOptions = options?.tags ?? [];

  const resourceOptionsWithDefaults = {
    ...options,
    tags: [
      `http/method/${methodTag}`,
      `http/uri/${uriTag}`,
      ...tagsFromOptions,
    ],
  };

  return getAsyncResource(
    axios.request,
    [requestConfigWithDefaults],
    resourceOptionsWithDefaults,
  );
};

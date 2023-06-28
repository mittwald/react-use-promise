import { AsyncFn, UseWatchResourceResult } from "../resource/types.js";
import { getAsyncResource } from "../resource/getAsyncResource.js";
import { UsePromiseOptions } from "./types.js";

export const usePromise = <
  TResult,
  TArgs extends unknown[],
  TOptions extends UsePromiseOptions,
>(
  asyncLoader: AsyncFn<TResult, TArgs>,
  parameters: TArgs,
  options: TOptions = {} as TOptions,
): UseWatchResourceResult<TResult, TOptions> =>
  getAsyncResource(asyncLoader, parameters, options).watch(
    options,
  ) as UseWatchResourceResult<TResult, TOptions>;

import {
  AsyncFn,
  GetAsyncResourceOptions,
  UseWatchResourceResult,
} from "../resource/types.js";
import { getAsyncResource } from "../resource/getAsyncResource.js";

export const usePromise = <
  TResult,
  TArgs extends unknown[],
  TOptions extends GetAsyncResourceOptions,
>(
  asyncLoader: AsyncFn<TResult, TArgs>,
  parameters: TArgs,
  options: TOptions = {} as TOptions,
): UseWatchResourceResult<TResult, TOptions> =>
  getAsyncResource(asyncLoader, parameters, options).watch(
    options,
  ) as UseWatchResourceResult<TResult, TOptions>;

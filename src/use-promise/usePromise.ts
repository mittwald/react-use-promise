import { AsyncFn, GetAsyncResourceOptions } from "../resource/types.js";
import { getAsyncResource } from "../resource/getAsyncResource.js";

export const usePromise = <TResult, TArgs extends unknown[]>(
  asyncLoader: AsyncFn<TResult, TArgs>,
  parameters: TArgs,
  options: GetAsyncResourceOptions = {},
): TResult => getAsyncResource(asyncLoader, parameters, options).watch();

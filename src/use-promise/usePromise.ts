import {
  AsyncFn,
  FnParameters,
  NullableResourceValue,
  UseWatchResourceResult,
} from "../resource/types.js";
import { getAsyncResource } from "../resource/getAsyncResource.js";
import { UsePromiseOptions } from "./types.js";

export const usePromise = <
  TValue,
  TParams extends FnParameters,
  TNullableParams extends TParams | null,
  TOptions extends UsePromiseOptions,
>(
  asyncLoader: AsyncFn<TValue, TParams>,
  parameters: TNullableParams,
  options: TOptions = {} as TOptions,
): UseWatchResourceResult<
  NullableResourceValue<TValue, TParams, TNullableParams>,
  TOptions
> =>
  getAsyncResource(asyncLoader, parameters, options).watch(
    options,
  ) as UseWatchResourceResult<TValue, TOptions>;

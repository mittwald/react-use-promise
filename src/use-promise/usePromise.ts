import {
  LoaderFn,
  FnParameters,
  UseWatchResourceResult,
} from "../resource/types";
import { getAsyncResource } from "../resource/getAsyncResource";
import { UsePromiseOptions } from "./types";

// function overloads for nullable parameters
export function usePromise<
  TValue,
  TParams extends FnParameters,
  TOptions extends UsePromiseOptions,
>(
  asyncLoader: LoaderFn<TValue, TParams>,
  parameters: TParams,
  options?: TOptions,
): UseWatchResourceResult<TValue, TOptions>;

export function usePromise<
  TValue,
  TParams extends FnParameters,
  TOptions extends UsePromiseOptions,
>(
  asyncLoader: LoaderFn<TValue, TParams>,
  parameters: TParams | null,
  options?: TOptions,
): UseWatchResourceResult<TValue | undefined, TOptions>;

export function usePromise<
  TValue,
  TParams extends FnParameters,
  TOptions extends UsePromiseOptions,
>(
  asyncLoader: LoaderFn<TValue, TParams>,
  parameters: TParams | null,
  options: TOptions = {} as TOptions,
): UseWatchResourceResult<TValue | undefined, TOptions> {
  return getAsyncResource(asyncLoader, parameters, options).use(options);
}

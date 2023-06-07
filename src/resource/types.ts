import { UseWatchResourceOptions } from "./useWatchResourceValue.js";
import { Tags } from "../store/types.js";

export type AsyncLoader<TResult = unknown> = () => Promise<TResult>;

export type AsyncFn<TResult, TArgs extends unknown[]> = (
  ...args: TArgs
) => Promise<TResult>;

export type AnyAsyncFn = AsyncFn<unknown, any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type AsyncResourceState = "void" | "loading" | "loaded" | "error";

export interface GetAsyncResourceOptions extends UseWatchResourceOptions {
  loaderId?: string;
  tags?: Tags;
}

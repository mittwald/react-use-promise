import { Tags } from "../store/types.js";
import { DurationLikeObject } from "luxon";
import { EventualValue } from "../lib/EventualValue.js";

export type AsyncLoader<TResult = unknown> = () => Promise<TResult>;

export type AsyncFn<TResult, TArgs extends unknown[]> = (
  ...args: TArgs
) => Promise<TResult>;

export type AnyAsyncFn = AsyncFn<unknown, any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type AsyncResourceState = "void" | "loading" | "loaded" | "error";

export interface GetAsyncResourceOptions {
  loaderId?: string;
  tags?: Tags;
  autoRefresh?: DurationLikeObject;
}

export interface UseWatchResourceOptions extends GetAsyncResourceOptions {
  keepValueWhileLoading?: boolean;
  useSuspense?: boolean;
}

export type UseWatchResourceResult<TResult, TOptions> = TOptions extends {
  useSuspense: false;
}
  ? EventualValue<TResult>
  : TResult;

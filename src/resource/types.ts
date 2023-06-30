import { Tags } from "../store/types.js";
import { DurationLikeObject } from "luxon";

// Async function types
export type FnParameters = unknown[];

export type NullableResourceValue<
  TValue,
  TParams extends FnParameters,
  TNullableParams extends TParams | null,
> = TParams extends TNullableParams ? TValue : TValue | undefined;

export type AsyncFn<TResult, TParams extends FnParameters> = (
  ...args: TParams
) => Promise<TResult>;

export type AnyAsyncFn = AsyncFn<unknown, any[]>; // eslint-disable-line @typescript-eslint/no-explicit-any

// Async resource types
export type AsyncLoader<TResult = unknown> = () => Promise<TResult>;

export type AsyncResourceState = "void" | "loading" | "loaded" | "error";

export interface GetAsyncResourceOptions {
  loaderId?: string;
  tags?: Tags;
  autoRefresh?: DurationLikeObject;
}

// useWatchResource types
export interface UseWatchResourceOptions extends GetAsyncResourceOptions {
  keepValueWhileLoading?: boolean;
  useSuspense?: boolean;
}

export type NoSuspenseReturnType<T> = Readonly<
  {
    maybeValue: T | undefined;
    isLoading: boolean;
  } & (
    | {
        hasValue: false;
      }
    | {
        hasValue: true;
        value: T;
      }
  )
>;

export type UseWatchResourceResult<TValue, TOptions> = TOptions extends {
  useSuspense: false;
}
  ? NoSuspenseReturnType<TValue>
  : TValue;

import { DurationLikeObject } from "luxon";
import { Tags } from "../store/types.js";

// Async function types
export type FnParameters = unknown[];

export type LoaderFn<TResult, TParams extends FnParameters> = (
  ...args: TParams
) => Promise<TResult> | TResult;

// Async resource types
export type ResourceLoader<TResult = unknown> = () =>
  | Promise<TResult>
  | TResult;

export type AsyncResourceState = "void" | "loading" | "loaded" | "error";

export type GetAsyncResourceOptions = {
  loaderId?: string;
  tags?: Tags;
};

// useWatchResource types
export type UseWatchResourceOptions = {
  keepValueWhileLoading?: boolean;
  useSuspense?: boolean;
  autoRefresh?: DurationLikeObject;
  refreshOnWindowFocus?: boolean;
  refreshOnDocumentVisibilityChange?: boolean;
} & GetAsyncResourceOptions;

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

export type ResolveLoaderPromiseFn = () => void;

export type OnRefreshHandler = () => void;

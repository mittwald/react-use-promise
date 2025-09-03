import { defaultStorageKeyBuilder } from "../store/defaultStorageKeyBuilder.js";
import { AsyncResource } from "./AsyncResource.js";
import { asyncResourceStore } from "./store.js";
import { LoaderFn, FnParameters, GetAsyncResourceOptions } from "./types.js";

// function overloads for nullable parameters
export function getAsyncResource<TValue, TParams extends FnParameters>(
  asyncFn: LoaderFn<TValue, TParams>,
  parameters: TParams,
  options?: GetAsyncResourceOptions,
): AsyncResource<TValue>;

export function getAsyncResource<TValue, TParams extends FnParameters>(
  asyncFn: LoaderFn<TValue, TParams>,
  parameters: TParams | null,
  options?: GetAsyncResourceOptions,
): AsyncResource<TValue | undefined>;

export function getAsyncResource<TValue, TParams extends FnParameters>(
  asyncFn: LoaderFn<TValue, TParams>,
  parameters: TParams | null,
  options: GetAsyncResourceOptions = {},
): AsyncResource<TValue | undefined> {
  const { loaderId, tags } = options;

  if (parameters === null) {
    return AsyncResource.voidInstance;
  }

  const storageKey = defaultStorageKeyBuilder({
    asyncFn,
    parameters,
    loaderId,
  });

  const asyncResourceLoader = () => asyncFn(...parameters);

  const resourceBuilder = () => new AsyncResource(asyncResourceLoader);

  return asyncResourceStore.getOrSet(storageKey, resourceBuilder, {
    tags: tags,
  });
}

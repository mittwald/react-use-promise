import { AsyncFn, FnParameters, GetAsyncResourceOptions } from "./types.js";
import { defaultStorageKeyBuilder } from "../store/defaultStorageKeyBuilder.js";
import { Store } from "../store/Store.js";
import { AsyncResource, AsyncResourceOptions } from "./AsyncResource.js";

const buildEmptyResource = (options: AsyncResourceOptions) =>
  new AsyncResource<undefined>(() => Promise.resolve(undefined), options);

// function overloads for nullable parameters
export function getAsyncResource<TValue, TParams extends FnParameters>(
  asyncFn: AsyncFn<TValue, TParams>,
  parameters: TParams,
  options?: GetAsyncResourceOptions,
): AsyncResource<TValue>;

export function getAsyncResource<TValue, TParams extends FnParameters>(
  asyncFn: AsyncFn<TValue, TParams>,
  parameters: TParams | null,
  options?: GetAsyncResourceOptions,
): AsyncResource<TValue | undefined>;

export function getAsyncResource<TValue, TParams extends FnParameters>(
  asyncFn: AsyncFn<TValue, TParams>,
  parameters: TParams | null,
  options: GetAsyncResourceOptions = {},
): AsyncResource<TValue | undefined> {
  const { loaderId, tags, autoRefresh } = options;

  const asyncResourceOptions: AsyncResourceOptions = {
    ttl: autoRefresh,
  };

  if (parameters === null) {
    return buildEmptyResource(asyncResourceOptions);
  }

  const storageKey = defaultStorageKeyBuilder({
    asyncFn,
    parameters,
    loaderId,
  });

  const asyncResourceLoader = () => asyncFn(...parameters);

  const resourceBuilder = () =>
    new AsyncResource(asyncResourceLoader, asyncResourceOptions);

  return Store.default.getOrSet(storageKey, resourceBuilder, {
    tags: tags,
  });
}

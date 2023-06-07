import { AnyAsyncFn, AsyncFn, GetAsyncResourceOptions } from "./types.js";
import { defaultStorageKeyBuilder } from "../store/defaultStorageKeyBuilder.js";
import { Store } from "../store/Store.js";
import { AsyncResource } from "./AsyncResource.js";

export const getAsyncResource = <TResult, TArgs extends unknown[]>(
  asyncFn: AsyncFn<TResult, TArgs>,
  parameters: TArgs,
  options: GetAsyncResourceOptions = {},
): AsyncResource<TResult> => {
  const { loaderId, tags, autoRefresh } = options;

  const storageKey = defaultStorageKeyBuilder({
    asyncFn: asyncFn as AnyAsyncFn,
    parameters,
    loaderId,
  });

  const asyncResourceLoader = () => asyncFn.call(asyncFn, ...parameters);

  const resourceBuilder = () =>
    new AsyncResource(asyncResourceLoader, {
      ttl: autoRefresh,
    });

  return Store.default.getOrSet(storageKey, resourceBuilder, {
    tags: tags,
  });
};

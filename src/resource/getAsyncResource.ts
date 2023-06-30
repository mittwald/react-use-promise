import {
  AnyAsyncFn,
  AsyncFn,
  FnParameters,
  GetAsyncResourceOptions,
  NullableResourceValue,
} from "./types.js";
import { defaultStorageKeyBuilder } from "../store/defaultStorageKeyBuilder.js";
import { Store } from "../store/Store.js";
import { AsyncResource, AsyncResourceOptions } from "./AsyncResource.js";

const buildEmptyResource = (options: AsyncResourceOptions) =>
  new AsyncResource<undefined>(() => Promise.resolve(undefined), options);

export const getAsyncResource = <
  TValue,
  TParams extends FnParameters,
  TNullableParams extends TParams | null,
>(
  asyncFn: AsyncFn<TValue, TParams>,
  parameters: TNullableParams,
  options: GetAsyncResourceOptions = {},
): AsyncResource<NullableResourceValue<TValue, TParams, TNullableParams>> => {
  const { loaderId, tags, autoRefresh } = options;

  const asyncResourceOptions: AsyncResourceOptions = {
    ttl: autoRefresh,
  };

  type Result = AsyncResource<
    NullableResourceValue<TValue, TParams, TNullableParams>
  >;

  if (parameters === null) {
    return buildEmptyResource(asyncResourceOptions) as Result;
  }

  const storageKey = defaultStorageKeyBuilder({
    asyncFn: asyncFn as AnyAsyncFn,
    parameters,
    loaderId,
  });

  const asyncResourceLoader = () => asyncFn.call(asyncFn, ...parameters);

  const resourceBuilder = () =>
    new AsyncResource(asyncResourceLoader, asyncResourceOptions);

  return Store.default.getOrSet(storageKey, resourceBuilder, {
    tags: tags,
  }) as Result;
};

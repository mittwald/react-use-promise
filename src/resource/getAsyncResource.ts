import { Tags } from "../store/Tags";
import { defaultStorageKeyBuilder } from "../store/defaultStorageKeyBuilder";
import { AsyncResource } from "./AsyncResource";
import { asyncResourceStore } from "./store";
import { LoaderFn, FnParameters, GetAsyncResourceOptions } from "./types";

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

  const resourceBuilder = () =>
    new AsyncResource(asyncResourceLoader, {
      tags: new Tags(tags),
    });

  return asyncResourceStore.getOrSet(storageKey, resourceBuilder, {
    tags: tags,
  });
}

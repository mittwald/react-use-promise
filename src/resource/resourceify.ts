import { AsyncFn, GetAsyncResourceOptions } from "./types.js";
import { AsyncResource } from "./AsyncResource.js";
import { getAsyncResource } from "./getAsyncResource.js";

export const resourceify =
  <TResult, TArgs extends unknown[]>(asyncFn: AsyncFn<TResult, TArgs>) =>
  (
    parameters: TArgs,
    options?: GetAsyncResourceOptions,
  ): AsyncResource<TResult> =>
    getAsyncResource(asyncFn, parameters, options);

import { AsyncFn, FnParameters, GetAsyncResourceOptions } from "./types.js";
import { getAsyncResource } from "./getAsyncResource.js";

export const resourceify =
  <TValue, TParams extends FnParameters>(asyncFn: AsyncFn<TValue, TParams>) =>
  (parameters: TParams | null, options?: GetAsyncResourceOptions) =>
    getAsyncResource(asyncFn, parameters, options);

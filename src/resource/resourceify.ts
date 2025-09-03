import { LoaderFn, FnParameters, GetAsyncResourceOptions } from "./types.js";
import { getAsyncResource } from "./getAsyncResource.js";

export const resourceify =
  <TValue, TParams extends FnParameters>(asyncFn: LoaderFn<TValue, TParams>) =>
  (parameters: TParams | null, options?: GetAsyncResourceOptions) =>
    getAsyncResource(asyncFn, parameters, options);

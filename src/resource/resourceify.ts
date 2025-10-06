import { LoaderFn, FnParameters, GetAsyncResourceOptions } from "./types";
import { getAsyncResource } from "./getAsyncResource";

export const resourceify =
  <TValue, TParams extends FnParameters>(asyncFn: LoaderFn<TValue, TParams>) =>
  (parameters: TParams | null, options?: GetAsyncResourceOptions) =>
    getAsyncResource(asyncFn, parameters, options);

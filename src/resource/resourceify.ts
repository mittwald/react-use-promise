import {
  AsyncFn,
  FnParameters,
  GetAsyncResourceOptions,
  NullableResourceValue,
} from "./types.js";
import { AsyncResource } from "./AsyncResource.js";
import { getAsyncResource } from "./getAsyncResource.js";

export const resourceify =
  <
    TValue,
    TParams extends FnParameters,
    TNullableParams extends TParams | null,
  >(
    asyncFn: AsyncFn<TValue, TParams>,
  ) =>
  (
    parameters: TNullableParams,
    options?: GetAsyncResourceOptions,
  ): AsyncResource<NullableResourceValue<TValue, TParams, TNullableParams>> =>
    getAsyncResource(asyncFn, parameters, options);

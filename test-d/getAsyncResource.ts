import { expectError, expectType } from "tsd";
import { getAsyncResource } from "../dist/index.js";
import { AsyncFn } from "../dist/resource/types.js";

declare const loader: AsyncFn<number, [boolean, string]>;

function testGetAsyncResourceRequiresCorrectParameters() {
  getAsyncResource(loader, null);
  expectError(getAsyncResource(loader, []));
  expectError(getAsyncResource(loader, [42]));
  expectError(getAsyncResource(loader, [42, 43]));
  expectError(getAsyncResource(loader, [true]));
  getAsyncResource(loader, [true, "foo"]);
  expectError(getAsyncResource(loader, [true, "foo", 42]));
}

function testWatchedResultIsLoaderReturnType() {
  const value = getAsyncResource(loader, [true, "foo"]).watch();
  expectType<number>(value);
}

function testWatchedResultIncludesUndefinedWhenParametersIsNull() {
  const optionalValue = getAsyncResource(loader, null).watch();
  expectType<number | undefined>(optionalValue);
}

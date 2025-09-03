import { LoaderFn } from "./types.js";
import { getAsyncResource } from "./getAsyncResource.js";
import { expectType } from "tsd";

declare const loader: LoaderFn<number, [boolean, string]>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testGetAsyncResourceRequiresCorrectParameters() {
  getAsyncResource(loader, null);
  // @ts-expect-error Should be an error
  getAsyncResource(loader, []);
  // @ts-expect-error Should be an error
  getAsyncResource(loader, [42]);
  // @ts-expect-error Should be an error
  getAsyncResource(loader, [42, 43]);
  // @ts-expect-error Should be an error
  getAsyncResource(loader, [true]);

  getAsyncResource(loader, [true, "foo"]);
  // @ts-expect-error Should be an error
  getAsyncResource(loader, [true, "foo", 42]);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testWatchedResultIsLoaderReturnType() {
  const value = getAsyncResource(loader, [true, "foo"]).use();
  expectType<number>(value);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testWatchedResultIncludesUndefinedWhenParametersIsNull() {
  const optionalValue = getAsyncResource(loader, null).use();
  expectType<number | undefined>(optionalValue);
}

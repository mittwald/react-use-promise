import { expectAssignable, expectError } from "tsd";
import { AsyncResource } from "../dist/resource/AsyncResource.js";

function testResultOfWatchMatchesAsyncLoaderReturnType() {
  interface ResultType {
    foo: number;
    bar: boolean;
  }

  const resource = {} as AsyncResource<ResultType>;
  const result = resource.watch();
  expectAssignable<ResultType>(result);
  expectError(result.unknownProp);
}

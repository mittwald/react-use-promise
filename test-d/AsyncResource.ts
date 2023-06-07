import { expectAssignable, expectError } from "tsd";
import { AsyncResource } from "../dist-cjs/resource/AsyncResource.js";

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

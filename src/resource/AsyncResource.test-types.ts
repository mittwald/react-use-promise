import { AsyncResource } from "./AsyncResource.js";
import { expectType } from "tsd";

interface ResultType {
  foo: number;
  bar: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testResultOfWatchMatchesAsyncLoaderReturnType() {
  const resource = {} as AsyncResource<ResultType>;

  const result = resource.use();
  expectType<ResultType>(result);

  // @ts-expect-error Test access to unknown props
  console.log(result.unknownProp);
}

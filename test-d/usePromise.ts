import { expectAssignable, expectError } from "tsd";
import { AsyncLoader } from "../dist-cjs/resource/types.js";
import { usePromise } from "../dist-cjs/index.js";

function testResultOfUsePromiseMatchesAsyncLoaderReturnType() {
  interface ResultType {
    foo: number;
    bar: boolean;
  }

  const loader = {} as AsyncLoader<ResultType>;
  const result = usePromise(loader, []);
  expectAssignable<ResultType>(result);
  expectError(result.unknownProp);
}

function testParametersOfUsePromiseMatchingAsyncLoaderParameters() {
  type AsyncLoader = (foo: number, bar: string) => Promise<unknown>;
  expectError(usePromise({} as AsyncLoader, []));
  expectError(usePromise({} as AsyncLoader, ["foo"]));
  expectError(usePromise({} as AsyncLoader, [42, 42]));
  usePromise({} as AsyncLoader, [42, "bar"]);
}

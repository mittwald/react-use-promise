import { expectAssignable, expectError } from "tsd";
import { AsyncLoader } from "../dist/resource/types.js";
import { usePromise } from "../dist/index.js";
import { NoSuspenseReturnType } from "../dist-cjs/resource/types.js";

interface ResultType {
  foo: number;
  bar: boolean;
}

declare const loader: AsyncLoader<ResultType>;

function testResultOfUsePromiseMatchesAsyncLoaderReturnType() {
  const result = usePromise(loader, []);
  expectAssignable<ResultType>(result);
  expectError(result.unknownProp);
}

function testResultOfUsePromiseMatchesAsyncLoaderReturnTypeWithDisabledSuspense() {
  const result = usePromise(loader, [], {
    useSuspense: false,
  });
  expectAssignable<NoSuspenseReturnType<ResultType>>(result);
}

function testParametersOfUsePromiseMatchingAsyncLoaderParameters() {
  type TestAsyncLoader = (foo: number, bar: string) => Promise<unknown>;
  const testAsyncLoader = {} as TestAsyncLoader;

  expectError(usePromise(testAsyncLoader, []));
  expectError(usePromise(testAsyncLoader, ["foo"]));
  expectError(usePromise(testAsyncLoader, [42, 42]));

  usePromise(testAsyncLoader, [42, "bar"]);
}

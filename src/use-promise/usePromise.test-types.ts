import { expectType } from "tsd";
import { AsyncFn, NoSuspenseReturnType } from "../resource/types.js";
import { usePromise } from "./usePromise.js";

interface ResultType {
  foo: number;
  bar: boolean;
}

declare const loader: AsyncFn<ResultType, [number]>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testResultOfUsePromiseMatchesAsyncLoaderReturnType() {
  const result = usePromise(loader, [0]);
  expectType<ResultType>(result);
  // @ts-expect-error Access to unknown prop
  console.log(result.unknownProp);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testResultOfUsePromiseMatchesAsyncLoaderReturnTypeWithDisabledSuspense() {
  const result = usePromise(loader, [0], {
    useSuspense: false,
  });
  expectType<NoSuspenseReturnType<ResultType>>(result);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testParametersOfUsePromiseMatchingAsyncLoaderParameters() {
  type TestAsyncLoader = (foo: number, bar: string) => Promise<unknown>;
  const testAsyncLoader = {} as TestAsyncLoader;

  // @ts-expect-error Access to unknown prop
  usePromise(testAsyncLoader, []);
  // @ts-expect-error Access to unknown prop
  usePromise(testAsyncLoader, ["foo"]);
  // @ts-expect-error Access to unknown prop
  usePromise(testAsyncLoader, [42, 42]);

  usePromise(testAsyncLoader, [42, "bar"]);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testResultTypeIncludeUndefinedWhenParametersAreNull() {
  const maybeNullParameters = {} as Parameters<typeof loader> | null;
  const result = usePromise(loader, maybeNullParameters);
  expectType<ResultType | undefined>(result);
}

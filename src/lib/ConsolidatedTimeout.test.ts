import { beforeEach, jest } from "@jest/globals";
import { ConsolidatedTimeout } from "./ConsolidatedTimeout.js";

const callback = jest.fn();

let timeout: ConsolidatedTimeout;

beforeEach((): void => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  timeout = new ConsolidatedTimeout(callback);
});

const testCallbackIsCalledAfter = (ms: number): void => {
  const beforeCalls = callback.mock.calls.length;
  jest.advanceTimersByTime(ms - 1);
  expect(callback).toHaveBeenCalledTimes(beforeCalls);
  jest.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(beforeCalls + 1);
};

const testCallbackIsNotCalledAfter = (ms: number): void => {
  const beforeCalls = callback.mock.calls.length;
  jest.advanceTimersByTime(ms - 1);
  expect(callback).toHaveBeenCalledTimes(beforeCalls);
  jest.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(beforeCalls);
};

test("Callback is not triggered after start when there is no timeout added", (): void => {
  timeout.start();
  testCallbackIsNotCalledAfter(Number.MAX_SAFE_INTEGER);
});

test("Callback is triggered (only once) after timeout added after start", (): void => {
  timeout.start();
  timeout.addTimeout({ milliseconds: 1000 });

  testCallbackIsCalledAfter(1000);
  testCallbackIsNotCalledAfter(Number.MAX_SAFE_INTEGER);
});

test("Callback is triggered after timeout added before start", (): void => {
  timeout.addTimeout({ milliseconds: 1000 });
  timeout.start();
  testCallbackIsCalledAfter(1000);
});

test("Callback is triggered at minimum timeout", (): void => {
  timeout.start();
  timeout.addTimeout({ milliseconds: 1000 });
  timeout.addTimeout({ milliseconds: 500 });
  testCallbackIsCalledAfter(500);
});

test("Consecutive start call restarts the timeout", (): void => {
  timeout.start();
  timeout.addTimeout({ milliseconds: 1000 });
  testCallbackIsNotCalledAfter(999);

  timeout.start();
  testCallbackIsNotCalledAfter(500);
  testCallbackIsCalledAfter(500);
});

test("Callback is triggered when adding timeout while already running", (): void => {
  timeout.start();

  timeout.addTimeout({ milliseconds: 1000 });
  testCallbackIsNotCalledAfter(499);

  timeout.addTimeout({ milliseconds: 500 });
  testCallbackIsCalledAfter(1);
});

test("Callback is triggered instantly when adding due timeout while already running", (): void => {
  timeout.start();

  timeout.addTimeout({ milliseconds: 1000 });
  testCallbackIsNotCalledAfter(501);
  timeout.addTimeout({ milliseconds: 500 });
  expect(callback).toHaveBeenCalledTimes(1);
});

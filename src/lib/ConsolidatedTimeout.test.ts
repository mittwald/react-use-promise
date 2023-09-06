import { jest, afterEach, beforeEach } from "@jest/globals";
import { ConsolidatedTimeout } from "./ConsolidatedTimeout.js";

const callback = jest.fn();

let timeout: ConsolidatedTimeout;

beforeEach((): void => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  timeout = new ConsolidatedTimeout(callback);
});

afterEach((): void => {
  timeout.stop();
});

test("Callback is not triggered after start when there is no timeout added", (): void => {
  timeout.start();
  jest.advanceTimersByTime(Number.MAX_SAFE_INTEGER);
  expect(callback).not.toHaveBeenCalled();
});

test("Callback is triggered (only once) after timeout added after start", (): void => {
  timeout.start();
  timeout.addTimeout({ milliseconds: 1000 });

  jest.advanceTimersByTime(999);
  expect(callback).toHaveBeenCalledTimes(0);

  jest.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(Number.MAX_SAFE_INTEGER);
  expect(callback).toHaveBeenCalledTimes(1);
});

test("Callback is triggered after timeout added before start", (): void => {
  timeout.addTimeout({ milliseconds: 1000 });
  timeout.start();

  jest.advanceTimersByTime(999);
  expect(callback).toHaveBeenCalledTimes(0);

  jest.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(1);
});

test("Callback is triggered at minimum timeout", (): void => {
  timeout.start();
  timeout.addTimeout({ milliseconds: 1000 });
  timeout.addTimeout({ milliseconds: 500 });

  jest.advanceTimersByTime(499);
  expect(callback).toHaveBeenCalledTimes(0);

  jest.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(1);
});

test("Consecutive start call restarts the timeout", (): void => {
  timeout.start();
  timeout.addTimeout({ milliseconds: 1000 });
  jest.advanceTimersByTime(999);

  timeout.start();
  jest.advanceTimersByTime(500);
  expect(callback).toHaveBeenCalledTimes(0);
  jest.advanceTimersByTime(500);
  expect(callback).toHaveBeenCalledTimes(1);
});

test("Callback is triggered when adding timeout while already running", (): void => {
  timeout.start();

  timeout.addTimeout({ milliseconds: 1000 });
  jest.advanceTimersByTime(499);

  timeout.addTimeout({ milliseconds: 500 });
  expect(callback).toHaveBeenCalledTimes(0);

  jest.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(1);
});

test("Callback is triggered instantly when adding due timeout while already running", (): void => {
  timeout.start();

  timeout.addTimeout({ milliseconds: 1000 });
  jest.advanceTimersByTime(501);
  expect(callback).toHaveBeenCalledTimes(0);

  timeout.addTimeout({ milliseconds: 500 });
  expect(callback).toHaveBeenCalledTimes(1);
});

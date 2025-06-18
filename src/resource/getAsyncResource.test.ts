import { beforeEach, expect, jest, test } from "@jest/globals";
import { sleep } from "../lib/testing.js";
import { getAsyncResource } from "./getAsyncResource.js";
import { AsyncResource } from "./AsyncResource.js";
import { asyncResourceStore } from "./store.js";

const sleepTime = 2000;

beforeEach(() => {
  jest.useFakeTimers();
  asyncResourceStore.clear();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const loader = jest.fn(async (value: string): Promise<string> => {
  await sleep(sleepTime);
  return value;
});

const load = async (resource: AsyncResource): Promise<void> => {
  const loadingPromise = resource.load();
  jest.advanceTimersToNextTimer();
  await loadingPromise;
};

test("Expect loader is not called when parameters is null", async () => {
  const resource = getAsyncResource(loader, null);
  await load(resource);
  expect(loader).not.toHaveBeenCalled();
});

test("Expect value is undefined when parameters is null", async () => {
  const resource = getAsyncResource(loader, null);
  await load(resource);

  const value = resource.value.value.isSet
    ? resource.value.value.value
    : undefined;

  expect(resource.value.value.isSet).toBe(true);
  expect(value).toBe(undefined);
});

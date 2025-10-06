import { vitest, beforeEach, expect, test, afterEach } from "vitest";
import { sleep } from "../lib/testing";
import { getAsyncResource } from "./getAsyncResource";
import { AsyncResource } from "./AsyncResource";
import { asyncResourceStore } from "./store";

const sleepTime = 2000;

beforeEach(() => {
  vitest.useFakeTimers();
  asyncResourceStore.clear();
});

afterEach(() => {
  vitest.runOnlyPendingTimers();
  vitest.useRealTimers();
});

const loader = vitest.fn(async (value: string): Promise<string> => {
  await sleep(sleepTime);
  return value;
});

const load = async (resource: AsyncResource): Promise<void> => {
  const loadingPromise = resource.load();
  vitest.advanceTimersToNextTimer();
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

test("Expect meta is set", async () => {
  const resource = getAsyncResource(loader, ["test"]);
  expect(resource.meta).toBeDefined();
});

test("Expect tags are set in meta", async () => {
  const resource = getAsyncResource(loader, ["test"], {
    tags: ["tag1", "tag2"],
  });
  expect(resource.meta.tags?.tags).toEqual(["tag1", "tag2"]);
});

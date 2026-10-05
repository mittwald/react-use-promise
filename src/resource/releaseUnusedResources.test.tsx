import { act, cleanup } from "@testing-library/react";
import { FC, Suspense } from "react";
import { afterEach, beforeEach, expect, test, vitest } from "vitest";
import { FakeWeakRef, render, sleep } from "../lib/testing.js";
import { AsyncResource } from "./AsyncResource.js";
import { getAsyncResource } from "./getAsyncResource.js";
import { refresh } from "./refresh.js";
import { releaseUnusedResources } from "./releaseUnusedResources.js";
import { asyncResourceStore } from "./store.js";

const loadingTime = 1000;
const unusedFor = { minutes: 10 };
const unusedForMs = 10 * 60 * 1000;

const loader = vitest.fn(async (id: number) => {
  await sleep(loadingTime);
  return `Value ${id}`;
});

const slowLoader = async (): Promise<string> => {
  await sleep(unusedForMs * 2);
  return "Value";
};

const getResource = (): AsyncResource<string> => getAsyncResource(loader, [1]);

const loadResource = async (): Promise<AsyncResource<string>> => {
  const resource = getResource();
  resource.load();
  const loaded = resource.suspensePromise;
  await vitest.advanceTimersByTimeAsync(loadingTime);
  await loaded;
  return resource;
};

const releaseAndCollect = (resource: AsyncResource): void => {
  releaseUnusedResources({ unusedFor });
  FakeWeakRef.collect(resource);
};

const expectStoredResources = (...expected: AsyncResource[]): void => {
  const stored = asyncResourceStore.getAll();
  expect(stored).toHaveLength(expected.length);
  expected.forEach((resource, index) => {
    expect(stored[index]).toBe(resource);
  });
};

beforeEach(() => {
  vitest.useFakeTimers();
  vitest.stubGlobal("WeakRef", FakeWeakRef);
  asyncResourceStore.clear();
  loader.mockClear();
});

afterEach(() => {
  vitest.runOnlyPendingTimers();
  vitest.useRealTimers();
  vitest.unstubAllGlobals();
  cleanup();
});

test("releases resources that were not used for the given duration", async () => {
  const resource = await loadResource();
  vitest.advanceTimersByTime(unusedForMs);

  releaseAndCollect(resource);

  expectStoredResources();
});

test("keeps resources that were used within the given duration", async () => {
  const resource = await loadResource();
  vitest.advanceTimersByTime(unusedForMs / 2);
  getResource();
  vitest.advanceTimersByTime(unusedForMs / 2);

  releaseAndCollect(resource);

  expectStoredResources(resource);
});

test("keeps resources that are still loading", () => {
  const resource = getAsyncResource(slowLoader, []);
  resource.load();
  vitest.advanceTimersByTime(unusedForMs);

  releaseAndCollect(resource);

  expectStoredResources(resource);
});

test("keeps resources for the given duration after loading finished", async () => {
  const resource = getAsyncResource(slowLoader, []);
  resource.load();
  const loaded = resource.suspensePromise;
  await vitest.advanceTimersByTimeAsync(unusedForMs * 2);
  await loaded;

  releaseAndCollect(resource);

  expectStoredResources(resource);
});

test("keeps resources while watched and for the given duration after unmount", async () => {
  const resource = getResource();
  const ResourceView: FC = () => <>{getResource().use()}</>;

  const view = await render(
    <Suspense fallback="Loading">
      <ResourceView />
    </Suspense>,
  );
  await act(() => vitest.advanceTimersByTimeAsync(loadingTime));
  expect(view.container.textContent).toBe("Value 1");

  vitest.advanceTimersByTime(unusedForMs);
  releaseAndCollect(resource);
  expectStoredResources(resource);

  view.unmount();
  releaseAndCollect(resource);
  expectStoredResources(resource);

  vitest.advanceTimersByTime(unusedForMs);
  releaseAndCollect(resource);
  expectStoredResources();
});

test("released resources stay reachable while they are still referenced", async () => {
  const resource = await loadResource();
  vitest.advanceTimersByTime(unusedForMs);

  releaseUnusedResources({ unusedFor });
  refresh();

  expect(resource.value.value.isSet).toBe(false);
  expect(getResource()).toBe(resource);
});

test("loads collected resources again on next use", async () => {
  const collectedResource = await loadResource();
  vitest.advanceTimersByTime(unusedForMs);
  releaseAndCollect(collectedResource);

  const newResource = await loadResource();

  expect(newResource).not.toBe(collectedResource);
  expect(newResource.value.value).toEqual({ isSet: true, value: "Value 1" });
  expect(loader).toHaveBeenCalledTimes(2);
});

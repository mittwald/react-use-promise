import {
  vitest,
  beforeEach,
  expect,
  test,
  Mock,
  afterEach,
  describe,
} from "vitest";
import { ResourceLoader } from "./types";
import { AsyncResource } from "./AsyncResource";
import { sleep } from "../lib/testing";
import { getAsyncResource } from "./getAsyncResource";

let loaderCalls = 0;
let sleepTime: Mock<() => number>;
const loadingTime = 10000;

let loader: Mock<ResourceLoader>;
const loaderImpl = async () => {
  loaderCalls++;
  await sleep(sleepTime());
  return `#${loaderCalls} call`;
};

let errorLoader: Mock<ResourceLoader>;
const errorLoaderImpl = async () => {
  loaderCalls++;
  await sleep(sleepTime());
  throw new Error("Whoops");
};

beforeEach(() => {
  vitest.resetAllMocks();
  vitest.useFakeTimers();

  loaderCalls = 0;
  sleepTime = vitest.fn(() => loadingTime);

  loader = vitest.fn(loaderImpl);
  errorLoader = vitest.fn(errorLoaderImpl);
});

afterEach(() => {
  vitest.runOnlyPendingTimers();
  vitest.useRealTimers();
});

describe("calling load()", () => {
  test("triggers loader", async () => {
    const resource = new AsyncResource(loader);
    expect(loader).toHaveBeenCalledTimes(0);
    resource.load();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  test("resource uses 'fresh' loader when function execution scope changes", async () => {
    const loaded: string[] = [];

    const scopedFn = async (scopedInputVar: string) => {
      const resource = getAsyncResource(async () => {
        await sleep(sleepTime());
        return scopedInputVar;
      }, []);

      resource.refresh();
      resource.load();
      await vitest.advanceTimersByTimeAsync(loadingTime);
      if (resource.value.value.isSet) {
        loaded.push(resource.value.value.value);
      }
    };

    await scopedFn("foo");
    await scopedFn("bar");

    expect(loaded).toEqual(["foo", "bar"]);
  });

  test("twice does not trigger loader twice", async () => {
    const resource = new AsyncResource(loader);
    // load
    resource.load();
    expect(loader).toHaveBeenCalledTimes(1);
    // after 100ms load again
    await vitest.advanceTimersByTimeAsync(loadingTime / 2);
    resource.load();
    expect(loader).toHaveBeenCalledTimes(1);
    // wait for second load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  test("can be superseded by another load() call if cleared in between", async () => {
    const resource = new AsyncResource(loader);
    // #1 load for 50ms
    sleepTime.mockReturnValue(50);
    resource.load();
    // after 10ms clear
    await vitest.advanceTimersByTimeAsync(10);
    void resource.refresh();
    // 2# load for 20ms
    sleepTime.mockReturnValue(20);
    resource.load();
    // wait for second load
    await vitest.advanceTimersByTimeAsync(20);
    if (!resource.value.value.isSet) {
      throw new Error("Should not happen");
    }
    expect(resource.value.value.value).toBe("#2 call");
  });

  test("will be aborted if cleared during loading", async () => {
    const resource = new AsyncResource(loader);
    // load
    resource.load();
    // while still loading
    await vitest.advanceTimersByTimeAsync(loadingTime / 2);
    resource.refresh();
    // wait for load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    expect(resource.value.value.isSet).toBe(false);
  });
});

describe(".value", () => {
  test("is empty on fresh resources", () => {
    const resource = new AsyncResource(loader);
    expect(resource.value.value.isSet).toBe(false);
  });

  test("is set after loader is done", async () => {
    const resource = new AsyncResource(loader);
    // load
    resource.load();
    // wait for load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    if (!resource.value.value.isSet) {
      throw new Error("Should not happen");
    }
    expect(resource.value.value.value).toBe("#1 call");
  });

  test("is empty after clear()", async () => {
    const resource = new AsyncResource(loader);
    // load
    resource.load();
    // wait for load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    resource.refresh();
    expect(resource.value.value.isSet).toBe(false);
  });

  test("is updated after loading again when cleared", async () => {
    const resource = new AsyncResource(loader);
    // load
    resource.load();
    // wait for load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    resource.refresh();
    // load again for 1000ms
    resource.load();
    // wait for load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    if (!resource.value.value.isSet) {
      throw new Error("Should not happen");
    }
    expect(resource.value.value.value).toBe("#2 call");
  });
});

describe(".error", () => {
  test("is empty on fresh resources", () => {
    const resource = new AsyncResource(errorLoader);
    expect(resource.error.value.isSet).toBe(false);
  });

  test("is set after loader throws error", async () => {
    const resource = new AsyncResource(errorLoader);
    // load
    resource.load();
    // wait for load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    if (!resource.error.value.isSet) {
      throw new Error("Should not happen");
    }
    expect(resource.error.value.value).toBeInstanceOf(Error);
  });

  test("is empty after clear()", async () => {
    const resource = new AsyncResource(errorLoader);
    // load
    resource.load();
    // wait for load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    resource.refresh();
    expect(resource.error.value.isSet).toBe(false);
  });

  test("is empty when becoming stale", async () => {
    const resource = new AsyncResource(errorLoader);
    // load
    resource.load();
    // wait for load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    expect(resource.error.value.isSet).toBe(true);
  });

  test("is updated after loading again when cleared", async () => {
    const resource = new AsyncResource(errorLoader);
    // load
    resource.load();
    // wait for load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    resource.refresh();
    errorLoader.mockImplementation(loaderImpl);
    // load again (now without error)
    resource.load();
    // wait for load
    await vitest.advanceTimersByTimeAsync(loadingTime);
    if (!resource.value.value.isSet) {
      throw new Error("Should not happen");
    }
    expect(resource.value.value.value).toBe("#2 call");
    expect(resource.error.value.isSet).toBe(false);
  });
});

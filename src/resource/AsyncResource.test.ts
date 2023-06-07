import { beforeEach, jest } from "@jest/globals";
import { AsyncLoader } from "./types.js";
import { AsyncResource } from "./AsyncResource.js";

const sleep = (ms: number) => {
  return new Promise((res) => setTimeout(res, ms));
};

let loaderCalls = 0;
let sleepTime: jest.Mock<() => number>;
const loadingTime = 10000;

let loader: jest.Mock<AsyncLoader>;
const loaderImpl = async () => {
  loaderCalls++;
  await sleep(sleepTime());
  return `#${loaderCalls} call`;
};

let errorLoader: jest.Mock<AsyncLoader>;
const errorLoaderImpl = async () => {
  loaderCalls++;
  await sleep(sleepTime());
  throw new Error("Whoops");
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();

  loaderCalls = 0;
  sleepTime = jest.fn(() => loadingTime);

  loader = jest.fn(loaderImpl);
  errorLoader = jest.fn(errorLoaderImpl);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("calling load()", () => {
  test("triggers loader", async () => {
    const resource = new AsyncResource(loader);
    expect(loader).toHaveBeenCalledTimes(0);
    resource.load();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  test("twice does not trigger loader twice", async () => {
    const resource = new AsyncResource(loader);
    // load
    resource.load();
    expect(loader).toHaveBeenCalledTimes(1);
    // after 100ms load again
    await jest.advanceTimersByTimeAsync(loadingTime / 2);
    resource.load();
    expect(loader).toHaveBeenCalledTimes(1);
    // wait for second load
    await jest.advanceTimersByTimeAsync(loadingTime);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  test("twice does trigger loader twice when TTL is reached", async () => {
    const resource = new AsyncResource(loader, {
      ttl: { milliseconds: 100 },
    });
    // load
    resource.load();
    expect(loader).toHaveBeenCalledTimes(1);
    // wait for load
    await jest.advanceTimersByTimeAsync(loadingTime);
    // wait for TTL-1 -> not loading again
    await jest.advanceTimersByTimeAsync(99);
    resource.load();
    expect(loader).toHaveBeenCalledTimes(1);
    // wait for TTL rest -> loading again
    await jest.advanceTimersByTimeAsync(1);
    resource.load();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  test("can be superseded by another load() call if cleared in between", async () => {
    const resource = new AsyncResource(loader);
    // #1 load for 50ms
    sleepTime.mockReturnValue(50);
    resource.load();
    // after 10ms clear
    await jest.advanceTimersByTimeAsync(10);
    resource.refresh();
    // 2# load for 20ms
    sleepTime.mockReturnValue(20);
    resource.load();
    // wait for second load
    await jest.advanceTimersByTimeAsync(20);
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
    await jest.advanceTimersByTimeAsync(loadingTime / 2);
    resource.refresh();
    // wait for load
    await jest.advanceTimersByTimeAsync(loadingTime);
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
    await jest.advanceTimersByTimeAsync(loadingTime);
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
    await jest.advanceTimersByTimeAsync(loadingTime);
    resource.refresh();
    expect(resource.value.value.isSet).toBe(false);
  });

  test("is empty when becoming stale", async () => {
    const resource = new AsyncResource(loader, {
      ttl: {
        milliseconds: 100,
      },
    });
    // load
    resource.load();
    // wait for load
    await jest.advanceTimersByTimeAsync(loadingTime);
    expect(resource.value.value.isSet).toBe(true);
    // after TTL
    jest.advanceTimersByTime(100);
    expect(resource.value.value.isSet).toBe(false);
  });

  test("is updated after loading again when cleared", async () => {
    const resource = new AsyncResource(loader);
    // load
    resource.load();
    // wait for load
    await jest.advanceTimersByTimeAsync(loadingTime);
    resource.refresh();
    // load again for 1000ms
    resource.load();
    // wait for load
    await jest.advanceTimersByTimeAsync(loadingTime);
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
    await jest.advanceTimersByTimeAsync(loadingTime);
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
    await jest.advanceTimersByTimeAsync(loadingTime);
    resource.refresh();
    expect(resource.error.value.isSet).toBe(false);
  });

  test("is empty when becoming stale", async () => {
    const resource = new AsyncResource(errorLoader, {
      ttl: {
        milliseconds: 100,
      },
    });
    // load
    resource.load();
    // wait for load
    await jest.advanceTimersByTimeAsync(loadingTime);
    expect(resource.error.value.isSet).toBe(true);
    // after TTL
    jest.advanceTimersByTime(100);
    expect(resource.error.value.isSet).toBe(false);
  });

  test("is updated after loading again when cleared", async () => {
    const resource = new AsyncResource(errorLoader);
    // load
    resource.load();
    // wait for load
    await jest.advanceTimersByTimeAsync(loadingTime);
    resource.refresh();
    errorLoader.mockImplementation(loaderImpl);
    // load again (now without error)
    resource.load();
    // wait for load
    await jest.advanceTimersByTimeAsync(loadingTime);
    if (!resource.value.value.isSet) {
      throw new Error("Should not happen");
    }
    expect(resource.value.value.value).toBe("#2 call");
    expect(resource.error.value.isSet).toBe(false);
  });
});

test("TTL is 'restarted' on reload", async () => {
  const ttl = loadingTime * 4;
  const resource = new AsyncResource(loader, {
    ttl: {
      milliseconds: ttl,
    },
  });

  // load
  resource.load();
  // wait for load
  await jest.advanceTimersByTimeAsync(loadingTime);
  // wait for TTL/2
  await jest.advanceTimersByTimeAsync(ttl / 2);
  // reload resource
  resource.refresh();
  // load
  resource.load();
  // wait for load
  await jest.advanceTimersByTimeAsync(loadingTime);
  // wait for TTL/2 -> resource not cleared
  await jest.advanceTimersByTimeAsync(ttl / 2);
  expect(resource.value.value.isSet).toBe(true);
  // wait for another TTL/2 -> resource finally cleared due to TTL
  await jest.advanceTimersByTimeAsync(ttl / 2);
  expect(resource.value.value.isSet).toBe(false);
});

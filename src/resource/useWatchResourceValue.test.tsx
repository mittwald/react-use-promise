import { beforeEach, describe, jest, test } from "@jest/globals";
import { act, cleanup, screen } from "@testing-library/react";
import React, { FC } from "react";
import { render, RenderWithLoadingView, sleep } from "../lib/testing.js";
import { AsyncResource } from "./AsyncResource.js";
import { AsyncLoader, UseWatchResourceOptions } from "./types.js";
import { useWatchResourceValue } from "./useWatchResourceValue.js";

let testResource: AsyncResource<string>;
let testResource2: AsyncResource<string>;
let getName: jest.Mock<() => string>;
let getName2: jest.Mock<() => string>;
let getTestResource: jest.Mock<() => AsyncResource<string>>;
let getNameAsync: jest.Mock<AsyncLoader<string>>;
let getNameAsync2: jest.Mock<AsyncLoader<string>>;
let options: UseWatchResourceOptions;
const loadingTime = 10000;

beforeEach(() => {
  jest.useFakeTimers();
  getName = jest.fn(() => "Foo");
  getName2 = jest.fn(() => "Foo2");
  getNameAsync = jest.fn(async () => {
    await sleep(loadingTime);
    return getName();
  });
  getNameAsync2 = jest.fn(async () => {
    await sleep(loadingTime);
    return getName2();
  });
  getTestResource = jest.fn(() => testResource);
  testResource = new AsyncResource(getNameAsync);
  testResource2 = new AsyncResource(getNameAsync2);
  options = {};
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  cleanup();
});

const renderInternal = () => {
  const value = useWatchResourceValue(getTestResource(), options);
  return <span data-testid="resource-value">{JSON.stringify(value)}</span>;
};

const TestView: FC = () => (
  <RenderWithLoadingView>{renderInternal}</RenderWithLoadingView>
);

const expectValue = (value: unknown): void => {
  screen.getByText(JSON.stringify(value));
};

const waitToBeLoaded = async (percent = 100): Promise<void> => {
  await act(
    async () =>
      await jest.advanceTimersByTimeAsync(loadingTime * (percent / 100)),
  );
};

test("Loading view is triggered", async () => {
  await render(<TestView />);
  await waitToBeLoaded(10);
  screen.getByTestId("loading-view");
  await waitToBeLoaded(90);
});

test("Error view is triggered", async () => {
  await render(<TestView />);
  getName.mockImplementation(() => {
    throw new Error("Whoops");
  });
  await waitToBeLoaded(10);
  screen.getByTestId("loading-view");
  await waitToBeLoaded(90);
  screen.getByText("ErrorFallback");
});

test("Error view is triggered after previous success", async () => {
  await render(<TestView />);
  await waitToBeLoaded(10);
  screen.getByTestId("loading-view");
  await waitToBeLoaded(90);

  getTestResource.mockReturnValue(testResource2);
  getName2.mockImplementation(() => {
    throw new Error("Whoops");
  });

  await render(<TestView />);
  await waitToBeLoaded(100);
  screen.getByText("ErrorFallback");
});

test("Greeting component renders after some time", async () => {
  await render(<TestView />);
  await waitToBeLoaded();
  screen.getByTestId("resource-value");
});

test("useWatchResourceValue() returns resolved resource value", async () => {
  await render(<TestView />);
  await waitToBeLoaded();
  expectValue("Foo");
});

test("renders old value when reloading and then new value", async () => {
  await render(<TestView />);
  await waitToBeLoaded();

  expectValue("Foo");

  // refresh resource
  getName.mockReturnValue("Bar");
  act(() => {
    testResource.refresh();
  });
  // wait for 50% -> old value visible
  await waitToBeLoaded(50);
  expectValue("Foo");

  await waitToBeLoaded(50);
  expectValue("Bar");
});

test("focus event triggers resource refresh, if 'refreshOnWindowFocus' is enabled", async () => {
  options.refreshOnWindowFocus = true;
  await render(<TestView />);
  await waitToBeLoaded();
  expectValue("Foo");

  getName.mockReturnValue("Bar");
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });

  await waitToBeLoaded();
  expectValue("Bar");
});

test("focus event does not trigger resource refresh, if 'refreshOnWindowFocus' is not enabled", async () => {
  await render(<TestView />);
  await waitToBeLoaded();
  expectValue("Foo");

  getName.mockReturnValue("Bar");
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });

  await waitToBeLoaded();
  expectValue("Foo");
});

test("visibilitychange event triggers resource refresh, if 'refreshOnDocumentVisibilityChange' is enabled", async () => {
  options.refreshOnDocumentVisibilityChange = true;
  await render(<TestView />);
  await waitToBeLoaded();
  expectValue("Foo");

  getName.mockReturnValue("Bar");
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });

  await waitToBeLoaded();
  expectValue("Bar");
});

test("visibilitychange event does not trigger resource refresh, if 'refreshOnVisibilityChange' is not enabled", async () => {
  await render(<TestView />);
  await waitToBeLoaded();
  expectValue("Foo");

  getName.mockReturnValue("Bar");
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });

  await waitToBeLoaded();
  expectValue("Foo");
});

describe("with disabled suspense", () => {
  beforeEach(() => {
    options.useSuspense = false;
  });

  test("Loading view is not triggered", async () => {
    await render(<TestView />);
    screen.getByTestId("resource-value");
  });

  test("useWatchResourceValue() returns empty value when not loaded", async () => {
    await render(<TestView />);
    expectValue({
      hasValue: false,
      isLoading: true,
    });
  });

  test("useWatchResourceValue() returns eventual value when loaded", async () => {
    await render(<TestView />);
    await waitToBeLoaded();
    expectValue({
      maybeValue: "Foo",
      value: "Foo",
      hasValue: true,
      isLoading: false,
    });
  });

  test("'isLoading' is true when reloading", async () => {
    await render(<TestView />);
    await waitToBeLoaded();

    expectValue({
      maybeValue: "Foo",
      value: "Foo",
      hasValue: true,
      isLoading: false,
    });

    // refresh resource
    getName.mockReturnValue("Bar");
    act(() => {
      testResource.refresh();
    });
    // wait 50% -> old value visible
    await waitToBeLoaded(50);

    expectValue({
      maybeValue: "Foo",
      value: "Foo",
      hasValue: true,
      isLoading: true,
    });

    await waitToBeLoaded(60);

    expectValue({
      maybeValue: "Bar",
      value: "Bar",
      hasValue: true,
      isLoading: false,
    });
  });

  test("value is not set when reloading and 'keepValueWhileLoading' is disabled", async () => {
    options.keepValueWhileLoading = false;

    await render(<TestView />);
    await waitToBeLoaded();

    // refresh resource
    getName.mockReturnValue("Bar");
    act(() => {
      testResource.refresh();
    });

    // wait 50% -> old value visible
    await waitToBeLoaded(50);

    expectValue({
      hasValue: false,
      isLoading: true,
    });

    await waitToBeLoaded(50);

    expectValue({
      maybeValue: "Bar",
      value: "Bar",
      hasValue: true,
      isLoading: false,
    });
  });
});

import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import React, { FC } from "react";
import { AsyncLoader, UseWatchResourceOptions } from "./types.js";
import { AsyncResource } from "./AsyncResource.js";
import { useWatchResourceValue } from "./useWatchResourceValue.js";
import { act, screen, waitFor } from "@testing-library/react";
import { render, RenderWithLoadingView, sleep } from "../lib/testing.js";

let testResource: AsyncResource<string>;
let getName: jest.Mock<() => string>;
let getNameAsync: jest.Mock<AsyncLoader<string>>;
let renderCount: number;
let options: UseWatchResourceOptions;
const loadingTime = 10000;

beforeEach(() => {
  jest.useFakeTimers();
  renderCount = 0;
  getName = jest.fn(() => "Foo");
  getNameAsync = jest.fn(async () => {
    await sleep(loadingTime);
    return getName();
  });
  testResource = new AsyncResource(getNameAsync);
  options = {};
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const TestView: FC = () => (
  <RenderWithLoadingView>
    {() => {
      renderCount++;
      const value = useWatchResourceValue(testResource, options);
      return <span data-testid="resource-value">{JSON.stringify(value)}</span>;
    }}
  </RenderWithLoadingView>
);

const waitForRendered = async (count: number): Promise<void> => {
  jest.advanceTimersToNextTimer();
  await waitFor(() => expect(renderCount).toBe(count));
};

const expectValue = (value: unknown): void => {
  screen.getByText(JSON.stringify(value));
};

const waitToBeLoaded = async (percent = 100): Promise<void> => {
  await act(() => jest.advanceTimersByTimeAsync(loadingTime * (percent / 100)));
};

test("Loading view is triggered", async () => {
  render(<TestView />);
  screen.getByTestId("loading-view");
  await waitForRendered(2);
});

test("Greeting component renders after some time", async () => {
  render(<TestView />);
  await waitForRendered(2);
  screen.getByTestId("resource-value");
});

test("useWatchResourceValue() returns resolved resource value", async () => {
  render(<TestView />);
  await waitForRendered(2);
  expectValue("Foo");
});

test("renders old value when reloading and then new value", async () => {
  render(<TestView />);
  await waitForRendered(2);

  expectValue("Foo");

  // refresh resource
  getName.mockReturnValue("Bar");
  act(() => {
    testResource.refresh();
  });
  // wait for 50% -> old value visible
  await waitToBeLoaded(50);
  expectValue("Foo");

  await waitForRendered(4);
  expectValue("Bar");
});

test("focus event triggers resource refresh, if 'refreshOnWindowFocus' is enabled", async () => {
  options.refreshOnWindowFocus = true;
  render(<TestView />);
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
  render(<TestView />);
  await waitToBeLoaded();
  expectValue("Foo");

  getName.mockReturnValue("Bar");
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });

  await waitToBeLoaded();
  expectValue("Foo");
});

describe("with disabled suspense", () => {
  beforeEach(() => {
    options.useSuspense = false;
  });

  test("Loading view is not triggered", async () => {
    render(<TestView />);
    screen.getByTestId("resource-value");
  });

  test("useWatchResourceValue() returns empty value when not loaded", async () => {
    render(<TestView />);
    expectValue({
      hasValue: false,
      isLoading: true,
    });
  });

  test("useWatchResourceValue() returns eventual value when loaded", async () => {
    render(<TestView />);
    await waitForRendered(2);
    expectValue({
      maybeValue: "Foo",
      value: "Foo",
      hasValue: true,
      isLoading: false,
    });
  });

  test("'isLoading' is true when reloading", async () => {
    render(<TestView />);
    await waitForRendered(2);

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

    await waitForRendered(4);

    expectValue({
      maybeValue: "Bar",
      value: "Bar",
      hasValue: true,
      isLoading: false,
    });
  });

  test("value is not set when reloading and 'keepValueWhileLoading' is disabled", async () => {
    options.keepValueWhileLoading = false;

    render(<TestView />);
    await waitForRendered(2);

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

    await waitForRendered(4);

    expectValue({
      maybeValue: "Bar",
      value: "Bar",
      hasValue: true,
      isLoading: false,
    });
  });
});

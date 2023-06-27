import { beforeEach, expect, jest, test } from "@jest/globals";
import React, { FC } from "react";
import { AsyncLoader, UseWatchResourceOptions } from "./types.js";
import { AsyncResource } from "./AsyncResource.js";
import { useWatchResourceValue } from "./useWatchResourceValue.js";
import { act, render, screen, waitFor } from "@testing-library/react";
import { RenderWithLoadingView, sleep } from "../lib/testing.js";

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

test("Loading view is triggered", async () => {
  render(<TestView />);
  screen.getByTestId("loading-view");
  await waitForRendered(2);
});

test("Loading view is not triggered, when not using suspense", async () => {
  options.useSuspense = false;
  render(<TestView />);
  screen.getByTestId("resource-value");
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

test("useWatchResourceValue() returns eventual value, when not using suspense", async () => {
  options.useSuspense = false;
  render(<TestView />);
  expectValue({ isSet: false });
  await waitForRendered(2);
  expectValue({ isSet: true, value: "Foo" });
});

test("renders old value when reloading and then new value", async () => {
  render(<TestView />);
  await waitForRendered(2);

  expectValue("Foo");

  // refresh resource
  getName.mockReturnValue("Bar");
  await act(() => {
    testResource.refresh();
  });
  // wait some time -> old value visible
  await jest.advanceTimersByTimeAsync(loadingTime / 2);
  expectValue("Foo");

  await waitForRendered(4);
  expectValue("Bar");
});

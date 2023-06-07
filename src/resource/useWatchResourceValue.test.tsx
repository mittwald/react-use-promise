import { beforeEach, expect, jest, test } from "@jest/globals";
import React, { FC } from "react";
import { AsyncLoader } from "./types.js";
import { AsyncResource } from "./AsyncResource.js";
import { useWatchResourceValue } from "./useWatchResourceValue.js";
import { act, render, screen, waitFor } from "@testing-library/react";
import { RenderWithLoadingView, sleep } from "../lib/testing.js";

let nameResource: AsyncResource<string>;
let getName: jest.Mock<() => string>;
let getNameAsync: jest.Mock<AsyncLoader<string>>;
let renderCount: number;
const loadingTime = 10000;

beforeEach(() => {
  jest.useFakeTimers();
  renderCount = 0;
  getName = jest.fn(() => "Foo");
  getNameAsync = jest.fn(async () => {
    await sleep(loadingTime);
    return getName();
  });
  nameResource = new AsyncResource(getNameAsync);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const GreetingView: FC = () => (
  <RenderWithLoadingView>
    {() => {
      renderCount++;
      const name = useWatchResourceValue(nameResource);
      return <span data-testid="greeting-view">Hello {name}</span>;
    }}
  </RenderWithLoadingView>
);

const waitForRendered = async (count: number): Promise<void> => {
  jest.advanceTimersToNextTimer();
  await waitFor(() => expect(renderCount).toBe(count));
};

test("Loading view is triggered", async () => {
  render(<GreetingView />);
  screen.getByTestId("loading-view");
  await waitForRendered(2);
});

test("Greeting component renders after some time", async () => {
  render(<GreetingView />);
  await waitForRendered(2);
  screen.getByTestId("greeting-view");
});

test("useWatchResourceValue() returns resolved resource value", async () => {
  render(<GreetingView />);
  await waitForRendered(2);
  screen.getByText("Hello Foo");
});

test("renders old value when reloading and then new value", async () => {
  render(<GreetingView />);
  await waitForRendered(2);

  screen.getByText("Hello Foo");

  // refresh resource
  getName.mockReturnValue("Bar");
  await act(() => {
    nameResource.refresh();
  });
  // wait some time -> old value visible
  await jest.advanceTimersByTimeAsync(loadingTime / 2);
  screen.getByText("Hello Foo");

  await waitForRendered(4);
  screen.getByText("Hello Bar");
});

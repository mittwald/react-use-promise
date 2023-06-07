import React, { FC } from "react";
import { beforeEach, jest, test } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import { usePromise } from "./usePromise.js";
import { Store } from "../store/Store.js";
import * as lib from "../lib/testing.js";
import { RenderWithLoadingView } from "../lib/testing.js";

let squareAsync: jest.MockedFunction<typeof lib.squareAsync>;
let renderCount: number;

const loadingTime = 10000;

beforeEach(() => {
  jest.useFakeTimers();
  renderCount = 0;
  squareAsync = jest.fn(lib.squareAsync);
  Store.default.clear();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const waitForRendered = async (count: number): Promise<void> => {
  jest.advanceTimersToNextTimer();
  await waitFor(() => expect(renderCount).toBe(count));
};

const SquareNumberView: FC<{ value: number }> = (props) => (
  <RenderWithLoadingView>
    {() => {
      const { value } = props;
      renderCount++;
      const squareNumber = usePromise(squareAsync, [value, loadingTime]);
      return <span data-testid="square-number-component">{squareNumber}</span>;
    }}
  </RenderWithLoadingView>
);

test("Loading view is triggered", async () => {
  render(<SquareNumberView value={4} />);
  screen.getByTestId("loading-view");
  await waitForRendered(2);
});

test("SquareNumber component renders after some time", async () => {
  render(<SquareNumberView value={4} />);
  screen.getByTestId("loading-view");
  await waitForRendered(2);
  const squareComponent = screen.getByTestId("square-number-component");
  expect(squareComponent.textContent).toBe("16");
});

test("AsyncLoader is not called twice when already loaded", async () => {
  const dom = render(<SquareNumberView value={4} />);
  await waitForRendered(2);

  dom.rerender(<span>Other view</span>);
  dom.rerender(<SquareNumberView value={4} />);
  await waitForRendered(3);

  expect(squareAsync).toHaveBeenCalledTimes(1);
});

test("AsyncLoader is called twice when parameter changed", async () => {
  const dom = render(<SquareNumberView value={4} />);
  await waitForRendered(2);

  dom.rerender(<span>Other view</span>);
  dom.rerender(<SquareNumberView value={5} />);
  await waitForRendered(4);

  expect(squareAsync).toHaveBeenCalledTimes(2);
});

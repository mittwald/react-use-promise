import { beforeEach, jest, test } from "@jest/globals";
import { cleanup, screen } from "@testing-library/react";
import React, { act, FC } from "react";
import * as lib from "../lib/testing.js";
import { render, RenderWithLoadingView } from "../lib/testing.js";
import { asyncResourceStore } from "../resource/store.js";
import { usePromise } from "./usePromise.js";

let squareAsync: jest.MockedFunction<typeof lib.squareAsync>;

const loadingTime = 10000;

beforeEach(() => {
  jest.useFakeTimers();
  squareAsync = jest.fn(lib.squareAsync);
  asyncResourceStore.clear();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  cleanup();
});

const waitToBeLoaded = async (percent = 100): Promise<void> => {
  await act(
    async () =>
      await jest.advanceTimersByTimeAsync(loadingTime * (percent / 100)),
  );
};

interface Props {
  value: number | null;
}

const SquareNumberView: FC<Props> = (props) => (
  <RenderWithLoadingView>
    {() => {
      const { value } = props;

      const squareNumber = usePromise(
        squareAsync,
        value === null ? null : [value, loadingTime],
      );

      const squareNumberString =
        squareNumber === undefined ? "undefined" : squareNumber;

      return (
        <span data-testid="square-number-component">{squareNumberString}</span>
      );
    }}
  </RenderWithLoadingView>
);

const expectRenderedNumberToBe = (number: string): void => {
  const squareComponent = screen.getByTestId("square-number-component");
  expect(squareComponent.textContent).toBe(number);
};

test("Loading view is triggered", async () => {
  await render(<SquareNumberView value={4} />);
  screen.getByTestId("loading-view");
  await waitToBeLoaded();
});

test("usePromise() returns 'undefined' when loader parameters are 'null'", async () => {
  await render(<SquareNumberView value={null} />);
  await waitToBeLoaded();
  expectRenderedNumberToBe("undefined");
});

test("SquareNumber component renders after some time", async () => {
  await render(<SquareNumberView value={4} />);
  screen.getByTestId("loading-view");
  await waitToBeLoaded();
  expectRenderedNumberToBe("16");
});

test("AsyncLoader is not called twice when already loaded", async () => {
  const dom = await render(<SquareNumberView value={4} />);
  await waitToBeLoaded();

  dom.rerender(<span>Other view</span>);
  dom.rerender(<SquareNumberView value={4} />);
  await waitToBeLoaded();

  expect(squareAsync).toHaveBeenCalledTimes(1);
});

test("AsyncLoader is called twice when parameter changed", async () => {
  await render(<SquareNumberView value={4} />);
  await waitToBeLoaded();

  await render(<span>Other view</span>);
  await render(<SquareNumberView value={5} />);
  await waitToBeLoaded();

  expect(squareAsync).toHaveBeenCalledTimes(2);
});

import {
  afterEach,
  vitest,
  beforeEach,
  expect,
  test,
  MockedFunction,
} from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { act, FC } from "react";
import * as lib from "../lib/testing";
import { render, RenderWithLoadingView } from "../lib/testing";
import { asyncResourceStore } from "../resource/store";
import { usePromise } from "./usePromise";

let squareAsync: MockedFunction<typeof lib.squareAsync>;
let squareSync: MockedFunction<typeof lib.squareSync>;

const loadingTime = 10000;

beforeEach(() => {
  vitest.useFakeTimers();
  squareAsync = vitest.fn(lib.squareAsync);
  squareSync = vitest.fn(lib.squareSync);
  asyncResourceStore.clear();
});

afterEach(() => {
  vitest.runOnlyPendingTimers();
  vitest.useRealTimers();
  cleanup();
});

const waitToBeLoaded = async (percent = 100): Promise<void> => {
  await act(
    async () =>
      await vitest.advanceTimersByTimeAsync(loadingTime * (percent / 100)),
  );
};

interface Props {
  value: number | null;
  loader?: typeof squareAsync | typeof squareSync;
}

const SquareNumberView: FC<Props> = (props) => (
  <RenderWithLoadingView>
    {() => {
      const { value, loader = squareAsync } = props;

      const squareNumber = usePromise(
        loader,
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

test("Loading view is not triggered when using sync loader", async () => {
  await render(<SquareNumberView value={4} loader={squareSync} />);
  expectRenderedNumberToBe("16");
  expect(() => screen.getByTestId("loading-view")).toThrow();
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

import { test, expect } from "@jest/globals";
import { ObservableValue } from "./ObservableValue.js";
import React, { FC } from "react";
import { useWatchObservableValue } from "./useWatchObservableValue.js";
import { act, render, screen } from "@testing-library/react";

let renderCount: number;

const TestComponent: FC<{ value: ObservableValue<string> }> = (props) => {
  renderCount++;
  return <>{useWatchObservableValue(props.value)}</>;
};

beforeEach(() => {
  renderCount = 0;
});

test("returns initial value", () => {
  const v = new ObservableValue("foo");
  render(<TestComponent value={v} />);
  screen.getByText("foo");
});

test("returns updated value and re-renders component", () => {
  const v = new ObservableValue("foo");
  render(<TestComponent value={v} />);
  act(() => {
    v.updateValue("bar");
  });
  screen.getByText("bar");
  expect(renderCount).toBe(2);
});

test("unbinds observer on unmount", () => {
  const v = new ObservableValue("foo");
  const dom = render(<TestComponent value={v} />);
  expect(v.observerCount).toBe(1);
  dom.rerender(<></>);
  expect(v.observerCount).toBe(0);
});

test("updates value when observable instance changes", () => {
  const v1 = new ObservableValue("foo");
  const v2 = new ObservableValue("bar");
  const dom = render(<TestComponent value={v1} />);
  screen.getByText("foo");
  dom.rerender(<TestComponent value={v2} />);
  screen.getByText("bar");
});

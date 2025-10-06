import { vitest, expect, test } from "vitest";
import { ObservableValue } from "./ObservableValue";

test("has initial value", () => {
  const v = new ObservableValue("foo");
  expect(v.value).toBe("foo");
});

test("value can be updated", () => {
  const v = new ObservableValue("foo");
  v.updateValue("bar");
  expect(v.value).toBe("bar");
});

test("observers are called on update", () => {
  const v = new ObservableValue("foo");
  const observer = vitest.fn();
  v.observe(observer);
  v.updateValue("bar");
  expect(observer).toHaveBeenCalledTimes(1);
  expect(observer).toHaveBeenCalledWith("bar");
});

test("observers can be unbound", () => {
  const v = new ObservableValue("foo");
  const observer = vitest.fn();
  const unbind = v.observe(observer);
  v.updateValue("bar");
  unbind();
  v.updateValue("baz");
  expect(observer).toHaveBeenCalledTimes(1);
});

test("multiple observers are called", () => {
  const v = new ObservableValue("foo");
  const observer1 = vitest.fn();
  const observer2 = vitest.fn();
  v.observe(observer1);
  v.observe(observer2);
  v.updateValue("bar");
  expect(observer1).toHaveBeenCalledTimes(1);
  expect(observer2).toHaveBeenCalledTimes(1);
});

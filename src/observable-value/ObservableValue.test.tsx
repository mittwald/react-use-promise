import { jest } from "@jest/globals";
import { ObservableValue } from "./ObservableValue.js";

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
  const observer = jest.fn();
  v.observe(observer);
  v.updateValue("bar");
  expect(observer).toHaveBeenCalledTimes(1);
  expect(observer).toHaveBeenCalledWith("bar");
});

test("observers can be unbound", () => {
  const v = new ObservableValue("foo");
  const observer = jest.fn();
  const unbind = v.observe(observer);
  v.updateValue("bar");
  unbind();
  v.updateValue("baz");
  expect(observer).toHaveBeenCalledTimes(1);
});

test("multiple observers are called", () => {
  const v = new ObservableValue("foo");
  const observer1 = jest.fn();
  const observer2 = jest.fn();
  v.observe(observer1);
  v.observe(observer2);
  v.updateValue("bar");
  expect(observer1).toHaveBeenCalledTimes(1);
  expect(observer2).toHaveBeenCalledTimes(1);
});

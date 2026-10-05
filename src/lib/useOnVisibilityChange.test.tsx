import { renderHook } from "@testing-library/react";
import { expect, test, vitest } from "vitest";
import { useOnVisibilityChange } from "./useOnVisibilityChange.js";

const dispatchVisibilityChange = (): void => {
  document.dispatchEvent(new Event("visibilitychange"));
};

test("callback is called on visibilitychange", () => {
  const callback = vitest.fn();
  renderHook(() => useOnVisibilityChange(callback, []));

  dispatchVisibilityChange();
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(true);
});

test("callback is not called after unmount", () => {
  const callback = vitest.fn();
  const { unmount } = renderHook(() => useOnVisibilityChange(callback, []));

  unmount();
  dispatchVisibilityChange();
  expect(callback).not.toHaveBeenCalled();
});

test("previous listener is removed when dependencies change", () => {
  const callback = vitest.fn();
  const { rerender } = renderHook(
    ({ dependency }) => useOnVisibilityChange(callback, [dependency]),
    { initialProps: { dependency: 1 } },
  );

  rerender({ dependency: 2 });
  dispatchVisibilityChange();
  expect(callback).toHaveBeenCalledTimes(1);
});

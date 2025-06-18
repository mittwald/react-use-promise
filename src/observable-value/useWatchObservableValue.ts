import { useEffect } from "react";
import { ObservableValue } from "./ObservableValue.js";
import { useRerender } from "../lib/useRerender.js";

export const useWatchObservableValue = <T>(
  observable: ObservableValue<T>,
): T => {
  const rerender = useRerender();
  useEffect(() => {
    return observable.observe(rerender);
  }, [observable]);
  return observable.value;
};

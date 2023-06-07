import { ObservableValue } from "./ObservableValue.js";
import { useEffect, useState } from "react";

export const useWatchObservableValue = <T>(
  observable: ObservableValue<T>,
): T => {
  const [watchedValue, setWatchedValue] = useState(observable.value);
  useEffect(() => observable.observe(setWatchedValue));
  return watchedValue;
};

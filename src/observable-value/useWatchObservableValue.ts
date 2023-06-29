import { ObservableValue } from "./ObservableValue.js";
import { useEffect, useState } from "react";

export const useWatchObservableValue = <T>(
  observable: ObservableValue<T>,
): T => {
  const [watchedValue, setWatchedValue] = useState(observable.value);

  useEffect(() => {
    setWatchedValue(observable.value);
    return observable.observe(setWatchedValue);
  }, [observable]);

  return watchedValue;
};

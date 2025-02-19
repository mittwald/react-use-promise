import { useEffect, useState } from "react";
import { ObservableValue } from "./ObservableValue.js";

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

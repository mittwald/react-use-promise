import { useEffect, useRef, useState } from "react";
import { ObservableValue } from "./ObservableValue.js";

export const useWatchObservableValue = <T>(
  observable: ObservableValue<T>,
): T => {
  const watchedObservable = useRef(observable);
  const [watchedValue, setWatchedValue] = useState(observable.value);

  useEffect(() => {
    watchedObservable.current = observable;
    setWatchedValue(observable.value);
    return observable.observe(setWatchedValue);
  }, [observable]);

  const observableHasChanged = watchedObservable.current !== observable;

  return observableHasChanged ? observable.value : watchedValue;
};

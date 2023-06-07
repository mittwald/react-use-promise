import { AsyncResource } from "./AsyncResource.js";
import { DurationLikeObject } from "luxon";
import { useRef } from "react";
import { useWatchObservableValue } from "../observable-value/useWatchObservableValue.js";

export interface UseWatchResourceOptions {
  keepValueWhileLoading?: boolean;
  autoRefresh?: DurationLikeObject;
}

export const useWatchResourceValue = <T>(
  resource: AsyncResource<T>,
  options: UseWatchResourceOptions = {},
): T => {
  const { keepValueWhileLoading = true } = options;

  const observedValue = useWatchObservableValue(resource.value);
  const error = useWatchObservableValue(resource.error);
  const previousValue = useRef(observedValue);

  resource.load();

  if (observedValue.isSet) {
    previousValue.current = observedValue;
    return observedValue.value;
  }

  if (keepValueWhileLoading && previousValue.current.isSet) {
    return previousValue.current.value;
  }

  if (error.isSet) {
    throw error.value;
  }

  throw resource.loaderPromise;
};

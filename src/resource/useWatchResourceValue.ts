import { AsyncResource } from "./AsyncResource.js";
import { useRef } from "react";
import { useWatchObservableValue } from "../observable-value/useWatchObservableValue.js";
import { UseWatchResourceOptions, UseWatchResourceResult } from "./types.js";
import { emptyValue } from "../lib/EventualValue.js";

export const useWatchResourceValue = <
  T,
  TOptions extends UseWatchResourceOptions,
>(
  resource: AsyncResource<T>,
  options: TOptions = {} as TOptions,
): UseWatchResourceResult<T, typeof options> => {
  type Result = UseWatchResourceResult<T, typeof options>;

  const { keepValueWhileLoading = true, useSuspense = true } = options;

  const observedValue = useWatchObservableValue(resource.value);
  const error = useWatchObservableValue(resource.error);
  const previousValue = useRef(observedValue);

  resource.load();

  if (observedValue.isSet) {
    previousValue.current = observedValue;

    return (useSuspense ? observedValue.value : observedValue) as Result;
  }

  if (keepValueWhileLoading && previousValue.current.isSet) {
    return (
      useSuspense ? previousValue.current.value : previousValue.current
    ) as Result;
  }

  if (error.isSet) {
    throw error.value;
  }

  if (useSuspense) {
    throw resource.loaderPromise;
  }

  return emptyValue as Result;
};

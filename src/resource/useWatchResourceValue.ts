import { AsyncResource } from "./AsyncResource.js";
import { useRef } from "react";
import { useWatchObservableValue } from "../observable-value/useWatchObservableValue.js";
import { UseWatchResourceOptions, UseWatchResourceResult } from "./types.js";

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

  void resource.load();

  if (observedValue.isSet) {
    previousValue.current = observedValue;
    if (useSuspense) {
      return observedValue.value as Result;
    }

    return Object.freeze({
      maybeValue: observedValue.value,
      value: observedValue.value,
      hasValue: true,
      isLoading: false,
    }) as Result;
  }

  if (keepValueWhileLoading && previousValue.current.isSet) {
    if (useSuspense) {
      return previousValue.current.value as Result;
    }

    return Object.freeze({
      maybeValue: previousValue.current.value,
      value: previousValue.current.value,
      hasValue: true,
      isLoading: true,
    }) as Result;
  }

  if (error.isSet) {
    throw error.value;
  }

  if (useSuspense) {
    throw resource.loaderPromise;
  }

  return Object.freeze({
    maybeValue: undefined,
    hasValue: false,
    isLoading: true,
  }) as Result;
};

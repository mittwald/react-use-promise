import { AsyncResource } from "./AsyncResource.js";
import { useEffect, useRef } from "react";
import { useWatchObservableValue } from "../observable-value/useWatchObservableValue.js";
import { UseWatchResourceOptions, UseWatchResourceResult } from "./types.js";
import { hash } from "object-code";
import { useOnWindowFocused } from "../lib/useOnWindowFocused.js";
import { useOnVisibilityChange } from "../lib/useOnVisibilityChange.js";

export const useWatchResourceValue = <
  T,
  TOptions extends UseWatchResourceOptions,
>(
  resource: AsyncResource<T>,
  options: TOptions = {} as TOptions,
): UseWatchResourceResult<T, typeof options> => {
  type Result = UseWatchResourceResult<T, typeof options>;

  const {
    keepValueWhileLoading = true,
    useSuspense = true,
    refreshOnWindowFocus = false,
    refreshOnVisibilityChange = false,
    autoRefresh,
  } = options;

  const observedValue = useWatchObservableValue(resource.value);
  const error = useWatchObservableValue(resource.error);
  const previousValue = useRef(observedValue);

  useEffect(() => {
    if (autoRefresh) {
      return resource.addTTL(autoRefresh);
    }
  }, [resource, hash(autoRefresh)]);

  useOnWindowFocused(() => {
    if (refreshOnWindowFocus) {
      resource.refresh();
    }
  }, [resource, refreshOnWindowFocus]);

  useOnVisibilityChange(() => {
    if (refreshOnVisibilityChange && document.visibilityState === "visible") {
      resource.refresh();
    }
  }, [resource, refreshOnVisibilityChange]);

  setTimeout(() => {
    void resource.load();
  }, 0);

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
    throw resource.suspensePromise;
  }

  return Object.freeze({
    maybeValue: undefined,
    hasValue: false,
    isLoading: true,
  }) as Result;
};

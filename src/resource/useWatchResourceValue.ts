import { hash } from "object-code";
import { useEffect } from "react";
import { useOnVisibilityChange } from "../lib/useOnVisibilityChange.js";
import { useOnWindowFocused } from "../lib/useOnWindowFocused.js";
import { useWatchObservableValue } from "../observable-value/useWatchObservableValue.js";
import { AsyncResource } from "./AsyncResource.js";
import { UseWatchResourceOptions, UseWatchResourceResult } from "./types.js";
import {
  emptyValue,
  setValue,
  type EventualValue,
} from "../lib/EventualValue.js";
import { useRefWithDependencies } from "../lib/useRefWithDependencies.js";

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
    refreshOnDocumentVisibilityChange = refreshOnWindowFocus,
    autoRefresh,
  } = options;

  const observedValue = useWatchObservableValue(
    useSuspense && keepValueWhileLoading
      ? resource.valueWithCache
      : resource.value,
  );
  const error = useWatchObservableValue(resource.error);

  const previousValue = useRefWithDependencies<EventualValue<T>>(emptyValue, [
    resource,
  ]);

  useEffect(
    () =>
      resource.onRefresh(() => {
        void resource.load();
      }),
    [resource],
  );

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

  useOnVisibilityChange(
    (isVisible) => {
      if (refreshOnDocumentVisibilityChange && isVisible) {
        resource.refresh();
      }
    },
    [resource, refreshOnDocumentVisibilityChange],
  );

  void resource.load();

  if (observedValue.isSet) {
    previousValue.current = setValue(observedValue.value);
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
    if (resource.loaderPromise === undefined) {
      throw new Error("Invariant violation: Unexpected state");
    }
    throw resource.loaderPromise;
  }

  return Object.freeze({
    maybeValue: undefined,
    hasValue: false,
    isLoading: true,
  }) as Result;
};

import { hash } from "object-code";
import { useEffect, useMemo } from "react";
import { useOnVisibilityChange } from "../lib/useOnVisibilityChange";
import { useOnWindowFocused } from "../lib/useOnWindowFocused";
import { useWatchObservableValue } from "../observable-value/useWatchObservableValue";
import { AsyncResource } from "./AsyncResource";
import { UseWatchResourceOptions, UseWatchResourceResult } from "./types";

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

  const previousValue = useMemo(() => ({ current: observedValue }), [resource]);

  useEffect(
    () =>
      resource.onRefresh(() => {
        resource.load();
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

  resource.load();

  if (resource.syncValue.isSet) {
    if (useSuspense) {
      return resource.syncValue.value as Result;
    }
    return Object.freeze({
      maybeValue: resource.syncValue.value,
      value: resource.syncValue.value,
      hasValue: true,
      isLoading: false,
    }) as Result;
  }

  if (resource.syncError.isSet) {
    throw resource.syncError.value;
  }

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
    if (resource.suspensePromise === undefined) {
      throw new Error("Invariant violation: Unexpected state");
    }
    throw resource.suspensePromise;
  }

  return Object.freeze({
    maybeValue: undefined,
    hasValue: false,
    isLoading: true,
  }) as Result;
};

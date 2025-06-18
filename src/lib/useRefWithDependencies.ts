import { useMemo, type DependencyList } from "react";

export const useRefWithDependencies = <T>(
  initial: T,
  deps: DependencyList,
): { current: T } =>
  useMemo(
    () => ({
      current: initial,
    }),
    deps,
  );

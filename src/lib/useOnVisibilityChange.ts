import { DependencyList, useEffect } from "react";
import { isBrowser } from "browser-or-node";

type Callback = (isVisible: boolean) => void;

export const useOnVisibilityChange = (
  cb: Callback,
  deps: DependencyList,
): void => {
  useEffect(() => {
    if (isBrowser) {
      const onVisibilityChange = (): void => cb(!document.hidden);
      document.addEventListener("visibilitychange", onVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    }
  }, deps);
};

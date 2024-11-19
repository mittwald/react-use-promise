import { DependencyList, useEffect } from "react";
import { isBrowser } from "browser-or-node";

type Callback = (isVisible: boolean) => void;

export const useOnVisibilityChange = (
  cb: Callback,
  deps: DependencyList,
): void => {
  useEffect(() => {
    if (isBrowser) {
      document.addEventListener("visibilitychange", () => cb(!document.hidden));
      return () => {
        document.removeEventListener("visibilitychange", () =>
          cb(!document.hidden),
        );
      };
    }
  }, deps);
};

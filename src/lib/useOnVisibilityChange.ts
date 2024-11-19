import { DependencyList, useEffect } from "react";
import { isBrowser } from "browser-or-node";

type Callback = () => void;

export const useOnVisibilityChange = (
  cb: Callback,
  deps: DependencyList,
): void => {
  useEffect(() => {
    if (isBrowser) {
      document.addEventListener("visibilitychange", cb);
      return () => {
        document.removeEventListener("visibilitychange", cb);
      };
    }
  }, deps);
};

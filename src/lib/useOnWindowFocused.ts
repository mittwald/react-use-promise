import { DependencyList, useEffect } from "react";
import { isBrowser } from "browser-or-node";

type Callback = () => void;

export const useOnWindowFocused = (
  cb: Callback,
  deps: DependencyList,
): void => {
  useEffect(() => {
    if (isBrowser) {
      window.addEventListener("focus", cb);
      return () => {
        window.removeEventListener("focus", cb);
      };
    }
  }, deps);
};

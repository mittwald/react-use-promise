import { DependencyList, useEffect } from "react";

type Callback = () => void;

export const useOnWindowFocused = (
  cb: Callback,
  deps: DependencyList,
): void => {
  useEffect(() => {
    window.addEventListener("focus", cb);
    return () => {
      window.removeEventListener("focus", cb);
    };
  }, deps);
};

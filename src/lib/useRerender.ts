import { useState } from "react";

export const useRerender = () => {
  const [, setTrigger] = useState(false);

  return () => {
    setTrigger((t) => !t);
  };
};

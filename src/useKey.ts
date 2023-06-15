import { useEffect } from "react";

function useKey(key: string, action: () => void) {
  useEffect(() => {
    const cb = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === key.toLowerCase()) {
        action();
      }
    };
    document.addEventListener("keydown", cb);
    return () => {
      document.removeEventListener("keydown", cb);
    };
  }, [key, action]);
}

export { useKey };

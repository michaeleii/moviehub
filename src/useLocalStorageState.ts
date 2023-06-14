import { useEffect, useState } from "react";

type LocalStorageState = <T>(
  initialState: T,
  key: string
) => [T, React.Dispatch<React.SetStateAction<T>>];

const useLocalStorageState: LocalStorageState = (intialState, key) => {
  const [value, setValue] = useState(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : intialState;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
};
export { useLocalStorageState };

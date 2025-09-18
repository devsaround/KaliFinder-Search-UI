interface Cache<T> {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
}

export const createCache = <T>(): Cache<T> => {
  const store = new Map<string, T>();

  return {
    get: (key: string) => store.get(key),
    set: (key: string, value: T) => store.set(key, value),
  };
};

import { type ReactNode, useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function AfterSSR({ children }: { children: ReactNode }) {
  const show = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!show) {
    return null;
  }
  return children;
}

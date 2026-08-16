import { onSettled } from "solid-js";

export class Timeout {
  private id: ReturnType<typeof setTimeout> | null = null;

  start(delay: number, callback: () => void) {
    this.clear();
    this.id = setTimeout(() => {
      this.id = null;
      callback();
    }, delay);
  }

  clear() {
    if (this.id !== null) {
      clearTimeout(this.id);
      this.id = null;
    }
  }
}

export function useTimeout(): Timeout {
  const timeout = new Timeout();
  onSettled(() => () => timeout.clear());
  return timeout;
}

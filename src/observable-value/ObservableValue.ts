import { Observer, UnbindObserver } from "./types.js";

export class ObservableValue<T> {
  public value: T;

  // using unknown since otherwise the ObservableValue seems to be invariant on type T
  private observers = new Set<Observer<unknown>>();

  public constructor(value: T) {
    this.value = value;
  }

  private notifyObservers(newValue: T): void {
    this.observers.forEach((o) => o(newValue));
  }

  public get observerCount(): number {
    return this.observers.size;
  }

  public observe(observer: Observer<T>): UnbindObserver {
    this.observers.add(observer as Observer<unknown>);
    return () => this.observers.delete(observer as Observer<unknown>);
  }

  public updateValue(newValue: T): void {
    if (this.value === newValue) {
      return;
    }

    this.value = newValue;
    this.notifyObservers(newValue);
  }
}

import { DurationLikeObject } from "luxon";
import {
  ConsolidatedTimeout,
  RemoveTimeout,
} from "../lib/ConsolidatedTimeout.js";
import { emptyValue, EventualValue, setValue } from "../lib/EventualValue.js";
import { ObservableValue } from "../observable-value/ObservableValue.js";
import { useWatchObservableValue } from "../observable-value/useWatchObservableValue.js";
import {
  AsyncLoader,
  AsyncResourceState,
  OnRefreshHandler,
  UseWatchResourceOptions,
  UseWatchResourceResult,
} from "./types.js";
import { useWatchResourceValue } from "./useWatchResourceValue.js";

export class AsyncResource<T = unknown> {
  public readonly loader: AsyncLoader<T>;
  private loaderPromise: Promise<void> | undefined;
  private loaderPromiseVersion = 0;
  private autoRefreshTimeout: ConsolidatedTimeout;

  public readonly value = new ObservableValue<EventualValue<T>>(emptyValue);
  public readonly valueWithCache = new ObservableValue<EventualValue<T>>(
    emptyValue,
  );
  public readonly error = new ObservableValue<EventualValue<unknown>>(
    emptyValue,
  );
  public readonly state = new ObservableValue<AsyncResourceState>("void");
  private readonly onRefreshListeners = new Set<OnRefreshHandler>();

  public static voidInstance = new AsyncResource<undefined>(() =>
    Promise.resolve(undefined),
  );

  public constructor(loader: AsyncLoader<T>) {
    this.loader = loader;
    this.autoRefreshTimeout = new ConsolidatedTimeout(() => this.refresh());
  }

  public refresh(): void {
    this.loaderPromiseVersion++;
    this.loaderPromise = undefined;
    this.value.updateValue(emptyValue);
    this.error.updateValue(emptyValue);
    this.state.updateValue("void");
    this.onRefreshListeners.forEach((listener) => listener());
  }

  public onRefresh(handler: OnRefreshHandler) {
    this.onRefreshListeners.add(handler);
    return () => {
      this.onRefreshListeners.delete(handler);
    };
  }

  public addTTL(ttl: DurationLikeObject): RemoveTimeout {
    return this.autoRefreshTimeout.addTimeout(ttl);
  }

  public async load(): Promise<void> {
    if (this.value.value.isSet || this.error.value.isSet) {
      return;
    }

    if (this.loaderPromise === undefined) {
      this.loaderPromise = this.handleLoading();
    }
  }

  public isMatchingError(error: true | unknown): boolean {
    if (!this.error.value.isSet) {
      return false;
    }
    return error === true || this.error.value.value === error;
  }

  private async handleLoading(): Promise<void> {
    const loaderPromiseVersion = ++this.loaderPromiseVersion;

    let result: EventualValue<T> = emptyValue;
    let error: EventualValue<unknown> = emptyValue;

    this.state.updateValue("loading");

    try {
      const awaitedResult = await this.loader();
      result = setValue(awaitedResult);
    } catch (e) {
      error = setValue(e);
    }

    if (this.loaderPromiseVersion === loaderPromiseVersion) {
      if (result.isSet) {
        this.valueWithCache.updateValue(result);
        this.value.updateValue(result);
        this.state.updateValue("loaded");
      } else if (error.isSet) {
        this.error.updateValue(error);
        this.state.updateValue("error");
      }
    }

    this.autoRefreshTimeout.start();
  }

  public use<TOptions extends UseWatchResourceOptions>(
    options: TOptions = {} as TOptions,
  ): UseWatchResourceResult<T, TOptions> {
    return useWatchResourceValue(this, options);
  }

  public watchState(): AsyncResourceState {
    return useWatchObservableValue(this.state);
  }
}

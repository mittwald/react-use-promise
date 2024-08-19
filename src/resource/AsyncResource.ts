import { emptyValue, EventualValue, setValue } from "../lib/EventualValue.js";
import {
  AsyncLoader,
  AsyncResourceState,
  ResolveLoaderPromiseFn,
  UseWatchResourceOptions,
  UseWatchResourceResult,
} from "./types.js";
import { ObservableValue } from "../observable-value/ObservableValue.js";
import { useWatchResourceValue } from "./useWatchResourceValue.js";
import { useWatchObservableValue } from "../observable-value/useWatchObservableValue.js";
import { DurationLikeObject } from "luxon";
import {
  ConsolidatedTimeout,
  RemoveTimeout,
} from "../lib/ConsolidatedTimeout.js";

export class AsyncResource<T = unknown> {
  public readonly loader: AsyncLoader<T>;
  private loaderPromise: Promise<void> | undefined;
  public suspensePromise: Promise<void> | undefined;
  private resolveSuspensePromise: ResolveLoaderPromiseFn = () => {
    throw new Error("Resolving initial suspense promise is not supported");
  };
  private loaderPromiseVersion = 0;
  private autoRefreshTimeout: ConsolidatedTimeout;

  public value = new ObservableValue<EventualValue<T>>(emptyValue);
  public error = new ObservableValue<EventualValue<unknown>>(emptyValue);
  public state = new ObservableValue<AsyncResourceState>("void");

  public constructor(loader: AsyncLoader<T>) {
    this.loader = loader;
    this.autoRefreshTimeout = new ConsolidatedTimeout(() => this.refresh());
    this.resetPromises();
  }

  public refresh(): void {
    this.loaderPromiseVersion++;
    this.resetPromises();
    this.value.updateValue(emptyValue);
    this.error.updateValue(emptyValue);
    this.state.updateValue("void");
  }

  public addTTL(ttl: DurationLikeObject): RemoveTimeout {
    return this.autoRefreshTimeout.addTimeout(ttl);
  }

  public async load(): Promise<void> {
    if (this.value.value.isSet || this.error.value.isSet) {
      return;
    }

    if (this.loaderPromise === undefined) {
      this.loaderPromise = this.handleLoading().then(() => {
        this.resolveSuspensePromise();
      });
    }
  }

  private resetPromises(): void {
    this.suspensePromise = new Promise<void>((resolve) => {
      this.resolveSuspensePromise = resolve;
    });
    this.loaderPromise = undefined;
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

    this.resolveSuspensePromise();

    if (this.loaderPromiseVersion === loaderPromiseVersion) {
      this.resetPromises();

      if (result.isSet) {
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

  /** @deprecated Renamed to `use` in version 2 */
  public watch<TOptions extends UseWatchResourceOptions>(
    options: TOptions = {} as TOptions,
  ): UseWatchResourceResult<T, TOptions> {
    return this.use(options);
  }

  public watchState(): AsyncResourceState {
    return useWatchObservableValue(this.state);
  }
}

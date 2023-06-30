import { emptyValue, EventualValue, setValue } from "../lib/EventualValue.js";
import {
  AsyncLoader,
  AsyncResourceState,
  UseWatchResourceOptions,
  UseWatchResourceResult,
} from "./types.js";
import { Duration, DurationLikeObject } from "luxon";
import { ObservableValue } from "../observable-value/ObservableValue.js";
import { useWatchResourceValue } from "./useWatchResourceValue.js";
import { useWatchObservableValue } from "../observable-value/useWatchObservableValue.js";

export interface AsyncResourceOptions {
  ttl?: DurationLikeObject;
}

export class AsyncResource<T = unknown> {
  public readonly loader: AsyncLoader<T>;
  public loaderPromise: Promise<void> | undefined;
  private loaderPromiseVersion = 0;

  private readonly options: AsyncResourceOptions;

  public value = new ObservableValue<EventualValue<T>>(emptyValue);
  public error = new ObservableValue<EventualValue<unknown>>(emptyValue);
  public state = new ObservableValue<AsyncResourceState>("void");

  private activeTtlTimeout: ReturnType<typeof setTimeout> | undefined;

  public constructor(loader: AsyncLoader<T>, opts?: AsyncResourceOptions) {
    this.loader = loader;
    this.options = opts ?? {};
  }

  public refresh(): void {
    this.loaderPromiseVersion++;
    this.loaderPromise = undefined;
    this.value.updateValue(emptyValue);
    this.error.updateValue(emptyValue);
    this.state.updateValue("void");
  }

  public async load(): Promise<void> {
    if (this.value.value.isSet || this.error.value.isSet) {
      return;
    }

    if (this.loaderPromise === undefined) {
      this.loaderPromise = this.handleLoading();
    }
    return this.loaderPromise;
  }

  public isMatchingError(error: true | unknown): boolean {
    if (!this.error.value.isSet) {
      return false;
    }
    return error === true || this.error.value.value === error;
  }

  private clearAfterTtl(): void {
    const ttl = this.options.ttl;

    if (ttl !== undefined) {
      clearTimeout(this.activeTtlTimeout);

      this.activeTtlTimeout = setTimeout(() => {
        this.refresh();
      }, Duration.fromDurationLike(ttl).toMillis());
    }
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
      this.loaderPromise = undefined;

      if (result.isSet) {
        this.value.updateValue(result);
        this.state.updateValue("loaded");
      } else if (error.isSet) {
        this.error.updateValue(error);
        this.state.updateValue("error");
      }

      this.clearAfterTtl();
    }
  }

  public watch<TOptions extends UseWatchResourceOptions>(
    options: TOptions = {} as TOptions,
  ): UseWatchResourceResult<T, TOptions> {
    return useWatchResourceValue(this, options);
  }

  public watchState(): AsyncResourceState {
    return useWatchObservableValue(this.state);
  }
}

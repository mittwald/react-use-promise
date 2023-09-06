import { DateTime, Duration, DurationLikeObject } from "luxon";

export type RemoveTimeout = () => void;
type ExecutionCallback = () => void;
type Timeout = ReturnType<typeof setTimeout>;

export class ConsolidatedTimeout {
  private readonly callback: ExecutionCallback;
  private startTime: DateTime;
  private timeoutMillis = new Set<number>();
  private runningTimeout?: Timeout;

  public constructor(callback: ExecutionCallback) {
    this.startTime = DateTime.now();
    this.callback = callback;
  }

  public start(): void {
    this.startTime = DateTime.now();
    this.startNextTimeout();
  }

  private clear(): void {
    if (this.runningTimeout) {
      clearTimeout(this.runningTimeout);
      this.runningTimeout = undefined;
    }
  }

  public addTimeout(timeout: DurationLikeObject): RemoveTimeout {
    const timeoutMs = Duration.fromDurationLike(timeout).toMillis();

    this.timeoutMillis.add(timeoutMs);
    this.startNextTimeout();

    return () => {
      this.timeoutMillis.delete(timeoutMs);
      this.startNextTimeout();
    };
  }

  private startNextTimeout(): void {
    this.clear();

    if (this.timeoutMillis.size === 0) {
      return;
    }

    const shortestTimeout = Math.min(...this.timeoutMillis);
    const elapsedTime = this.startTime.diffNow().negate().toMillis();
    const ms = shortestTimeout - elapsedTime;

    if (ms <= 0) {
      this.callback();
    } else {
      this.runningTimeout = setTimeout(() => this.callback(), ms);
    }
  }
}

export default ConsolidatedTimeout;

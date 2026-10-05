import {
  ReleasedStorageEntry,
  StorageEntry,
  StorageEntryOptions,
} from "./types.js";
import { Tags, type Tag } from "./Tags.js";

export class Store<T> {
  private readonly entries = new Map<
    string,
    StorageEntry<T> | ReleasedStorageEntry<T>
  >();

  public constructor() {}

  public getOrSet<TExtends extends T>(
    id: string,
    dataBuilder: () => TExtends,
    options: StorageEntryOptions = {},
  ): TExtends {
    const { tags = [] } = options;

    const existing = this.retain(id);

    if (existing) {
      return existing.data as unknown as TExtends;
    }

    const newData = dataBuilder();

    this.entries.set(id, {
      data: newData,
      tags: new Tags(tags),
    });

    return newData;
  }

  public set<TExtends extends T>(
    id: string,
    dataBuilder: () => TExtends,
    options: StorageEntryOptions = {},
  ): void {
    this.getOrSet(id, dataBuilder, options);
  }

  public get(id: string): T | undefined {
    return this.getEntry(id)?.data;
  }

  public findBy(matcher: (entry: T) => boolean): T[] {
    return this.getAll().filter(matcher);
  }

  public releaseBy(matcher: (entry: T) => boolean): void {
    this.entries.forEach((entry, id) => {
      if (!("data" in entry) || !matcher(entry.data)) {
        return;
      }

      if (isWeakRefTarget(entry.data)) {
        this.entries.set(id, {
          dataRef: new WeakRef(entry.data),
          tags: entry.tags,
        });
      } else {
        this.entries.delete(id);
      }
    });
  }

  public getAll(tag?: Tag): T[] {
    const entriesArray = this.getEntries();

    if (tag === undefined) {
      return entriesArray.map((e) => e.data);
    }

    const isMatching = Tags.createMatcher(tag);
    return entriesArray.filter((e) => isMatching(e.tags)).map((e) => e.data);
  }

  public clear(): void {
    this.entries.clear();
  }

  private getEntry(id: string): StorageEntry<T> | undefined {
    const entry = this.entries.get(id);

    if (entry === undefined || "data" in entry) {
      return entry;
    }

    const data = entry.dataRef.deref();

    if (data === undefined) {
      this.entries.delete(id);
      return undefined;
    }

    return { data, tags: entry.tags };
  }

  private getEntries(): StorageEntry<T>[] {
    return Array.from(this.entries.keys()).flatMap(
      (id) => this.getEntry(id) ?? [],
    );
  }

  private retain(id: string): StorageEntry<T> | undefined {
    const entry = this.getEntry(id);

    if (entry) {
      this.entries.set(id, entry);
    }

    return entry;
  }
}

function isWeakRefTarget<T>(value: T): value is T & object {
  return (
    (typeof value === "object" && value !== null) || typeof value === "function"
  );
}

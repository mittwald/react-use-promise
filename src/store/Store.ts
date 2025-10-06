import { StorageEntry, StorageEntryOptions } from "./types";
import { Tags, type Tag } from "./Tags";

export class Store<T> {
  private readonly entries = new Map<string, StorageEntry<T>>();

  public constructor() {}

  public getOrSet<TExtends extends T>(
    id: string,
    dataBuilder: () => TExtends,
    options: StorageEntryOptions = {},
  ): TExtends {
    const { tags = [] } = options;

    const existing = this.entries.get(id);

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
    return this.entries.get(id)?.data;
  }

  public findBy(matcher: (entry: T) => boolean): T[] {
    return this.getAll().filter(matcher);
  }

  public getAll(tag?: Tag): T[] {
    const entriesArray = Array.from(this.entries.values());

    if (tag === undefined) {
      return entriesArray.map((e) => e.data);
    }

    return entriesArray.filter((e) => e.tags.matching(tag)).map((e) => e.data);
  }

  public clear(): void {
    this.entries.clear();
  }
}

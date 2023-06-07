import { AsyncResource } from "../resource/AsyncResource.js";
import { Minimatch } from "minimatch";
import {
  TagPattern,
  Tags,
  StorageEntry,
  StorageEntryOptions,
  Tag,
} from "./types.js";

export class Store {
  public static default: Store = new Store();
  private readonly entries = new Map<string, StorageEntry>();

  private constructor() {
    // singleton
  }

  public getOrSet<T extends AsyncResource>(
    id: string,
    resourceBuilder: () => T,
    options: StorageEntryOptions = {},
  ): T {
    const { tags = [] } = options;

    const existing = this.entries.get(id);

    if (existing) {
      return existing.resource as unknown as T;
    }

    const newResource = resourceBuilder();

    this.entries.set(id, {
      resource: newResource,
      tags,
    });

    return newResource;
  }

  public get(id: string): AsyncResource | undefined {
    return this.entries.get(id)?.resource;
  }

  public findByError(error: true | unknown): AsyncResource[] {
    return this.getAll().filter((resource) => resource.isMatchingError(error));
  }

  public getAll(tag?: Tag | TagPattern): AsyncResource[] {
    const entriesArray = Array.from(this.entries.values());

    if (tag === undefined) {
      return entriesArray.map((e) => e.resource);
    }

    const mm = new Minimatch(tag);

    const testSomeTagsMatchingPattern = (tags: Tags): boolean =>
      tags.some((t) => mm.match(t));

    return entriesArray
      .filter((e) => testSomeTagsMatchingPattern(e.tags))
      .map((e) => e.resource);
  }

  public clear(): void {
    this.entries.clear();
  }
}

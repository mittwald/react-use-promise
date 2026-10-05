import type { Tags, TagsInput } from "./Tags.js";

export interface StorageEntryOptions {
  tags?: TagsInput;
}

export interface StorageEntry<T> {
  readonly data: T;
  readonly tags: Tags;
}

export interface ReleasedStorageEntry<T> {
  readonly dataRef: WeakRef<T & object>;
  readonly tags: Tags;
}

type StorageKeyBuilderInput = unknown;

export type StorageKeyBuilder = (input: StorageKeyBuilderInput) => string;

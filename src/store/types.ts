import type { Tags, TagsInput } from "../store/tags.js";

export interface StorageEntryOptions {
  tags?: TagsInput;
}

export interface StorageEntry<T> {
  readonly data: T;
  readonly tags: Tags;
}

type StorageKeyBuilderInput = unknown;

export type StorageKeyBuilder = (input: StorageKeyBuilderInput) => string;

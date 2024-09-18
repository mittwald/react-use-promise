export type Tag = string;
export type TagPattern = string;
export type Tags = Tag[];

export interface StorageEntryOptions {
  tags?: Tags;
}

export interface StorageEntry<T> {
  readonly data: T;
  readonly tags: Tags;
}

type StorageKeyBuilderInput = unknown;

export type StorageKeyBuilder = (input: StorageKeyBuilderInput) => string;

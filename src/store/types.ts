import { AsyncResource } from "../resource/AsyncResource.js";
import { AnyAsyncFn } from "../resource/types.js";

export type Tag = string;
export type TagPattern = string;
export type Tags = Tag[];

export interface StorageEntryOptions {
  tags?: Tags;
}

export interface StorageEntry {
  readonly resource: AsyncResource;
  readonly tags: Tags;
}

interface StorageKeyBuilderInput {
  asyncFn: AnyAsyncFn;
  parameters: unknown[];
  loaderId?: string;
}

export type StorageKeyBuilder = (input: StorageKeyBuilderInput) => string;

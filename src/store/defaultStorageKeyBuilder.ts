import { StorageKeyBuilder } from "./types";
import { hash } from "object-code";

export const defaultStorageKeyBuilder: StorageKeyBuilder = (input) => {
  return hash(input).toString();
};

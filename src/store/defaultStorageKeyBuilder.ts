import { StorageKeyBuilder } from "./types.js";
import { hash } from "object-code";

export const defaultStorageKeyBuilder: StorageKeyBuilder = (input) => {
  const { loaderId = "null", parameters, asyncFn } = input;

  const storageKeyObject = {
    asyncFn,
    parameters,
    loaderId,
  };

  return hash(storageKeyObject).toString();
};

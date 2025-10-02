import type { Tag } from "../store/tags.js";
import { AsyncResource } from "./AsyncResource.js";

import { asyncResourceStore } from "./store.js";

interface ClearOptions {
  tag?: Tag;
  error?: true | unknown;
}

export function refresh(options: ClearOptions = {}): void {
  const { tag, error } = options;

  const resourceIsMatchingError = (resource: AsyncResource): boolean =>
    error === undefined || resource.isMatchingError(error);

  asyncResourceStore
    .getAll(tag)
    .filter(resourceIsMatchingError)
    .forEach((resource) => resource.refresh());
}

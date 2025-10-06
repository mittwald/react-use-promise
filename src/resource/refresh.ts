import type { Tag } from "../store/Tags";
import { AsyncResource } from "./AsyncResource";

import { asyncResourceStore } from "./store";

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

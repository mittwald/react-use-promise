import { Store } from "./store/Store.js";
import { Tag, TagPattern } from "./store/types.js";
import { AsyncResource } from "./resource/AsyncResource.js";

interface ClearOptions {
  tag?: Tag | TagPattern;
  error?: true | unknown;
}

export function refresh(options: ClearOptions = {}): void {
  const { tag, error } = options;

  const resourceIsMatchingError = (resource: AsyncResource): boolean =>
    error === undefined || resource.isMatchingError(error);

  Store.default
    .getAll(tag)
    .filter(resourceIsMatchingError)
    .forEach((resource) => resource.refresh());
}

import { Duration, DurationLikeObject } from "luxon";
import { asyncResourceStore } from "./store.js";

interface RemoveUnusedResourcesOptions {
  unusedFor: DurationLikeObject;
}

export function removeUnusedResources(
  options: RemoveUnusedResourcesOptions,
): void {
  const unusedForMs = Duration.fromDurationLike(options.unusedFor).toMillis();

  asyncResourceStore.deleteBy((resource) => resource.isUnusedFor(unusedForMs));
}

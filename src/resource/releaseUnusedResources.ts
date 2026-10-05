import { Duration, DurationLikeObject } from "luxon";
import { asyncResourceStore } from "./store.js";

interface ReleaseUnusedResourcesOptions {
  unusedFor: DurationLikeObject;
}

export function releaseUnusedResources(
  options: ReleaseUnusedResourcesOptions,
): void {
  const unusedForMs = Duration.fromDurationLike(options.unusedFor).toMillis();

  asyncResourceStore.releaseBy((resource) => resource.isUnusedFor(unusedForMs));
}

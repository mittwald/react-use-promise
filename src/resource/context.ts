import { createCascade } from "context";
import type { AsyncResource } from "./AsyncResource";

type LoaderContext = {
  asyncResource: AsyncResource;
};

export const loaderContext = createCascade<LoaderContext>();

export const useLoaderContext = () =>
  loaderContext.use() as LoaderContext | undefined;

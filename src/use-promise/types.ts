import {
  GetAsyncResourceOptions,
  UseWatchResourceOptions,
} from "../resource/types.js";

export type UsePromiseOptions = GetAsyncResourceOptions &
  UseWatchResourceOptions;

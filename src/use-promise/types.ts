import {
  GetAsyncResourceOptions,
  UseWatchResourceOptions,
} from "../resource/types";

export type UsePromiseOptions = GetAsyncResourceOptions &
  UseWatchResourceOptions;

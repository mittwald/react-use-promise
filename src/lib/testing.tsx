import React, { createElement, FC, ReactNode, Suspense } from "react";

export const sleep = (ms: number) => {
  return new Promise((res) => setTimeout(res, ms));
};

export const squareAsync = async (value: number, sleepTimeMs: number) => {
  await sleep(sleepTimeMs);
  return value * value;
};

const loadingView = <span data-testid="loading-view">Loading</span>;

export const RenderWithLoadingView: FC<{ children: () => ReactNode }> = (
  props,
) => (
  <Suspense fallback={loadingView}>{createElement(props.children)}</Suspense>
);

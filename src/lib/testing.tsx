import React, { createElement, FC, ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { act, render as testingLibRender } from "@testing-library/react";
import { jest } from "@jest/globals";

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const squareAsync = async (value: number, sleepTimeMs: number) => {
  await sleep(sleepTimeMs);
  return value * value;
};

/* Initial loading is done immediately with setTimeout(..., 0) */
export const waitForInitialTimeout = () =>
  act(() => jest.advanceTimersToNextTimer());

export const render = (ui: ReactNode) => {
  const result = testingLibRender(ui);
  waitForInitialTimeout();
  return result;
};

const loadingView = <span data-testid="loading-view">Loading</span>;

export const RenderWithLoadingView: FC<{ children: () => ReactNode }> = (
  props,
) => (
  <ErrorBoundary fallback="ErrorFallback">
    <Suspense fallback={loadingView}>{createElement(props.children)}</Suspense>
  </ErrorBoundary>
);

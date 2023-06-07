import { test, expect } from "@jest/globals";
import { defaultStorageKeyBuilder } from "./defaultStorageKeyBuilder.js";

const builderInput = (override: object = {}) => ({
  parameters: ["foo", { bar: "baz" }],
  asyncFn: () => Promise.resolve("bam"),
  ...override,
});

test("Generates different ID when key changes", () => {
  expect(defaultStorageKeyBuilder(builderInput())).not.toEqual(
    defaultStorageKeyBuilder(
      builderInput({
        loaderId: "new",
      }),
    ),
  );
});

test("Generates different ID when parameter changes", () => {
  expect(defaultStorageKeyBuilder(builderInput())).not.toEqual(
    defaultStorageKeyBuilder(
      builderInput({
        parameters: ["foo", { bar: "new" }],
      }),
    ),
  );
});

test("Generates different ID when async function changes", () => {
  expect(defaultStorageKeyBuilder(builderInput())).not.toEqual(
    defaultStorageKeyBuilder(
      builderInput({
        asyncFn: () => Promise.resolve("new"),
      }),
    ),
  );
});

import { Tags } from "./Tags";
import { expect, test } from "vitest";

test("simple tags are store in tags", () => {
  const tags = new Tags(["tag1"]);
  expect(tags.tags).toEqual(["tag1"]);
});

test("scoped tags can be found", () => {
  const tags = new Tags([
    ["id", "123"],
    ["url", "https://example.com"],
  ]);
  expect(tags.getByScope("id")).toEqual("123");
  expect(tags.getByScope("url")).toEqual("https://example.com");
});

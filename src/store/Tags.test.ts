import { Tags, type Tag, type TagsInput } from "./Tags.js";
import { describe, expect, test } from "vitest";

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

describe("matching()", () => {
  test.each<[TagsInput, Tag, boolean]>([
    [[], "foo", false],
    [["foo"], "foo", true],
    [["foo"], "bar", false],
    [["entry/42/tag/1"], "entry/**", true],
    [["entry/42/tag/1"], "entry/43/**", false],
    [[["scope", "42"]], ["scope", "42"], true],
    [[["scope", "42"]], ["scope", "*"], true],
    [[["scope", "42"]], ["other", "42"], false],
    [[["scope", "42"]], "42", false],
    [["42"], ["scope", "42"], false],
  ])("Tags %j matching %j is %s", (input, tag, expected) => {
    expect(new Tags(input).matching(tag)).toBe(expected);
  });
});

describe("createMatcher()", () => {
  test("returned matcher can be reused for multiple Tags", () => {
    const isMatching = Tags.createMatcher("entry/42/**");

    expect(isMatching(new Tags(["entry/42/tag/1"]))).toBe(true);
    expect(isMatching(new Tags(["entry/43/tag/1"]))).toBe(false);
    expect(isMatching(new Tags(["entry/42/tag/2"]))).toBe(true);
  });
});

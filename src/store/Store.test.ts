import { Store } from "./Store.js";
import { AsyncResource } from "../resource/AsyncResource.js";
import { beforeEach } from "@jest/globals";
import { setValue } from "../lib/EventualValue.js";

const testStore = new Store<AsyncResource>();

beforeEach(() => {
  testStore.clear();
});

const testResource1 = new AsyncResource(() => Promise.resolve("foo"));
const testResource2 = new AsyncResource(() => Promise.resolve("bar"));

const error1 = new Error("Whoops1");
const error2 = new Error("Whoops2");

const errorTestResource1 = new AsyncResource(() => Promise.resolve("foo"));
const errorTestResource2 = new AsyncResource(() => Promise.resolve("bar"));
errorTestResource1.error.updateValue(setValue(error1));
errorTestResource2.error.updateValue(setValue(error2));

describe("get()", () => {
  test("returns undefined if entry is not set", () => {
    expect(testStore.get("42")).toBeUndefined();
  });

  test("returns entry if entry is  set", () => {
    testStore.getOrSet("42", () => testResource1);
    expect(testStore.get("42")).toBe(testResource1);
  });
});

describe("findByError()", () => {
  test("returns all with error when set to 'true'", () => {
    testStore.getOrSet("42", () => errorTestResource1);
    testStore.getOrSet("43", () => errorTestResource2);
    const all = testStore.findBy((res) => res.isMatchingError(true));
    expect(all).toHaveLength(2);
    expect(all).toEqual(
      expect.arrayContaining([errorTestResource1, errorTestResource2]),
    );
  });

  test("returns only matching ones when set to an error instance", () => {
    testStore.getOrSet("42", () => errorTestResource1);
    testStore.getOrSet("43", () => errorTestResource2);
    const matching = testStore.findBy((res) => res.isMatchingError(error1));
    expect(matching).toHaveLength(1);
    expect(matching).toEqual(expect.arrayContaining([errorTestResource1]));
  });

  test("returns nothing when set to an error instance that is not stored", () => {
    testStore.getOrSet("42", () => errorTestResource1);
    testStore.getOrSet("43", () => errorTestResource2);
    const matching = testStore.findBy((res) =>
      res.isMatchingError(new Error("Not found")),
    );
    expect(matching).toHaveLength(0);
  });
});

describe("getOrSet()", () => {
  test("inserts new entry", () => {
    expect(testStore.get("42")).toBeUndefined();
    testStore.getOrSet("42", () => testResource1);
    expect(testStore.get("42")).toBe(testResource1);
  });

  test("does not override existing entry", () => {
    testStore.getOrSet("42", () => testResource1);
    testStore.getOrSet("42", () => testResource2);
    expect(testStore.get("42")).toBe(testResource1);
  });
});

describe("getAll()", () => {
  test("returns all entries", () => {
    testStore.getOrSet("42", () => testResource1);
    testStore.getOrSet("43", () => testResource2);
    const all = testStore.getAll();
    expect(all).toHaveLength(2);
    expect(all).toEqual(expect.arrayContaining([testResource1, testResource2]));
  });

  test("returns no entries when no tag matches", () => {
    testStore.getOrSet("42", () => testResource1, {
      tags: ["entry/42/tag/1", "entry/42/tag/2"],
    });
    const all = testStore.getAll("foo");
    expect(all).toHaveLength(0);
  });

  test("returns no entries when no tag matches glob", () => {
    testStore.getOrSet("42", () => testResource1, {
      tags: ["entry/42/tag/1", "entry/42/tag/2"],
    });
    const all = testStore.getAll("foo/**");
    expect(all).toHaveLength(0);
  });

  test("returns entry when one tag matches exactly", () => {
    testStore.getOrSet("42", () => testResource1, {
      tags: ["entry/42/tag/1", "entry/42/tag/2"],
    });
    const all = testStore.getAll("entry/42/tag/1");
    expect(all).toHaveLength(1);
  });

  test("returns entry when one tag matches glob", () => {
    testStore.getOrSet("42", () => testResource1, {
      tags: ["entry/42/tag/1", "entry/42/tag/2"],
    });
    const all = testStore.getAll("entry/42/**");
    expect(all).toHaveLength(1);
  });

  test("returns all entries with tag matching glob", () => {
    testStore.getOrSet("42", () => testResource1, {
      tags: ["entry/42/tag/1", "entry/43/tag/2"],
    });
    testStore.getOrSet("43", () => testResource2, {
      tags: ["entry/43/tag/1", "entry/43/tag/2"],
    });
    const all = testStore.getAll("entry/**");
    expect(all).toHaveLength(2);
  });
});

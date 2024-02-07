import { getHttpResource } from "./getHttpResource.js";
import { Store } from "../store/Store.js";
import { beforeEach } from "@jest/globals";

beforeEach(() => {
  Store.default.clear();
});

test("HTTP resource is tagged with method and uri", () => {
  getHttpResource("https://test.org");
  expect(Store.default.getAll("http/method/GET")).toHaveLength(1);
  expect(Store.default.getAll("http/uri/https://test.org")).toHaveLength(1);
});

test("HTTP resource is tagged with method and uri (using query params)", () => {
  getHttpResource("https://test.org", { params: { search: "foo" } });
  expect(Store.default.getAll("http/method/GET")).toHaveLength(1);
  expect(
    Store.default.getAll("http/uri/https://test.org?search=foo"),
  ).toHaveLength(1);
});

test("HTTP resource is tagged with no-default method and uri", () => {
  getHttpResource("https://test.org/foo", {
    method: "OPTIONS",
  });
  expect(Store.default.getAll("http/method/OPTIONS")).toHaveLength(1);
  expect(Store.default.getAll("http/uri/https://test.org/*")).toHaveLength(1);
  expect(Store.default.getAll("http/uri/**/foo")).toHaveLength(1);
});

test("HTTP resource is the same on same request config and url", () => {
  const resource1 = getHttpResource("https://test.org", {
    method: "GET",
  });

  const resource2 = getHttpResource("https://test.org", {
    method: "GET",
  });

  expect(resource1).toBe(resource2);
});

test("HTTP resource is not the same for different URLs", () => {
  const resource1 = getHttpResource("https://test.org", {
    method: "GET",
  });

  const resource2 = getHttpResource("https://test.org/foo", {
    method: "GET",
  });

  expect(resource1).not.toBe(resource2);
});

test("HTTP resource is not the same for different request config", () => {
  const resource1 = getHttpResource("https://test.org", {
    method: "GET",
  });

  const resource2 = getHttpResource("https://test.org", {
    method: "GET",
    headers: {
      "x-access-token": "12345",
    },
  });

  expect(resource1).not.toBe(resource2);
});

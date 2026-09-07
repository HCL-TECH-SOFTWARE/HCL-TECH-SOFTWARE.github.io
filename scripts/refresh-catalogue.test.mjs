import assert from "node:assert/strict";
import test from "node:test";
import { normaliseRepository } from "./refresh-catalogue.mjs";

const repository = {
  name: "example",
  description: "<img src=x onerror=alert(1)>",
  url: "https://github.com/HCL-TECH-SOFTWARE/example",
  isPrivate: false,
  isFork: false,
  licenseInfo: { name: "MIT License" },
  primaryLanguage: { name: "JavaScript" },
  repositoryTopics: { nodes: [{ topic: { name: "example" } }] }
};

test("retains public repository text as data", () => {
  assert.deepEqual(normaliseRepository(repository), {
    name: "example",
    description: "<img src=x onerror=alert(1)>",
    url: "https://github.com/HCL-TECH-SOFTWARE/example",
    private: false,
    fork: false,
    license: "MIT License",
    language: "JavaScript",
    languageColor: "#f1e05a",
    topics: ["example"]
  });
});

test("rejects private and unapproved repository URLs", () => {
  assert.equal(normaliseRepository({ ...repository, isPrivate: true }), null);
  assert.equal(normaliseRepository({ ...repository, url: "javascript:alert(1)" }), null);
  assert.equal(normaliseRepository({ ...repository, url: "https://github.com/other/example" }), null);
});

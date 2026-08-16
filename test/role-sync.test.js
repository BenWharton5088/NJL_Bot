import test from "node:test";
import assert from "node:assert/strict";
import { desiredRoleNames } from "../src/role-sync.js";

test("first place receives Try Hard and Playoffs", () => {
  assert.deepEqual(desiredRoleNames(1, 10, 6), ["Try Hard", "Playoffs"]);
});

test("middle playoff team receives Average and Playoffs", () => {
  assert.deepEqual(desiredRoleNames(4, 10, 6), ["Average", "Playoffs"]);
});

test("non-playoff team receives Average and Washed", () => {
  assert.deepEqual(desiredRoleNames(8, 10, 6), ["Average", "Washed"]);
});

test("last place receives Last Place and Washed", () => {
  assert.deepEqual(desiredRoleNames(10, 10, 6), ["Last Place", "Washed"]);
});

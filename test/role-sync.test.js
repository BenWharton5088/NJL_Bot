import test from "node:test";
import assert from "node:assert/strict";
import { desiredRoleNames } from "../src/role-sync.js";

test("first place receives Try Hard and Playoffs", () => {
  assert.deepEqual(desiredRoleNames(1, 10, 6), ["Try Hard", "Playoffs"]);
});


test("last place receives Last Place and Washed", () => {
  assert.deepEqual(desiredRoleNames(10, 10, 6), ["Last Place", "Washed"]);
});

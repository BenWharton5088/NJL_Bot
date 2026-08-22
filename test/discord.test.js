import test from "node:test";
import assert from "node:assert/strict";
import { getGuildRoles } from "../src/discord.js";

test("Discord requests retry after a 429 response", async () => {
  const originalFetch = global.fetch;
  let calls = 0;

  global.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response(JSON.stringify({ retry_after: 0 }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify([{ id: "role-1", name: "Try Hard" }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const roles = await getGuildRoles("guild-1", "token");
    assert.equal(calls, 2);
    assert.deepEqual(roles, [{ id: "role-1", name: "Try Hard" }]);
  } finally {
    global.fetch = originalFetch;
  }
});

/**
 * Verifies participating companies come back alphabetically.
 *
 * The real route handlers are exercised, but against a throwaway database so
 * the live `investment-db` companies are never written to. The live collection
 * is snapshotted before and compared after as a backstop.
 */
const fs = require("fs");
const { startServer } = require("./testServer.cjs");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");

const env = fs.readFileSync(".env", "utf8");
const LIVE_URI = env.match(/^MONGODB_URI=(.*)$/m)[1].trim();
const JWT_SECRET = env.match(/^JWT_SECRET=(.*)$/m)[1].trim();

const SCRATCH_DB = "sorttest_scratch_delete_me";
const TEST_URI = LIVE_URI.replace(/\/([^/?]+)\?/, `/${SCRATCH_DB}?`);
if (!TEST_URI.includes(SCRATCH_DB) || TEST_URI.includes("/investment-db?")) {
  console.error("refusing to run: could not redirect the URI to a scratch db");
  process.exit(1);
}

const PORT = 3100;
const BASE = `http://127.0.0.1:${PORT}`;
const token = jwt.sign(
  { id: "6a7178c3210b0c87d366bb80", email: "sorttest@local", role: "superadmin" },
  JWT_SECRET,
  { expiresIn: "1h" }
);
const AUTH = { cookie: `admin_token=${token}`, "content-type": "application/json" };

let pass = 0, fail = 0;
const t = (name, cond, detail) => {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name + (detail ? "\n          -> " + String(detail) : "")); }
};

// Deliberately awkward: lowercase, all-caps, digits, and an accent. Inserted in
// an order that is neither alphabetical nor reverse-alphabetical.
const NAMES = [
  "Zenith Metals",
  "apex mining",
  "3M Minerals",
  "Barrick Gold",
  "ATLAS COPCO",
  "Éclat Resources",
  "astra exploration",
];

const get = async (qs) => {
  const res = await fetch(`${BASE}/api/companies${qs}`, { headers: { cookie: AUTH.cookie } });
  const body = await res.json();
  return { status: res.status, body };
};
const names = (body) => (body.data || []).map((c) => c.name);

// What "alphabetical, case-insensitive" should mean, computed independently of
// MongoDB so the assertion is not just re-stating the server's own answer.
const expectedOrder = [...NAMES].sort((a, b) =>
  a.localeCompare(b, "en", { sensitivity: "base" })
);


(async () => {
  const live = new MongoClient(LIVE_URI);
  await live.connect();
  const before = (await live.db().collection("companies").find({}, { projection: { name: 1 } }).toArray())
    .map((d) => String(d._id) + ":" + d.name).sort();
  console.log(`live companies before: ${before.length}`);

  const server = await startServer({
    port: PORT,
    env: { MONGODB_URI: TEST_URI },
    readyPath: "/api/companies?limit=1",
    readyHeaders: {},
  });

  try {

    // Confirm the server really is on the scratch db before writing anything.
    const empty = await get("?limit=100");
    if (names(empty.body).length !== 0) {
      throw new Error("scratch db is not empty — aborting rather than risk live data");
    }
    console.log("scratch db confirmed empty\n");

    const created = await fetch(`${BASE}/api/companies`, {
      method: "POST",
      headers: AUTH,
      body: JSON.stringify(NAMES.map((name) => ({ name, year: 2027 }))),
    });
    const createdBody = await created.json();
    t("seeded 7 companies via POST", created.status === 201 && createdBody.data?.length === 7,
      `${created.status} ${JSON.stringify(createdBody).slice(0, 200)}`);

    // 1. The default — what the frontend gets with no query string at all.
    const def = await get("?limit=100");
    t("default (no ?sort=) is A–Z",
      JSON.stringify(names(def.body)) === JSON.stringify(expectedOrder),
      `got    ${JSON.stringify(names(def.body))}\n          expect ${JSON.stringify(expectedOrder)}`);

    // 2. Case-insensitivity is the part binary sorting gets wrong.
    const got = names(def.body);
    t("lowercase not exiled after uppercase",
      got.indexOf("apex mining") < got.indexOf("Barrick Gold"),
      `apex@${got.indexOf("apex mining")} barrick@${got.indexOf("Barrick Gold")}`);
    // astra < atlas on the third letter (s < t), so lowercase "astra" leading
    // all-caps "ATLAS" is exactly what case-insensitive ordering should do.
    t("all-caps ATLAS not hoisted above lowercase astra",
      got.indexOf("astra exploration") < got.indexOf("ATLAS COPCO") &&
      got.indexOf("ATLAS COPCO") < got.indexOf("Barrick Gold"), JSON.stringify(got));
    t("digits lead", got[0] === "3M Minerals", got[0]);
    t("accented É files under E, not last",
      got.indexOf("Éclat Resources") < got.indexOf("Zenith Metals"), JSON.stringify(got));

    // 3. An explicit sort must still win — the admin table's column headers use it.
    const desc = await get("?limit=100&sort=name&order=desc");
    t("?sort=name&order=desc reverses",
      JSON.stringify(names(desc.body)) === JSON.stringify([...expectedOrder].reverse()),
      JSON.stringify(names(desc.body)));

    const byDate = await get("?limit=100&sort=createdAt&order=desc");
    t("?sort=createdAt still overrides the default",
      JSON.stringify(names(byDate.body)) !== JSON.stringify(expectedOrder),
      "createdAt sort returned alphabetical order — the override is not applied");

    // 4. Pagination must stay alphabetical across pages, not just within one.
    const p1 = await get("?limit=3&page=1");
    const p2 = await get("?limit=3&page=2");
    const p3 = await get("?limit=3&page=3");
    t("pages 1–3 concatenate into one A–Z run",
      JSON.stringify([...names(p1.body), ...names(p2.body), ...names(p3.body)]) ===
      JSON.stringify(expectedOrder),
      JSON.stringify([...names(p1.body), ...names(p2.body), ...names(p3.body)]));

    // 5. Search results are a directory too.
    const search = await get("?limit=100&search=a");
    const s = names(search.body);
    t("search results are alphabetical",
      JSON.stringify(s) === JSON.stringify(s.slice().sort((a, b) =>
        a.localeCompare(b, "en", { sensitivity: "base" }))), JSON.stringify(s));

    // 6. The admin page's own defaults hit the same order.
    const adminQs = await get("?page=1&limit=10&sort=name&order=asc");
    t("admin page defaults (sort=name&order=asc) match",
      JSON.stringify(names(adminQs.body)) === JSON.stringify(expectedOrder),
      JSON.stringify(names(adminQs.body)));

    // 7. Admin companies page renders.
    const pageRes = await fetch(`${BASE}/admin/companies`, { headers: { cookie: AUTH.cookie } });
    t("/admin/companies responds 200", pageRes.status === 200, String(pageRes.status));
  } finally {
    server.stop();
    // Drop the scratch database; never the live one.
    const scratch = new MongoClient(TEST_URI);
    await scratch.connect();
    if (scratch.db().databaseName !== SCRATCH_DB) throw new Error("wrong db, not dropping");
    await scratch.db().dropDatabase();
    await scratch.close();
    console.log(`\ndropped scratch db ${SCRATCH_DB}`);

    const after = (await live.db().collection("companies").find({}, { projection: { name: 1 } }).toArray())
      .map((d) => String(d._id) + ":" + d.name).sort();
    t("live companies untouched",
      JSON.stringify(before) === JSON.stringify(after),
      `before ${before.length} after ${after.length}`);
    await live.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

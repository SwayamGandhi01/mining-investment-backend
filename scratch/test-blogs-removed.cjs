/**
 * Confirms blogs are gone from the API and admin panel, and that removing them
 * did not disturb the dashboard (whose fallback block indexes results
 * positionally, so a stale index would silently mislabel other counts).
 *
 * Read-only against the live database.
 */
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { startServer } = require("./testServer.cjs");

const env = fs.readFileSync(".env", "utf8");
const LIVE_URI = env.match(/^MONGODB_URI=(.*)$/m)[1].trim();
const JWT_SECRET = env.match(/^JWT_SECRET=(.*)$/m)[1].trim();

const PORT = 3107;
const COOKIE = `admin_token=${jwt.sign(
  { id: "6a7178c3210b0c87d366bb80", email: "test@local", role: "superadmin" },
  JWT_SECRET,
  { expiresIn: "1h" }
)}`;

let pass = 0, fail = 0;
const t = (name, cond, detail) => {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name + (detail ? "\n          -> " + String(detail) : "")); }
};

(async () => {
  const live = new MongoClient(LIVE_URI);
  await live.connect();
  const blogDocs = await live.db().collection("blogs").countDocuments();

  const server = await startServer({
    port: PORT,
    readyPath: "/api/companies?limit=1",
  });
  const BASE = server.base;

  try {
    // --- The API is gone -----------------------------------------------------
    for (const path of ["/api/blogs", "/api/blogs?limit=1", "/api/blogs/123"]) {
      const res = await fetch(`${BASE}${path}`, { headers: { cookie: COOKIE } });
      t(`GET ${path} is 404`, res.status === 404, String(res.status));
    }
    const post = await fetch(`${BASE}/api/blogs`, {
      method: "POST",
      headers: { cookie: COOKIE, "content-type": "application/json" },
      body: JSON.stringify({ title: "x" }),
    });
    t("POST /api/blogs is 404", post.status === 404, String(post.status));

    // --- The admin pages are gone -------------------------------------------
    for (const path of ["/admin/blogs", "/admin/blogs/create"]) {
      const res = await fetch(`${BASE}${path}`, { headers: { cookie: COOKIE } });
      t(`${path} is 404`, res.status === 404, String(res.status));
    }

    // --- Nothing links to them anymore --------------------------------------
    let js = "";
    const path = require("path");
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith(".js")) js += fs.readFileSync(p, "utf8") + "\n";
      }
    })(path.join(process.cwd(), ".next/static/chunks"));

    t("no /admin/blogs link in any client bundle", !js.includes("/admin/blogs"));
    t("no /api/blogs call in any client bundle", !js.includes("/api/blogs"));
    t("no 'Blog Posts' label in any client bundle", !js.includes("Blog Posts"));

    // --- The dashboard still works ------------------------------------------
    const stats = await fetch(`${BASE}/api/dashboard/stats`, { headers: { cookie: COOKIE } });
    const statsBody = await stats.json();
    t("dashboard stats endpoint responds 200", stats.status === 200, String(stats.status));
    t("stats no longer report a blogs count",
      !("blogs" in (statsBody.data?.counts || {})), JSON.stringify(statsBody.data?.counts));

    // Every other count must survive — this is what a bad edit would break.
    const expected = ["events", "speakers", "sponsors", "registrations", "companies",
      "brochures", "agendas", "gallery", "users", "investorRegistrations",
      "companyRegistrations", "newsflash"];
    const counts = statsBody.data?.counts || {};
    t("all other dashboard counts still present",
      expected.every((k) => k in counts),
      `missing: ${expected.filter((k) => !(k in counts))}`);
    t("counts are real numbers, not undefined",
      expected.every((k) => typeof counts[k] === "number"), JSON.stringify(counts));

    // --- The fallback path indexes results positionally ----------------------
    // Re-create it here: if an index were left stale, a label would show the
    // wrong endpoint's total.
    const fallbackEndpoints = [
      "/api/events", "/api/registrations", "/api/investor-registrations",
      "/api/company-registrations", "/api/speakers", "/api/sponsors",
      "/api/companies", "/api/brochures", "/api/agendas", "/api/gallery", "/api/users",
    ];
    const src = fs.readFileSync("src/app/admin/(dashboard)/dashboard/page.tsx", "utf8");
    const listed = [...src.matchAll(/axios\.get\("(\/api\/[a-z-]+)\?limit=1"\)/g)].map((m) => m[1]);
    t("fallback fetches exactly the 11 remaining endpoints, in order",
      JSON.stringify(listed) === JSON.stringify(fallbackEndpoints),
      JSON.stringify(listed));

    const indices = [...src.matchAll(/getTotal\(results\[(\d+)\]\)/g)].map((m) => Number(m[1]));
    t("results indices are contiguous 0..10 with no gap left by blogs",
      JSON.stringify(indices) === JSON.stringify([...Array(11).keys()]),
      JSON.stringify(indices));

    // --- Other admin pages still render -------------------------------------
    for (const p of ["dashboard", "companies", "latest-news", "newsflash", "gallery", "subscribers"]) {
      const res = await fetch(`${BASE}/admin/${p}`, { headers: { cookie: COOKIE } });
      t(`/admin/${p} still responds 200`, res.status === 200, String(res.status));
    }

    // --- Source tree is clean ------------------------------------------------
    const leftovers = [];
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (/blog/i.test(e.name)) leftovers.push(p); walk(p); }
        else if (/blog/i.test(e.name)) leftovers.push(p);
      }
    })(path.join(process.cwd(), "src"));
    t("no blog files or directories remain under src/", leftovers.length === 0, leftovers.join(", "));
  } finally {
    server.stop();
    console.log(`\nNOTE: the MongoDB "blogs" collection still holds ${blogDocs} document(s) — not touched.`);
    await live.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

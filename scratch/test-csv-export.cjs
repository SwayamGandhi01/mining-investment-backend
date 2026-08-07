/**
 * Verifies the CSV export endpoints on all four admin lists.
 *
 * Seeds deliberately hostile values (commas, quotes, newlines, spreadsheet
 * formulas, accents) into a throwaway database and parses the CSV back to
 * confirm it round-trips. Live data is never touched.
 */
const fs = require("fs");
const { startServer } = require("./testServer.cjs");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");

const env = fs.readFileSync(".env", "utf8");
const LIVE_URI = env.match(/^MONGODB_URI=(.*)$/m)[1].trim();
const JWT_SECRET = env.match(/^JWT_SECRET=(.*)$/m)[1].trim();

const SCRATCH_DB = "csvexport_scratch_delete_me";
const TEST_URI = LIVE_URI.replace(/\/([^/?]+)\?/, `/${SCRATCH_DB}?`);
if (!TEST_URI.includes(SCRATCH_DB) || TEST_URI.includes("/investment-db?")) {
  console.error("refusing to run: could not redirect the URI to a scratch db");
  process.exit(1);
}

const PORT = 3104;
const BASE = `http://127.0.0.1:${PORT}`;
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

/** Minimal RFC 4180 parser, so assertions read the CSV the way Excel would. */
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = "", inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\r" && text[i + 1] === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; }
    else if (ch === "\n" || ch === "\r") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const NASTY = {
  comma: "Smith, John",
  quotes: 'He said "hello" loudly',
  newline: "Line one\nLine two",
  formula: "=cmd|'/c calc'!A0",
  // Starts with "+" like a phone number, but is a DDE payload.
  plusPayload: "+cmd|'/c calc'!A0",
  minusPayload: "-2+3+cmd|'/c calc'!A0",
  accented: "Zoë Éclair-Müller",
};

(async () => {
  const live = new MongoClient(LIVE_URI);
  await live.connect();
  const liveCounts = {};
  for (const c of ["subscribers", "investorregistrations", "companyregistrations", "studentsponsorships"]) {
    liveCounts[c] = await live.db().collection(c).countDocuments();
  }
  console.log("live counts before:", JSON.stringify(liveCounts));

  // Seed the scratch db directly — the export path is what is under test.
  const scratch = new MongoClient(TEST_URI);
  await scratch.connect();
  const sdb = scratch.db();
  if (sdb.databaseName !== SCRATCH_DB) throw new Error("wrong db");
  // Start from empty: a run that dies before its cleanup would otherwise leave
  // rows behind and inflate the next run's counts.
  await sdb.dropDatabase();

  const now = new Date("2027-03-15T10:30:00.000Z");
  // 12 subscribers, so an export that respected the default limit=10 would show it.
  await sdb.collection("subscribers").insertMany([
    { fullName: NASTY.comma, email: "comma@example.com", isDeleted: false, createdAt: now, updatedAt: now },
    { fullName: NASTY.quotes, email: "quotes@example.com", isDeleted: false, createdAt: now, updatedAt: now },
    { fullName: NASTY.newline, email: "newline@example.com", isDeleted: false, createdAt: now, updatedAt: now },
    { fullName: NASTY.formula, email: "formula@example.com", isDeleted: false, createdAt: now, updatedAt: now },
    { fullName: NASTY.accented, email: "accented@example.com", isDeleted: false, createdAt: now, updatedAt: now },
    { fullName: NASTY.plusPayload, email: "plus@example.com", isDeleted: false, createdAt: now, updatedAt: now },
    { fullName: NASTY.minusPayload, email: "minus@example.com", isDeleted: false, createdAt: now, updatedAt: now },
    { fullName: "+1 (416) 555-0199", email: "phone@example.com", isDeleted: false, createdAt: now, updatedAt: now },
    { fullName: "Deleted Person", email: "deleted@example.com", isDeleted: true, createdAt: now, updatedAt: now },
    ...Array.from({ length: 7 }, (_, i) => ({
      fullName: `Filler ${i + 1}`, email: `filler${i + 1}@example.com`,
      isDeleted: false, createdAt: now, updatedAt: now,
    })),
  ]);

  await sdb.collection("investorregistrations").insertOne({
    registrationNumber: "INV-TEST0001", companyName: "Northern Capital, LLC", firstName: "Aisha",
    lastName: "Rahman", businessTitle: "Portfolio Manager", city: "Toronto", country: "Canada",
    email: "aisha@example.com", phone: "+1 416 555 0100", investorType: "Institutional",
    assetsUnderManagement: "$500M+", signUpForNews: true, status: "confirmed",
    isDeleted: false, createdAt: now, updatedAt: now,
  });

  await sdb.collection("companyregistrations").insertOne({
    registrationNumber: "CMP-TEST0001", companyName: "Aurora Metals Corp", marketCap: "$1.2B",
    primaryExchangeTicker: "TSX:AUR", commodity: "Gold, Copper", projectStage: "Developer",
    location: "Vancouver, BC", email: "ir@example.com", signUpForNews: false, status: "confirmed",
    isDeleted: false, createdAt: now, updatedAt: now,
  });

  await sdb.collection("studentsponsorships").insertOne({
    registrationNumber: "STU-TEST0001", firstName: "Sarah", lastName: "Jenkins",
    email: "sarah@example.edu", phone: "+1 416 555 0199", currentSchool: "Queen's University",
    programAndYear: "Mining Engineering, 2nd Year", language: "English",
    letterOfInterest: "First paragraph.\nSecond paragraph, with a comma.",
    resume: { url: "https://res.cloudinary.com/x/raw/upload/resume-1", publicId: "p1", fileName: "CV.pdf" },
    letterOfInterestFile: { url: "https://res.cloudinary.com/x/raw/upload/letter-1", publicId: "p2", fileName: "Letter.docx" },
    signUpForNews: true, status: "confirmed", isDeleted: false, createdAt: now, updatedAt: now,
  });
  await scratch.close();

  const server = await startServer({
    port: PORT,
    env: { MONGODB_URI: TEST_URI },
    readyPath: "/api/subscribers?limit=1",
    readyHeaders: { cookie: COOKIE },
  });

  const getCsv = async (path, qs = "") => {
    const res = await fetch(`${BASE}${path}${qs}`, { headers: { cookie: COOKIE } });
    return { res, text: await res.text() };
  };

  try {
    // --- Routing: /export must not be swallowed by the [id] route ------------
    const { res, text } = await getCsv("/api/subscribers/export");
    t("/export resolves to the export route, not [id]",
      res.status === 200 && (res.headers.get("content-type") || "").includes("text/csv"),
      `${res.status} ${res.headers.get("content-type")} ${text.slice(0, 120)}`);

    // --- Response shape -------------------------------------------------------
    t("filename is dated and attached",
      /attachment; filename="subscribers-\d{4}-\d{2}-\d{2}\.csv"/.test(
        res.headers.get("content-disposition") || ""),
      res.headers.get("content-disposition"));
    // Checked on the raw bytes: res.text() decodes with BOM-stripping, so the
    // decoded string never shows it even when the file has one.
    const rawHead = Buffer.from(
      await (await fetch(`${BASE}/api/subscribers/export`, { headers: { cookie: COOKIE } })).arrayBuffer()
    ).subarray(0, 3);
    t("UTF-8 BOM present so Excel reads accents",
      rawHead.equals(Buffer.from([0xef, 0xbb, 0xbf])), rawHead.toString("hex"));

    const rows = parseCsv(text);
    t("header row matches the columns",
      JSON.stringify(rows[0]) === JSON.stringify(["Full Name", "Email", "Subscribed At"]),
      JSON.stringify(rows[0]));

    // --- Completeness: exports the whole list, not one page -------------------
    t("exports all 15 rows, ignoring the default page size of 10",
      rows.length - 1 === 15, `${rows.length - 1} data rows`);
    t("soft-deleted records excluded",
      !text.includes("Deleted Person"), "deleted subscriber leaked into the export");

    // --- Escaping -------------------------------------------------------------
    const byEmail = Object.fromEntries(rows.slice(1).map((r) => [r[1], r]));
    t("comma in a value survives", byEmail["comma@example.com"]?.[0] === NASTY.comma,
      JSON.stringify(byEmail["comma@example.com"]?.[0]));
    t("double quotes survive", byEmail["quotes@example.com"]?.[0] === NASTY.quotes,
      JSON.stringify(byEmail["quotes@example.com"]?.[0]));
    t("embedded newline stays inside one field",
      byEmail["newline@example.com"]?.[0] === NASTY.newline,
      JSON.stringify(byEmail["newline@example.com"]?.[0]));
    t("accented characters intact", byEmail["accented@example.com"]?.[0] === NASTY.accented,
      JSON.stringify(byEmail["accented@example.com"]?.[0]));
    t("spreadsheet formula neutralised with a leading apostrophe",
      byEmail["formula@example.com"]?.[0] === `'${NASTY.formula}`,
      JSON.stringify(byEmail["formula@example.com"]?.[0]));

    t("'+' DDE payload still neutralised despite the phone exemption",
      byEmail["plus@example.com"]?.[0] === `'${NASTY.plusPayload}`,
      JSON.stringify(byEmail["plus@example.com"]?.[0]));
    t("'-' DDE payload still neutralised",
      byEmail["minus@example.com"]?.[0] === `'${NASTY.minusPayload}`,
      JSON.stringify(byEmail["minus@example.com"]?.[0]));
    t("a genuine phone number keeps no apostrophe",
      byEmail["phone@example.com"]?.[0] === "+1 (416) 555-0199",
      JSON.stringify(byEmail["phone@example.com"]?.[0]));

    // Injection payloads that merely start like a phone number must NOT slip
    // through the phone exemption.
    const inv2 = parseCsv((await getCsv("/api/investor-registrations/export")).text);
    const phoneCol = inv2[0].indexOf("Phone");
    t("plain phone number exported without a stray apostrophe",
      inv2[1][phoneCol] === "+1 416 555 0100", JSON.stringify(inv2[1][phoneCol]));
    t("date exported as ISO-8601",
      byEmail["comma@example.com"]?.[2] === "2027-03-15T10:30:00.000Z",
      byEmail["comma@example.com"]?.[2]);

    // --- Search is honoured ---------------------------------------------------
    const filtered = await getCsv("/api/subscribers/export", "?search=Filler");
    const filteredRows = parseCsv(filtered.text);
    t("search narrows the export", filteredRows.length - 1 === 7, `${filteredRows.length - 1} rows`);

    // --- Auth: these prefixes are public for form POSTs, so the handler must guard
    for (const path of [
      "/api/subscribers/export",
      "/api/investor-registrations/export",
      "/api/company-registrations/export",
      "/api/student-sponsorships/export",
    ]) {
      const anon = await fetch(`${BASE}${path}`);
      t(`${path} rejects unauthenticated requests`,
        anon.status === 401 || anon.status === 403, String(anon.status));
    }

    // --- The other three exports ---------------------------------------------
    const inv = parseCsv((await getCsv("/api/investor-registrations/export")).text);
    t("investor export header correct",
      inv[0].join("|") ===
      "Registration #|Company Name|First Name|Last Name|Business Title|City|Country|Email|Phone|Investor Type|Assets Under Management|Signed Up For News|Status|Registered At",
      inv[0].join("|"));
    t("investor row exported with comma-containing company name",
      inv[1][1] === "Northern Capital, LLC" && inv[1][0] === "INV-TEST0001", JSON.stringify(inv[1]));
    t("boolean true renders as Yes", inv[1][11] === "Yes", inv[1][11]);

    const cmp = parseCsv((await getCsv("/api/company-registrations/export")).text);
    t("company registration export has all fields",
      cmp[0].length === 11 && cmp[1][3] === "TSX:AUR" && cmp[1][4] === "Gold, Copper" &&
      cmp[1][5] === "Developer" && cmp[1][6] === "Vancouver, BC",
      JSON.stringify(cmp[1]));
    t("boolean false renders as No", cmp[1][8] === "No", cmp[1][8]);

    const stu = parseCsv((await getCsv("/api/student-sponsorships/export")).text);
    const col = Object.fromEntries(stu[0].map((h, i) => [h, i]));
    t("student sponsorship export includes resume filename",
      stu[1][col["Resume File"]] === "CV.pdf", JSON.stringify(stu[1]));
    t("multi-line letter of interest kept in one field",
      stu[1][col["Letter of Interest"]] === "First paragraph.\nSecond paragraph, with a comma.",
      JSON.stringify(stu[1][col["Letter of Interest"]]));

    // --- Download links in the CSV must give a real, named PDF ---------------
    const resumeLink = stu[1][col["Resume Download URL"]];
    const letterLink = stu[1][col["Letter File Download URL"]];
    t("resume download link is absolute (clickable from a spreadsheet)",
      /^https?:\/\/127\.0\.0\.1:\d+\/api\/student-sponsorships\/[a-f0-9]{24}\/file\?type=resume$/.test(resumeLink),
      resumeLink);
    t("letter download link is absolute",
      /\/file\?type=letter$/.test(letterLink) && letterLink.startsWith("http"), letterLink);
    // Every link in the sheet must be a working one — a raw Cloudinary URL
    // anywhere in the row is a link that downloads an unopenable file.
    t("no raw Cloudinary URL anywhere in the export",
      !stu[1].some((cell) => String(cell).includes("res.cloudinary.com")),
      JSON.stringify(stu[1].filter((c) => String(c).includes("res.cloudinary.com"))));
    t("every http link in the row is a download link",
      stu[1].filter((c) => String(c).startsWith("http"))
            .every((c) => String(c).includes("/file?type=")),
      JSON.stringify(stu[1].filter((c) => String(c).startsWith("http"))));

    // The seeded record points at a fake Cloudinary path, so the proxy cannot
    // fetch it — a 502 proves the link routed correctly and was authenticated,
    // which is what the CSV column is responsible for. The real download is
    // covered end to end in test-sponsorship-download.cjs.
    const linkRes = await fetch(resumeLink, { headers: { cookie: COOKIE } });
    t("resume link reaches the download route (not a 404/400)",
      linkRes.status === 502, `${linkRes.status}`);
    const linkAnon = await fetch(resumeLink);
    t("resume link still requires a signed-in admin",
      linkAnon.status === 401 || linkAnon.status === 403, String(linkAnon.status));

    // A record with no attachments must not emit a link to nothing.
    await (async () => {
      const c = new MongoClient(TEST_URI);
      await c.connect();
      await c.db().collection("studentsponsorships").insertOne({
        registrationNumber: "STU-NOFILE01", firstName: "No", lastName: "Files",
        email: "nofile@example.edu", phone: "1", currentSchool: "X", programAndYear: "Y",
        signUpForNews: false, status: "confirmed", isDeleted: false, createdAt: now, updatedAt: now,
      });
      await c.close();
    })();
    const stu2 = parseCsv((await getCsv("/api/student-sponsorships/export", "?search=NOFILE")).text);
    t("no attachment means an empty link cell, not a dead URL",
      stu2[1][col["Resume Download URL"]] === "" && stu2[1][col["Letter File Download URL"]] === "",
      JSON.stringify(stu2[1]));

    // --- Empty export still produces a valid file -----------------------------
    const none = await getCsv("/api/subscribers/export", "?search=zzzznomatch");
    const noneRows = parseCsv(none.text);
    t("empty result still returns a header-only CSV",
      none.res.status === 200 && noneRows.length === 1 && noneRows[0][0] === "Full Name",
      JSON.stringify(noneRows));

    // --- Admin pages render with the new button ------------------------------
    for (const p of ["subscribers", "investor-registrations", "company-registrations", "student-sponsorships"]) {
      const page = await fetch(`${BASE}/admin/${p}`, { headers: { cookie: COOKIE } });
      t(`/admin/${p} responds 200`, page.status === 200, String(page.status));
    }

    // The button ships to the browser on all four pages.
    let js = "";
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = require("path").join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith(".js")) js += fs.readFileSync(p, "utf8") + "\n";
      }
    };
    walk(require("path").join(process.cwd(), ".next/static/chunks"));
    t("Export CSV button bundled for the browser", js.includes("Export CSV"));
    for (const ep of ["/api/subscribers/export", "/api/investor-registrations/export",
                      "/api/company-registrations/export", "/api/student-sponsorships/export"]) {
      t(`${ep} wired into a page bundle`, js.includes(ep));
    }
  } finally {
    server.stop();
    const cleanup = new MongoClient(TEST_URI);
    await cleanup.connect();
    if (cleanup.db().databaseName !== SCRATCH_DB) throw new Error("wrong db, not dropping");
    await cleanup.db().dropDatabase();
    await cleanup.close();
    console.log(`\ndropped scratch db ${SCRATCH_DB}`);

    let intact = true;
    for (const [c, n] of Object.entries(liveCounts)) {
      const after = await live.db().collection(c).countDocuments();
      if (after !== n) { intact = false; console.log(`  ${c}: ${n} -> ${after}`); }
    }
    t("live collections untouched", intact);
    await live.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

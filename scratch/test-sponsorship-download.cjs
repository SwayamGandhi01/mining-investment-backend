/** Read-only check of the admin attachment download route against the live entry. */
const fs = require("fs");
const { startServer } = require("./testServer.cjs");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");

const env = fs.readFileSync(".env", "utf8");
const LIVE_URI = env.match(/^MONGODB_URI=(.*)$/m)[1].trim();
const JWT_SECRET = env.match(/^JWT_SECRET=(.*)$/m)[1].trim();

const PORT = 3103;
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


(async () => {
  const live = new MongoClient(LIVE_URI);
  await live.connect();
  const col = live.db().collection("studentsponsorships");
  const rec = await col.findOne({ registrationNumber: "STU-E88FC77F" });
  if (!rec) throw new Error("test entry not found");
  const before = await col.countDocuments();

  const server = await startServer({
    port: PORT,
    env: {},
    readyPath: "/api/student-sponsorships?limit=1",
    readyHeaders: { cookie: COOKIE },
  });

  try {
    const id = String(rec._id);

    const resume = await fetch(`${BASE}/api/student-sponsorships/${id}/file?type=resume`, {
      headers: { cookie: COOKIE },
    });
    const resumeBytes = Buffer.from(await resume.arrayBuffer());
    const cd = resume.headers.get("content-disposition") || "";
    console.log(`  resume -> HTTP ${resume.status} | ct: ${resume.headers.get("content-type")} | cd: ${cd}`);
    t("resume downloads 200", resume.status === 200, String(resume.status));
    t("served as application/pdf", resume.headers.get("content-type") === "application/pdf",
      resume.headers.get("content-type"));
    t("original filename restored", cd.includes('filename="Sarah Jenkins - Resume.pdf"'), cd);
    t("resume bytes are a real PDF", resumeBytes.subarray(0, 5).toString() === "%PDF-",
      resumeBytes.subarray(0, 10).toString());

    const letter = await fetch(`${BASE}/api/student-sponsorships/${id}/file?type=letter`, {
      headers: { cookie: COOKIE },
    });
    const lcd = letter.headers.get("content-disposition") || "";
    console.log(`  letter -> HTTP ${letter.status} | ct: ${letter.headers.get("content-type")} | cd: ${lcd}`);
    t("letter file downloads 200", letter.status === 200, String(letter.status));
    t("letter served as docx",
      letter.headers.get("content-type") ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      letter.headers.get("content-type"));
    t("letter filename restored", lcd.includes('filename="Letter of Interest.docx"'), lcd);

    // An applicant's resume must not be world-readable just because the POST
    // endpoint on the same prefix is public.
    const anon = await fetch(`${BASE}/api/student-sponsorships/${id}/file?type=resume`);
    t("unauthenticated request is rejected", anon.status === 401 || anon.status === 403,
      String(anon.status));

    const missing = await fetch(`${BASE}/api/student-sponsorships/6a7178c3210b0c87d366bb80/file?type=resume`, {
      headers: { cookie: COOKIE },
    });
    t("unknown application returns 404", missing.status === 404, String(missing.status));

    const badId = await fetch(`${BASE}/api/student-sponsorships/not-an-id/file?type=resume`, {
      headers: { cookie: COOKIE },
    });
    t("malformed id returns 400", badId.status === 400, String(badId.status));

    const page = await fetch(`${BASE}/admin/student-sponsorships`, { headers: { cookie: COOKIE } });
    t("/admin/student-sponsorships responds 200", page.status === 200, String(page.status));

    // --- The real flow: export CSV -> click the link -> get a usable PDF -----
    const csvRes = await fetch(`${BASE}/api/student-sponsorships/export`, { headers: { cookie: COOKIE } });
    const csvText = await csvRes.text();

    t("export contains no raw Cloudinary links to click by mistake",
      !csvText.includes("res.cloudinary.com"),
      csvText.split(/\r?\n/).find((l) => l.includes("res.cloudinary.com")));

    const headerCells = csvText.split("\r\n")[0].split(",");
    const dataLine = csvText.split("\r\n").find((l) => l.includes("STU-E88FC77F"));
    const linkFromCsv = (dataLine.match(/https?:\/\/[^,"]*file\?type=resume/) || [])[0];
    t("CSV has a resume download link", Boolean(linkFromCsv),
      `headers: ${headerCells.join("|")}`);

    if (linkFromCsv) {
      const clicked = await fetch(linkFromCsv, { headers: { cookie: COOKIE } });
      const bytes = Buffer.from(await clicked.arrayBuffer());
      const disp = clicked.headers.get("content-disposition") || "";
      console.log(`  CSV link -> HTTP ${clicked.status} | ct: ${clicked.headers.get("content-type")} | cd: ${disp}`);
      t("clicking the CSV link returns HTTP 200", clicked.status === 200, String(clicked.status));
      t("clicking the CSV link serves application/pdf",
        clicked.headers.get("content-type") === "application/pdf",
        clicked.headers.get("content-type"));
      t("clicking the CSV link downloads a .pdf filename",
        /filename="[^"]+\.pdf"/.test(disp), disp);
      t("the downloaded bytes are a real PDF", bytes.subarray(0, 5).toString() === "%PDF-",
        bytes.subarray(0, 10).toString());
    }
  } finally {
    server.stop();
    const after = await col.countDocuments();
    t("live record count unchanged", before === after, `${before} -> ${after}`);
    await live.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

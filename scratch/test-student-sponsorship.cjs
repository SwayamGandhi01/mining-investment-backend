/**
 * Verifies the student sponsorship form fields match the screenshot.
 *
 * Runs the real routes against a throwaway database, with Cloudinary
 * deliberately unconfigured so attachments fall back to local disk instead of
 * uploading into the live asset account. Both are cleaned up at the end.
 */
const fs = require("fs");
const path = require("path");
const { startServer } = require("./testServer.cjs");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");

const env = fs.readFileSync(".env", "utf8");
const LIVE_URI = env.match(/^MONGODB_URI=(.*)$/m)[1].trim();
const JWT_SECRET = env.match(/^JWT_SECRET=(.*)$/m)[1].trim();

const SCRATCH_DB = "stusponsor_scratch_delete_me";
const TEST_URI = LIVE_URI.replace(/\/([^/?]+)\?/, `/${SCRATCH_DB}?`);
if (!TEST_URI.includes(SCRATCH_DB) || TEST_URI.includes("/investment-db?")) {
  console.error("refusing to run: could not redirect the URI to a scratch db");
  process.exit(1);
}

const PORT = 3101;
const BASE = `http://127.0.0.1:${PORT}`;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "student-sponsorships");
const token = jwt.sign(
  { id: "6a7178c3210b0c87d366bb80", email: "test@local", role: "superadmin" },
  JWT_SECRET,
  { expiresIn: "1h" }
);
const COOKIE = `admin_token=${token}`;

let pass = 0, fail = 0;
const t = (name, cond, detail) => {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name + (detail ? "\n          -> " + String(detail) : "")); }
};

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
// A real PDF header so nothing downstream rejects it as malformed.
const pdfBytes = Buffer.from("%PDF-1.4\n% test resume\n1 0 obj\n<<>>\nendobj\ntrailer\n%%EOF\n");
const docxBytes = Buffer.from("PK\x03\x04 fake docx letter of interest");

const BASE_FIELDS = {
  firstName: "Sarah",
  lastName: "Jenkins",
  email: "sarah.jenkins@example.edu",
  phone: "+1 (416) 555-0199",
  currentSchool: "Queen's University",
  programAndYear: "Mining Engineering, 2nd Year",
  language: "English",
};

const postJson = async (body) => {
  const res = await fetch(`${BASE}/api/student-sponsorships`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};


(async () => {
  const live = new MongoClient(LIVE_URI);
  await live.connect();
  const liveBefore = await live.db().collection("studentsponsorships").countDocuments();
  console.log(`live student sponsorships before: ${liveBefore}`);

  const filesBefore = fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR) : [];

  const server = await startServer({
    port: PORT,
    env: { MONGODB_URI: TEST_URI, CLOUDINARY_URL: "", CLOUDINARY_CLOUD_NAME: "", CLOUDINARY_API_KEY: "", CLOUDINARY_API_SECRET: "" },
    readyPath: "/api/student-sponsorships?limit=1",
    readyHeaders: { cookie: COOKIE },
  });

  try {

    const empty = await fetch(`${BASE}/api/student-sponsorships?limit=100`, { headers: { cookie: COOKIE } });
    const emptyBody = await empty.json();
    if ((emptyBody.data || []).length !== 0) {
      throw new Error("scratch db is not empty — aborting rather than risk live data");
    }
    console.log("scratch db confirmed empty\n");

    // --- Section 1 & 2: required fields -------------------------------------
    const ok = await postJson(BASE_FIELDS);
    t("JSON submission with all required fields succeeds",
      ok.status === 201 && /^STU-/.test(ok.body.data?.registrationNumber || ""),
      `${ok.status} ${JSON.stringify(ok.body).slice(0, 200)}`);

    for (const field of ["firstName", "lastName", "email", "phone", "currentSchool", "programAndYear"]) {
      const body = { ...BASE_FIELDS };
      delete body[field];
      const res = await postJson(body);
      t(`${field} is required`, res.status === 400,
        `${res.status} ${JSON.stringify(res.body).slice(0, 160)}`);
    }

    // programAndYear was optional before this change — the screenshot marks it *.
    const blankProgram = await postJson({ ...BASE_FIELDS, programAndYear: "" });
    t("programAndYear rejects an empty string", blankProgram.status === 400,
      `${blankProgram.status}`);

    // Language carries no asterisk on the form, so it must stay optional.
    const noLang = await postJson({ ...BASE_FIELDS, language: undefined });
    t("language stays optional", noLang.status === 201, `${noLang.status}`);

    // --- Section 3: resume + letter of interest -----------------------------
    const form = new FormData();
    for (const [k, v] of Object.entries(BASE_FIELDS)) form.append(k, v);
    form.append("letterOfInterest", "I am interested in exploring TVR Discovery's student programs.");
    form.append("signUpForNews", "on"); // how an HTML checkbox actually submits
    form.append("resume", new File([pdfBytes], "Sarah Jenkins CV.pdf", { type: "application/pdf" }));
    form.append("letterOfInterestFile", new File([docxBytes], "letter.docx", { type: DOCX_MIME }));

    const mp = await fetch(`${BASE}/api/student-sponsorships`, { method: "POST", body: form });
    const mpBody = await mp.json();
    const rec = mpBody.data || {};
    t("multipart submission with attachments succeeds", mp.status === 201,
      `${mp.status} ${JSON.stringify(mpBody).slice(0, 300)}`);
    t("resume stored and given a url", Boolean(rec.resume?.url), JSON.stringify(rec.resume));
    t("resume keeps its original filename", rec.resume?.fileName === "Sarah Jenkins CV.pdf",
      JSON.stringify(rec.resume));
    t("letter-of-interest file stored", Boolean(rec.letterOfInterestFile?.url),
      JSON.stringify(rec.letterOfInterestFile));
    t("letter-of-interest text stored",
      rec.letterOfInterest === "I am interested in exploring TVR Discovery's student programs.",
      JSON.stringify(rec.letterOfInterest));
    t("checkbox 'on' becomes boolean true", rec.signUpForNews === true,
      JSON.stringify(rec.signUpForNews));

    // The uploaded file must actually be retrievable, byte for byte.
    if (rec.resume?.url) {
      const dl = await fetch(rec.resume.url);
      const bytes = Buffer.from(await dl.arrayBuffer());
      t("uploaded resume is downloadable and intact",
        dl.status === 200 && bytes.equals(pdfBytes), `${dl.status} ${bytes.length}b vs ${pdfBytes.length}b`);
    } else {
      t("uploaded resume is downloadable and intact", false, "no resume url");
    }

    // --- Attachment guards ---------------------------------------------------
    const badForm = new FormData();
    for (const [k, v] of Object.entries(BASE_FIELDS)) badForm.append(k, v);
    badForm.append("resume", new File([Buffer.from("MZ")], "virus.exe", { type: "application/x-msdownload" }));
    const bad = await fetch(`${BASE}/api/student-sponsorships`, { method: "POST", body: badForm });
    const badBody = await bad.json();
    t("non-document attachment rejected",
      bad.status === 400 && /PDF, DOC and DOCX/.test(badBody.message || ""),
      `${bad.status} ${badBody.message}`);

    const uncheckedForm = new FormData();
    for (const [k, v] of Object.entries(BASE_FIELDS)) uncheckedForm.append(k, v);
    uncheckedForm.append("signUpForNews", "false");
    const unchecked = await fetch(`${BASE}/api/student-sponsorships`, { method: "POST", body: uncheckedForm });
    const uncheckedBody = await unchecked.json();
    t("unticked news checkbox stores false", uncheckedBody.data?.signUpForNews === false,
      JSON.stringify(uncheckedBody.data?.signUpForNews));

    const noFiles = new FormData();
    for (const [k, v] of Object.entries(BASE_FIELDS)) noFiles.append(k, v);
    const noFilesRes = await fetch(`${BASE}/api/student-sponsorships`, { method: "POST", body: noFiles });
    t("attachments are optional", noFilesRes.status === 201, String(noFilesRes.status));

    // --- Persistence: mongoose strict mode silently drops unknown fields ------
    const scratch = new MongoClient(TEST_URI);
    await scratch.connect();
    const stored = await scratch.db().collection("studentsponsorships")
      .findOne({ _id: new (require("mongodb").ObjectId)(rec._id) });
    t("fields really persisted to MongoDB (not dropped by strict mode)",
      Boolean(stored?.resume?.url) && Boolean(stored?.letterOfInterestFile?.url) &&
      Boolean(stored?.letterOfInterest) && stored?.programAndYear === BASE_FIELDS.programAndYear,
      JSON.stringify({ resume: stored?.resume, letter: stored?.letterOfInterest, prog: stored?.programAndYear }));
    await scratch.close();

    // --- Admin surface -------------------------------------------------------
    const list = await fetch(`${BASE}/api/student-sponsorships?limit=100`, { headers: { cookie: COOKIE } });
    const listBody = await list.json();
    const withDocs = (listBody.data || []).find((d) => d.resume?.url);
    t("admin list exposes the new fields", Boolean(withDocs?.resume?.url && withDocs?.letterOfInterest),
      JSON.stringify(withDocs?.resume));

    const pageRes = await fetch(`${BASE}/admin/student-sponsorships`, { headers: { cookie: COOKIE } });
    t("/admin/student-sponsorships responds 200", pageRes.status === 200, String(pageRes.status));

    // --- Regression: the Articles PDF upload shares the refactored lib -------
    const pdfForm = new FormData();
    pdfForm.append("file", new File([pdfBytes], "article.pdf", { type: "application/pdf" }));
    const pdfRes = await fetch(`${BASE}/api/upload-pdf`, { method: "POST", headers: { cookie: COOKIE }, body: pdfForm });
    const pdfBody = await pdfRes.json();
    t("upload-pdf still works after the refactor", pdfRes.status === 200 && Boolean(pdfBody.url),
      `${pdfRes.status} ${JSON.stringify(pdfBody).slice(0, 160)}`);

    const wrongForm = new FormData();
    wrongForm.append("file", new File([docxBytes], "notes.docx", { type: DOCX_MIME }));
    const wrongRes = await fetch(`${BASE}/api/upload-pdf`, { method: "POST", headers: { cookie: COOKIE }, body: wrongForm });
    const wrongBody = await wrongRes.json();
    t("upload-pdf still rejects non-PDFs",
      wrongRes.status === 400 && /Only PDF/.test(wrongBody.message || ""),
      `${wrongRes.status} ${wrongBody.message}`);
  } finally {
    server.stop();

    const scratch = new MongoClient(TEST_URI);
    await scratch.connect();
    if (scratch.db().databaseName !== SCRATCH_DB) throw new Error("wrong db, not dropping");
    await scratch.db().dropDatabase();
    await scratch.close();
    console.log(`\ndropped scratch db ${SCRATCH_DB}`);

    // Remove only the files this run created.
    if (fs.existsSync(UPLOAD_DIR)) {
      for (const f of fs.readdirSync(UPLOAD_DIR)) {
        if (!filesBefore.includes(f)) fs.unlinkSync(path.join(UPLOAD_DIR, f));
      }
      if (fs.readdirSync(UPLOAD_DIR).length === 0) fs.rmdirSync(UPLOAD_DIR);
    }
    const pdfDir = path.join(process.cwd(), "public", "uploads", "pdfs");
    if (fs.existsSync(pdfDir)) {
      for (const f of fs.readdirSync(pdfDir)) {
        if (f.includes("article-")) fs.unlinkSync(path.join(pdfDir, f));
      }
    }
    console.log("removed locally stored test uploads");

    const liveAfter = await live.db().collection("studentsponsorships").countDocuments();
    t("live student sponsorships untouched", liveBefore === liveAfter, `${liveBefore} -> ${liveAfter}`);
    await live.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

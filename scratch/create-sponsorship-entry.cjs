/**
 * Creates one student sponsorship test entry in the LIVE database, with a real
 * resume uploaded to Cloudinary, then verifies the stored URL is publicly
 * retrievable (this account has raw/PDF delivery restrictions, so that is the
 * part worth proving rather than assuming).
 */
const fs = require("fs");
const { spawn } = require("child_process");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");

const env = fs.readFileSync(".env", "utf8");
const LIVE_URI = env.match(/^MONGODB_URI=(.*)$/m)[1].trim();
const JWT_SECRET = env.match(/^JWT_SECRET=(.*)$/m)[1].trim();

const PORT = 3102;
const BASE = `http://127.0.0.1:${PORT}`;
const COOKIE = `admin_token=${jwt.sign(
  { id: "6a7178c3210b0c87d366bb80", email: "test@local", role: "superadmin" },
  JWT_SECRET,
  { expiresIn: "1h" }
)}`;

// A minimal but structurally valid PDF, so anything that opens it sees a real file.
const RESUME_PDF = Buffer.from(
  "%PDF-1.4\n" +
    "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n" +
    "4 0 obj<</Length 78>>stream\nBT /F1 18 Tf 72 700 Td (Sarah Jenkins - Resume) Tj ET\nendstream endobj\n" +
    "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n" +
    "trailer<</Root 1 0 R>>\n%%EOF\n"
);
const LETTER_DOCX = Buffer.from("PK\x03\x04 letter of interest - Sarah Jenkins");
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/api/student-sponsorships?limit=1`, { headers: { cookie: COOKIE } });
      if (r.status < 500) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

(async () => {
  const live = new MongoClient(LIVE_URI);
  await live.connect();
  const col = live.db().collection("studentsponsorships");
  const before = await col.countDocuments();
  console.log(`live student sponsorships before: ${before}`);

  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    env: { ...process.env, NODE_ENV: "production" },
    shell: true,
    stdio: "ignore",
  });

  try {
    if (!await waitForServer()) throw new Error("server did not start");

    const form = new FormData();
    Object.entries({
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "sarah.jenkins@queensu.ca",
      phone: "+1 (416) 555-0199",
      currentSchool: "Queen's University",
      programAndYear: "Mining Engineering, 2nd Year",
      language: "English",
      letterOfInterest:
        "I am a second-year Mining Engineering student at Queen's University with a strong " +
        "interest in mineral exploration and sustainable extraction. The TVR Discovery Student " +
        "Sponsorship Program would let me meet operators and investors working on the projects " +
        "I have been studying, and I would bring back what I learn to our student chapter.",
      signUpForNews: "on",
    }).forEach(([k, v]) => form.append(k, v));

    form.append("resume", new File([RESUME_PDF], "Sarah Jenkins - Resume.pdf", { type: "application/pdf" }));
    form.append("letterOfInterestFile", new File([LETTER_DOCX], "Letter of Interest.docx", { type: DOCX_MIME }));

    const res = await fetch(`${BASE}/api/student-sponsorships`, { method: "POST", body: form });
    const body = await res.json();

    if (res.status !== 201) {
      console.error("FAILED to create entry:", res.status, JSON.stringify(body, null, 2));
      process.exitCode = 1;
      return;
    }

    const rec = body.data;
    console.log("\ncreated entry:");
    console.log("  _id                ", rec._id);
    console.log("  registrationNumber ", rec.registrationNumber);
    console.log("  name               ", rec.firstName, rec.lastName);
    console.log("  email              ", rec.email);
    console.log("  school             ", rec.currentSchool);
    console.log("  program            ", rec.programAndYear);
    console.log("  signUpForNews      ", rec.signUpForNews);
    console.log("\n  resume.url         ", rec.resume?.url);
    console.log("  resume.publicId    ", rec.resume?.publicId);
    console.log("  resume.fileName    ", rec.resume?.fileName);
    console.log("  letterFile.url     ", rec.letterOfInterestFile?.url);

    const onCloudinary = (rec.resume?.url || "").includes("res.cloudinary.com");
    console.log(`\n  stored on: ${onCloudinary ? "CLOUDINARY" : "LOCAL DISK (fallback)"}`);

    // The decisive check: can a browser actually fetch that URL?
    for (const [label, url] of [
      ["resume", rec.resume?.url],
      ["letter file", rec.letterOfInterestFile?.url],
    ]) {
      if (!url) continue;
      const dl = await fetch(url);
      const bytes = Buffer.from(await dl.arrayBuffer());
      const expected = label === "resume" ? RESUME_PDF : LETTER_DOCX;
      console.log(
        `  ${label} URL -> HTTP ${dl.status}` +
          ` | content-type: ${dl.headers.get("content-type")}` +
          ` | ${bytes.length}b` +
          ` | bytes match: ${bytes.equals(expected)}` +
          (dl.headers.get("x-cld-error") ? ` | x-cld-error: ${dl.headers.get("x-cld-error")}` : "")
      );
    }

    const stored = await col.findOne({ registrationNumber: rec.registrationNumber });
    console.log(`\n  persisted in MongoDB: ${Boolean(stored)} | resume url in db: ${Boolean(stored?.resume?.url)}`);
    const after = await col.countDocuments();
    console.log(`  live count: ${before} -> ${after}`);
  } finally {
    server.kill("SIGKILL");
    await live.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });

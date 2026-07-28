import fetch from "node-fetch";

const baseUrl = "http://localhost:3000";
const admin = {
  name: "Test Admin",
  email: "testadmin@example.com",
  password: "Password123",
};

async function seedAdmin() {
  try {
    const res = await fetch(`${baseUrl}/api/auth/seed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(admin),
    });
    const data = await res.json();
    console.log("seed status", res.status, JSON.stringify(data));
    return res.status === 201;
  } catch (error) {
    console.error("seed error", error);
    return false;
  }
}

async function login() {
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: admin.email, password: admin.password }),
    });
    const data = await res.json();
    console.log("login status", res.status, JSON.stringify(data));
    const cookie = res.headers.get("set-cookie");
    return cookie;
  } catch (error) {
    console.error("login error", error);
    return null;
  }
}

async function createLatestNews(cookie) {
  const payload = {
    title: "Test Latest News Entry",
    subheading: "A sample latest news item created during API testing.",
    content: "This is a test latest-news API entry.",
    date: "July 28, 2026",
    category: "Latest News",
    status: "published",
    isFeatured: true,
    publishedAt: new Date().toISOString(),
    seoTitle: "Test Latest News",
    seoDescription: "A test news item created via API.",
    seoKeywords: "test, latest news, api",
  };

  try {
    const res = await fetch(`${baseUrl}/api/latest-news`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie || "",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("create status", res.status, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("create error", error);
  }
}

(async () => {
  await seedAdmin();
  const cookie = await login();
  if (!cookie) {
    console.error("Login failed, cannot create latest-news entry.");
    process.exit(1);
  }
  await createLatestNews(cookie);
})();

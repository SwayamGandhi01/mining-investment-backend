/**
 * Spawns a production server for a test run and reliably shuts it down.
 *
 * Two Windows-specific traps this exists to avoid:
 *
 *  1. spawn(..., {shell: true}) puts cmd.exe between us and `next start`.
 *     child.kill() then kills the shell and leaves the server running, so the
 *     next test run silently talks to a stale build. Killing the whole tree
 *     with taskkill /T is what actually stops it.
 *
 *  2. If something is already listening on the port, `next start` fails to bind
 *     but the test still gets 200s — from the wrong server. So the port is
 *     checked up front and the run aborts rather than reporting on stale code.
 */
const net = require("net");
const { spawn, execSync } = require("child_process");

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net
      .connect({ port, host: "127.0.0.1" })
      .setTimeout(1000)
      .once("connect", () => { socket.destroy(); resolve(true); })
      .once("timeout", () => { socket.destroy(); resolve(false); })
      .once("error", () => resolve(false));
  });
}

function killTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(-pid, "SIGKILL");
    }
  } catch {
    // Already gone.
  }
}

/**
 * Start `next start` on `port`, wait until `readyPath` answers, and return a
 * handle whose stop() kills the entire process tree.
 */
async function startServer({ port, env = {}, readyPath = "/", readyHeaders = {}, timeoutMs = 60000 }) {
  if (await portInUse(port)) {
    throw new Error(
      `port ${port} is already in use — refusing to run, results would come from another server. ` +
        `Kill it first (Get-NetTCPConnection -LocalPort ${port}).`
    );
  }

  // shell: true is required on Node 22+ for Windows .cmd shims (spawn EINVAL
  // otherwise). That puts cmd.exe in the middle, which is exactly why stop()
  // uses taskkill /T to kill the tree rather than child.kill().
  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    env: { ...process.env, NODE_ENV: "production", ...env },
    stdio: "ignore",
    shell: process.platform === "win32",
    detached: process.platform !== "win32",
  });

  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + timeoutMs;
  let ready = false;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(base + readyPath, { headers: readyHeaders });
      if (res.status < 500) { ready = true; break; }
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!ready) {
    killTree(child.pid);
    throw new Error(`server on port ${port} did not become ready within ${timeoutMs}ms`);
  }

  return { base, stop: () => killTree(child.pid) };
}

module.exports = { startServer, killTree, portInUse };

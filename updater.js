const { ipcRenderer } = require("electron");

const logEl = document.getElementById("log");
function log(msg) { logEl.textContent += `${msg}\n`; }

const registryStatusEl = document.getElementById("registryStatus");
const registerStatusEl = document.getElementById("registerStatus");
const pickedDirEl = document.getElementById("pickedDir");
const updateGameStatusEl = document.getElementById("updateGameStatus");

// Fetch remote game registry (example JSON in your repo)
document.getElementById("fetchRegistry").addEventListener("click", async () => {
  const registry = await ipcRenderer.invoke("fetch-remote-registry");
  const count = Array.isArray(registry) ? registry.length : Object.keys(registry || {}).length;
  registryStatusEl.textContent = `Loaded ${count} entries`;
  log(`Registry loaded: ${count} entries`);
});

// Pick directory
document.getElementById("pickDir").addEventListener("click", async () => {
  const dir = await ipcRenderer.invoke("select-directory");
  if (dir) {
    pickedDirEl.textContent = dir;
    log(`Selected directory: ${dir}`);
  } else {
    pickedDirEl.textContent = "(canceled)";
  }
});

// Register game
document.getElementById("registerGame").addEventListener("click", async () => {
  const name = document.getElementById("gameName").value.trim();
  const dir = pickedDirEl.textContent.trim();
  if (!name || !dir) {
    registerStatusEl.textContent = "Enter game name and pick a directory.";
    return;
  }
  const res = await ipcRenderer.invoke("register-game", { name, dir });
  registerStatusEl.textContent = res.message || res.status;
  log(`Register: ${JSON.stringify(res)}`);
});

// Update game
document.getElementById("updateGame").addEventListener("click", async () => {
  const game = document.getElementById("updateGameName").value.trim();
  const link = document.getElementById("updateZipUrl").value.trim();
  const version = document.getElementById("updateVersion").value.trim();
  const dir = pickedDirEl.textContent.trim();

  if (!game || !link || !version || !dir) {
    updateGameStatusEl.textContent = "Fill all fields and ensure game is registered.";
    return;
  }

  updateGameStatusEl.textContent = "Starting update...";
  log(`Update requested: ${game} -> ${version}`);

  try {
    const res = await ipcRenderer.invoke("update-game", { game, dir, link, version });
    updateGameStatusEl.textContent = res.status;
    log(`Update result: ${JSON.stringify(res)}`);
  } catch (err) {
    updateGameStatusEl.textContent = `Error: ${err.message}`;
    log(`Update error: ${err.message}`);
  }
});

const { ipcRenderer } = require("electron");

const addGameBtn = document.getElementById("addGameBtn");
const addGameStatusEl = document.getElementById("addGameStatus");
const gameSelect = document.getElementById("gameSelect");
const removeGameBtn = document.getElementById("removeGameBtn");
const checkBtn = document.getElementById("checkBtn");
const updateBtn = document.getElementById("updateBtn");
const statusEl = document.getElementById("status");

function setStatus(msg) { statusEl.textContent = `Status: ${msg}`; }
function fillDropdown(reg) {
  gameSelect.innerHTML = "";
  Object.keys(reg).forEach(game => {
    const opt = document.createElement("option");
    opt.value = game;
    opt.textContent = `${game} — ${reg[game].dir}`;
    gameSelect.appendChild(opt);
  });
  if (!Object.keys(reg).length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "(no games registered)";
    gameSelect.appendChild(opt);
  }
}

// Load registry on startup (auto-prune deleted locations)
(async () => {
  const reg = await ipcRenderer.invoke("get-registered-games");
  fillDropdown(reg);
  setStatus("Loaded registrations");
})();

// Register a new game location (persisted)
addGameBtn.addEventListener("click", async () => {
  addGameStatusEl.textContent = "";
  const res = await ipcRenderer.invoke("register-game-location");
  if (res.status === "ok") {
    addGameStatusEl.textContent = `Registered: ${res.game} at ${res.dir}`;
    const reg = await ipcRenderer.invoke("get-registered-games");
    fillDropdown(reg);
    setStatus("Registration saved");
  } else if (res.status === "exists") {
    addGameStatusEl.textContent = `Already registered: ${res.game}`;
    setStatus("Location already persisted");
  } else if (res.status === "canceled") {
    addGameStatusEl.textContent = "(canceled)";
  } else {
    addGameStatusEl.textContent = `Error: ${res.message}`;
    setStatus("Registration error");
  }
});

// Remove registration (doesn’t delete files, just the record)
removeGameBtn.addEventListener("click", async () => {
  const val = gameSelect.value;
  if (!val) return;
  const res = await ipcRenderer.invoke("remove-registered-game", val);
  const reg = await ipcRenderer.invoke("get-registered-games");
  fillDropdown(reg);
  setStatus(res.status === "ok" ? "Registration removed" : "Remove failed");
  updateBtn.disabled = true;
});

// Check local vs remote version; unlock Update if remote > local
checkBtn.addEventListener("click", async () => {
  const val = gameSelect.value;
  if (!val) return;
  const res = await ipcRenderer.invoke("check-game-status", val);
  if (res.status === "missing") {
    setStatus(`Folder missing for ${val}. Pruned registration.`);
    const reg = await ipcRenderer.invoke("get-registered-games");
    fillDropdown(reg);
    updateBtn.disabled = true;
    return;
  }
  setStatus(`Local ${res.local} vs Remote ${res.remote} — ${res.updateAvailable ? "update available" : "up to date"}`);
  updateBtn.disabled = !res.updateAvailable;
});

// Run update using remote ZIP; update local marker file
updateBtn.addEventListener("click", async () => {
  const val = gameSelect.value;
  if (!val) return;
  updateBtn.disabled = true;
  setStatus("Updating...");
  const res = await ipcRenderer.invoke("update-registered-game", val);
  setStatus(res.status || "Done");
});

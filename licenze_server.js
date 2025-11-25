/**
 * Server Node.js per gestire licenze in locale
 * Perfetto per lo sviluppo e i test
 * 
 * Installazione:
 *   npm install express body-parser cors
 * 
 * Esecuzione:
 *   node licenze_server.js
 * 
 * Il server ascolterà su http://localhost:3000
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// File di configurazione licenze
const LICENSE_FILE = path.join(__dirname, "licenze.json");

// Inizializza il file licenze se non esiste
function initializeLicenses() {
  const defaultLicenses = {
    licenses: [
      {
        username: "petar",
        valid: true,
        role: null,
        expires: "2026-09-17",
        notes: "Admin account"
      },
      {
        username: "Kelloggs_",
        valid: true,
        role: null,
        expires: "2026-09-17",
        notes: "Regular account"
      }
    ],
    heartbeat: []
  };

  if (!fs.existsSync(LICENSE_FILE)) {
    fs.writeFileSync(LICENSE_FILE, JSON.stringify(defaultLicenses, null, 2));
    console.log("✅ File licenze.json creato con i dati di default");
  }
}

// Carica le licenze dal file
function loadLicenses() {
  try {
    const data = fs.readFileSync(LICENSE_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Errore lettura licenze:", error);
    return { licenses: [], heartbeat: [] };
  }
}

// Salva le licenze nel file
function saveLicenses(data) {
  try {
    fs.writeFileSync(LICENSE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Errore salvataggio licenze:", error);
  }
}

/**
 * GET /license - Controlla una licenza
 * ?user=username
 */
app.get("/license", (req, res) => {
  const user = req.query.user;

  if (!user) {
    return res.status(400).json({ error: "Missing user parameter" });
  }

  const data = loadLicenses();
  const license = data.licenses.find(
    (l) => l.username.toLowerCase() === user.toLowerCase()
  );

  if (!license) {
    return res.json({
      valid: false,
      reason: "not_found",
      username: user
    });
  }

  // Controlla scadenza
  if (license.valid && license.expires) {
    const expireDate = new Date(license.expires);
    const now = new Date();

    if (now > expireDate) {
      return res.json({
        valid: false,
        reason: "expired",
        expires: license.expires,
        username: user
      });
    }
  }

  return res.json({
    valid: license.valid,
    role: license.role || null,
    expires: license.expires || "Never",
    username: user
  });
});

/**
 * POST /heartbeat - Registra un heartbeat del bot
 * Body: { name: "username", version: "1.6" }
 */
app.post("/heartbeat", (req, res) => {
  const { name, version } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Missing name parameter" });
  }

  const data = loadLicenses();
  data.heartbeat.push({
    timestamp: new Date().toISOString(),
    username: name,
    version: version || "unknown",
    status: "active"
  });

  // Mantieni solo gli ultimi 1000 heartbeat
  if (data.heartbeat.length > 1000) {
    data.heartbeat = data.heartbeat.slice(-1000);
  }

  saveLicenses(data);

  res.json({
    status: "ok",
    name: name,
    version: version
  });
});

/**
 * GET /licenses - Lista tutte le licenze (admin)
 */
app.get("/licenses", (req, res) => {
  const data = loadLicenses();
  res.json(data.licenses);
});

/**
 * POST /license/add - Aggiungi una nuova licenza
 * Body: { username, valid, role, expires, notes }
 */
app.post("/license/add", (req, res) => {
  const { username, valid, role, expires, notes } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  const data = loadLicenses();
  const exists = data.licenses.find(
    (l) => l.username.toLowerCase() === username.toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ error: "Username already exists" });
  }

  data.licenses.push({
    username,
    valid: valid !== false,
    role: role || null,
    expires: expires || "Never",
    notes: notes || ""
  });

  saveLicenses(data);

  res.json({
    status: "ok",
    message: `Licenza aggiunta per ${username}`,
    license: data.licenses[data.licenses.length - 1]
  });
});

/**
 * PUT /license/update - Aggiorna una licenza
 * Body: { username, valid, role, expires, notes }
 */
app.put("/license/update", (req, res) => {
  const { username, valid, role, expires, notes } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  const data = loadLicenses();
  const license = data.licenses.find(
    (l) => l.username.toLowerCase() === username.toLowerCase()
  );

  if (!license) {
    return res.status(404).json({ error: "License not found" });
  }

  if (valid !== undefined) license.valid = valid;
  if (role !== undefined) license.role = role;
  if (expires !== undefined) license.expires = expires;
  if (notes !== undefined) license.notes = notes;

  saveLicenses(data);

  res.json({
    status: "ok",
    message: `Licenza aggiornata per ${username}`,
    license
  });
});

/**
 * DELETE /license/delete - Elimina una licenza
 * ?user=username
 */
app.delete("/license/delete", (req, res) => {
  const user = req.query.user;

  if (!user) {
    return res.status(400).json({ error: "Missing user parameter" });
  }

  const data = loadLicenses();
  const index = data.licenses.findIndex(
    (l) => l.username.toLowerCase() === user.toLowerCase()
  );

  if (index === -1) {
    return res.status(404).json({ error: "License not found" });
  }

  const deleted = data.licenses.splice(index, 1);
  saveLicenses(data);

  res.json({
    status: "ok",
    message: `Licenza eliminata per ${user}`,
    deleted: deleted[0]
  });
});

/**
 * GET /heartbeat/history - Vedi la cronologia heartbeat
 */
app.get("/heartbeat/history", (req, res) => {
  const data = loadLicenses();
  res.json(data.heartbeat.slice(-50)); // Ultimi 50
});

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Inizializza e avvia il server
initializeLicenses();

app.listen(PORT, () => {
  console.log(`\n🚀 Server licenze avviato!`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`\n📋 Endpoint disponibili:`);
  console.log(`   GET  /license?user=username              - Controlla licenza`);
  console.log(`   POST /heartbeat                          - Registra heartbeat`);
  console.log(`   GET  /licenses                           - Lista licenze`);
  console.log(`   POST /license/add                        - Aggiungi licenza`);
  console.log(`   PUT  /license/update                     - Aggiorna licenza`);
  console.log(`   DELETE /license/delete?user=username     - Elimina licenza`);
  console.log(`   GET  /heartbeat/history                  - Cronologia\n`);
  console.log(`📁 File: ${LICENSE_FILE}\n`);
});

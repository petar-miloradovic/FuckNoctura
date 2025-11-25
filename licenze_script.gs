// Google Apps Script - License Management Server
// Questo script gestisce le licenze del bot Noctura

// ID del Google Sheet (da aggiornare con il tuo ID)
const SHEET_ID = "1mG3CvZdkELICw0Y1pnVu1z51tUHrsfd2cUCkNui_87k";
const SHEET_NAME = "Licenze";

/**
 * Funzione principale - gestisce GET e POST requests
 */
function doGet(e) {
  try {
    const user = e.parameter.user;
    
    if (!user) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: "Missing user parameter" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    return getLicenseInfo(user);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Gestisce POST requests (heartbeat del bot)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const name = data.name;
    const version = data.version;
    
    if (!name) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: "Missing name parameter" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Log del heartbeat
    logHeartbeat(name, version);
    
    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok", name: name, version: version })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Ottiene le informazioni di licenza per un utente
 */
function getLicenseInfo(username) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Intestazioni: A=Username | B=Valid | C=Role | D=Expires | E=Notes | F=Extra | ecc...
    const headers = data[0];
    
    // Trova gli indici delle colonne principali
    let usernameIndex = -1;
    let validIndex = -1;
    let roleIndex = -1;
    let expiresIndex = -1;
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toString().toLowerCase().trim();
      if (header === "username") usernameIndex = i;
      if (header === "valid") validIndex = i;
      if (header === "role") roleIndex = i;
      if (header === "expires") expiresIndex = i;
    }
    
    // Se le colonne non sono trovate, usa i valori di default (A, B, C, D)
    if (usernameIndex === -1) usernameIndex = 0;
    if (validIndex === -1) validIndex = 1;
    if (roleIndex === -1) roleIndex = 2;
    if (expiresIndex === -1) expiresIndex = 3;
    
    // Cerca l'utente
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Salta righe vuote
      if (!row[usernameIndex] || row[usernameIndex].toString().trim() === "") {
        continue;
      }
      
      if (row[usernameIndex].toString().toLowerCase() === username.toLowerCase()) {
        const valid = row[validIndex] === true || 
                     row[validIndex] === "TRUE" || 
                     row[validIndex] === "true" || 
                     row[validIndex] === 1;
        const expires = row[expiresIndex];
        const role = row[roleIndex] || null;
        
        // Controlla scadenza
        if (valid && expires) {
          const expireDate = new Date(expires);
          const now = new Date();
          
          if (now > expireDate) {
            return ContentService.createTextOutput(
              JSON.stringify({
                valid: false,
                reason: "expired",
                expires: expires,
                username: username
              })
            ).setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        return ContentService.createTextOutput(
          JSON.stringify({
            valid: valid,
            role: role,
            expires: expires || "Never",
            username: username
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Utente non trovato
    return ContentService.createTextOutput(
      JSON.stringify({
        valid: false,
        reason: "not_found",
        username: username
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Registra i heartbeat del bot
 */
function logHeartbeat(name, version) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let logSheet = ss.getSheetByName("Heartbeat");
    
    // Crea il sheet se non esiste
    if (!logSheet) {
      logSheet = ss.insertSheet("Heartbeat");
      logSheet.appendRow(["Timestamp", "Username", "Version", "Status"]);
    }
    
    logSheet.appendRow([
      new Date(),
      name,
      version,
      "active"
    ]);
  } catch (error) {
    Logger.log("Heartbeat logging error: " + error);
  }
}

/**
 * Inizializza il Google Sheet con i dati di esempio
 * Esegui questa funzione UNA VOLTA per creare i dati
 */
function initializeLicenses() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    } else {
      sheet.clear();
    }
    
    // Intestazioni
    sheet.appendRow(["Username", "Valid", "Role", "Expires", "Notes"]);
    
    // Dati di esempio
    sheet.appendRow([
      "petar",
      true,
      null,
      "2026-09-17",
      "Admin account"
    ]);
    
    sheet.appendRow([
      "Kelloggs_",
      true,
      null,
      "2026-09-17",
      "Regular account"
    ]);
    
    // Formatta le colonne
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 80);
    sheet.setColumnWidth(3, 100);
    sheet.setColumnWidth(4, 150);
    sheet.setColumnWidth(5, 200);
    
    Logger.log("Licenses initialized successfully!");
  } catch (error) {
    Logger.log("Error: " + error);
  }
}

/**
 * Testa il servizio localmente
 */
function testLicense() {
  const result1 = getLicenseInfo("petar");
  Logger.log("Petar: " + result1);
  
  const result2 = getLicenseInfo("Kelloggs_");
  Logger.log("Kelloggs_: " + result2);
  
  const result3 = getLicenseInfo("unknown");
  Logger.log("Unknown: " + result3);
}

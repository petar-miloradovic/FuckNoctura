# 📋 Sistema di Gestione Licenze Noctura

Ho creato **due soluzioni** per gestire le licenze del bot. Scegli quella che preferisci:

---

## 🌐 **SOLUZIONE 1: Google Apps Script (Consigliato per produzione)**

Questo è uno script che gira su Google e gestisce le licenze da un Google Sheet.

### Setup:

1. **Vai su Google Apps Script:**
   - Apri https://script.google.com
   - Crea un nuovo progetto
   - Incolla il contenuto di `licenze_script.gs`

2. **Crea un Google Sheet:**
   - Crea un nuovo Google Sheet
   - Copia l'ID del Sheet (dall'URL: `docs.google.com/spreadsheets/d/[ID]/...`)
   - Sostituisci `YOUR_SHEET_ID_HERE` nello script

3. **Esegui l'inizializzazione:**
   - In Apps Script, seleziona la funzione `initializeLicenses`
   - Clicca "Run"
   - Autorizza l'accesso

4. **Distribuisci il servizio:**
   - Click "Deploy" → "New deployment"
   - Seleziona "Web app"
   - "Execute as:" → il tuo account
   - "Who has access:" → "Anyone"
   - Copia l'URL generato

5. **Aggiorna il bot:**
   - Modifica l'URL in `popup.js` e `noctura.js` con quello generato

### Endpoint:
- `GET https://your-script-url.com?user=petar` → Controlla licenza
- `POST https://your-script-url.com` → Registra heartbeat

---

## 💻 **SOLUZIONE 2: Server Node.js Locale (Per sviluppo)**

Questo è un piccolo server che gira sul tuo computer e gestisce le licenze da un file JSON.

### Setup:

1. **Installa Node.js** (se non lo hai):
   - Scarica da https://nodejs.org

2. **Installa le dipendenze:**
   ```bash
   cd "c:\Users\petar\Bot 1.4.1"
   npm install express body-parser cors
   ```

3. **Avvia il server:**
   ```bash
   node licenze_server.js
   ```

   Vedrai:
   ```
   🚀 Server licenze avviato!
      URL: http://localhost:3000
   ```

4. **Modifica il bot per usare localhost:**
   
   In `popup.js`, cambia:
   ```javascript
   const t = "http://localhost:3000/license?user=" + encodeURIComponent(e)
   ```

   In `noctura.js`, cambia:
   ```javascript
   fetch("http://localhost:3000/heartbeat", {...})
   ```

### Endpoint locali:
- `GET http://localhost:3000/license?user=petar` → Controlla licenza
- `POST http://localhost:3000/heartbeat` → Registra heartbeat
- `GET http://localhost:3000/licenses` → Lista tutte le licenze
- `POST http://localhost:3000/license/add` → Aggiungi licenza
- `PUT http://localhost:3000/license/update` → Aggiorna licenza
- `DELETE http://localhost:3000/license/delete?user=petar` → Elimina licenza
- `GET http://localhost:3000/health` → Health check

### File licenze.json:
```json
{
  "licenses": [
    {
      "username": "petar",
      "valid": true,
      "role": null,
      "expires": "2026-09-17",
      "notes": "Admin account"
    },
    {
      "username": "Kelloggs_",
      "valid": true,
      "role": null,
      "expires": "2026-09-17",
      "notes": "Regular account"
    }
  ],
  "heartbeat": []
}
```

---

## 📊 Confronto delle soluzioni:

| Aspetto | Google Script | Node.js Locale |
|---------|---------------|-----------------|
| Setup | Medio | Facile |
| Affidabilità | Alta | Per sviluppo |
| Disponibilità | 24/7 | Solo se il server è acceso |
| Costi | Gratuito (Google) | Gratuito |
| Scalabilità | Illimitata | Limitata |
| Migliore per | Produzione | Sviluppo/Test |

---

## ✅ Utenti autorizzati attuali:

- **petar** - Valido fino al 2026-09-17
- **Kelloggs_** - Valido fino al 2026-09-17

---

## 🔧 Come aggiungere nuovi utenti:

### Con Node.js (localhost):
```bash
# Aggiungi utente
curl -X POST http://localhost:3000/license/add \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","valid":true,"expires":"2026-12-31"}'

# Visualizza tutte le licenze
curl http://localhost:3000/licenses
```

### Con Google Sheet:
Modifica direttamente il Google Sheet aggiungendo una riga con i dati dell'utente.

---

## 🐛 Troubleshooting:

### Il bot dice "License expired"
- Controlla la data nel file `licenze.json` o nel Google Sheet
- La data deve essere nel formato `YYYY-MM-DD`

### "Network error" o "Failed to fetch"
- Assicurati che il server Node.js sia acceso: `node licenze_server.js`
- Controlla che l'URL nel bot corrisponda

### Script Google non funziona
- Assicurati di aver autorizzato l'accesso
- Verifica che il Sheet ID sia corretto
- Controlla che il nome del Sheet sia "Licenze"

---

**Scegli la soluzione che preferisci e fammi sapere se hai domande!** 🚀

require("dotenv").config();
const { Pool } = require("pg");
let s = require("../set");
var dbUrl = s.DATABASE_URL ? s.DATABASE_URL : "postgres://db_7xp9_user:6hwmTN7rGPNsjlBEHyX49CXwrG7cDeYi@dpg-cj7ldu5jeehc73b2p7g0-a.oregon-postgres.render.com/db_7xp9";

const proConfig = {
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(proConfig);

// Fonction pour créer la table "antilien"
async function createAntilienTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS antilien (
        jid text PRIMARY KEY,
        etat text DEFAULT 'non',
        action text DEFAULT 'warn'
      );
    `);
    console.log("La table 'antilien' a été créée avec succès.");
  } catch (error) {
    console.error("Une erreur est survenue lors de la création de la table 'antilien':", error);
  } finally {
    client.release();
  }
}

createAntilienTable();

// ============ FONCTIONS PRINCIPALES ============

// 1. Enregistrer JID (kuwasha anti-link)
async function enregistrerJid(jid) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM antilien WHERE jid = $1', [jid]);
    
    if (result.rows.length > 0) {
      // Update existing
      await client.query('UPDATE antilien SET etat = $1 WHERE jid = $2', ['oui', jid]);
    } else {
      // Insert new
      await client.query('INSERT INTO antilien (jid, etat, action) VALUES ($1, $2, $3)', [jid, 'oui', 'warn']);
    }
    console.log(`✅ Anti-link enabled for ${jid}`);
  } catch (error) {
    console.error('Error enabling anti-link:', error);
  } finally {
    client.release();
  }
}

// 2. Supprimer JID (kuzima anti-link)
async function supprimerJid(jid) {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM antilien WHERE jid = $1', [jid]);
    console.log(`❌ Anti-link disabled for ${jid}`);
  } catch (error) {
    console.error('Error disabling anti-link:', error);
  } finally {
    client.release();
  }
}

// 3. Kuweka action (warn, delete, remove)
async function mettreAJourActionJid(jid, action) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM antilien WHERE jid = $1', [jid]);
    
    if (result.rows.length > 0) {
      // Update action only
      await client.query('UPDATE antilien SET action = $1 WHERE jid = $2', [action, jid]);
    } else {
      // Insert with action
      await client.query('INSERT INTO antilien (jid, etat, action) VALUES ($1, $2, $3)', [jid, 'oui', action]);
    }
    console.log(`⚙️ Action updated to ${action} for ${jid}`);
  } catch (error) {
    console.error('Error updating action:', error);
  } finally {
    client.release();
  }
}

// 4. Kuangalia kama anti-link imewashwa
async function verifierEtatJid(jid) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT etat FROM antilien WHERE jid = $1', [jid]);
    
    if (result.rows.length > 0) {
      return result.rows[0].etat === 'oui';
    }
    return false;
  } catch (error) {
    console.error('Error checking status:', error);
    return false;
  } finally {
    client.release();
  }
}

// 5. Kupata action ya JID
async function recupererActionJid(jid) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT action FROM antilien WHERE jid = $1', [jid]);
    
    if (result.rows.length > 0 && result.rows[0].action) {
      return result.rows[0].action;
    }
    return 'warn'; // Default action
  } catch (error) {
    console.error('Error getting action:', error);
    return 'warn';
  } finally {
    client.release();
  }
}

// ============ EXPORTS ============
module.exports = {
  enregistrerJid,        // NEW: Kuwasha anti-link
  supprimerJid,          // NEW: Kuzima anti-link
  mettreAJourActionJid,  // NEW: Kuweka action
  verifierEtatJid,       // EXISTING: Kuangalia status
  recupererActionJid,    // EXISTING: Kupata action
  
  // Aliases for backward compatibility
  ajouterOuMettreAJourJid: enregistrerJid,
  mettreAJourAction: mettreAJourActionJid,
};

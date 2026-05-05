const { MongoClient, ServerApiVersion } = require("mongodb");
 
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
 
let client = null;
let clientPromise = null;
let db = null;
let lastConnectError = null;
let connectedAt = null;
 
function isEnabled() {
  return typeof MONGODB_URI === "string" && MONGODB_URI.trim().length > 0;
}
 
async function connectMongo() {
  if (!isEnabled()) {
    return { enabled: false, ok: false, reason: "MONGODB_URI ausente" };
  }
 
  if (db && client) {
    return { enabled: true, ok: true, dbName: db.databaseName };
  }
 
  if (!clientPromise) {
    const maxPoolSize = Math.min(
      Math.max(parseInt(process.env.MONGODB_MAX_POOL_SIZE || "10", 10) || 10, 1),
      100
    );
 
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    });
 
    clientPromise = client
      .connect()
      .then(c => {
        db = c.db(MONGODB_DB || undefined);
        connectedAt = new Date();
        lastConnectError = null;
        return c;
      })
      .catch(err => {
        lastConnectError = err;
        clientPromise = null;
        try {
          client?.close?.();
        } catch {
        }
        client = null;
        db = null;
        throw err;
      });
  }
 
  await clientPromise;
  return { enabled: true, ok: true, dbName: db.databaseName };
}
 
function getDb() {
  if (!db) {
    throw new Error("MongoDB não inicializado. Chame connectMongo() no boot.");
  }
  return db;
}
 
async function pingMongo({ timeoutMs } = {}) {
  if (!isEnabled()) {
    return { enabled: false, ok: true, mode: "disabled" };
  }
 
  const pingTimeoutMs = Math.min(
    Math.max(parseInt(timeoutMs ?? process.env.MONGODB_PING_TIMEOUT_MS ?? "800", 10) || 800, 50),
    5000
  );
 
  if (!client) {
    return {
      enabled: true,
      ok: false,
      connected: false,
      error: lastConnectError ? String(lastConnectError.message || lastConnectError) : "not_connected"
    };
  }
 
  try {
    const pingPromise = client.db("admin").command({ ping: 1 });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("ping_timeout")), pingTimeoutMs).unref()
    );
 
    await Promise.race([pingPromise, timeoutPromise]);
 
    return {
      enabled: true,
      ok: true,
      connected: true,
      dbName: db?.databaseName || null,
      connectedAt: connectedAt ? connectedAt.toISOString() : null
    };
  } catch (err) {
    return {
      enabled: true,
      ok: false,
      connected: !!db,
      dbName: db?.databaseName || null,
      error: String(err?.message || err)
    };
  }
}
 
async function closeMongo() {
  if (!client) return;
  try {
    await client.close();
  } finally {
    client = null;
    clientPromise = null;
    db = null;
    connectedAt = null;
  }
}
 
function getMongoStatus() {
  return {
    enabled: isEnabled(),
    connected: !!db,
    dbName: db?.databaseName || null,
    connectedAt: connectedAt ? connectedAt.toISOString() : null,
    lastConnectError: lastConnectError ? String(lastConnectError.message || lastConnectError) : null
  };
}
 
module.exports = {
  connectMongo,
  getDb,
  pingMongo,
  closeMongo,
  getMongoStatus
};

// Connection pool for the Aiven MySQL database. Runs on the server only, so the
// password in .env.local never reaches the browser.

import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

// The Aiven CA certificate: on Vercel it comes from the DB_SSL_CA_CERT variable (the PEM text),
// locally it's read from the file named in DB_SSL_CA (ca.pem in this folder).
function caCertificate() {
  const pem = process.env.DB_SSL_CA_CERT;
  if (pem) return pem.replace(/\\n/g, "\n");
  return fs.readFileSync(path.resolve(process.cwd(), process.env.DB_SSL_CA ?? "ca.pem"));
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // always connect over SSL and verify the server with the Aiven CA certificate (ca.pem)
    ssl: { ca: caCertificate() },
    // give up quickly when Aiven is powered off or unreachable
    connectTimeout: 8000,
    connectionLimit: 5,
    // return DECIMAL columns and SUMs as numbers instead of strings
    decimalNumbers: true,
  });
}

// keep one pool across hot reloads in development
const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

function getPool() {
  globalForDb.pool ??= createPool();
  return globalForDb.pool;
}

export async function query<T>(sql: string, values: number[] = []): Promise<T[]> {
  const [rows] = await getPool().query(sql, values);
  return rows as unknown as T[];
}

// turn a connection error into a message for the dashboard
export function describeDbError(error: unknown) {
  const code = (error as { code?: string }).code ?? "UNKNOWN";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return { code, message: "The Aiven host can't be found. The MySQL service may be powered off." };
  }
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ECONNRESET") {
    return { code, message: "Aiven isn't accepting connections right now. The service may be starting or powered off." };
  }
  if (code === "ER_ACCESS_DENIED_ERROR") {
    return { code, message: "Aiven rejected the login. Check the username and password in .env.local." };
  }
  if (code === "ENOENT") {
    return { code, message: "The Aiven CA certificate is missing. Set DB_SSL_CA_CERT, or put ca.pem in the dashboard folder." };
  }
  return { code, message: "The database query failed." };
}

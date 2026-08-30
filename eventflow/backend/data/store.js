// Lightweight JSON-file data store standing in for MongoDB.
// Zero external services needed to run the demo. Swap this module for
// Mongoose models (see ../models/*.js) to move to a real MongoDB deployment —
// every function here maps 1:1 to a Mongoose equivalent (find/findById/create/save).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

const EMPTY = {
  users: [],
  departments: [],
  events: [],
  registrations: [],
  teams: [],
  payments: [],
  attendance: [],
  certificates: [],
};

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

let db = load();

export const store = {
  get raw() {
    return db;
  },
  reload() {
    db = load();
    return db;
  },
  collection(name) {
    return db[name];
  },
  persist() {
    save(db);
  },
  reset(newDb) {
    db = newDb;
    save(db);
  },
};

export default store;

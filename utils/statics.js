const logVisit = (db, path) => {
  const stmt = db.prepare(`INSERT INTO page_visits (path) VALUES (?)`);
  stmt.run(path);
};

const getVisitsForPage = (db, path, callback) => {
  const stmt = db.prepare(
    `SELECT COUNT(*) AS visits FROM page_visits WHERE path = ?`,
  );
  return stmt.get(path, (err, row) => {
    stmt.finalize();
    if (err) return callback(err);
    callback(null, row.visits);
  });
};

const getTotalVisitsPerPage = (db, callback) => {
  const stmt = db.prepare(`
    SELECT path, COUNT(*) AS visits
    FROM page_visits
    GROUP BY path
    ORDER BY visits DESC
  `);
  return stmt.all((err, rows) => {
    stmt.finalize();
    if (err) return callback(err);
    callback(null, rows);
  });
};

const excludedPrefixes = [
  "/public",
  "/rawblogs",
  "/assets",
  "/fonts",
  "/styles",
  "/api",
];

const excludedExact = ["/manifest.json", "favicon.ico"];

module.exports = {
  logVisit,
  getVisitsForPage,
  getTotalVisitsPerPage,
  excludedExact,
  excludedPrefixes,
};

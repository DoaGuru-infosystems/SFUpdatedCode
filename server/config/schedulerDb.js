// Scheduler Plugin - DB Helper for SF backend
// Uses the main database pool from ./db.js (dilkeris_sf)
const { db } = require('./db');

const schedulerQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error('[Scheduler DB] Query error:', err.message);
        return reject(err);
      }
      resolve(results);
    });
  });
};

const schedulerPool = {
  getConnection: () => {
    return new Promise((resolve, reject) => {
      db.getConnection((err, connection) => {
        if (err) return reject(err);
        
        const promisifiedConn = {
          _raw: connection,
          beginTransaction: () => new Promise((res, rej) => connection.beginTransaction(e => e ? rej(e) : res())),
          commit: () => new Promise((res, rej) => connection.commit(e => e ? rej(e) : res())),
          rollback: () => new Promise((res) => connection.rollback(() => res())),
          release: () => connection.release(),
          query: (sql, values) => new Promise((res, rej) => {
            if (values === undefined) {
              connection.query(sql, (e, r) => e ? rej(e) : res([r]));
            } else {
              connection.query(sql, values, (e, r) => e ? rej(e) : res([r]));
            }
          })
        };
        resolve(promisifiedConn);
      });
    });
  },
  query: db.query.bind(db),
  execute: (sql, values) => {
    return new Promise((resolve, reject) => {
      const cb = (err, results, fields) => {
        if (err) return reject(err);
        resolve([results, fields]);
      };
      if (values === undefined) {
        db.query(sql, cb);
      } else {
        db.query(sql, values, cb);
      }
    });
  }
};

module.exports = { schedulerPool, schedulerQuery };


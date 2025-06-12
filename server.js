const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('redis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

async function fetchFromPostgres() {
  const pool = new Pool({ connectionString: process.env.NEON_DB_URL });
  try {
    const res = await pool.query('SELECT name, url, type FROM inventory ORDER BY id');
    return res.rows;
  } finally {
    await pool.end();
  }
}

async function fetchFromRedis() {
  const client = createClient({ url: process.env.REDIS_URL });
  await client.connect();
  try {
    const items = await client.lRange('inventory', 0, -1);
    return items.map((item) => JSON.parse(item));
  } finally {
    await client.quit();
  }
}

app.get('/inventory', async (req, res) => {
  try {
    if (process.env.REDIS_URL) {
      const data = await fetchFromRedis();
      res.json(data);
      return;
    }
    if (process.env.NEON_DB_URL) {
      const data = await fetchFromPostgres();
      res.json(data);
      return;
    }
    res.json([]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const { Pool } = require('pg');

const app = express();
app.use(cors());

const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', err => console.error('Redis error', err));
redis.connect();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/inventory', async (req, res) => {
  try {
    let cached = await redis.get('inventory');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const { rows } = await pool.query(
      'SELECT id, name, image_url as url, media_type as type FROM inventory'
    );
    await redis.set('inventory', JSON.stringify(rows), { EX: 300 });
    res.json(rows);
  } catch (err) {
    console.error('Inventory fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));

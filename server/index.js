require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const { Pool } = require('pg');

const app = express();
app.use(cors());

let redis = null;
if (process.env.REDIS_URL) {
  redis = createClient({ url: process.env.REDIS_URL });
  redis.on('error', err => console.error('Redis error', err));
  redis.connect().catch(err => {
    console.error('Redis connection failed', err);
    redis = null; // disable redis usage if connection fails
  });
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/inventory', async (req, res) => {
  try {
    if (redis) {
      try {
        const cached = await redis.get('inventory');
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (err) {
        console.error('Redis fetch failed', err);
      }
    }

    const { rows } = await pool.query(
      'SELECT id, name, image_url as url, media_type as type FROM inventory'
    );
    if (redis) {
      try {
        await redis.set('inventory', JSON.stringify(rows), { EX: 300 });
      } catch (err) {
        console.error('Redis cache set failed', err);
      }
    }
    res.json(rows);
  } catch (err) {
    console.error('Inventory fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Server running on port ${port}`));

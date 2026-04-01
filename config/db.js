import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'kiddo_backend',
  password: 'Sanjay@1218',
  port: 5432,
});

export default pool;

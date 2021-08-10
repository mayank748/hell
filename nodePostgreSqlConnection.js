const { Pool, Client } = require('pg')
const pool = new Pool({
  user: 'maya',
  host: 'localhost',
  database: 'project_details',
  password: 'jw8s0F4',
  port: 5432,
})
pool.query('SELECT NOW()', (err, res) => {
  console.log(err, res)
  pool.end()
})
const client = new Client({
  user: 'maya',
  host: 'localhost',
  database: 'project_details',
  password: 'jw8s0F4',
  port: 5432,
})
client.connect()
client.query('SELECT * FROM video_call_table', (err, res) => {
  console.log(err, res)
  client.end()
})
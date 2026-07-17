// POST /.netlify/functions/submit-message
// Body: { email, message, deliverAt }  (deliverAt = ISO date string)

const postgres = require('postgres');

let sql;
function getSql() {
  if (!sql) {
    const connectionString = process.env.NETLIFY_DB_URL;
    if (!connectionString) {
      throw new Error('NETLIFY_DB_URL is not set in this environment');
    }
    sql = postgres(connectionString);
  }
  return sql;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let email, message, deliverAt;
  try {
    ({ email, message, deliverAt } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  if (!email || !message || !deliverAt) {
    return { statusCode: 400, body: 'email, message, and deliverAt are required' };
  }

  const deliverDate = new Date(deliverAt);
  if (isNaN(deliverDate.getTime()) || deliverDate <= new Date()) {
    return { statusCode: 400, body: 'deliverAt must be a valid future date' };
  }

  try {
    const sql = getSql();
    await sql`
      INSERT INTO messages (email, message, deliver_at)
      VALUES (${email}, ${message}, ${deliverDate.toISOString()})
    `;
  } catch (err) {
    console.error('DB insert failed:', err);
    return { statusCode: 500, body: 'Could not save your message' };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};

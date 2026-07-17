// POST /.netlify/functions/submit-message
// Body: { email, message, deliverAt }  (deliverAt = ISO date string)

const { getConnectionString } = require('@netlify/database');
const postgres = require('postgres');

const sql = postgres(getConnectionString());

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

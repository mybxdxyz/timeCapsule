// Scheduled function (see netlify.toml for the cron schedule).
// Finds any messages whose deliver_at has passed and haven't been sent,
// emails them, then marks them sent.

const postgres = require('postgres');
const { Resend } = require('resend');

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

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async () => {
  const sql = getSql();
  const due = await sql`
    SELECT id, email, message
    FROM messages
    WHERE deliver_at <= now() AND sent = false
    ORDER BY deliver_at ASC
    LIMIT 100
  `;

  let sentCount = 0;
  let failedCount = 0;

  for (const row of due) {
    try {
      await resend.emails.send({
        from: 'Time Capsule <capsule@yourdomain.com>', // update to a verified sender
        to: row.email,
        subject: 'A message from your past self',
        text: row.message,
      });

      await sql`
        UPDATE messages
        SET sent = true, sent_at = now()
        WHERE id = ${row.id}
      `;
      sentCount++;
    } catch (err) {
      // Leave sent = false so the next scheduled run retries it.
      console.error(`Failed to send message ${row.id}:`, err);
      failedCount++;
    }
  }

  console.log(`Checked ${due.length} due message(s): ${sentCount} sent, ${failedCount} failed.`);

  return {
    statusCode: 200,
    body: JSON.stringify({ checked: due.length, sent: sentCount, failed: failedCount }),
  };
};

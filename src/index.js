export default {
  async fetch(request, env, ctx) {
    const { results } = await env.DB
      .prepare(`
        SELECT
          title,
          store_name,
          city,
          event_type,
          start_time,
          event_url
        FROM events
        WHERE status = 'active'
        ORDER BY start_time ASC
      `)
      .all();

    const eventsHtml = results.length
      ? results.map(event => `
          <article>
            <h2>${event.title}</h2>
            <p><strong>Κατάστημα:</strong> ${event.store_name || "-"}</p>
            <p><strong>Πόλη:</strong> ${event.city || "-"}</p>
            <p><strong>Τύπος:</strong> ${event.event_type || "-"}</p>
            <p><strong>Ημερομηνία:</strong> ${event.start_time || "-"}</p>
            ${
              event.event_url
                ? `<p><a href="${event.event_url}" target="_blank">Δες το event</a></p>`
                : ""
            }
          </article>
        `).join("")
      : "<p>Δεν υπάρχουν διαθέσιμα events.</p>";

    const html = `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Riftbound Events Greece</title>
</head>
<body>
  <h1>Riftbound Events Greece</h1>

  ${eventsHtml}
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    });
  },
};

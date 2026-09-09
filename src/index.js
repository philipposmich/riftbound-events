export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/events") {
      const { results } = await env.DB
        .prepare(`
          SELECT
            external_id,
            title,
            store_name,
            city,
            address,
            event_type,
            start_time,
            event_url,
            status
          FROM events
          WHERE status = 'active'
          ORDER BY start_time ASC
        `)
        .all();

      return Response.json(results, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300"
        }
      });
    }

    return new Response("Riftbound Events API is online!", {
      headers: {
        "content-type": "text/plain; charset=UTF-8"
      }
    });
  }
};

const LOCATOR_API =
  "https://api.cloudflare.riftbound.uvsgames.com/hydraproxy/api/v2";

const PAGE_SIZE = 250;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // TEST: διάβασε ΟΛΑ τα events από τον υπάρχοντα locator
    if (url.pathname === "/api/locator-test") {
      try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 90);

        let page = 1;
        let total = null;
        let allEvents = [];

        while (true) {
          const params = new URLSearchParams({
            start_date_after: startDate.toISOString(),
            start_date_before: endDate.toISOString(),
            display_status: "upcoming",
            latitude: "37.9838",
            longitude: "23.7275",
            num_miles: "600",
            upcoming_only: "true",
            game_slug: "riftbound",
            page: String(page),
            page_size: String(PAGE_SIZE)
          });

          const response = await fetch(
            `${LOCATOR_API}/events/?${params.toString()}`,
            {
              headers: {
                Accept: "application/json"
              }
            }
          );

          if (!response.ok) {
            return Response.json(
              {
                success: false,
                page,
                status: response.status,
                error: `Locator returned HTTP ${response.status}`
              },
              { status: 500 }
            );
          }

          const data = await response.json();

          const pageEvents = Array.isArray(data.results)
            ? data.results
            : [];

          if (total === null) {
            total = Number(data.total || 0);
          }

          allEvents.push(...pageEvents);

          if (
            pageEvents.length === 0 ||
            pageEvents.length < PAGE_SIZE ||
            allEvents.length >= total
          ) {
            break;
          }

          page++;

          // Safety stop
          if (page > 20) {
            break;
          }
        }

        const greekEvents = allEvents.filter(event => {
          const country = String(
            event.store?.country || ""
          ).trim().toLowerCase();

          const address = String(
            event.full_address || ""
          ).toLowerCase();

          return (
            country === "gr" ||
            country === "grc" ||
            country === "greece" ||
            country === "hellas" ||
            country === "ελλάδα" ||
            address.includes("greece") ||
            address.includes("ελλάδα")
          );
        });

        return Response.json({
          success: true,
          locator_total: total,
          pages_checked: page,
          events_downloaded: allEvents.length,
          greek_events_found: greekEvents.length,
          greek_events: greekEvents.map(event => ({
            id: event.id,
            name: event.name,
            start_datetime: event.start_datetime,
            event_type: event.event_type,
            event_format: event.event_format,
            address: event.full_address,
            store_name: event.store?.name || null,
            city: event.store?.city || null,
            country: event.store?.country || null
          }))
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: String(error)
          },
          { status: 500 }
        );
      }
    }

    // Events από τη δική μας βάση
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

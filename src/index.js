const LOCATOR_API =
  "https://api.cloudflare.riftbound.uvsgames.com/hydraproxy/api/v2";

const PAGE_SIZE = 250;


async function fetchAllLocatorEvents() {
  const startDate = new Date();

  const endDate = new Date();
  endDate.setDate(
    endDate.getDate() + 90
  );

  let page = 1;
  let total = null;
  let allEvents = [];


  while (true) {
    const params =
      new URLSearchParams({
        start_date_after:
          startDate.toISOString(),

        start_date_before:
          endDate.toISOString(),

        display_status:
          "upcoming",

        latitude:
          "37.9838",

        longitude:
          "23.7275",

        num_miles:
          "600",

        upcoming_only:
          "true",

        game_slug:
          "riftbound",

        page:
          String(page),

        page_size:
          String(PAGE_SIZE)
      });


    const response =
      await fetch(
        `${LOCATOR_API}/events/?${params.toString()}`,
        {
          headers: {
            Accept: "application/json"
          }
        }
      );


    if (!response.ok) {
      throw new Error(
        `Locator returned HTTP ${response.status} on page ${page}`
      );
    }


    const data =
      await response.json();


    const pageEvents =
      Array.isArray(data.results)
        ? data.results
        : [];


    if (total === null) {
      total =
        Number(data.total || 0);
    }


    allEvents.push(
      ...pageEvents
    );


    if (
      pageEvents.length === 0 ||
      pageEvents.length < PAGE_SIZE ||
      allEvents.length >= total
    ) {
      break;
    }


    page++;


    if (page > 20) {
      throw new Error(
        "Safety stop: too many locator pages"
      );
    }
  }


  return {
    total,
    pagesChecked: page,
    events: allEvents
  };
}



function isGreekEvent(event) {
  const country =
    String(
      event.store?.country || ""
    )
    .trim()
    .toLowerCase();


  const address =
    String(
      event.full_address || ""
    )
    .trim()
    .toLowerCase();


  return (
    country === "gr" ||
    country === "grc" ||
    country === "greece" ||
    country === "hellas" ||
    country === "ελλάδα" ||
    address.includes("greece") ||
    address.includes("ελλάδα")
  );
}



async function syncGreekEvents(
  env,
  greekEvents
) {
  await env.DB.prepare(`
    UPDATE events
    SET
      status = 'inactive',
      updated_at = CURRENT_TIMESTAMP
    WHERE source = 'legacy-locator'
  `).run();


  const statements =
    greekEvents.map(
      event => {
        const externalId =
          `legacy:${event.id}`;


        return env.DB.prepare(`
          INSERT INTO events (
            external_id,
            title,
            store_name,
            city,
            address,
            event_type,
            start_time,
            event_url,
            status,
            source,
            last_seen_at,
            updated_at
          )

          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'active',
            'legacy-locator',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )

          ON CONFLICT(external_id)

          DO UPDATE SET
            title = excluded.title,
            store_name = excluded.store_name,
            city = excluded.city,
            address = excluded.address,
            event_type = excluded.event_type,
            start_time = excluded.start_time,
            event_url = excluded.event_url,
            status = 'active',
            source = 'legacy-locator',
            last_seen_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          externalId,
          event.name ||
            "Riftbound Event",

          event.store?.name ||
            null,

          event.store?.city ||
            null,

          event.full_address ||
            null,

          event.event_type ||
            null,

          event.start_datetime ||
            null,

          `https://locator.riftbound.uvsgames.com/events/${event.id}`
        );
      }
    );


  const CHUNK_SIZE = 50;


  for (
    let i = 0;
    i < statements.length;
    i += CHUNK_SIZE
  ) {
    await env.DB.batch(
      statements.slice(
        i,
        i + CHUNK_SIZE
      )
    );
  }


  return statements.length;
}



async function runSync(env) {
  const locator =
    await fetchAllLocatorEvents();


  const greekEvents =
    locator.events.filter(
      isGreekEvent
    );


  const synced =
    await syncGreekEvents(
      env,
      greekEvents
    );


  return {
    locator_total:
      locator.total,

    pages_checked:
      locator.pagesChecked,

    greek_events_found:
      greekEvents.length,

    events_synced:
      synced
  };
}



export default {
  async fetch(
    request,
    env
  ) {
    const url =
      new URL(request.url);


    /*
      Manual sync test
    */

    if (
      url.pathname ===
      "/api/sync-test"
    ) {
      try {
        const result =
          await runSync(env);


        return Response.json({
          success: true,
          ...result
        });
      }

      catch (error) {
        return Response.json(
          {
            success: false,
            error:
              String(error)
          },
          {
            status: 500
          }
        );
      }
    }



    /*
      UPCOMING EVENTS

      Αυτό συνεχίζει να τροφοδοτεί
      τη σημερινή λίστα.
    */

    if (
      url.pathname ===
      "/api/events"
    ) {
      const { results } =
        await env.DB.prepare(`
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

          ORDER BY
            start_time ASC
        `).all();


      return Response.json(
        results,
        {
          headers: {
            "Access-Control-Allow-Origin":
              "*",

            "Cache-Control":
              "public, max-age=300"
          }
        }
      );
    }



    /*
      CALENDAR ARCHIVE

      Επιστρέφει:

      - όλα τα active events
      - όλα τα events που έχουν
        ημερομηνία στο παρελθόν

      Δεν επιστρέφει inactive
      events του μέλλοντος, γιατί
      αυτά μπορεί να έχουν
      ακυρωθεί ή αφαιρεθεί.
    */

    if (
      url.pathname ===
      "/api/calendar-events"
    ) {
      const now =
        new Date().toISOString();


      const { results } =
        await env.DB.prepare(`
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

          WHERE
            status = 'active'
            OR start_time < ?

          ORDER BY
            start_time ASC
        `)
        .bind(now)
        .all();


      return Response.json(
        results,
        {
          headers: {
            "Access-Control-Allow-Origin":
              "*",

            "Cache-Control":
              "public, max-age=300"
          }
        }
      );
    }



    return new Response(
      "Riftbound Events API is online!",
      {
        headers: {
          "content-type":
            "text/plain; charset=UTF-8"
        }
      }
    );
  },



  async scheduled(
    controller,
    env,
    ctx
  ) {
    ctx.waitUntil(
      runSync(env)
    );
  }
};

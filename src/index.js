const LEGACY_LOCATOR_API =
  "https://api.cloudflare.riftbound.uvsgames.com/hydraproxy/api/v2";

const PLAYRIFTBOUND_GQL =
  "https://playriftbound.com/api/gql";


/*
  LEGACY LOCATOR
*/

const LEGACY_PAGE_SIZE =
  250;


/*
  PLAYRIFTBOUND
*/

const PLAYRIFTBOUND_RADIUS_METERS =
  32187;

const PLAYRIFTBOUND_PAGE_SIZE =
  20;

const PLAYRIFTBOUND_MAX_PAGES_PER_AREA =
  20;

const PLAYRIFTBOUND_MAX_TOTAL_REQUESTS =
  45;

const PLAYRIFTBOUND_OPERATION =
  "CompeteTournamentSearch";

const PLAYRIFTBOUND_QUERY_HASH =
  "acbcbba681a9c9a8063f792f7d665ba1eda81b19528b6af19e523f0c2061bec2";


const PLAYRIFTBOUND_SEARCH_AREAS = [
  {
    name: "Athens",
    latitude: 37.9842,
    longitude: 23.7353
  },

  {
    name: "Chalkida",
    latitude: 38.4636,
    longitude: 23.5994
  },

  {
    name: "Corinth",
    latitude: 37.9386,
    longitude: 22.9322
  },

  {
    name: "Patras",
    latitude: 38.2466,
    longitude: 21.7346
  },

  {
    name: "Kalamata",
    latitude: 37.0389,
    longitude: 22.1142
  },

  {
    name: "Tripoli",
    latitude: 37.5101,
    longitude: 22.3726
  },

  {
    name: "Lamia",
    latitude: 38.8993,
    longitude: 22.4332
  },

  {
    name: "Volos",
    latitude: 39.3610,
    longitude: 22.9426
  },

  {
    name: "Larisa",
    latitude: 39.6390,
    longitude: 22.4191
  },

  {
    name: "Trikala",
    latitude: 39.5557,
    longitude: 21.7679
  },

  {
    name: "Ioannina",
    latitude: 39.6650,
    longitude: 20.8537
  },

  {
    name: "Agrinio",
    latitude: 38.6214,
    longitude: 21.4078
  },

  {
    name: "Thessaloniki",
    latitude: 40.6401,
    longitude: 22.9444
  },

  {
    name: "Skydra",
    latitude: 40.7680,
    longitude: 22.1514
  },

  {
    name: "Kozani",
    latitude: 40.3007,
    longitude: 21.7889
  },

  {
    name: "Serres",
    latitude: 41.0909,
    longitude: 23.5413
  },

  {
    name: "Kavala",
    latitude: 40.9396,
    longitude: 24.4069
  },

  {
    name: "Xanthi",
    latitude: 41.1349,
    longitude: 24.8880
  },

  {
    name: "Komotini",
    latitude: 41.1192,
    longitude: 25.4054
  },

  {
    name: "Alexandroupoli",
    latitude: 40.8457,
    longitude: 25.8739
  },

  {
    name: "Corfu",
    latitude: 39.6243,
    longitude: 19.9217
  },

  {
    name: "Zakynthos",
    latitude: 37.7870,
    longitude: 20.8999
  },

  {
    name: "Heraklion",
    latitude: 35.3387,
    longitude: 25.1442
  },

  {
    name: "Chania",
    latitude: 35.5138,
    longitude: 24.0180
  },

  {
    name: "Rhodes",
    latitude: 36.4341,
    longitude: 28.2176
  },

  {
    name: "Kos",
    latitude: 36.8937,
    longitude: 27.2877
  },

  {
    name: "Mytilene",
    latitude: 39.1079,
    longitude: 26.5553
  },

  {
    name: "Chios",
    latitude: 38.3688,
    longitude: 26.1358
  },

  {
    name: "Samos",
    latitude: 37.7548,
    longitude: 26.9770
  },

  {
    name: "Syros",
    latitude: 37.4447,
    longitude: 24.9429
  }
];


/*
  GENERAL HELPERS
*/

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("el-GR")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}


function normalizeVenueName(value) {
  return normalizeText(value)
    .replace(
      /[^\p{L}\p{N}]+/gu,
      ""
    );
}


function safeCoordinate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function degreesToRadians(value) {
  return (
    value *
    Math.PI /
    180
  );
}


function distanceKm(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const radius =
    6371;

  const dLat =
    degreesToRadians(
      lat2 - lat1
    );

  const dLon =
    degreesToRadians(
      lon2 - lon1
    );

  const a =
    Math.sin(
      dLat / 2
    ) ** 2
    +
    Math.cos(
      degreesToRadians(
        lat1
      )
    )
    *
    Math.cos(
      degreesToRadians(
        lat2
      )
    )
    *
    Math.sin(
      dLon / 2
    ) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return (
    radius *
    c
  );
}


/*
  LEGACY SOURCE
*/

async function fetchAllLegacyEvents() {
  const startDate =
    new Date();

  const endDate =
    new Date();

  endDate.setDate(
    endDate.getDate() + 90
  );

  let page =
    1;

  let total =
    null;

  const allEvents =
    [];

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
          String(
            LEGACY_PAGE_SIZE
          )
      });

    const response =
      await fetch(
        `${LEGACY_LOCATOR_API}/events/?${params.toString()}`,
        {
          headers: {
            Accept:
              "application/json"
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        `Legacy Locator returned HTTP ${response.status} on page ${page}`
      );
    }

    const data =
      await response.json();

    const pageEvents =
      Array.isArray(
        data.results
      )
        ? data.results
        : [];

    if (total === null) {
      total =
        Number(
          data.total || 0
        );
    }

    allEvents.push(
      ...pageEvents
    );

    if (
      pageEvents.length === 0 ||
      pageEvents.length <
        LEGACY_PAGE_SIZE ||
      allEvents.length >= total
    ) {
      break;
    }

    page++;

    if (page > 20) {
      throw new Error(
        "Legacy safety stop: too many pages"
      );
    }
  }

  return {
    total,
    pagesChecked:
      page,

    events:
      allEvents
  };
}


function isGreekLegacyEvent(event) {
  const country =
    normalizeText(
      event.store?.country
    );

  const address =
    normalizeText(
      event.full_address
    );

  return (
    country === "gr" ||
    country === "grc" ||
    country === "greece" ||
    country === "hellas" ||
    country === "ελλαδα" ||
    address.includes(
      "greece"
    ) ||
    address.includes(
      "ελλαδα"
    )
  );
}


function normalizeLegacyEvent(event) {
  return {
    external_id:
      `legacy:${event.id}`,

    title:
      event.name ||
      "Riftbound Event",

    store_name:
      event.store?.name ||
      null,

    city:
      event.store?.city ||
      null,

    address:
      event.full_address ||
      null,

    event_type:
      event.event_type ||
      null,

    start_time:
      event.start_datetime ||
      null,

    event_url:
      `https://locator.riftbound.uvsgames.com/events/${event.id}`,

    latitude:
      safeCoordinate(
        event.latitude ??
        event.store?.latitude
      ),

    longitude:
      safeCoordinate(
        event.longitude ??
        event.store?.longitude
      ),

    source:
      "legacy-locator"
  };
}


/*
  PLAYRIFTBOUND SOURCE
*/

function playRiftboundEventType(
  value
) {
  const type =
    String(
      value || ""
    )
    .toUpperCase();

  const types = {
    NEXUS_NIGHT:
      "Nexus Night",

    SUMMONER_SKIRMISH:
      "Summoner Skirmish",

    PRE_RIFT:
      "Pre-Rift",

    SHOWDOWN:
      "Showdown",

    REGIONAL:
      "Regional",

    CHALLENGE:
      "Challenge",

    CUP:
      "Cup"
  };

  return (
    types[type] ||
    value ||
    null
  );
}


function buildPlayRiftboundURL(
  area,
  after = null
) {
  const variables = {
    sport:
      "rb",

    first:
      PLAYRIFTBOUND_PAGE_SIZE,

    filter: {
      rb: {
        coords: {
          latitude:
            area.latitude,

          longitude:
            area.longitude
        },

        distanceMeters:
          PLAYRIFTBOUND_RADIUS_METERS
      }
    },

    sortBy: {
      rb:
        "DATE"
    }
  };

  if (after) {
    variables.after =
      after;
  }

  const extensions = {
    clientLibrary: {
      name:
        "@apollo/client",

      version:
        "4.1.9"
    },

    persistedQuery: {
      version:
        1,

      sha256Hash:
        PLAYRIFTBOUND_QUERY_HASH
    }
  };

  const params =
    new URLSearchParams({
      operationName:
        PLAYRIFTBOUND_OPERATION,

      variables:
        JSON.stringify(
          variables
        ),

      extensions:
        JSON.stringify(
          extensions
        )
    });

  return (
    `${PLAYRIFTBOUND_GQL}?${params.toString()}`
  );
}


async function fetchPlayRiftboundPage(
  area,
  after = null
) {
  const response =
    await fetch(
      buildPlayRiftboundURL(
        area,
        after
      ),
      {
        method:
          "GET",

        headers: {
          "accept":
            "application/graphql-response+json,application/json;q=0.9",

          "accept-language":
            "en-US,en;q=0.9,el;q=0.8",

          "content-type":
            "application/json",

          "apollographql-client-name":
            "Esports Web",

          "apollographql-client-version":
            "230eb7a",

          "referer":
            "https://playriftbound.com/en-US/events"
        }
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `PlayRiftbound ${area.name} returned HTTP ${response.status}: ${responseText}`
    );
  }

  let body;

  try {
    body =
      JSON.parse(
        responseText
      );
  }

  catch (_) {
    throw new Error(
      `PlayRiftbound ${area.name} returned invalid JSON: ${responseText}`
    );
  }

  if (
    Array.isArray(
      body.errors
    ) &&
    body.errors.length
  ) {
    const messages =
      body.errors
        .map(
          error =>
            error?.message ||
            "Unknown GraphQL error"
        )
        .join(
          " | "
        );

    throw new Error(
      `PlayRiftbound ${area.name} GraphQL error: ${messages}`
    );
  }

  const connection =
    body
      ?.data
      ?.competeTournamentSearch;

  if (!connection) {
    throw new Error(
      `PlayRiftbound ${area.name} response did not contain competeTournamentSearch`
    );
  }

  const edges =
    Array.isArray(
      connection.edges
    )
      ? connection.edges
      : [];

  return {
    nodes:
      edges
        .map(
          edge =>
            edge?.node
        )
        .filter(
          Boolean
        ),

    pageInfo:
      connection.pageInfo ||
      {}
  };
}


async function fetchPlayRiftboundArea(
  area,
  requestCounter
) {
  let after =
    null;

  let page =
    0;

  const eventsById =
    new Map();

  while (true) {
    if (
      requestCounter.count >=
      PLAYRIFTBOUND_MAX_TOTAL_REQUESTS
    ) {
      throw new Error(
        `PlayRiftbound safety stop: reached ${PLAYRIFTBOUND_MAX_TOTAL_REQUESTS} total API requests`
      );
    }

    page++;

    requestCounter.count++;

    const result =
      await fetchPlayRiftboundPage(
        area,
        after
      );

    for (
      const node of
      result.nodes
    ) {
      const tournamentId =
        node
          ?.tournament
          ?.id;

      if (tournamentId) {
        eventsById.set(
          String(
            tournamentId
          ),
          node
        );
      }
    }

    const hasNextPage =
      Boolean(
        result
          .pageInfo
          ?.hasNextPage
      );

    const endCursor =
      result
        .pageInfo
        ?.endCursor ||
      null;

    if (!hasNextPage) {
      break;
    }

    if (!endCursor) {
      throw new Error(
        `PlayRiftbound ${area.name}: hasNextPage=true but endCursor is missing`
      );
    }

    after =
      endCursor;

    if (
      page >=
      PLAYRIFTBOUND_MAX_PAGES_PER_AREA
    ) {
      throw new Error(
        `PlayRiftbound ${area.name}: safety stop after ${PLAYRIFTBOUND_MAX_PAGES_PER_AREA} pages`
      );
    }
  }

  return {
    area:
      area.name,

    pagesChecked:
      page,

    events:
      [
        ...eventsById.values()
      ]
  };
}


async function fetchAllPlayRiftboundEvents() {
  const allEventsById =
    new Map();

  const areaResults =
    [];

  const requestCounter = {
    count: 0
  };

  for (
    const area of
    PLAYRIFTBOUND_SEARCH_AREAS
  ) {
    const result =
      await fetchPlayRiftboundArea(
        area,
        requestCounter
      );

    areaResults.push({
      area:
        result.area,

      pages_checked:
        result.pagesChecked,

      events_found:
        result.events.length
    });

    for (
      const node of
      result.events
    ) {
      const tournamentId =
        node
          ?.tournament
          ?.id;

      if (tournamentId) {
        allEventsById.set(
          String(
            tournamentId
          ),
          node
        );
      }
    }
  }

  return {
    requestsMade:
      requestCounter.count,

    searchAreas:
      PLAYRIFTBOUND_SEARCH_AREAS.length,

    areaResults,

    events:
      [
        ...allEventsById.values()
      ]
  };
}


function isGreekPlayRiftboundEvent(
  node
) {
  const address =
    normalizeText(
      node
        ?.organizer
        ?.physicalAddress
        ?.formattedAddress
    );

  return (
    address.includes(
      "greece"
    )
    ||
    address.includes(
      "ελλαδα"
    )
  );
}


function normalizePlayRiftboundEvent(
  node
) {
  const organizer =
    node?.organizer ||
    {};

  const location =
    organizer
      ?.physicalAddress ||
    {};

  const tournament =
    node?.tournament ||
    {};

  const tournamentId =
    tournament.id;

  const eventURL =
    tournamentId
      ? `https://playriftbound.com/en-US/events/${encodeURIComponent(tournamentId)}`
      : "https://playriftbound.com/en-US/events";

  return {
    external_id:
      `playriftbound:${tournamentId}`,

    title:
      tournament.name ||
      "Riftbound Event",

    store_name:
      organizer.name ||
      null,

    city:
      location.city ||
      null,

    address:
      location.formattedAddress ||
      null,

    event_type:
      playRiftboundEventType(
        tournament
          ?.config
          ?.tournamentType
      ),

    start_time:
      tournament.startsAt ||
      null,

    event_url:
      eventURL,

    latitude:
      safeCoordinate(
        location.latitude
      ),

    longitude:
      safeCoordinate(
        location.longitude
      ),

    source:
      "playriftbound"
  };
}


/*
  SAFE D1 SYNC
*/

async function syncSourceEvents(
  env,
  source,
  events
) {
  if (
    !Array.isArray(
      events
    ) ||
    events.length === 0
  ) {
    throw new Error(
      `${source} returned zero Greek events. Refusing to mark existing events inactive.`
    );
  }

  const syncStamp =
    new Date()
      .toISOString();

  const statements =
    events.map(
      event =>
        env.DB.prepare(`
          INSERT INTO events (
            external_id,
            title,
            store_name,
            city,
            address,
            event_type,
            start_time,
            event_url,
            latitude,
            longitude,
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
            ?,
            ?,
            'active',
            ?,
            ?,
            CURRENT_TIMESTAMP
          )

          ON CONFLICT(external_id)

          DO UPDATE SET
            title =
              excluded.title,

            store_name =
              excluded.store_name,

            city =
              excluded.city,

            address =
              excluded.address,

            event_type =
              excluded.event_type,

            start_time =
              excluded.start_time,

            event_url =
              excluded.event_url,

            latitude =
              excluded.latitude,

            longitude =
              excluded.longitude,

            status =
              'active',

            source =
              excluded.source,

            last_seen_at =
              excluded.last_seen_at,

            updated_at =
              CURRENT_TIMESTAMP
        `)
        .bind(
          event.external_id,
          event.title,
          event.store_name,
          event.city,
          event.address,
          event.event_type,
          event.start_time,
          event.event_url,
          event.latitude,
          event.longitude,
          source,
          syncStamp
        )
    );

  const CHUNK_SIZE =
    50;

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

  await env.DB.prepare(`
    UPDATE events

    SET
      status = 'inactive',
      updated_at = CURRENT_TIMESTAMP

    WHERE
      source = ?
      AND (
        last_seen_at IS NULL
        OR last_seen_at <> ?
      )
  `)
  .bind(
    source,
    syncStamp
  )
  .run();

  return (
    events.length
  );
}


/*
  SOURCE RUNNERS
*/

async function syncLegacySource(
  env
) {
  const locator =
    await fetchAllLegacyEvents();

  const greekEvents =
    locator.events
      .filter(
        isGreekLegacyEvent
      );

  const normalized =
    greekEvents
      .map(
        normalizeLegacyEvent
      );

  const synced =
    await syncSourceEvents(
      env,
      "legacy-locator",
      normalized
    );

  return {
    source:
      "legacy-locator",

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


async function syncPlayRiftboundSource(
  env
) {
  const result =
    await fetchAllPlayRiftboundEvents();

  const greekEvents =
    result.events
      .filter(
        isGreekPlayRiftboundEvent
      );

  const normalized =
    greekEvents
      .map(
        normalizePlayRiftboundEvent
      );

  const synced =
    await syncSourceEvents(
      env,
      "playriftbound",
      normalized
    );

  return {
    source:
      "playriftbound",

    search_areas:
      result.searchAreas,

    api_requests:
      result.requestsMade,

    events_downloaded:
      result.events.length,

    greek_events_found:
      greekEvents.length,

    events_synced:
      synced,

    areas:
      result.areaResults
  };
}


/*
  COMPLETE SYNC
*/

async function runSync(
  env
) {
  let legacyResult =
    null;

  let playRiftboundResult =
    null;

  const errors =
    {};

  try {
    legacyResult =
      await syncLegacySource(
        env
      );
  }

  catch (error) {
    errors.legacy_locator =
      String(error);
  }

  try {
    playRiftboundResult =
      await syncPlayRiftboundSource(
        env
      );
  }

  catch (error) {
    errors.playriftbound =
      String(error);
  }

  if (
    !legacyResult &&
    !playRiftboundResult
  ) {
    throw new Error(
      `All event sources failed: ${JSON.stringify(errors)}`
    );
  }

  return {
    legacy_locator:
      legacyResult,

    playriftbound:
      playRiftboundResult,

    partial_failure:
      Object.keys(
        errors
      ).length > 0,

    errors
  };
}


/*
  FRONTEND DEDUPLICATION
*/

function sourcePriority(
  event
) {
  if (
    event.source ===
    "playriftbound"
  ) {
    return 2;
  }

  if (
    event.source ===
    "legacy-locator"
  ) {
    return 1;
  }

  return 0;
}


function sameVenue(
  a,
  b
) {
  const aStore =
    normalizeVenueName(
      a.store_name
    );

  const bStore =
    normalizeVenueName(
      b.store_name
    );

  if (
    aStore &&
    bStore &&
    aStore === bStore
  ) {
    return true;
  }

  const aLat =
    safeCoordinate(
      a.latitude
    );

  const aLon =
    safeCoordinate(
      a.longitude
    );

  const bLat =
    safeCoordinate(
      b.latitude
    );

  const bLon =
    safeCoordinate(
      b.longitude
    );

  if (
    aLat === null ||
    aLon === null ||
    bLat === null ||
    bLon === null
  ) {
    return false;
  }

  return (
    distanceKm(
      aLat,
      aLon,
      bLat,
      bLon
    )
    <= 0.35
  );
}


function likelySameEvent(
  a,
  b
) {
  if (
    !a ||
    !b
  ) {
    return false;
  }

  if (
    a.source ===
    b.source
  ) {
    return false;
  }

  if (
    !sameVenue(
      a,
      b
    )
  ) {
    return false;
  }

  const aTime =
    Date.parse(
      a.start_time
    );

  const bTime =
    Date.parse(
      b.start_time
    );

  if (
    !Number.isFinite(
      aTime
    ) ||
    !Number.isFinite(
      bTime
    )
  ) {
    return false;
  }

  const difference =
    Math.abs(
      aTime -
      bTime
    );

  return (
    difference <=
    5 * 60 * 1000
  );
}


function dedupeEvents(
  events
) {
  const sorted =
    [...events]
      .sort(
        (
          a,
          b
        ) => {
          const priority =
            sourcePriority(
              b
            )
            -
            sourcePriority(
              a
            );

          if (
            priority !== 0
          ) {
            return priority;
          }

          const aTime =
            Date.parse(
              a.start_time
            );

          const bTime =
            Date.parse(
              b.start_time
            );

          if (
            !Number.isFinite(
              aTime
            )
          ) {
            return 1;
          }

          if (
            !Number.isFinite(
              bTime
            )
          ) {
            return -1;
          }

          return (
            aTime -
            bTime
          );
        }
      );

  const kept =
    [];

  for (
    const event of sorted
  ) {
    const duplicate =
      kept.some(
        existing =>
          likelySameEvent(
            existing,
            event
          )
      );

    if (!duplicate) {
      kept.push(
        event
      );
    }
  }

  kept.sort(
    (
      a,
      b
    ) => {
      const aTime =
        Date.parse(
          a.start_time
        );

      const bTime =
        Date.parse(
          b.start_time
        );

      if (
        !Number.isFinite(
          aTime
        )
      ) {
        return 1;
      }

      if (
        !Number.isFinite(
          bTime
        )
      ) {
        return -1;
      }

      return (
        aTime -
        bTime
      );
    }
  );

  return kept;
}


/*
  API HELPERS
*/

function jsonResponse(
  data,
  cacheControl =
    "public, max-age=300"
) {
  return Response.json(
    data,
    {
      headers: {
        "Access-Control-Allow-Origin":
          "*",

        "Cache-Control":
          cacheControl
      }
    }
  );
}


async function getUpcomingEvents(
  env
) {
  const {
    results
  } =
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
        latitude,
        longitude,
        status,
        source

      FROM events

      WHERE
        status = 'active'

      ORDER BY
        start_time ASC
    `)
    .all();

  return (
    dedupeEvents(
      results
    )
  );
}


async function getCalendarEvents(
  env
) {
  const now =
    new Date()
      .toISOString();

  const {
    results
  } =
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
        latitude,
        longitude,
        status,
        source

      FROM events

      WHERE
        status = 'active'
        OR (
          start_time IS NOT NULL
          AND datetime(start_time)
            < datetime(?)
        )

      ORDER BY
        start_time ASC
    `)
    .bind(
      now
    )
    .all();

  return (
    dedupeEvents(
      results
    )
  );
}


/*
  WORKER
*/

export default {
  async fetch(
    request,
    env
  ) {
    const url =
      new URL(
        request.url
      );


    if (
      url.pathname ===
      "/api/sync-test"
    ) {
      try {
        const result =
          await runSync(
            env
          );

        return jsonResponse(
          {
            success:
              true,

            ...result
          },
          "no-store"
        );
      }

      catch (error) {
        return jsonResponse(
          {
            success:
              false,

            error:
              String(error)
          },
          "no-store"
        );
      }
    }


    if (
      url.pathname ===
      "/api/events"
    ) {
      const events =
        await getUpcomingEvents(
          env
        );

      return jsonResponse(
        events
      );
    }


    if (
      url.pathname ===
      "/api/calendar-events"
    ) {
      const events =
        await getCalendarEvents(
          env
        );

      return jsonResponse(
        events
      );
    }


    if (
      url.pathname ===
      "/api/status"
    ) {
      const latest =
        await env.DB.prepare(`
          SELECT
            last_seen_at

          FROM events

          WHERE
            source IN (
              'legacy-locator',
              'playriftbound'
            )
            AND last_seen_at
              IS NOT NULL

          ORDER BY
            datetime(last_seen_at)
            DESC

          LIMIT 1
        `)
        .first();

      const {
        results:
          activeRows
      } =
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
            latitude,
            longitude,
            status,
            source

          FROM events

          WHERE
            status = 'active'
        `)
        .all();

      const {
        results:
          sourceRows
      } =
        await env.DB.prepare(`
          SELECT
            source,

            MAX(
              last_seen_at
            )
              AS last_sync,

            SUM(
              CASE
                WHEN status =
                  'active'
                THEN 1
                ELSE 0
              END
            )
              AS active_events

          FROM events

          WHERE
            source IN (
              'legacy-locator',
              'playriftbound'
            )

          GROUP BY
            source
        `)
        .all();

      const sources =
        {};

      for (
        const row of
        sourceRows
      ) {
        sources[
          row.source
        ] = {
          last_sync:
            row.last_sync ||
            null,

          active_events:
            Number(
              row.active_events ||
              0
            )
        };
      }

      return jsonResponse(
        {
          online:
            true,

          last_successful_sync:
            latest
              ?.last_seen_at ||
            null,

          active_events:
            dedupeEvents(
              activeRows
            ).length,

          sources
        },
        "no-store"
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
      runSync(
        env
      )
    );
  }
};

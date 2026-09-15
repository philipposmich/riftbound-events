const LEGACY_LOCATOR_API =
  "https://api.cloudflare.riftbound.uvsgames.com/hydraproxy/api/v2";

const PLAYRIFTBOUND_GQL =
  "https://playriftbound.com/api/gql";

const LEGACY_PAGE_SIZE = 250;

const PLAYRIFTBOUND_RADIUS_METERS = 32187;
const PLAYRIFTBOUND_PAGE_SIZE = 20;
const PLAYRIFTBOUND_MAX_PAGES_PER_AREA = 20;
const PLAYRIFTBOUND_MAX_TOTAL_REQUESTS = 45;
const PLAYRIFTBOUND_STALE_AFTER_MINUTES = 75;

const PLAYRIFTBOUND_OPERATION =
  "CompeteTournamentSearch";

const PLAYRIFTBOUND_QUERY_HASH =
  "acbcbba681a9c9a8063f792f7d665ba1eda81b19528b6af19e523f0c2061bec2";


/*
  GROUP A runs at :00 and :30.
  It also runs the Legacy Locator.
*/

const PLAYRIFTBOUND_GROUP_A = [
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
    name: "Syros",
    latitude: 37.4447,
    longitude: 24.9429
  }
];


/*
  GROUP B runs at :15 and :45.
*/

const PLAYRIFTBOUND_GROUP_B = [
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
  }
];


/* -------------------- HELPERS -------------------- */

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


function jsonResponse(
  data,
  cacheControl =
    "public, max-age=300",
  status =
    200
) {
  return Response.json(
    data,
    {
      status,

      headers: {
        "Access-Control-Allow-Origin":
          "*",

        "Cache-Control":
          cacheControl
      }
    }
  );
}



/* -------------------- LEGACY LOCATOR -------------------- */

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



/* -------------------- PLAYRIFTBOUND -------------------- */

function playRiftboundEventType(value) {
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
          accept:
            "application/graphql-response+json,application/json;q=0.9",

          "accept-language":
            "en-US,en;q=0.9,el;q=0.8",

          "content-type":
            "application/json",

          "apollographql-client-name":
            "Esports Web",

          "apollographql-client-version":
            "230eb7a",

          referer:
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


async function fetchAllPlayRiftboundEvents(
  searchAreas
) {
  const allEventsById =
    new Map();

  const areaResults =
    [];

  const requestCounter = {
    count:
      0
  };

  for (
    const area of
    searchAreas
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
      searchAreas.length,

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
    ) ||
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
      tournamentId
        ? `https://playriftbound.com/en-US/events/${encodeURIComponent(tournamentId)}`
        : "https://playriftbound.com/en-US/events",

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



/* -------------------- D1 UPSERT -------------------- */

function buildUpsertStatement(
  env,
  event,
  source,
  syncStamp
) {
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
  );
}


async function batchUpsertEvents(
  env,
  source,
  events,
  syncStamp
) {
  const statements =
    events.map(
      event =>
        buildUpsertStatement(
          env,
          event,
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
}


/*
  Full-source sync.
  Used by Legacy, because Legacy is still
  downloaded completely in one run.
*/

async function syncFullSourceEvents(
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

  await batchUpsertEvents(
    env,
    source,
    events,
    syncStamp
  );

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
  Partial PlayRiftbound sync.

  Only half of Greece is searched each run.
  Therefore we do NOT immediately deactivate
  rows that were not seen in this run.

  Every group is refreshed every 30 minutes.
  A row becomes inactive only if it has not
  been seen for 75 minutes.
*/

async function syncPlayRiftboundPartialEvents(
  env,
  events
) {
  if (
    !Array.isArray(
      events
    ) ||
    events.length === 0
  ) {
    throw new Error(
      "playriftbound returned zero Greek events for this group. Refusing to update stale status."
    );
  }

  const syncStamp =
    new Date()
      .toISOString();

  await batchUpsertEvents(
    env,
    "playriftbound",
    events,
    syncStamp
  );

  const staleBefore =
    new Date(
      Date.now() -
      PLAYRIFTBOUND_STALE_AFTER_MINUTES *
      60 *
      1000
    )
    .toISOString();

  await env.DB.prepare(`
    UPDATE events

    SET
      status = 'inactive',
      updated_at = CURRENT_TIMESTAMP

    WHERE
      source = 'playriftbound'
      AND status = 'active'
      AND (
        last_seen_at IS NULL
        OR datetime(last_seen_at) < datetime(?)
      )
  `)
  .bind(
    staleBefore
  )
  .run();

  return {
    events_synced:
      events.length,

    stale_before:
      staleBefore
  };
}



/* -------------------- SOURCE RUNNERS -------------------- */

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
    await syncFullSourceEvents(
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
  env,
  searchAreas,
  groupName
) {
  const result =
    await fetchAllPlayRiftboundEvents(
      searchAreas
    );

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

  const syncResult =
    await syncPlayRiftboundPartialEvents(
      env,
      normalized
    );

  return {
    source:
      "playriftbound",

    group:
      groupName,

    search_areas:
      result.searchAreas,

    api_requests:
      result.requestsMade,

    events_downloaded:
      result.events.length,

    greek_events_found:
      greekEvents.length,

    events_synced:
      syncResult.events_synced,

    stale_before:
      syncResult.stale_before,

    areas:
      result.areaResults
  };
}



/* -------------------- 15-MINUTE ROTATION -------------------- */

function getSyncPlan(
  timestamp = Date.now()
) {
  const minute =
    new Date(
      timestamp
    )
    .getUTCMinutes();

  /*
    :00 / :30 = Group A
    :15 / :45 = Group B
  */

  const groupIndex =
    Math.floor(
      minute / 15
    ) % 2;

  if (
    groupIndex === 0
  ) {
    return {
      groupName:
        "A",

      searchAreas:
        PLAYRIFTBOUND_GROUP_A,

      includeLegacy:
        true
    };
  }

  return {
    groupName:
      "B",

    searchAreas:
      PLAYRIFTBOUND_GROUP_B,

    includeLegacy:
      false
  };
}


function getRequestedSyncPlan(
  group
) {
  const normalized =
    String(
      group || ""
    )
    .trim()
    .toUpperCase();

  if (
    normalized === "A"
  ) {
    return {
      groupName:
        "A",

      searchAreas:
        PLAYRIFTBOUND_GROUP_A,

      includeLegacy:
        true
    };
  }

  if (
    normalized === "B"
  ) {
    return {
      groupName:
        "B",

      searchAreas:
        PLAYRIFTBOUND_GROUP_B,

      includeLegacy:
        false
    };
  }

  return null;
}


async function runSync(
  env,
  plan
) {
  let legacyResult =
    null;

  let playRiftboundResult =
    null;

  const errors =
    {};

  if (
    plan.includeLegacy
  ) {
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
  }

  try {
    playRiftboundResult =
      await syncPlayRiftboundSource(
        env,
        plan.searchAreas,
        plan.groupName
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
      `All scheduled sources failed: ${JSON.stringify(errors)}`
    );
  }

  return {
    sync_group:
      plan.groupName,

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



/* -------------------- FAST READ DEDUPE -------------------- */

const DEDUPE_TIME_WINDOW_MS =
  5 * 60 * 1000;


function prepareEventForDedupe(
  event
) {
  const time =
    Date.parse(
      event.start_time
    );

  return {
    event,

    time:
      Number.isFinite(
        time
      )
        ? time
        : null,

    storeKey:
      normalizeVenueName(
        event.store_name
      ),

    latitude:
      safeCoordinate(
        event.latitude
      ),

    longitude:
      safeCoordinate(
        event.longitude
      )
  };
}


function samePreparedVenue(
  a,
  b
) {
  if (
    a.storeKey &&
    b.storeKey &&
    a.storeKey ===
      b.storeKey
  ) {
    return true;
  }

  if (
    a.latitude === null ||
    a.longitude === null ||
    b.latitude === null ||
    b.longitude === null
  ) {
    return false;
  }

  return (
    distanceKm(
      a.latitude,
      a.longitude,
      b.latitude,
      b.longitude
    )
    <= 0.35
  );
}


function getTimeBucket(
  time
) {
  return Math.floor(
    time /
    DEDUPE_TIME_WINDOW_MS
  );
}


function isLegacyDuplicateOfPlay(
  legacy,
  playByBucket
) {
  if (
    legacy.time === null
  ) {
    return false;
  }

  const bucket =
    getTimeBucket(
      legacy.time
    );

  for (
    let offset = -1;
    offset <= 1;
    offset++
  ) {
    const candidates =
      playByBucket.get(
        bucket + offset
      ) || [];

    for (
      const play of
      candidates
    ) {
      if (
        play.time === null
      ) {
        continue;
      }

      if (
        Math.abs(
          legacy.time -
          play.time
        )
        >
        DEDUPE_TIME_WINDOW_MS
      ) {
        continue;
      }

      if (
        samePreparedVenue(
          legacy,
          play
        )
      ) {
        return true;
      }
    }
  }

  return false;
}


function sortEventsByStartTime(
  events
) {
  events.sort(
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
        ) &&
        !Number.isFinite(
          bTime
        )
      ) {
        return 0;
      }

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

  return events;
}


function dedupeEvents(
  events
) {
  const playEvents =
    [];

  const legacyEvents =
    [];

  const otherEvents =
    [];

  for (
    const event of
    events
  ) {
    if (
      event.source ===
      "playriftbound"
    ) {
      playEvents.push(
        prepareEventForDedupe(
          event
        )
      );
    }

    else if (
      event.source ===
      "legacy-locator"
    ) {
      legacyEvents.push(
        prepareEventForDedupe(
          event
        )
      );
    }

    else {
      otherEvents.push(
        event
      );
    }
  }

  const playByBucket =
    new Map();

  for (
    const play of
    playEvents
  ) {
    if (
      play.time === null
    ) {
      continue;
    }

    const bucket =
      getTimeBucket(
        play.time
      );

    if (
      !playByBucket.has(
        bucket
      )
    ) {
      playByBucket.set(
        bucket,
        []
      );
    }

    playByBucket
      .get(
        bucket
      )
      .push(
        play
      );
  }

  const kept =
    playEvents.map(
      item =>
        item.event
    );

  for (
    const legacy of
    legacyEvents
  ) {
    if (
      !isLegacyDuplicateOfPlay(
        legacy,
        playByBucket
      )
    ) {
      kept.push(
        legacy.event
      );
    }
  }

  kept.push(
    ...otherEvents
  );

  return (
    sortEventsByStartTime(
      kept
    )
  );
}



/* -------------------- READ APIs -------------------- */

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


async function getStatus(
  env
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


  return {
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
  };
}



/* -------------------- WORKER -------------------- */

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
        const requestedGroup =
          url.searchParams.get(
            "group"
          );


        const plan =
          requestedGroup
            ? getRequestedSyncPlan(
                requestedGroup
              )
            : getSyncPlan();


        if (!plan) {
          return jsonResponse(
            {
              success:
                false,

              error:
                "group must be A or B"
            },
            "no-store",
            400
          );
        }


        const result =
          await runSync(
            env,
            plan
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
          "no-store",
          500
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
      const status =
        await getStatus(
          env
        );

      return jsonResponse(
        status,
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
    const plan =
      getSyncPlan(
        controller
          ?.scheduledTime ||
        Date.now()
      );


    ctx.waitUntil(
      runSync(
        env,
        plan
      )
    );
  }
};


const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const SHOW_ID = "tt0460681";
const SHOW_NAME = "Supernatural";

const manifest = {
  id: "community.supernatural.br",
  version: "1.2.0",
  name: "Supernatural BR",
  description: "Catálogo completo de Supernatural: 15 temporadas e episódios.",
  resources: ["catalog", "meta"],
  types: ["series"],
  catalogs: [
    {
      type: "series",
      id: "supernatural-br",
      name: "Supernatural BR"
    }
  ],
  idPrefixes: [SHOW_ID]
};

const builder = new addonBuilder(manifest);

let cachedShow = null;
let cacheTime = 0;

async function getShow() {
  const now = Date.now();

  if (cachedShow && now - cacheTime < 60 * 60 * 1000) {
    return cachedShow;
  }

  const response = await fetch(
    "https://api.tvmaze.com/singlesearch/shows?q=Supernatural&embed=episodes"
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar dados no TVmaze: " + response.status);
  }

  const show = await response.json();

  if (!show._embedded || !show._embedded.episodes) {
    throw new Error("A lista de episódios não foi encontrada.");
  }

  cachedShow = show;
  cacheTime = now;

  return show;
}

function cleanText(text) {
  return (text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function getShowMetadata(show) {
  return {
    id: SHOW_ID,
    type: "series",
    name: SHOW_NAME,
    poster: show.image?.original || show.image?.medium,
    background: show.image?.original || show.image?.medium,
    description: cleanText(show.summary),
    genres: show.genres || [],
    releaseInfo: show.premiered
      ? show.premiered.slice(0, 4) + " - " +
        (show.ended ? show.ended.slice(0, 4) : "Em exibição")
      : undefined
  };
}

builder.defineCatalogHandler(async ({ type, id }) => {
  if (type !== "series" || id !== "supernatural-br") {
    return { metas: [] };
  }

  try {
    const show = await getShow();

    return {
      metas: [getShowMetadata(show)]
    };
  } catch (error) {
    console.error("Erro no catálogo:", error);
    return { metas: [] };
  }
});

builder.defineMetaHandler(async ({ type, id }) => {
  if (type !== "series" || id !== SHOW_ID) {
    return { meta: null };
  }

  try {
    const show = await getShow();

    const episodes = show._embedded.episodes
      .filter(ep =>
        ep.season >= 1 &&
        ep.season <= 15 &&
        ep.number !== null
      )
      .map(ep => ({
        id: `${SHOW_ID}:${ep.season}:${ep.number}`,
        season: ep.season,
        episode: ep.number,
        title: ep.name || `Episódio ${ep.number}`,
        released: ep.airdate
          ? `${ep.airdate}T00:00:00.000Z`
          : undefined,
        overview: cleanText(ep.summary),
        thumbnail: ep.image?.original || ep.image?.medium
      }));

    return {
      meta: {
        ...getShowMetadata(show),
        videos: episodes
      }
    };
  } catch (error) {
    console.error("Erro nos episódios:", error);
    return { meta: null };
  }
});

serveHTTP(builder.getInterface(), {
  port: process.env.PORT || 7000
});

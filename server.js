
const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const SHOW_ID = "tt0460681";

const manifest = {
  id: "community.supernatural.br",
  version: "1.1.0",
  name: "Supernatural BR",
  description: "As 15 temporadas de Supernatural",
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

async function getShow() {
  const response = await fetch(
    "https://api.tvmaze.com/singlesearch/shows?q=Supernatural&embed=episodes"
  );

  if (!response.ok) {
    throw new Error("Não foi possível consultar os episódios");
  }

  return response.json();
}

builder.defineCatalogHandler(async ({ type, id }) => {
  if (type !== "series" || id !== "supernatural-br") {
    return { metas: [] };
  }

  const show = await getShow();

  return {
    metas: [{
      id: SHOW_ID,
      type: "series",
      name: "Supernatural",
      poster: show.image?.original,
      background: show.image?.original,
      description: show.summary?.replace(/<[^>]*>/g, "") || "",
      genres: show.genres || []
    }]
  };
});

builder.defineMetaHandler(async ({ type, id }) => {
  if (type !== "series" || id !== SHOW_ID) {
    return { meta: null };
  }

  const show = await getShow();

  const episodes = show._embedded.episodes
    .filter(ep => ep.season >= 1 && ep.season <= 15)
    .map(ep => ({
      id: `${SHOW_ID}:${ep.season}:${ep.number}`,
      season: ep.season,
      episode: ep.number,
      title: ep.name,
      released: ep.airdate
        ? new Date(ep.airdate).toISOString()
        : undefined,
      overview: ep.summary?.replace(/<[^>]*>/g, "") || "",
      thumbnail: ep.image?.original
    }));

  return {
    meta: {
      id: SHOW_ID,
      type: "series",
      name: "Supernatural",
      poster: show.image?.original,
      background: show.image?.original,
      description: show.summary?.replace(/<[^>]*>/g, "") || "",
      genres: show.genres || [],
      videos: episodes
    }
  };
});

serveHTTP(builder.getInterface(), {
  port: process.env.PORT || 7000
});

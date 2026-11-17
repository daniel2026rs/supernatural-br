
const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
  id: "community.supernatural.br",
  version: "1.0.0",
  name: "Supernatural BR",
  description: "Catálogo dedicado à série Supernatural",
  resources: ["catalog", "meta"],
  types: ["series"],
  catalogs: [
    {
      type: "series",
      id: "supernatural-br",
      name: "Supernatural BR"
    }
  ],
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

const supernatural = {
  id: "tt0460681",
  type: "series",
  name: "Supernatural",
  description: "Sam e Dean Winchester enfrentam forças sobrenaturais.",
  genres: ["Drama", "Fantasia", "Terror"]
};

builder.defineCatalogHandler(({ type, id }) => {
  if (type === "series" && id === "supernatural-br") {
    return Promise.resolve({
      metas: [supernatural]
    });
  }

  return Promise.resolve({ metas: [] });
});

builder.defineMetaHandler(({ type, id }) => {
  if (type === "series" && id === "tt0460681") {
    return Promise.resolve({ meta: supernatural });
  }

  return Promise.resolve({ meta: null });
});

serveHTTP(builder.getInterface(), {
  port: process.env.PORT || 7000
});

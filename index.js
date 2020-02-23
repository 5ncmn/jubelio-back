"use strict";

const Hapi = require("@hapi/hapi");
const { eleveniaQuery } = require("./controllers/eleveniaQuery");
const { updateByProductNumber } = require("./controllers/update");
const { deleteByProductNumber } = require("./controllers/delete");
const { resetDB } = require("./controllers/resetDB");
const { getAll } = require("./controllers/getAll");
const { getByProductNumber } = require("./controllers/getByProductNumber");

const init = async () => {
  const server = Hapi.server({
    port: 3001,
    host: "localhost"
  });

  server.route({
    method: "POST",
    path: "/query-elevenia",
    options: {
      cors: true
    },
    handler: eleveniaQuery
  });

  server.route({
    method: "PUT",
    path: "/{productNumber}",
    options: {
      cors: true
    },
    handler: updateByProductNumber
  });

  server.route({
    method: "GET",
    path: "/{productNumber}",
    handler: getByProductNumber
  });

  server.route({
    method: "DELETE",
    path: "/{productNumber}",
    options: {
      cors: true
    },
    handler: deleteByProductNumber
  });

  server.route({
    method: "GET",
    path: "/",
    options: {
      cors: true
    },
    handler: getAll
  });

  // nuke this way
  server.route({
    method: "POST",
    path: "/reset",
    options: {
      cors: true
    },
    handler: resetDB
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", err => {
  console.log(err);
  process.exit(1);
});

init();

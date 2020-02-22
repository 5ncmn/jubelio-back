"use strict";

const Hapi = require("@hapi/hapi");
const Axios = require("axios");
const FXP = require("fast-xml-parser");
const { Client } = require("pg");

// im using scalegrid for db
// jdbc:postgresql://SG-jubelio-473-pgsql-master.servers.mongodirector.com:5432/<your-database-name>

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: "localhost"
  });

  // query DB
  server.route({
    method: "POST",
    path: "/query-elevenia",
    handler: async (request, h) => {
      try {
        const eleveniaData = await Axios({
          method: "GET",
          url: "http://api.elevenia.co.id/rest/prodservices/product/listing",
          headers: {
            openapikey: "721407f393e84a28593374cc2b347a98"
          }
        }).then(({ data }) => FXP.parse(data).Products.product);

        const cleanUpData = await Promise.all(
          eleveniaData.map(async (item, index) => {
            let eachItem = {
              name: item.prdNm,
              sku: item.sellerPrdCd.toString(),
              price: item.selPrc,
              productNumber: item.prdNo,
              productImages: []
            };

            const itemDetail = await Axios({
              method: "GET",
              url: `http://api.elevenia.co.id/rest/prodservices/product/details/${eachItem.productNumber}`,
              headers: {
                openapikey: "721407f393e84a28593374cc2b347a98"
              }
            }).then(({ data }) => FXP.parse(data).Product);

            Object.keys(itemDetail)
              .filter(key => key.includes("prdImage"))
              .map(imageKey => {
                eachItem.productImages.push(itemDetail[imageKey]);
              });

            return eachItem;
          })
        );

        return cleanUpData;
      } catch (err) {
        return err;
      }
    }
  });

  // const { Client } = require('pg')
  server.route({
    method: "GET",
    path: "/db-connection",
    handler: async (request, h) => {
      try {
        const client = new Client();
        console.log("we got here!");
        await client.connect();
        console.log("we got here 2!");
        const res = await client.query("SELECT $1::text as message", [
          "Hello world!"
        ]);

        await client.end();
        return res;
      } catch (err) {
        return err;
      }
    }
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", err => {
  console.log(err);
  process.exit(1);
});

init();

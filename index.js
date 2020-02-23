"use strict";

const Hapi = require("@hapi/hapi");
const Axios = require("axios");
const FXP = require("fast-xml-parser");
const { Client } = require("pg");
const DB = require("./db");

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

  server.route({
    method: "GET",
    path: "/db-connection",
    handler: async (request, h) => {
      try {
        const query = await DB.query("SELECT $1::text as message", [
          "hello world"
        ]);
        return {
          query,
          message: "Query successful."
        };
      } catch (err) {
        return err;
      }
    }
  });

  server.route({
    method: "GET",
    path: "/all",
    handler: async (request, h) => {
      try {
        const queryAll = await DB.query(`
          SELECT * FROM product;
        `);

        return queryAll;
      } catch (err) {
        return err;
      }
    }
  });

  server.route({
    method: "POST",
    path: "/test-insert",
    handler: async (request, h) => {
      try {
        const addNewProduct = await DB.query(`
          INSERT INTO product VALUES(
            'sku-0122',
            'TEST PRODUCT NAME',
            '32000',
            '12332311',
            '{"https://static.bmdstatic.com/pk/product/medium/5a669c252bde9.jpg", "https://p.ipricegroup.com/uploaded_71b7e3bc05dc6de7a9d4205c562c3fd6.jpg"}'
          )
        `);

        return {
          product: addNewProduct
        };
      } catch (err) {
        return err;
      }
    }
  });

  server.route({
    method: "POST",
    path: "/reset",
    handler: async (request, h) => {
      try {
        const newDB = await DB.query(`
        CREATE TABLE product (
          sku             VARCHAR PRIMARY KEY,
          name            VARCHAR NOT NULL,
          price           INT DEFAULT 0,
          productNumber   INT,
          productImages   TEXT[]
        )`);

        if (!newDB.success) {
          return {
            message: "wow error."
          };
        }

        return {
          newDB,
          message: "it works."
        };
      } catch (err) {
        return {
          error: err
        };
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

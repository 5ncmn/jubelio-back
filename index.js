"use strict";

const Hapi = require("@hapi/hapi");
const Axios = require("axios");
const FXP = require("fast-xml-parser");
const DB = require("./db");

const init = async () => {
  const server = Hapi.server({
    port: 3001,
    host: "localhost"
  });

  // query DB
  server.route({
    method: "POST",
    path: "/query-elevenia",
    options: {
      cors: true
    },
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

        // format for batch upload
        const sqlStringForBatchUpload = cleanUpData.reduce(
          (total, current, index) => {
            return (
              total +
              `${index ? ", " : ""}(
            '${current.sku}',
            '${current.name}',
            '${current.price}',
            '${current.productNumber}',
            '{${current.productImages.reduce((totalImage, currentImage) => {
              return (
                totalImage + `${totalImage.length ? ", " : ""}"${currentImage}"`
              );
            }, "")}}'
          )`
            );
          },
          ""
        );

        // batch upload
        const addNewProduct = await DB.query(`
          INSERT INTO product VALUES${sqlStringForBatchUpload}
        `);

        return {
          product: addNewProduct
        };
      } catch (err) {
        return err;
      }
    }
  });

  // Update
  server.route({
    method: "PUT",
    path: "/{productNumber}",
    options: {
      cors: true
    },
    handler: async (request, h) => {
      try {
        if (request.payload) {
          const updateString = Object.entries(request.payload).reduce(
            (total, current, index) => {
              if (current[0] == "productimages") {
                return (
                  total +
                  ", productimages = " +
                  `'{${current[1].reduce((totalImage, currentImage) => {
                    return (
                      totalImage +
                      `${totalImage.length ? "," : ""}"${currentImage}"`
                    );
                  }, "")}}'`
                );
              } else {
                return (
                  total + `${index ? ", " : ""}${current[0]} = '${current[1]}'`
                );
              }
            },
            ""
          );

          const updateDB = await DB.query(`
            UPDATE product
            SET ${updateString}
            WHERE productNumber = ${request.params.productNumber};
          `);

          if (updateDB.response.rowCount) {
            const queryDB = await DB.query(`
            SELECT * 
            FROM product
            ORDER BY productNumber ASC
          `);

            return {
              code: "001",
              data: queryDB.response.rows,
              message: "Updated successfully."
            };
          } else {
            return {
              code: "002",
              message: "0 rows updated."
            };
          }
        }
      } catch (err) {
        return err;
      }
    }
  });

  // Get one
  server.route({
    method: "GET",
    path: "/{productNumber}",
    handler: async (request, h) => {
      try {
        const updateDB = await DB.query(`
            SELECT * FROM product WHERE productNumber = ${request.params.productNumber}
          `);

        return {
          data: updateDB.response.rows
        };
      } catch (err) {
        return err;
      }
    }
  });

  // Delete
  server.route({
    method: "DELETE",
    path: "/{productNumber}",
    options: {
      cors: true
    },
    handler: async (request, h) => {
      try {
        const updateDB = await DB.query(`
            DELETE FROM product WHERE productNumber = ${request.params.productNumber}
          `);

        if (updateDB.response.rowCount) {
          const queryDB = await DB.query(`
            SELECT * 
            FROM product
            ORDER BY productNumber ASC
          `);

          return {
            code: "001",
            data: queryDB.response.rows,
            message: "Deleted successfully."
          };
        } else {
          return {
            code: "002",
            message: "0 rows deleted."
          };
        }
      } catch (err) {
        return err;
      }
    }
  });

  server.route({
    method: "GET",
    path: "/",
    options: {
      cors: true
    },
    handler: async (request, h) => {
      try {
        const queryAll = await DB.query(`
          SELECT * 
          FROM product
          ORDER BY ${request.query.orderBy || "productNumber"} ${request.query
          .orderIn || "ASC"}
        `);

        return queryAll.response.rows;
      } catch (err) {
        return err;
      }
    }
  });

  // NUKE
  server.route({
    method: "POST",
    path: "/reset",
    options: {
      cors: true
    },
    handler: async (request, h) => {
      try {
        const newDB = await DB.query(`
        CREATE TABLE product (
          sku             VARCHAR NOT NULL,
          name            VARCHAR NOT NULL,
          price           INT DEFAULT 0,
          productNumber   INT PRIMARY KEY,
          productImages   TEXT[]
        )`);

        // exists
        if (!newDB.success) {
          const clearTable = await DB.query(`
            DROP TABLE product
          `);

          const newDB = await DB.query(`
            CREATE TABLE product (
              sku             VARCHAR,
              name            VARCHAR NOT NULL,
              price           INT DEFAULT 0,
              productNumber   INT PRIMARY KEY,
              productImages   TEXT[]
            )
          `);

          return {
            info: newDB,
            message: "Table cleared."
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

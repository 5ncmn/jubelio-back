const DB = require("../db");

module.exports = {
  resetDB: async (request, h) => {
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
};

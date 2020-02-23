const DB = require("../db");

module.exports = {
  getAll: async (request, h) => {
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
};

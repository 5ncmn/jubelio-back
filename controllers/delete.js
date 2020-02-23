const DB = require("../db");

module.exports = {
  deleteByProductNumber: async (request, h) => {
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
};

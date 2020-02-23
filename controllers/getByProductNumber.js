module.exports = {
  getByProductNumber: async (request, h) => {
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
};

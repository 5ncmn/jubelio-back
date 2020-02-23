const DB = require("../db");

module.exports = {
  updateByProductNumber: async (request, h) => {
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
};

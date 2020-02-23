const Axios = require("axios");
const FXP = require("fast-xml-parser");
const DB = require("../db");

module.exports = {
  eleveniaQuery: async (request, h) => {
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
};

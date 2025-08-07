const category = require("../models/category");
const products = require("../models/product");
const productImages = require("../models/product_images");
const productFeatures = require("../models/product_features");

getProductData = () => {
    return [
        new Promise((resolve, reject) => {
            category.get((response) => {
                if (!response.error) {
                    resolve(response.data);
                } else {
                    reject(response.error);
                }
            });
        }),
        new Promise((resolve, reject) => {
            products.get((response) => {
                if (!response.error) {
                    const products = response.result;
                    mapProductImages(products, (products) => {
                        mapProductFeatures(products, (products) => {
                            resolve(products);
                        });
                    });
                } else {
                    reject(response.error);
                }
            });
        })
    ]
}

const mapProductImages = (products, calback) => {
    productImages.get((response) => {
        products.forEach((product) => {
            const productImages = response.result
                                        .filter((image) => image.productId == product.productId)
                                        .map(({name}) => name);
            Object.assign(product, {productImages});
        });
        calback(products);
    });
}

const mapProductFeatures = (products, calback) => {
    productFeatures.get((response) => {
        
        products.forEach((product) => {
            const features = response.result
                                        .filter((feature) => feature.productId == product.productId)
                                        .map(({details}) => details);
            Object.assign(product, {features});
        });
        calback(products);
    });
}

module.exports = {
    getProductData
}
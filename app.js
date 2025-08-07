const express = require('express');
const ejs = require('ejs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const _ = require("lodash");
const axios = require('axios').default;
require('dotenv').config();

// Initialise Express
const app = express();
const enquiryModel = require('./models/enquiry');
const productsModule = require('./web-modules/products');
const mailModule = require('./web-modules/emailModule');


app.locals.domain = process.env.DOMAIN;
global.domain = app.locals.domain;

app.locals._ = _;


// Render static files
// app.use(express.static('public'));
app.use(express.static(__dirname + '/public', {
    setHeaders: (res, path) => {
        res.setHeader('Access-Control-Allow-Origin', "http://www.pragatienter.com:3000");
        res.setHeader('Access-Control-Allow-Origin', "http://pragatienter.com:3000");
        res.setHeader('Access-Control-Allow-Origin', "http://www.pragatienter.com/web");
        res.setHeader('Access-Control-Allow-Origin', "http://pragatienter.com");
    }
}));

app.use((req, res, next) => {

    // Website you wish to allow to connect
    var allowedOrigins = ['http://www.pragatienter.com:3000', 'http://www.pragatienter.com', 'http://pragatienter.com', 'http://pragatienter.com:3000'];
    var origin = req.headers.origin;
    if(allowedOrigins.indexOf(origin) > -1){
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,token, Content-Length, boundary, Access-Control-Allow-Origin');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// for parsing application/json
app.use(bodyParser.json({limit: "50mb"})); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true })); 
//form-urlencoded

// for parsing multipart/form-data
// app.use(upload.array()); 
app.use(express.static('public'));

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/views'));
// Port website will run on
const port = 3000;
app.listen(port, () => {
    console.log("server port", port);
});

// *** GET Routes - display pages ***

// RI page
app.get('/v3',(req,res) => {  
    res.redirect('http://www.pragatienter.com/v3')
})

// Root Route
app.get('/', (req, res) => {
    Promise.all(productsModule.getProductData()).then((values) => {
        const products = values[1].filter(({pages}) => pages.includes("home"));
        if(products) {
            res.render("index", {categorys: values[0], products});
        } else {
            res.redirect('/web/404');
        }
    });
});

// Web routes
app.get('/product/all-products', (req, res) => {
    let {categoryId, categoryName} = req.query;
    categoryName = categoryName || "All Products"
    Promise.all(productsModule.getProductData()).then((values) => {
        let products = categoryId
                        ? values[1].filter((pro) => pro.categoryId == categoryId)
                        : values[1];
        if(products) {
            res.render('products/all-products',{products, categoryName});
        } else {
            res.redirect('/404');
        }
    });
});

app.get('/product/details', (req, res) => {
    Promise.all(productsModule.getProductData()).then((values) => {
        const product = values[1].find(({productId}) => productId == req.query.productId);
        if(product) {
            res.render('products/product-detail', {product});
        } else {
            res.redirect('/web/404');
        }
    });
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/enquiry', (req, res) => {
    const {categoryName, productName, productImage, productId, productDesc, metaKeywords} = req.query;
    res.render('products/product-enquiry', {categoryName, productName, productId, productImage, productDesc, metaKeywords});
});

app.post('/enquiry/request', (req, res) => {
    if(_.isEmpty(req.body["g-recaptcha-response"])) {
        mailModule.sendEnquiryMail({mailTo: 'admin@pragatienter.com', mailCC: '', subject: 'Invalid enquiry', ...req.body}, () => {});
        
        res.status(400).json({
            message: "CAPTCHA validation error.",
            error: {},
            data: null
        });
    } else {
        validateCaptcha({
            secret: process.env.GOOGLE_CAPTCHA_SECRET,
            response: req.body["g-recaptcha-response"]
        }, (validationRes) => {
            if(_.isEmpty(validationRes.error) && validationRes.success == true) {
                enquiryModel.add(req.body, (error, result, fields) => {
                    if (error) {
                        let errorStr = JSON.stringify(error);
                        res.status(500).json({
                            message: "There are some error with query.",
                            error: errorStr,
                            data: null
                        })
                    } else {
                        mailModule.sendEnquiryMail(req.body, () => {
                            res.status(200).json({
                                status: true,
                                message:"Enquiry successfully sent.",
                                data: result
                            });
                        });
                    }
                });
            } else {
                mailModule.sendEnquiryMail({mailTo: 'admin@pragatienter.com', mailCC: '', subject: 'Invalid enquiry', ...req.body}, () => {
                    res.status(400).json({
                        message: "Found invalid google CAPTCHA.",
                        error: validationRes['error-codes'],
                        data: null
                    });
                });
            }
        });
    }
});

// API section
var product = require('./api/routes/product');
var images = require('./api/routes/images');
var enquiry = require('./api/routes/enquiry');
var categoryApi = require('./api/routes/category');

app.use('/api/product', product);
app.use('/api/images', images);
app.use('/api/enquiry', enquiry);
app.use("/api/category", categoryApi);

app.get('/404', (req, res) => {
    res.render('404');
});

app.all('*', (req, res) => {
    res.redirect('/web/404');
});

const validateCaptcha = ({secret, response}, calback) => {
    axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${response}`)
      .then((response) => {
        calback(response.data);
      })
      .catch((error) => {
        calback(error);
      });
}


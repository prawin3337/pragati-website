const mysql = require("mysql");

var mysqlConnection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
});

mysqlConnection.connect((err) => {
    if(!err) {
        console.log("DB connected.");
    } else {
        console.log("DB connection fail", JSON.stringify(err));
    }
});

module.exports = mysqlConnection;

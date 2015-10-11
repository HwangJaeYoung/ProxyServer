/**
 * Created by HwangJaeYoung on 2015-10-10.
 */

// extract the modules
var http = require('http');
var express = require('express');
var mysql = require('mysql');

var retrieve = require('./Proxy/Retrieve');

var app = express( );


// connection to database
var client = mysql.createConnection({
    user : 'root',
    password : 'blossom',
    database : 'blossom'
});

app.use(app.router);

// Register Fiware Device to Mobius
app.get('/FiwareDeviceCreate', function(request, response) {



});

//  Retrieve Fiware Device infomation
app.get('/FiwareDeviceInfo', function(request, response) {
    client.query('SELECT * FROM onem2m WHERE entityID = "ContextEntity"', function(err, rows, fields) {
        if(err)
            throw err;
        for(var i = 0; i < rows.length; i++)
            console.log(rows[i].entityID + ' : ' + rows[i].attributeName);
    });
    retrieve.getFiwareInfo(response);
});

http.createServer(app).listen(62590, function( ) {
    console.log("Server running at http://127.0.0.1:62590");
});
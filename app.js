/**
 * Created by HwangJaeYoung on 2015-10-10.
 */

// extract the modules
var http = require('http');
var express = require('express');
var requesteToAnotherServer = require('request');
var mysql = require('mysql');

var app = express( );

// connection to database
var client = mysql.createConnection({
    user : 'root',
    password : 'blossom',
    database : 'blossom'
});

app.use(app.router);

app.get('/FiwareEntity', function(request, response) {
    /*client.query('SELECT * FROM blossom WHERE entityID = ContextEntity', function(err, rows, fields) {
        if(err)
            throw err;
        for(var i = 0; i < rows.length; i++)
            console.log(rows[i].entityID + ' : ' + rows[i].attributeID);
    });*/

    requesteToAnotherServer({
            url : 'http://193.48.247.246:1026/v1/queryContext',
            method : 'POST',
            json : true,
            headers : {
                'content-type' : 'application/json',
                'Accept' : 'application/json',
                'Fiware-Service' : 'egmul20',
                'Fiware-ServicePat2h' : '/egmul20path'
            },
            body: {
                'entities': [
                    {
                        "type": "thing",
                        "isPattern": "false",
                        "id": "ContextEntity"
                    }
                ]
            }
    }, function (error, responseAnotherServer, body) {
        if (!error && responseAnotherServer.statusCode == 200) {
            console.log("data %j", body);
        }
    });
    response.send('<h1> Good </h1>')
});

http.createServer(app).listen(62590, function( ) {
    console.log("Server running at http://127.0.0.1:62590");
});
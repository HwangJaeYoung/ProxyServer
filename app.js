/**
 * Created by HwangJaeYoung on 2015-10-10.
 */

// extract the modules
var http = require('http');
var express = require('express');
var requesteToAnotherServer = require('request');
var mysql = require('mysql');

var app = express( );

/*
// connection to database
var client = mysql.createConnection({
    user : 'root',
    password : 'blossom',
    database : 'blossom'
}); */

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
            var a = body.contextResponses
            var b = a[0].contextElement;
            var c = b.attributes;


            var entityID = b.id;
            var type = b.type;

            console.log(entityID + ' : ' + type);
            for(var i = 0; i < c.length; i++) {
                if(c[i].name == 'TimeInstant') {

                } else if (c[i].name == 'att_name') {

                } else {
                    console.log(c[i].name + ' : ' + c[i].type + ' : ' + c[i].value);
                }
            }
        }
    });
    response.send('<h1> Good </h1>')
});

http.createServer(app).listen(62590, function( ) {
    console.log("Server running at http://127.0.0.1:62590");
});
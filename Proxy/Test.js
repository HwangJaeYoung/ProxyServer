/**
 * Created by Blossom on 2015-10-17.
 */

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var requestToAnotherServer = require('request');

var app = express( );

// bodyPaerser 위치 안지키면 post parsing이 안된다.....;;
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json( ));
app.use(app.router);

//  Register Fiware Device infomation
app.get('/PostTest', function(request, response) {

    var attributes = [];
    attributes[0] = 'temperature';
    attributes[1] = 'pressure';

    requestToAnotherServer({
        url: 'http://193.48.247.246:1026/v1/subscribeContext',
        method: 'POST',
        json: true,
        headers: { // fiware접근에 필요한 기본 헤더의 구조
            'content-type': 'application/json',
            'Accept': 'application/json',
            'Fiware-Service': 'egmul20',
            'Fiware-ServicePat2h': 'egmul20path'
        },
        body: { // subscription를 등록할때 필요한 payload json 구조를 작성한다.
            "entities": [
                {
                    "type": "thing",
                    "isPattern": "false",
                    "id": 'doubleEntity'
                }
            ],
            "attributes": [
                attributes
            ],
            "reference": "http://54.65.62.99:62590/FiwareNotificationEndpoint", // 나중에 endpoint를 지정한다.
            "duration": "P1M",
            "notifyConditions": [
                {
                    "type": "ONTIMEINTERVAL",
                    "condValues": [
                        "PT15S"
                    ]
                }
            ]
        }
    }, function (error, containerCreateResponse, body) {
        console.log(containerCreateResponse.statusCode);
        response.status(200).send();
    });
});

// Server start!!
http.createServer(app).listen(62590, function( ) {
    console.log("Server running at http://127.0.0.1:62590");
});
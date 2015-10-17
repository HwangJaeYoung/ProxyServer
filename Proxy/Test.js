/**
 * Created by Blossom on 2015-10-17.
 */

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var requestToAnotherServer = require('request');

var app = express( );

// bodyPaerser ��ġ ����Ű�� post parsing�� �ȵȴ�.....;;
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
        headers: { // fiware���ٿ� �ʿ��� �⺻ ����� ����
            'content-type': 'application/json',
            'Accept': 'application/json',
            'Fiware-Service': 'egmul20',
            'Fiware-ServicePat2h': 'egmul20path'
        },
        body: { // subscription�� ����Ҷ� �ʿ��� payload json ������ �ۼ��Ѵ�.
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
            "reference": "http://54.65.62.99:62590/FiwareNotificationEndpoint", // ���߿� endpoint�� �����Ѵ�.
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
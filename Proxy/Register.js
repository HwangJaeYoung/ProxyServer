/**
 * Created by HwangJaeYoung on 2015-10-11.
 */

// extract the modules
var mysql = require('mysql');
var requestToAnotherServer = require('request');
var dbConfig = require('./DatabaseConfig');

exports.getFiwareInfo = function(response, entityName){

    // Fiware에 접근하여 entityName에 대한 정보를 가지고 온다.
    requestToAnotherServer( { url : 'http://193.48.247.246:1026/v1/queryContext',
            method : 'POST',
            json : true,
            headers : { // fiware접근에 필요한 기본 헤더의 구조
                'content-type' : 'application/json',
                'Accept' : 'application/json',
                'Fiware-Service' : fiwareService,
                'Fiware-ServicePat2h' : fiwareServicePath
            },
            body: { // NGSI10에 따른 payload이 구성이다.(queryContext)
                'entities': [
                    {
                        "type": "thing",
                        "isPattern": "false",
                        "id": "" + entityName
                    }
                ]
            }
        }, function (error, responseAnotherServer, body) {
        if (!error && responseAnotherServer.statusCode == 200) {
            var contextResponses = body.contextResponses
            var contextElement = contextResponses[0].contextElement;
            var attributes = contextElement.attributes;

            var entityID = contextElement.id;
            var type = contextElement.type;

            console.log(entityID + ' : ' + type);
            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].name == 'TimeInstant') {

                } else if (attributes[i].name == 'att_name') {

                } else {
                    a = attributes[i].name + ' : ' + attributes[i].type + ' : ' + attributes[i].value;
                    console.log(a);
                    response.send('<h1>' + a + '</h1>');
                }
            }
        }
    });
};
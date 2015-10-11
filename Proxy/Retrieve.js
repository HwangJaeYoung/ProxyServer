/**
 * Created by HwangJaeYoung on 2015-10-10.
 */

// extract the modules
var mysql = require('mysql');
var requestToAnotherServer = require('request');

exports.getFiwareInfo = function(response){
    requestToAnotherServer( { url : 'http://193.48.247.246:1026/v1/queryContext',
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
            for (var i = 0; i < c.length; i++) {
                if (c[i].name == 'TimeInstant') {

                } else if (c[i].name == 'att_name') {

                } else {
                    a = c[i].name + ' : ' + c[i].type + ' : ' + c[i].value;
                    console.log(a);
                    response.send('<h1>' + a + '</h1>');
                }
            }
        }
    });
};
/**
 *  Created by HwangJaeYoung on 2015-11-30.
 *  forest62590@gmail.com
 */
var requestToAnotherServer = require('request');
var unsubscriptionCount = 0;

var unsubscriptionFunction = function(request, response, subIdArray, unsubscriptionCallback) {
    // ********************** unsubscription을 하기 위해 ContextBroker에 요청을한다. ***************************
    requestToAnotherServer({
        url:  fiwareIP + '/v1/unsubscribeContext',
        method: 'POST',
        json: true,
        headers: { // Mobius에 contentInstance등록을 위한 기본 헤더 구조
            'content-type' : 'application/json',
            'Accept' : 'application/json',
            'Fiware-Service' : fiwareService,
            'Fiware-ServicePath' : fiwareServicePath
        },
        body: { // unsubscription을 할때 필요한 body 구조를 작성한다.
            "subscriptionId" : subIdArray[unsubscriptionCount]
        }
    }, function (error, unsubscriptionResponse, body) {
        if (!error && unsubscriptionResponse.statusCode == 200) {
            if (unsubscriptionCount < subIdArray.length - 1) {
                unsubscriptionCount++;
                unsubscriptionCallback(request, response, subIdArray, unsubscriptionFunction);
            } else {
                response.status(200).send("<h1> *** Unsubscription Success *** </h1>");
            }
        }
    });
};

exports.unsubscriptionFiwareDevice = function(request, response, map){
    var subIdArray = []; var count = 0;

    map.forEach(function(value, key) {
        subIdArray[count++] = key;
    });

    if(unsubscriptionCount < subIdArray.length) {
        unsubscriptionFunction(request, response, subIdArray, unsubscriptionFunction);
    } else {
        response.status(500).send("<h1> *** Subscription ID not exist *** </h1>")
    }
};
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
        headers: { // ContextBroker에 Unsubscription을 하기위한 헤더구조
            'content-type' : 'application/json',
            'Accept' : 'application/json',
            'Fiware-Service' : fiwareService,
            'Fiware-ServicePath' : fiwareServicePath
        },
        body: { // Unsubscription을 할때 필요한 body 구조를 작성한다.
            "subscriptionId" : subIdArray[unsubscriptionCount]
        }
    }, function (error, unsubscriptionResponse, body) {
        if (!error && unsubscriptionResponse.statusCode == 200) {
            if (unsubscriptionCount < subIdArray.length - 1) {
                unsubscriptionCount++;
                unsubscriptionCallback(request, response, subIdArray, unsubscriptionFunction);
            } else { // 모든 Entity의 Unsubscription 성공
                response.status(200).send("<h1> *** Unsubscription Success *** </h1>");
            }
        } else { // Entity Unsubscription 중간에 실패할 경우
            response.status(500).send("<h1> *** Unsubscription error *** </h1>")
        }
    });
};

exports.unsubscriptionFiwareDevice = function(request, response, map){
    var subIdArray = []; var count = 0;

    // Subscription등록 후 생성된 ID 저장한 것의 Key를 가져온다.
    map.forEach(function(value, key) {
        subIdArray[count++] = key;
    });

    if(unsubscriptionCount < subIdArray.length) { // Subscription ID가 존재한다면
        unsubscriptionFunction(request, response, subIdArray, unsubscriptionFunction);
    } else { // Subscription ID가 하나라도 없다면
        response.status(500).send("<h1> *** Subscription ID not exist *** </h1>")
    }
};
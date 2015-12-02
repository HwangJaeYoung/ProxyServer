/**
 *  Created by HwangJaeYoung on 2015-11-30.
 *  forest62590@gmail.com
 */

var fs = require('fs');
var requestToAnotherServer = require('request');
var unsubscriptionCount = 0;

var unsubscriptionFunction = function(subIdArray, unsubscriptionCallback) {
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
        if (unsubscriptionResponse.statusCode == 200) { // 삭제 완료되었을 때
            if (unsubscriptionCount < subIdArray.length - 2) { // 더 삭제할 것이 있는지 확인한다.
                unsubscriptionCount++;
                unsubscriptionCallback(subIdArray, unsubscriptionFunction);
            } else { // 모든 Entity의 Unsubscription 성공
                fs.writeFile('subscriptionList.txt', '', function (error) {
                    if(error)
                        console.log('FATAL An error occurred trying to write in the file: ' + err);
                    else {
                        console.log('******* Unsubscription Success *******');
                    }
                });
            }
        } else { // Entity Unsubscription 중간에 실패할 경우
            console.log('******* Retry unsubscription delete *******');
            unsubscriptionCallback(subIdArray, unsubscriptionFunction);
        }
    });
};

exports.unsubscriptionFiwareDevice = function(subIdArray){
    unsubscriptionFunction(subIdArray, unsubscriptionFunction);
};
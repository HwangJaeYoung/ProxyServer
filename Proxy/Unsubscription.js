/**
 *  Created by HwangJaeYoung on 2015-11-30.
 *  forest62590@gmail.com
 */
var requestToAnotherServer = require('request');
var unsubscriptionCount = 0;

var unsubscriptionFunction = function(request, response, subIdArray, unsubscriptionCallback) {
    // ********************** unsubscription�� �ϱ� ���� ContextBroker�� ��û���Ѵ�. ***************************
    requestToAnotherServer({
        url:  fiwareIP + '/v1/unsubscribeContext',
        method: 'POST',
        json: true,
        headers: { // ContextBroker�� Unsubscription�� �ϱ����� �������
            'content-type' : 'application/json',
            'Accept' : 'application/json',
            'Fiware-Service' : fiwareService,
            'Fiware-ServicePath' : fiwareServicePath
        },
        body: { // Unsubscription�� �Ҷ� �ʿ��� body ������ �ۼ��Ѵ�.
            "subscriptionId" : subIdArray[unsubscriptionCount]
        }
    }, function (error, unsubscriptionResponse, body) {
        if (!error && unsubscriptionResponse.statusCode == 200) {
            if (unsubscriptionCount < subIdArray.length - 1) {
                unsubscriptionCount++;
                unsubscriptionCallback(request, response, subIdArray, unsubscriptionFunction);
            } else { // ��� Entity�� Unsubscription ����
                response.status(200).send("<h1> *** Unsubscription Success *** </h1>");
            }
        } else { // Entity Unsubscription �߰��� ������ ���
            response.status(500).send("<h1> *** Unsubscription error *** </h1>")
        }
    });
};

exports.unsubscriptionFiwareDevice = function(request, response, map){
    var subIdArray = []; var count = 0;

    // Subscription��� �� ������ ID ������ ���� Key�� �����´�.
    map.forEach(function(value, key) {
        subIdArray[count++] = key;
    });

    if(unsubscriptionCount < subIdArray.length) { // Subscription ID�� �����Ѵٸ�
        unsubscriptionFunction(request, response, subIdArray, unsubscriptionFunction);
    } else { // Subscription ID�� �ϳ��� ���ٸ�
        response.status(500).send("<h1> *** Subscription ID not exist *** </h1>")
    }
};
/**
 *  Created by HwangJaeYoung on 2015-11-30.
 *  forest62590@gmail.com
 */

var fs = require('fs');
var requestToAnotherServer = require('request');
var unsubscriptionCount = 0;
var retryCount = 0;

var unsubscriptionFunction = function(subIdArray, unsubscriptionCallback) {
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
        if (unsubscriptionResponse.statusCode == 200) { // ���� �Ϸ�Ǿ��� ��
            if (unsubscriptionCount < subIdArray.length - 2) { // �� ������ ���� �ִ��� Ȯ���Ѵ�.
                unsubscriptionCount++;
                unsubscriptionCallback(subIdArray, unsubscriptionFunction);
            } else { // ��� Entity�� Unsubscription ����
                fs.writeFile('subscriptionList.txt', '', function (err) {
                    if(err)
                        console.log('FATAL An error occurred trying to write in the file: ' + err);
                    else {
                        console.log('******* Unsubscription Success *******');
                        console.log('After 10 seconds, Server is run...');
                    }
                });
            }
        } else { // Entity Unsubscription �߰��� ������ ���
            if (retryCount < 10) { // �ִ� retryȽ���� �����Ѵ�.
                console.log('******* Retry unsubscription : ' + retryCount + ' *******');
                retryCount++;
                unsubscriptionCallback(subIdArray, unsubscriptionFunction);
            } else { // �ִ� retry Ƚ���� �ʰ��Ͽ��� ���� ���Ḧ �Ѵ�.
                return;
            }
        }
    });
};

exports.unsubscriptionFiwareDevice = function(subIdArray){
    unsubscriptionFunction(subIdArray, unsubscriptionFunction);
};
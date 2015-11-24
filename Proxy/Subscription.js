/**
 * Created by HwangJaeYoung on 2015-10-14.
 * forest62590@gmail.com
 */

// extract the modules
var mysql = require('mysql');
var requestToAnotherServer = require('request');

// AE�� ������ �Ŀ� �������� attribute���� ���� �� �ִµ� �ݺ������� ������Ʈ �ϱ� ���� �Լ��̴�.
var updateFunction = function(response, entityName, attributeName, type, value, startTime, subscriptionCountPram, updateCallback) {
    var subscriptionCount = subscriptionCountPram;
    console.log('values : ' + attributeName[subscriptionCount] + ', ' + type[subscriptionCount] + ', ' + value[subscriptionCount]);

    var cur_d = new Date();
    var msec = '';

    if((parseInt(cur_d.getMilliseconds(), 10)<10)) {
        msec = ('00'+cur_d.getMilliseconds());
    }
    else if((parseInt(cur_d.getMilliseconds(), 10)<100)) {
        msec = ('0'+cur_d.getMilliseconds());
    }
    else {
        msec = cur_d.getMilliseconds();
    }
    var subscriptionID = 'CI' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);

    // ********************** contentInstance�� ����� �����Ѵ�. ***************************
    requestToAnotherServer({
        url: yellowTurtleIP + '/mobius-yt/' + entityName + '/' + attributeName[subscriptionCount],
        method: 'POST',
        json: true,
        headers: { // Mobius�� contentInstance����� ���� �⺻ ��� ����
            'Accept': 'application/json',
            'locale': 'ko',
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'Origin',
            'X-M2M-NM': subscriptionID, // path_UNIQUE�̹Ƿ� ����ũ���ʸ� �̿��Ͽ� ���ڵ带 �����Ѵ�.
            'content-type': 'application/vnd.onem2m-res+json; ty=4',
            'nmtype': 'long'
        },
        body: { // contentInstance�� ����Ҷ� �ʿ��� payload json ������ �ۼ��Ѵ�.
            "contentInfo": type[subscriptionCount],
            "content": value[subscriptionCount]
        }
    }, function (error, contentInstanceResponse, body) {
        if(typeof(contentInstanceResponse) !== 'undefined') {
            if (contentInstanceResponse.statusCode == 201) { // ���������� ����� �� �Ǿ��� ��

                if (subscriptionCount < attributeName.length - 1) {
                    subscriptionCount++;
                    updateCallback(response, entityName, attributeName, type, value, startTime, subscriptionCount, updateFunction);
                } else {
                    subscriptionCount = 0; // ��� �� ������Ʈ �Ͽ����Ƿ� �ʱ�ȭ �Ѵ�.
                }
            } else {
                // �ַ� 409 Conflict������ �߻��Ѵ�.
                console.log('****************** error status **************** : ' + contentInstanceResponse.statusCode);
                process.exit(1); // ������ �߻����� ��� ������ �����Ų��.
            }
        } else {
            if(error != null) {
                console.log('****************** error status **************** : ' + error);
                console.log('****************** error code ****************** : ' + error.code);
                process.exit(1); // ������ �߻����� ��� ������ �����Ų��.
            }
        }
    });
};

exports.updateFiwareInfo = function(request, response, startTime){
    // Fiware���� ������ ������ �Ľ��Ѵ�. (attribute�� �����͸� ������ �´�.)
    console.log('subscriptionId : ' + request.body.subscriptionId);
    var contextResponses = request.body.contextResponses
    var contextElement = contextResponses[0].contextElement;
    var entityName = contextElement.id;
    var attributes = contextElement.attributes;

    var attributeName = [], type = [], value = []; // Ư�� attribute�� �����ϱ����� �迭
    var count = 0;

    for (var i = 0; i < attributes.length; i++) {
        if (attributes[i].name == 'TimeInstant' || attributes[i].name == 'att_name') {
            continue;
        } else {
            // ���ҽ� ��Ͽ� �ʿ��� ������ �Ľ�
            attributeName[count] = attributes[i].name;
            type[count] = attributes[i].type;
            value[count] =  attributes[i].value;
            count++;
        }
    }
    updateFunction(response, entityName, attributeName, type, value, startTime, 0, updateFunction);
};
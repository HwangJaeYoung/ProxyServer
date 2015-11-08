/**
 * Created by HwangJaeYoung on 2015-10-14.
 */

// extract the modules
var mysql = require('mysql');
var async = require('async');
var requestToAnotherServer = require('request');

var registerCount = 0; // attribute ����� ������ ī��Ʈ �Ѵ�.

// AE�� ������ �Ŀ� �������� attribute���� ���� �� �ִµ� �ݺ������� ������Ʈ �ϱ� ���� �Լ��̴�.
var updateFunction = function(response, entityName, attributeName, type, value, startTime, updateCallback) {
    console.log('values : ' + attributeName[registerCount] + ', ' + type[registerCount] + ', ' + value[registerCount]);
    // ********************** contentInstance������ �����Ѵ�. ***************************
    requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt/' + entityName + '/' + attributeName[registerCount] + '/' + 'deviceinfo',
        method : 'DELETE',
        headers : { // Mobius�� contentInstance������ ���� �⺻ ��� ����
            'Accept' : 'application/xml',
            'X-M2M-RI' : '12345',
            'X-M2M-Origin' : 'Origin'
        }
    }, function(error, containerCreateResponse, body) {
        console.log('in contentInstance');
        // ********************** containerInstance�� ����� �����Ѵ�. ***************************
        requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt/' + entityName + '/'+ attributeName[registerCount],
            method : 'POST',
            json : true,
            headers : { // Mobius�� contentInstance����� ���� �⺻ ��� ����
                'Accept' : 'application/json',
                'locale' : 'ko',
                'X-M2M-RI' : '12345',
                'X-M2M-Origin' : 'Origin',
                'X-M2M-NM' : 'deviceinfo', // Fiware���� ������ attribute�̸��� ����Ѵ�.(e.g. temperature)
                'content-type' : 'application/vnd.onem2m-res+json; ty=4',
                'nmtype' : 'long'
            },
            body: { // contentInstance�� ����Ҷ� �ʿ��� payload json ������ �ۼ��Ѵ�.
                "contentInfo": type[registerCount],
                "content": value[registerCount]
            }
        }, function(error, contentInstanceResponse, body) {
            if(contentInstanceResponse.statusCode == 201) { // ���������� ����� �� �Ǿ��� ��
                console.log('contentInstance update success!!');

                var endDate = new Date();
                var endTime = parseInt(endDate.getMilliseconds());
                var timeResult = endTime - startTime;

                console.log('**************************************************');
                console.log('startTime : ' + startTime);
                console.log('endTIme : ' + endTime);
                console.log('time : ' + timeResult);
                console.log('**************************************************');

                if(registerCount < attributeName.length - 1) {
                    registerCount++;
                    updateCallback(response, entityName, attributeName, type, value, startTime, updateFunction);
                } else {
                    registerCount = 0; // ��� �� ������Ʈ �Ͽ����Ƿ� �ʱ�ȭ �Ѵ�.
                    response.status(201).send();
                }
            } else {
                response.status(404).send();
            }
        });
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

    updateFunction(response, entityName, attributeName, type, value, startTime, updateFunction);
};
/**
 * Created by Blossom on 2015-10-14.
 */

// extract the modules
var mysql = require('mysql');
var async = require('async');
var requestToAnotherServer = require('request');

// AE�� ������ �Ŀ� �������� attribute���� ���� �� �ִµ� �ݺ������� ������Ʈ �ϱ� ���� �Լ��̴�.
var updateFunction = function(response, entityName, attributeName, type, value) {
    console.log('values : ' + attributeName + ', ' + type + ', ' + value);
    // ********************** 1. contentInstance������ �����Ѵ�. ***************************
    requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt/' + entityName + '/' + attributeName + '/' + 'deviceinfo',
        method : 'DELETE',
        headers : { // Mobius�� contentInstance������ ���� �⺻ ��� ����
            'Accept' : 'application/xml',
            'X-M2M-RI' : '12345',
            'X-M2M-Origin' : 'Origin'
        }
    }, function(error, containerCreateResponse, body) {
        console.log('in contentInstance');
        console.log(containerCreateResponse.statusCode);
        // ********************** containerInstance�� ����� �����Ѵ�. ***************************.
        requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt/' + entityName + '/'+ attributeName,
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
                "contentInfo": type,
                "content": value
            }
        }, function(error, contentInstanceResponse, body) {
            if(contentInstanceResponse.statusCode == 201) { // ���������� ����� �� �Ǿ��� ��
                console.log('AE, Container, contentInstance create success!!');
                response.status(201).send();
            } else
                response.status(404).send();
        });
    });
};

exports.updateFiwareInfo = function(request, response){
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

    var registerCount = 0;
    // contentInstance�� ������Ʈ�� �����Ѵ�. attribute�� �������� ��� ����ȭ�� �ʿ��ϴ�.
    async.whilst(function( ) {
            // Ż������ ������ attribute�� ������ Ȯ���Ͽ� ������ŭ �����Ѵ�.
            return registerCount < attributeName.length;
        },

        function (dummyCallback) { // dummyCallback�� ����ϴ� �Լ��� �ƴϴ�.
            console.log('in async');
            // �ݺ������� �����ϱ� ���� ȣ���Ѵ�. �� �� ȣ���� ������  registerCount�˻縦 ���������� �˻��Ͽ� �����Ѵ�.
            updateFunction(response, entityName, attributeName[registerCount], type[registerCount], value[registerCount]);
            registerCount++;
            setTimeout(dummyCallback, 1000); // 1�� �ֱ�� �ش��Լ��� �����Ѵ�.
        },
        function (err) { // �߰��� ������ �߻��ϰų� Ż������ Ȯ���� ���������� ������ ��
            console.log("End");
        }
    )
};
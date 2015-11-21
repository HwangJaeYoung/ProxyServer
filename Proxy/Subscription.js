/**
 * Created by HwangJaeYoung on 2015-10-14.
 * forest62590@gmail.com
 */

// extract the modules
var mysql = require('mysql');
var async = require('async');
var requestToAnotherServer = require('request');

// AE를 생성한 후에 여러개의 attribute들이 있을 수 있는데 반복적으로 업데이트 하기 위한 함수이다.
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

    // ********************** contentInstance에 등록을 시작한다. ***************************
    requestToAnotherServer({
        url: yellowTurtleIP + '/mobius-yt/' + entityName + '/' + attributeName[subscriptionCount],
        method: 'POST',
        json: true,
        headers: { // Mobius에 contentInstance등록을 위한 기본 헤더 구조
            'Accept': 'application/json',
            'locale': 'ko',
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'Origin',
            'X-M2M-NM': msec, // Fiware에서 가져온 attribute이름을 사용한다.(e.g. temperature)
            'content-type': 'application/vnd.onem2m-res+json; ty=4',
            'nmtype': 'long'
        },
        body: { // contentInstance를 등록할때 필요한 payload json 구조를 작성한다.
            "contentInfo": type[subscriptionCount],
            "content": value[subscriptionCount]
        }
    }, function (error, contentInstanceResponse, body) {
        if (contentInstanceResponse.statusCode == 201) { // 정상적으로 등록이 다 되었을 때

            if (subscriptionCount < attributeName.length - 1) {
                subscriptionCount++;
                updateCallback(response, entityName, attributeName, type, value, startTime, subscriptionCount, updateFunction);
            } else {
                subscriptionCount = 0; // 모두 다 업데이트 하였으므로 초기화 한다.
                response.status(201).send();
            }
        } else {
            response.status(404).send();
        }
    });
};

exports.updateFiwareInfo = function(request, response, startTime){
    // Fiware에서 전달한 정보를 파싱한다. (attribute의 데이터를 가지고 온다.)
    console.log('subscriptionId : ' + request.body.subscriptionId);
    var contextResponses = request.body.contextResponses
    var contextElement = contextResponses[0].contextElement;
    var entityName = contextElement.id;
    var attributes = contextElement.attributes;

    var attributeName = [], type = [], value = []; // 특정 attribute를 저장하기위한 배열
    var count = 0;

    for (var i = 0; i < attributes.length; i++) {
        if (attributes[i].name == 'TimeInstant' || attributes[i].name == 'att_name') {
            continue;
        } else {
            // 리소스 등록에 필요한 데이터 파싱
            attributeName[count] = attributes[i].name;
            type[count] = attributes[i].type;
            value[count] =  attributes[i].value;
            count++;
        }
    }
    updateFunction(response, entityName, attributeName, type, value, startTime, 0, updateFunction);
};
/**
 * Created by Blossom on 2015-10-14.
 */

// extract the modules
var mysql = require('mysql');
var async = require('async');
var requestToAnotherServer = require('request');

// AE를 생성한 후에 여러개의 attribute들이 있을 수 있는데 반복적으로 업데이트 하기 위한 함수이다.
var updateFuntciton = function(response, AEName, attributeName, type, value) {
    console.log('values : ' + attributeName + ', ' + type + ', ' + value);
    // ********************** 1. contentInstance삭제를 시작한다. ***************************
    requestToAnotherServer( { url : 'http://210.107.239.106:7579/mobius-yt/' + AEName + '/' + attributeName + 'deviceinfo',
        method : 'DELETE',
        headers : { // Mobius에 contentInstance삭제를 위한 기본 헤더 구조
            'Accept' : 'application/json',
            'X-M2M-RI' : '12345',
            'X-M2M-Origin' : 'Origin',
        }
    }, function(error, containerCreateResponse, body) {
        console.log('in contentInstance');
        // ********************** containerInstance에 등록을 시작한다. ***************************.
        requestToAnotherServer( { url : 'http://210.107.239.106:7579/mobius-yt/' + AEName + '/'+ attributeName,
            method : 'POST',
            json : true,
            headers : { // Mobius에 contentInstance등록을 위한 기본 헤더 구조
                'Accept' : 'application/json',
                'locale' : 'ko',
                'X-M2M-RI' : '12345',
                'X-M2M-Origin' : 'Origin',
                'X-M2M-NM' : 'deviceinfo', // Fiware에서 가져온 attribute이름을 사용한다.(e.g. temperature)
                'content-type' : 'application/vnd.onem2m-res+json; ty=4',
                'nmtype' : 'long'
            },
            body: { // contentInstance를 등록할때 필요한 payload json 구조를 작성한다.
                "contentInfo": type,
                "content": value
            }
        }, function(error, contentInstanceResponse, body) {
            if(contentInstanceResponse.statusCode == 201) { // 정상적으로 등록이 다 되었을 때
                console.log('AE, Container, contentInstance crease success!!');
                response.status(201).send();
            } else
                response.status(404).send();
        });
    });
};

exports.updateFiwareInfo = function(request, response){
    // Fiware에서 전달한 정보를 파싱한다. (attribute의 데이터를 가지고 온다.)
    var contextResponses = request.body.contextResponses
    var contextElement = contextResponses[0].contextElement;
    var attributes = contextElement.attributes;

    var AEName;
    var attributeName = [], type = [], value = []; // 특정 attribute를 저장하기위한 배열
    var count = 0;

    for (var i = 0; i < attributes.length; i++) {
        if (attributes[i].name == 'TimeInstant') {
            continue;
        } else if(attributes[i].name == 'att_name') {
            AEName = attributes[i].value; // AE Name을 미리 등록해 놓는다.
        } else {
            // 리소스 등록에 필요한 데이터 파싱
            attributeName[count] = attributes[i].name;
            type[count] = attributes[i].type;
            value[count] =  attributes[i].value;
            count++;
        }
    }

    // contentInstance의 업데이트를 시작한다. attribute가 여러개인 경우 동기화가 필요하다.
    async.whilst(function( ) {
            // 탈출조건 저장할 attribute의 갯수를 확인하여 갯수만큼 저장한다.
            return registerCount < attributeName.length;
        },

        function (dummyCallback) { // dummyCallback은 사용하는 함수가 아니다.
            console.log('in async');
            // 반복적으로 저장하기 위해 호출한다. 한 번 호출이 끝나면  registerCount검사를 동기적으로 검사하여 실행한다.
            updateFuntciton(response, AEName, attributeName[registerCount], type[registerCount], value[registerCount]);
            registerCount++;
            setTimeout(dummyCallback, 1000); // 1초 주기로 해당함수를 실행한다.
        },
        function (err) { // 중간에 에러가 발생하거나 탈출조건 확인후 정상적으로 끝났을 때
            console.log("End");
        }
    )
};
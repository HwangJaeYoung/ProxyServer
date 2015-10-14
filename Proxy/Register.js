/**
 * Created by HwangJaeYoung on 2015-10-11.
 */

// extract the modules
var mysql = require('mysql');
var requestToAnotherServer = require('request');
var dbConfig = require('./DatabaseConfig');

exports.getFiwareInfo = function(response, entityName){

    // Fiware에 접근하여 entityName에 대한 정보를 가지고 온다.
    requestToAnotherServer( { url : 'http://193.48.247.246:1026/v1/queryContext',
            method : 'POST',
            json : true,
            headers : { // fiware접근에 필요한 기본 헤더의 구조
                'content-type' : 'application/json',
                'Accept' : 'application/json',
                'Fiware-Service' : fiwareService,
                'Fiware-ServicePat2h' : fiwareServicePath
            },
            body: { // NGSI10에 따른 payload이 구성이다.(queryContext)
                'entities': [
                    {
                        "type": "thing",
                        "isPattern": "false",
                        "id": "" + entityName
                    }
                ]
            }
        }, function (error, fiwareResponse, body) {
        if (!error && fiwareResponse.statusCode == 200) {
            // ContextBroker에서 리턴하는 json구조에 대한 파싱을 시작한다.
            var contextResponses = body.contextResponses
            var contextElement = contextResponses[0].contextElement;
            var attributes = contextElement.attributes;

            var entityID = contextElement.id; // ContextBroker에 전달한 EntityID
            var type = contextElement.type; // Entity의 Type을 추출

            console.log(entityID + ' : ' + type);

            var attributeName, type, value;

            // 특정 attribute를 찾아낸다 현재는 한개만 가능하다.
            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].name == 'TimeInstant') { }
                else if (attributes[i].name == 'att_name') { }
                else {
                    // 리소스 등록에 필요한 데이터 파싱
                    attributeName = attributes[i].name;
                    type = attributes[i].type;
                    value =  attributes[i].value;
                }
            }

            // ********************** AE에 등록을 시작한다. ***************************
            requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt',
                method : 'POST',
                json : true,
                headers : { // Mobius에 AE등록을 위한 기본 헤더 구조
                    'Accept' : 'application/json',
                    'locale' : 'ko',
                    'X-M2M-RI' : '12345',
                    'X-M2M-Origin' : 'Origin',
                    'X-M2M-NM' : 'FiwareDevice',
                    'content-type' : 'application/vnd.onem2m-res+json; ty=2',
                    'nmtype' : 'long'
                },
                body: { // AE를 등록할때 필요한 payload json 구조를 작성한다.
                    "m2m:AE": {
                        "App-ID": "0.2.481.2.0001.001.000111"
                    }
                }
            }, function(error, AECreateResponse, body) {

                console.log('in container');
                // ********************** Container에 등록을 시작한다. ***************************
                requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt/FiwareDevice',
                    method : 'POST',
                    json : true,
                    headers : { // Mobius에 Container 등록을 위한 기본 헤더 구조
                        'Accept' : 'application/json',
                        'locale' : 'ko',
                        'X-M2M-RI' : '12345',
                        'X-M2M-Origin' : 'Origin',
                        'X-M2M-NM' : '' + attributeName, // Fiware에서 가져온 attribute이름을 사용한다.(e.g. temperature)
                        'content-type' : 'application/vnd.onem2m-res+json; ty=3',
                        'nmtype' : 'long'
                    },
                    body: { // Container를 등록할때 필요한 payload json 구조를 작성한다.
                        "m2m:container": {
                            "containerType": "heartbeat",
                            "heartbeatPeriod": "300"
                        }
                    }
                }, function(error, containerCreateResponse, body) {
                    console.log('in contentInstance');
                    // ********************** containerInstance에 등록을 시작한다. ***************************.
                    requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt/FiwareDevice/'+ attributeName,
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
                            "m2m:contentInstance": {
                                "contentInfo": type,
                                "content": value
                            }
                        }
                    }, function(error, contentInstanceResponse, body) {
                        if(contentInstanceResponse.statusCode == 201) {
                            console.log('AE, Container, contentInstance crease success!!');
                            response.status(201).send();
                        } else
                            response.status(404).send();
                    });
                });
            });
        }
    });
};
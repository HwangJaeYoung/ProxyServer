/**
 * Created by HwangJaeYoung on 2015-10-11.
 * forest62590@gmail.com
 */

// extract the modules
var fs = require('fs');
var requestToAnotherServer = require('request');
var unsubscription = require('./Unsubscription');

var AEName = ''; // 공통적으로 사용하는 AE를 정의한다.
var AEType = ''; // 공통적으로 사용하는 AE Type을 정의한다.
var AECount = 0; // 생성되는 AE의 개수를 확인하기 위하여 사용한다.
var registerCount = 0;  // attribute 요소의 개수를 카운트 한다.
var subscriptionCount = 0; // ContextBroker에 Subscription을 신청할 때 개수를 확인하기 위하여 사용한다.

// AE를 생성한 후에 여러개의 attribute들이 있을 수 있는데 반복적으로 정의하기 위한 함수이다.
var registerFunction = function(attributeName, type, value, registerCallback, aeCreateCallback, fiwareInfo) {
    // ********************** Container에 등록을 시작한다. ***************************
    requestToAnotherServer( { url : yellowTurtleIP + '/mobius-yt/' + AEName,
        method : 'POST',
        json : true,
        headers : { // Mobius에 Container 등록을 위한 기본 헤더 구조
            'Accept' : 'application/json',
            'locale' : 'ko',
            'X-M2M-RI' : '12345',
            'X-M2M-Origin' : 'Origin',
            'X-M2M-NM' : '' + attributeName[registerCount], // Fiware에서 가져온 attribute이름을 사용한다.(e.g. temperature)
            'content-type' : 'application/vnd.onem2m-res+json; ty=3',
            'nmtype' : 'long'
        },
        body: { // Container를 등록할때 필요한 payload json 구조를 작성한다.
            "containerType": "heartbeat",
            "heartbeatPeriod": "300"
        }
    }, function(error, containerCreateResponse, body) {
        // ********************** containerInstance에 등록을 시작한다. ***************************.
        requestToAnotherServer( { url : yellowTurtleIP + '/mobius-yt/' + AEName + '/'+ attributeName[registerCount],
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
                "contentInfo": type[registerCount],
                "content": value[registerCount]
            }
        }, function(error, contentInstanceResponse, body) {

            if(contentInstanceResponse.statusCode == 201) { // 정상적으로 등록이 다 되었을 때
                if(registerCount < attributeName.length - 1) {
                    registerCount++;
                    // 아직 등록되지 않은 attribute들이 있으므로 registerCallback 함수를 이용하여 나머지 attribute들을 등록한다.
                    registerCallback(attributeName, type, value, registerFunction, aeCreateCallback, fiwareInfo);
                } else {
                    registerCount = 0; // 모두 다 생성 하였으므로 초기화 한다.

                    // 아직 등록되지 않은 Entity(AE)가 있으므로 aeCreateCallback 함수를 다시 호출한다.
                    if(AECount < fiwareInfo.getEntityNameLength( ) - 1) {
                        AECount++;
                        aeCreateCallback(fiwareInfo);
                    } else { // 모든 AE가 등록이 되었을 때 수행하는 부분
                        console.log('*****************************************')
                        console.log("********** All Entity Created ***********");
                        console.log('*****************************************')

                        // 모든 AE의 등록이 끝나고 나서 각 Entity에 대한 Subscription을 ContextBroker에 신청한다.
                        subscriptionToContextBroker(fiwareInfo); // 등록한 EntityID목록을 매개변수로 넘겨준다.
                    }
                }
            } else { // contentInstance의 등록이 실패하였을때 실행하는 부분 주로 409 에러를 발생시킨다.
                console.log('*****************************************')
                console.log("Create Error : " + contentInstanceResponse.statusCode);
                console.log('*****************************************')
            }
        });
    });
};

var subscriptionToContextBroker = function (fiwareInfo) {

    var entityName = fiwareInfo.getEntityName( );
    var entityType = fiwareInfo.getEntityType( );

    var AEName = entityName[subscriptionCount];
    var AEType = entityType[subscriptionCount];

    // Fiware에 접근하여 entityName에 대한 정보를 가지고 온다.
    requestToAnotherServer( { url :  fiwareIP + '/v1/queryContext',
            method : 'POST',
            json : true,
            headers : { // fiware접근에 필요한 기본 헤더의 구조
                'content-type' : 'application/json',
                'Accept' : 'application/json',
                'Fiware-Service' : fiwareService,
                'Fiware-ServicePath' : fiwareServicePath
            },
            body: { // NGSI10에 따른 payload이 구성이다.(queryContext)
                'entities': [
                    {
                        "type": AEType,
                        "isPattern": "false",
                        "id": "" + AEName
                    }
                ]
            }
        }, function (error, fiwareResponse, body) {
            if (!error && fiwareResponse.statusCode == 200) {
                // ContextBroker에서 리턴하는 json구조에 대한 파싱을 시작한다.
                var contextResponses = body.contextResponses
                var contextElement = contextResponses[0].contextElement;
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
                        value[count] = attributes[i].value;
                        count++;
                    }
                }

                requestToAnotherServer({
                    url: fiwareIP + '/v1/subscribeContext',
                    method: 'POST',
                    json: true,
                    headers: { // fiware접근에 필요한 기본 헤더의 구조
                        'content-type': 'application/json',
                        'Accept': 'application/json',
                        'Fiware-Service': fiwareService,
                        'Fiware-ServicePath': fiwareServicePath
                    },
                    body: { // subscription를 등록할때 필요한 payload json 구조를 작성한다.
                        "entities": [
                            {
                                "type": AEType,
                                "isPattern": "false",
                                "id": "" + AEName
                            }
                        ],
                        "attributes": attributeName,
                        "reference": proxyIP + ':' + proxyPort + '/FiwareNotificationEndpoint', // 나중에 endpoint를 지정한다.
                        "duration": "P1M",
                        "notifyConditions": [
                            {
                                "type": "ONTIMEINTERVAL",
                                "condValues": [
                                    "PT1S"
                                    // Fiware에서 notification 하는 주기를 설정한다. PT15S는 15초 마다 Fiware에서 Fi-Proxy로 전달을 한다.
                                    // PT1S로 바꾸면 1초마다 전달된다.
                                ]
                            }
                        ]
                    }
                }, function (error, subscriptionResponse, body) {
                    console.log("FiwareDevice Subscription Success");

                    if(subscriptionCount < fiwareInfo.getEntityNameLength( ) - 1) {
                        // 아직 Subscription 등록할 Entity들이 남아 있으므로 subscriptionToContextBroker 콜백함수를 사용하여 다시 등록한다.
                        subscriptionCount++;
                        subscriptionToContextBroker(fiwareInfo);
                    } else {
                        // 모든 Entity의 Subscription 등록을 마쳤을 때 수행하는 부분.
                        console.log('*****************************************')
                        console.log("******** Subscription All Create ********");
                        console.log('*****************************************');
                    }
                });
            }
    });
}

var getFiwareInfo = function(fiwareInfo){

    var entityName = fiwareInfo.getEntityName( );
    var entityType = fiwareInfo.getEntityType( );

    AEName = entityName[AECount];
    AEType = entityType[AECount];

    console.log('Creating..... ' + AEName + ' / ' + AEType);

    // Fiware에 접근하여 entityName에 대한 정보를 가지고 온다.
    requestToAnotherServer( { url :  fiwareIP + '/v1/queryContext',
        method : 'POST',
        json : true,
        headers : { // fiware접근에 필요한 기본 헤더의 구조
            'content-type' : 'application/json',
            'Accept' : 'application/json',
            'Fiware-Service' : fiwareService,
            'Fiware-ServicePath' : fiwareServicePath
        },
        body: { // NGSI10에 따른 payload이 구성이다.(queryContext)
            'entities': [
                {
                    "type": AEType,
                    "isPattern": "false",
                    "id": "" + AEName
                }
            ]
        }
    }, function (error, fiwareResponse, body) {
        if (!error && fiwareResponse.statusCode == 200) {
            // ContextBroker에서 리턴하는 json구조에 대한 파싱을 시작한다.
            var contextResponses = body.contextResponses
            var contextElement = contextResponses[0].contextElement;
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

            // ********************** AE에 등록을 시작한다. ***************************
            requestToAnotherServer( { url :  yellowTurtleIP + '/mobius-yt',
                method : 'POST',
                json : true,
                headers : { // Mobius에 AE등록을 위한 기본 헤더 구조
                    'Accept' : 'application/json',
                    'locale' : 'ko',
                    'X-M2M-RI' : '12345',
                    'X-M2M-Origin' : 'Origin',
                    'X-M2M-NM' : AEName,
                    'content-type' : 'application/vnd.onem2m-res+json; ty=2',
                    'nmtype' : 'long'
                },
                body : { // NGSI10에 따른 payload이 구성이다.(queryContext)
                    'App-ID': "0.2.481.2.0001.001.000111"
                }
            }, function(error, AECreateResponse, body) {
                console.log("AE create status : " + AECreateResponse.statusCode);
                registerFunction(attributeName, type, value, registerFunction, getFiwareInfo, fiwareInfo);
            });
        }
    });
};

exports.fiwareDeviceRegistration = function(fiwareInfo) {
    fs.readFile('subList.txt', 'utf-8', function (err, data) {
        if (err) {
            console.log("FATAL An error occurred trying to read in the file: " + err);
            console.log("error : set to default for configuration");
        } else {
            var subIdArray = data.split("\n");

            if(subIdArray.length > 0) {
                unsubscription.unsubscriptionFiwareDevice(subIdArray);
                setTimeout(getFiwareInfo(fiwareInfo), 10000);  // Subscription삭제가 끝내면 그때 등록을 시작한다.
            } else {
                getFiwareInfo(fiwareInfo);
            }
        }
    });
}
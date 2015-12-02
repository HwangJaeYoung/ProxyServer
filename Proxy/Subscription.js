/**
 * Created by HwangJaeYoung on 2015-10-14.
 * forest62590@gmail.com
 */

// extract the modules
var requestToAnotherServer = require('request');
var retryCount = 0;

// AE를 생성한 후에 여러개의 attribute들이 있을 수 있는데 반복적으로 업데이트 하기 위한 함수이다.
var updateFunction = function(response, entityName, attributeName, type, value, subscriptionCountPram, updateCallback) {
    var subscriptionCount = subscriptionCountPram;
    console.log('values : ' + attributeName[subscriptionCount] + ', ' + type[subscriptionCount] + ', ' + value[subscriptionCount]);

    var cur_d = new Date();
    var msec = '';

    if((parseInt(cur_d.getMilliseconds(), 10)<10)) {
        msec = ('00'+cur_d.getMilliseconds());
    } else if((parseInt(cur_d.getMilliseconds(), 10)<100)) {
        msec = ('0'+cur_d.getMilliseconds());
    } else {
        msec = cur_d.getMilliseconds();
    }

    var subscriptionID = 'CI' + cur_d.toISOString().replace(/-/, '').replace(/-/, '').replace(/T/, '').replace(/:/, '').replace(/:/, '').replace(/\..+/, '') + msec + randomValueBase64(4);

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
            'X-M2M-NM': subscriptionID, // path_UNIQUE이므로 마이크로초를 이용하여 레코드를 구분한다.
            'content-type': 'application/vnd.onem2m-res+json; ty=4',
            'nmtype': 'long'
        },
        body: { // contentInstance를 등록할때 필요한 payload json 구조를 작성한다.
            "contentInfo": type[subscriptionCount],
            "content": value[subscriptionCount]
        }
    }, function (error, contentInstanceResponse, body) {
        if(typeof(contentInstanceResponse) !== 'undefined') {
            if (contentInstanceResponse.statusCode == '201' || contentInstanceResponse.statusCode == '409') { // 정상적으로 등록이 다 되었을 때
                if (subscriptionCount < attributeName.length - 1) {
                    subscriptionCount++;
                    updateCallback(response, entityName, attributeName, type, value, subscriptionCount, updateFunction);
                } else {
                    subscriptionCount = 0; // 모두 다 업데이트 하였으므로 초기화 한다.
                }
            } else { // 201, 409가 아닌 기타오류 발생시에는 등록을 재시도 한다.
                console.log('StatusCode : ' + contentInstanceResponse.statusCode);
                if (retryCount < 10) { // 최대 retry횟수를 정의한다.
                    console.log('******* Retry update operation to YellowTurtle : ' + retryCount + ' *******');
                    retryCount++;
                    updateCallback(response, entityName, attributeName, type, value, subscriptionCount, updateFunction);
                } else { // 최대 retry 횟수를 초과하였을 때는 종료를 한다.
                    return;
                }
            }
        } else {
            if(error != null) {
                console.log('******* YellowTurtle not response *******' + error.code);
            }
        }
    });
};

exports.updateFiwareInfo = function(request, response){
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
    updateFunction(response, entityName, attributeName, type, value, 0, updateFunction);
};
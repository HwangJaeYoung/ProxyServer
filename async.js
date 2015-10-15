/**
 * Created by Blossom on 2015-10-15.
 */

var async = require('async');

var count = 0;

async.whilst(
    function () { return count < 5; },
    function (fnc) {
        count++;
        console.log(count)
        console.log(typeof(fnc));
        setTimeout(fnc, 1000);
    },
    function (err) {
        console.log("End");
    }
);

var fnc = function(){
    console.log('nyakao ÀÔ´Ï´Ù.');
};



/**
 * Created by Blossom on 2015-12-01.
 */
var fs = require('fs');

fs.appendFile('message2.txt', 'data to append' + '\n', function (err) {
    if (err) throw err;
    console.log('The "data to append" was appended to file!');
});

/*
fs.appendFile('message2.txt', 'akakakakakakakakakakaakakak' + '\n', function (err) {
    if (err) throw err;
    console.log('The "data to append" was appended to file!');

    fs.readFile('message2.txt', 'utf-8', function (err, data) {
        var subIdArray = data.split("\n");
        console.log(subIdArray.length);
    });
}); */
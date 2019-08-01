var config 	= require('./config');
var http = require('http');
var express = require('express');
var fileType = require('file-type');
var readChunk = require('read-chunk');


config.source.base64 = new Buffer(config.source.username + ':' + config.source.password).toString('base64');

var app = express();
app.get('/getimage', function(req, res1) {        
	var https = require("https");
	
	var host = req.query.host;
	var path = req.query.path;
//	var base64 = req.query.base64;
	var base64 = config.source.base64;
	var ftype = req.query.filetype;
	var options = {
	  "method": "GET",
	  "hostname": host, //"sandbox.jiveon.com",
	  "port": null,
	  "path": path, //"/api/core/v3/images/611461",
	  "headers": {
	    "authorization": "Basic "+base64, //bmlrLmVkbWlpZHo6ZmlybWVuaWNoMQ==",
	    "cache-control": "no-cache"
	  }
	};
	
	console.log(options);
	var req = https.request(options, function (res) {
	  var chunks = [];

	  res.on("data", function (chunk) {
	    chunks.push(chunk);
	  });

	  res.on("end", function () {
		var body = Buffer.concat(chunks);
		var mime = ftype;
		if (ftype == "image"){
	    		var file_type = fileType(body);
			mime = file_type.mime;
		}
		res1.writeHead(200, {
		  'Content-Type': mime,
		  //'Content-Disposition': 'attachment; filename=some_file.pdf',
		  'Content-Length': body.length
		});
		res1.end(body);
	  });
	});
	req.end();
    });


var server = app.listen(8080, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
});

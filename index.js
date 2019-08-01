var config 	= require('./config');
var async 	= require('async');
var q		= require('q');
var https 	= require('https');
var DomParser = require('dom-parser');
var parser = new DomParser();
var retryCount = 0;

	config.source.BasicAuth      = 'Basic ' + new Buffer(config.source.username + ':' + config.source.password).toString('base64');
	config.destination.BasicAuth = 'Basic ' + new Buffer(config.destination.username + ':' + config.destination.password).toString('base64');
	config.source.base64 = new Buffer(config.source.username + ':' + config.source.password).toString('base64');

function startJiveToJiveMigration() {
	//Get the place id for source and destinations
	getPlaceIds(config.source.placeUrl, config.destination.placeUrl).then(function(success){
		console.log('great!! the source and destination found');
		//console.log(config);
		startMigration().then(function(success){
			console.log('All Done! Go and check the destination place!');
		})
	})
}


function startMigration(){
	var d = q.defer();
	//Get Data from Source
	var searchURL = '/api/core/v3/contents?filter=place(/places/'+config.source.placeId+')&includeBlogs=true'
	var sourceOpt = getAuthData('source', searchURL);	

	requestData(sourceOpt).then(function(sourceContents){
		async.eachSeries(sourceContents.list, function(content, callback){
				var destBlogOpt = getAuthData('destination', '/api/core/v3/places/'+config.destination.blogContainer+'/contents');
				var destinOpt 	= getAuthData('destination', '/api/core/v3/places/'+config.destination.placeId+'/contents');		
				console.log(content.subject);
			//if (content.subject == "This is my first blog post"){
				var embeddedImages = [];
				var dom = parser.parseFromString(content.content.text);			
				var images = dom.getElementsByTagName('img');
				for (var i in images){
	       			var imgSrc = findImgSrc(images[i].attributes);
	       			if (imgSrc != "") {
	       				embeddedImages.push({
	       					orgimg:imgSrc, 
	       					imgid:findImgId(imgSrc), 
	       					type:"embeddedImage", 
	       					filetype:"image/"+imgSrc.split('.').pop(), 
	       					name:imgSrc.split('/').pop()
	       				});
	       			}
	       		}

	       		var attachments = [];
	       		if (content.hasOwnProperty('attachments')){
	       			for (var i in content.attachments){
	       				attachments.push({
	       					orgimg:content.attachments[i].url, 
	       					imgid:content.attachments[i].url.split(config.source.basicUrl)[1], 
	       					type:"attachment", 
	       					filetype:content.attachments[i].contentType, 
	       					name:content.attachments[i].name
	       				});	       				
	       			}
	       		}

	       		if (content.type == "file"){
	       			//Only one attachment is allowed in file, so make the embedded images and attachment empty
	       			attachments = [];
	       			embeddedImages = [];
	       			var file = content.binaryURL.split(config.source.basicUrl)[1];
	       			attachments.push({
	       				orgimg:file, 
	       				imgid:file,
	       				type:'file', 
	       				filetype :content.contentType,
	       				name: content.name
	       			});					
	       		}

	       		removeUnusedProps(content, ['banner', 'resources', 'author', 'parentPlace', 'contentImages', 'authors', 'binaryURL']);
	       		if (content.type != "poll"){
	       			content.attachments = makeAttachments(embeddedImages.concat(attachments));
	       		}
				var options = (content.type =="post") ? destBlogOpt : destinOpt;	

				var postdata = JSON.stringify(content);
					options.method = "POST";				
					console.log('data ready for document creation');
					
					//console.log(content);
					console.log("content.type", content.type);
					console.log("=====================");


					requestData(options, postdata).then(function(res){
						//console.log("document is created", res);
						if (res == "Error"){
							console.log('this document had issue::', content.subject, res)
							callback(null, res);
							//There was some issue with this doucment, go and create next one
						} else {
							if (embeddedImages.length == 0){
								console.log('no need to update the document');
								callback(null, res);
							} else {
								//console.log('updating the doucment', res);
								var postdata = JSON.stringify(res);
									if (res.hasOwnProperty('attachments')){
										postdata = updateImagesPath(postdata, embeddedImages, res.attachments);	
									}
									options.method = "PUT";
									options.path = res.resources.self.ref.split(config.destination.basicUrl).pop();
									requestData(options, postdata).then(function(res){
										console.log('document updated')
										callback(null, res);
									})
							}
						}								
				})
			//} else {callback(null, 'res');}		
		}, 
		function(){
			d.resolve(true);
		})
	})
	return d.promise;
}

function removeUnusedProps(obj, props){
	for(var i in props){
		if (obj.hasOwnProperty(props[i])){
			delete obj[props[i]]
		}
	}
}


function findImgId(img){
	var imgid = "";
	if (img.indexOf('downloadImage/') != -1){
		imgid = img.split('downloadImage/')[1].split('/')[0];
		if (imgid.indexOf('-') != -1){
			imgid = imgid.split('-');
			imgid = imgid[imgid.length-1];
		}
	}
	return imgid;
}

function findImgSrc(attrs){
    for(var i in attrs){
        if (String(attrs[i].name).toLowerCase() == 'src'){
            return attrs[i].value;
        }
    }
    return '';
}

function updateImagesPath(postdata, embeddedImages, attachments){
	for(var i=0; i<embeddedImages.length; i++){
		for (var j=0; j<attachments.length; j++){
			if(embeddedImages[i].name == attachments[j].name){
				//console.log("image matched ", i)
				//console.log("found", embeddedImages[i].orgimg, postdata.indexOf(embeddedImages[i].orgimg))
				postdata = postdata.split(embeddedImages[i].orgimg).join(attachments[j].url);
				//console.log("replaced", attachments[j].url, postdata.indexOf(attachments[j].url))	
			}			
		}		
	}
	return postdata;
}

function makeAttachments(imagesArr){
	var attachments = []	
	for (let i = 0; i < imagesArr.length; i++) {
		var host = config.source.basicUrl;
		var base64 = config.source.base64;

		if (imagesArr[i].type == "embeddedImage"){
			var path = "/api/core/v3/images/"+imagesArr[i].imgid;			
		} else {
			var path = imagesArr[i].imgid;	
		}		
		attachments.push({
			"name" : imagesArr[i].name, 
			"contentType" : imagesArr[i].filetype, 
			"doUpload": true, 
			"url": config.proxyurl+"?host="+host+"&path="+path+"&base64="+base64+"&filetype="+imagesArr[i].filetype})
	}	
	return attachments;
}


function getPlaceIds(sourceURL, destinationURL){
	var d = q.defer();
	var sourcedata = getAuthData('source');	
	requestData(sourcedata).then(function(source){
		if (source.list.length < 1){
			console.log('source not found');
			d.reject('source place not found')
		}else{
			for(var i=0; i<source.list.length; i++){
				if(source.list[i].resources.html.ref == sourceURL){
					config.source.placeId = source.list[i].placeID;
				}
			}

			if (config.source.placeId == 0){
				console.log('source not found 1');
				d.reject('source place not found');
			} else {
				//Checking the destination id
				var destinationdata = getAuthData('destination');	
				requestData(destinationdata).then(function(destination){				
					if (destination.list.length < 1){
						console.log('destination not found');
						d.reject('destination place not found')
					} else {
						for(var i=0; i<destination.list.length; i++){
							if (destination.list[i].resources.html.ref == destinationURL){
								config.destination.placeId = destination.list[i].placeID;
								config.destination.blogContainer = destination.list[i].resources.blog.ref.split("/").pop();							}
						}

						if (config.destination.placeId == 0){
							console.log('destination not found 1');
							d.reject('destination place not found');
						} else {
							d.resolve(true);
						}
					}
				})
			}
		}	
	})	
	return d.promise;
}

function requestData(data, postdata = ""){
	var d = q.defer();	
	var req = https.request(data, function(res) {
		    res.setEncoding('utf8');
            var str = '';
            res.on('data', function (chunk) {
                 str += chunk;
            });            
            res.on('end', function () {
            	//console.log('end', str);
            	try {
            		str = JSON.parse(str);
            		if (str.hasOwnProperty("error")){
            			console.log(str);
            			d.resolve("Error");
            		} else {
            			d.resolve(str);
            		}                 	
            	} catch (e){ 
            			console.log("error found here", str)        		
            			d.resolve("Error");
            	}
                 
            }, function (error) {
            	 console.log(error);
                 d.resolve("Error");
            });
         });
		 if (postdata != ""){
		 	console.log("writting data");
		 	req.write(postdata);
		 }
         req.end();
	     req.on('error', function(e) {
	         console.log('Error getting data');
	         console.log(e);
	     });
		return d.promise;
}


function getAuthData(theEnv, thePath=""){
	 var env = config[theEnv];
	 var placeName = env.placeUrl.split("/").pop();
	 var search = "/api/core/v3/search/places?filter=search("+placeName+")&count=100";
     var options = {
         hostname: env.basicUrl,
         path: (thePath == "") ? search: thePath,
         port: 443,
         method: "GET",
		"X-Jive-Add-Api-Uris": "true",
         headers: {         	
	        "Authorization": env.BasicAuth,
            "Content-Type": "application/json;"            
        }
	};
	return options;
}

// Here is the starting point
startJiveToJiveMigration();
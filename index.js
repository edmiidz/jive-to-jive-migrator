var config 		= require('./config');
var async 		= require('async');
var q			= require('q');
var https 		= require('https');
var DomParser 	= require('dom-parser');
var mysql       = require('mysql');
var parser 		= new DomParser();
var dbdata 	 	= [];
var videos		= [];

config.source.BasicAuth      = 'Basic ' + new Buffer(config.source.username + ':' + config.source.password).toString('base64');
config.destination.BasicAuth = 'Basic ' + new Buffer(config.destination.username + ':' + config.destination.password).toString('base64');
config.source.base64 = new Buffer(config.source.username + ':' + config.source.password).toString('base64');


// Insert or Update the data in the database
if (config.database.usedatabase) {
	var connection = mysql.createConnection({
        host     : config.database.host,
        user     : config.database.user,
        password : config.database.password,
        database : config.database.database,
        port     : config.database.port,
    });
}

function db_insert_data(source_contentID, dest_contentID, action){
	var d = q.defer();
	if(!config.database.usedatabase || action != 'insert'){
		d.resolve('');
	} else {	
		console.log('Inserting record')	
		// For now we are just inserting the data 
		if (action == 'insert'){
			var sql = 'INSERT INTO `'+config.database.table+'` (`place_id`, `source_contentID`, `dest_contentID`) VALUES ('+config.destination.placeId+', '+source_contentID+', '+dest_contentID+' )';
		}
		connection.query(sql, function(err, result) {
	      if (err) throw err;
	      d.resolve(result);
	    });
	}
    return d.promise;
}

function db_select_data(placeid){
	if(!config.database.usedatabase){return};
	
	var d = q.defer();
	var sql = 'SELECT * FROM `'+config.database.table+'` where place_id='+placeid;
	connection.query(sql, function(err, result) {
      if (err) throw err;
      d.resolve(result);
    });
    return d.promise;
}

function db_update_data(data){
	if(!config.database.usedatabase){return};
	
	var d = q.defer();
	var sql = 'UPDATE `'+connection.table+'` SET `place_id` = '+data.placeid+', `content_id` = '+data.contentID+' WHERE `migrator_data`.`id` = 1';
	connection.query(sql, function(err, result) {
      if (err) throw err;
      d.resolve(result);
    });
    return d.promise;
}

/*function db_delete_data(id){
	if(!config.database.usedatabase){return};
	
	var d = q.defer();
	var sql = 'DELETE FROM `migrator_data` WHERE `migrator_data`.`id` = '+id;
	connection.query(sql, function(err, result) {
      if (err) throw err;
      d.resolve(result);
    });
    return d.promise;
}*/




/*console.log(connection);
process.exit();*/

function startJiveToJiveMigration() {
	//Get the place id for source and destinations
	getPlaceIds(config.source.placeUrl, config.destination.placeUrl).then(function(success){
		console.log('great!! the source and destination found');
		console.log("source place id = "+config.source.placeId)
		console.log("destination place id = "+config.destination.placeId)
		//console.log(config);
		db_select_data(config.destination.placeId).then(function(data){
			dbdata = data;
			//console.log('dbdata =', dbdata)
			startMigration().then(function(success){
				console.log('All Done! Go and check the destination place!');
				console.log('now upload videos')
				//console.log(videos)
				createVideos();
			})
		})
	})
}


function createVideos(){
	console.log('createVideos')
	//var d = q.defer();
	var options 		= getAuthData('destination', '/api/core/v3/places/'+config.destination.placeId+'/contents');
	var optionsource	= getAuthData('source');		
	async.eachSeries(videos, function(video, callback){
		optionsource.path = video.resources.downloadOptions.ref.split(config.source.basicUrl)[1]
		requestData(optionsource, "").then(function(res){
			var bestQVideo = res.assets.pop();
			//console.log('bestQVideo = ', bestQVideo.downloadUrl);
			var content = {};
			content.subject = video.subject;
			content.content = video.content;
	     	content.type = 'video'
			content.attachment = [{
	            "name" : res.displayName, 
	            "contentType" : "video/"+res.container, 
	            "doUpload": true, 
	            "url": bestQVideo.downloadUrl
	        	}]

	       var postdata = JSON.stringify(content);
			   options.method = "POST";

			   //console.log(postdata);
			   //console.log(options);

			   requestData(options, postdata).then(function(res){
			   	console.log('video created', res.resources);
			   	callback(null, res)
			   	//process.exit();
			   })

		})
	},
	function done(){
		console.log("All Videos done");
		process.exit();
	})	
	
}

function startMigration(){
	var d = q.defer();
	var startIndex = 0;
	var count = 25;
	var next_page = '/api/core/v3/contents?filter=place(/places/'+config.source.placeId+')&includeBlogs=true&startIndex'+startIndex+'&count='+count;
	//Get Data from Source
		async.doWhilst(function(callback1) {
			var sourceOpt = getAuthData('source', next_page);
			requestData(sourceOpt).then(function(sourceContents){
				if (sourceContents.list.length == 0){
					console.log('List is empty')
					//callback1(null, sourceContents);
					console.log('Done!!');
        			d.resolve(true);
				}

				async.eachSeries(sourceContents.list, function(content, callback){
					console.log("=====================");
					var destBlogOpt = getAuthData('destination', '/api/core/v3/places/'+config.destination.blogContainer+'/contents');
					var destinOpt 	= getAuthData('destination', '/api/core/v3/places/'+config.destination.placeId+'/contents');		
					console.log(content.subject);
				if (content.type != "video" && content.subject == "hhjhkhkj"){
					//console.log(content)
					var embeddedImages = [];
					var dom = parser.parseFromString(content.content.text);			
					var images = dom.getElementsByTagName('img');
					for (var i in images){
		       			var imgSrc = findImgSrc(images[i].attributes);
		       			if (imgSrc != "") {
		       				var _imgid = findImgId(imgSrc);
		       				//console.log('_imgid', _imgid);
		       				//console.log('imgSrc', imgSrc)
		       				embeddedImages.push({
		       					orgimg 	: imgSrc, 
		       					imgid 	: _imgid, //(_imgid != "") ? _imgid : imgSrc.split(config.source.basicUrl)[1], 
		       					type 	: (_imgid != "") ? "embeddedImage" : "embeddedImage_", 
		       					filetype: (_imgid != "") ? "image/"+imgSrc.split('.').pop() : 'image/png', 
		       					name 	: (_imgid != "") ? imgSrc.split('/').pop() : 'attachment_image.png'
		       				});
		       			}
		       		}
					console.log('embeddedImages', embeddedImages)

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

		       		if (content.type == "file" || content.type == "photo"){
		       			//Only one attachment is allowed in file, so make the embedded images and attachment empty
		       			attachments = [];
		       			embeddedImages = [];
		       			// trying to handle [square brackets] in file names
		       			//var filename = encodeURI(content.name);
		       			var filename = content.name;
		       			var file = content.binaryURL.split(config.source.basicUrl)[1];
		       			attachments.push({
		       				orgimg:file, 
		       				imgid:file,
		       				type:'file', 
		       				filetype :content.contentType,
		       				name: filename
		       			});					
		       		}

		       		removeUnusedProps(content, ['banner', 'resources', 'author', 'parentPlace', 'contentImages', 'attachments' ,'parent' ,'authors', 'binaryURL']);
		       		if (content.type != "poll"){
		       			content.attachments = makeAttachments(embeddedImages.concat(attachments));
		       		}

		       		console.log('content.attachments', content.attachments);

		       		//console.log('content.attachments = ', content.attachments)
		       		/*process.exit();*/
					var options = (content.type =="post") ? destBlogOpt : destinOpt;
					content.parent = ('https://'+ config.destination.basicUrl + options.path).split("/contents").join("");
					console.log('content.parent',content.parent);
					/*process.exit();	*/

					var postdata = JSON.stringify(content);
						options.method = "POST";				
						console.log('data ready for document creation');
						
						//console.log(content);
						console.log("content.type", content.type);
						//console.log("content.type", content.attachments);
						var dbaction = 'insert';
						var db_contentIDs = get_db_contentID(content.contentID);
						if (db_contentIDs.source_contentID != 0){
							var dbaction = 'update';
							console.log("this content already exist, so updating")
							options.method = "PUT";
							options.path = "/api/core/v3/contents/"+db_contentIDs.dest_contentID;
						}else {
							console.log("this content does not exist, so inserting")
						}	
						
						//console.log("options = ", options)
						//console.log("postdata = ",postdata)
						requestData(options, postdata).then(function(res){
							//console.log("document is created", res);
							if (res == "Error"){
								console.log('this document had issue::', content.subject, res)
								callback(null, res);
								//There was some issue with this doucment, go and create next one
							} else {
								db_insert_data(content.contentID, res.contentID, dbaction).then(function(){
									if (embeddedImages.length == 0){
										console.log('no need to update the document');
										console.log('==========================');
										callback(null, res);
									} else {
										//console.log('updating the doucment', res);
										var postdata = JSON.stringify(res);
											
											// a link that opens the image in lightbox						       		
								       		var dom = parser.parseFromString(res.content.text);

								       		var imglinks = dom.getElementsByTagName('a');
								       		//console.log("imglinks = ", imglinks);
								       		var imageLinks = [];
											for (var i in imglinks){
												var ahref = findLinkHref(imglinks[i].attributes);
												//console.log('asdfasdf=',decodeURIComponent(ahref));					
												if (ahref != "") {
													imageLinks.push({
														orgimg: ahref,
														name:decodeURIComponent(ahref).split('/').pop()							
													})
												}
											}
											//console.log("imageLinks = ", imageLinks);
											if (res.hasOwnProperty('attachments')){
												postdata = updateImagesPath(postdata, embeddedImages, res.attachments, imageLinks);	
											}
											options.method = "PUT";
											options.path = res.resources.self.ref.split(config.destination.basicUrl).pop();
											requestData(options, postdata).then(function(res){
												console.log('document updated');
												console.log('==========================');
												callback(null, res);
											})
									}
								})
							}								
					})
				} else {					
						videos.push(content);
						callback(null, 'res');
				}		
			}, 
			function(){
				console.log('first loo is done', sourceContents.links.next);
				//d.resolve(true);
				//loop done for one set of data
				if(typeof sourceContents.links.next == 'undefined' || sourceContents.list.length < count) {
                    next_page = false;
                } else {
                	startIndex++;
                    next_page = sourceContents.links.next;
                    //sourceOpt.path = next_page;
                }
                callback1(null, sourceContents);
			});
		//each serease ends here
		});
		//request data ends here
	}, function () {
        console.log(next_page !== false, 'Step 2 -> CHECK - next_page = ' + next_page);
        return next_page !== false;
    }, function done() {
        console.log('Done!!');
        d.resolve(true);
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

function findLinkHref(attrs){
    for(var i in attrs){
        if (String(attrs[i].name).toLowerCase() == 'href'){
            return attrs[i].value;
        }
    }
    return '';
}

function get_db_contentID(contentID){
	console.log("contentID = ", contentID)
	var content = dbdata.find(function(item){
		return item.source_contentID == contentID;
	})
	return (typeof content == 'undefined')? {source_contentID:0, dest_contentID:0} : content;
}

function updateImagesPath(postdata, embeddedImages, attachments, imageLinks){
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
	//console.log(postdata);
	// Change the hyperlinks
	for(var i=0; i<imageLinks.length; i++){
		for (var j=0; j<attachments.length; j++){
			if(imageLinks[i].name == attachments[j].name){
				//console.log("image matched ", i)
				//console.log("found", imageLinks[i].orgimg, postdata.indexOf(imageLinks[i].orgimg))
				//postdata = postdata.split(imageLinks[i].orgimg).join(attachments[j].url.split("showImage").join());
				postdata = postdata.split("href='"+imageLinks[i].orgimg+"'").join("");
				postdata = postdata.split('href="'+imageLinks[i].orgimg+'"').join("");
				//console.log("replaced", attachments[j].url, postdata.indexOf(attachments[j].url))	
			}			
		}		
	}
	return postdata;
}

function makeAttachments(imagesArr){
	var attachments = []	
	for (let i = 0; i < imagesArr.length; i++) {
		var static_image = false;
		var host = config.source.basicUrl;
		var base64 = config.source.base64;

		if (imagesArr[i].type == "embeddedImage" && imagesArr[i].imgid != "" /*&& imagesArr[i].orgimg.indexOf('/v3/attachments/') == -1*/){
			var path = "/api/core/v3/images/"+imagesArr[i].imgid;			
		} else {
			var path = imagesArr[i].imgid;	
			if (imagesArr[i].orgimg.indexOf("/statics/") != -1){
				path = imagesArr[i].orgimg;
				static_image = true;
			}
			if (imagesArr[i].orgimg.indexOf("/attachments/") != -1){
				path = imagesArr[i].orgimg;
			}

		}
		if (static_image && config.ignore_static_images){
			continue;
		}	
		attachments.push({
			"name" : imagesArr[i].name, 
			"contentType" : imagesArr[i].filetype, 
			"doUpload": true, 
			"url": config.proxyurl+"?host="+host+"&path="+path+"&filetype="+imagesArr[i].filetype})
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
	//console.log(data)
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
            			console.log("error found here", e, str)        		
            			d.resolve("Error");
            	}
                 
            }, function (error) {
            	 console.log(error);
                 d.resolve("Error");
            });
         });
		 if (postdata != ""){
		 	console.log("writing data");
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
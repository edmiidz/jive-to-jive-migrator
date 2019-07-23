var config 	= require('./config.example');
var async 	= require('async');
var q		= require('q');
var https 	= require('https');

	config.source.BasicAuth      = 'Basic ' + new Buffer(config.source.username + ':' + config.source.password).toString('base64');
	config.destination.BasicAuth = 'Basic ' + new Buffer(config.destination.username + ':' + config.destination.password).toString('base64');


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
	
	var destinOpt 	= getAuthData('destination', '/api/core/v3/places/'+config.destination.placeId+'/contents');		
	var destBlogOpt = getAuthData('destination', '/api/core/v3/places/'+config.destination.blogContainer+'/contents');

	requestData(sourceOpt).then(function(sourceContents){		
		async.eachSeries(sourceContents.list, function(content, callback){
			var options = (content.type =="post") ? destBlogOpt : destinOpt;

			var postdata = JSON.stringify(content);
				options.method = "POST";			
				requestData(options, postdata).then(function(res){
					callback(null, res);				
				})
		}, 
		function(){
			d.resolve(true);
		})
	})
	return d.promise;
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
					}else{
						for(var i=0; i<destination.list.length; i++){
							if(destination.list[i].resources.html.ref == destinationURL){
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
                 str = JSON.parse(str);
                 d.resolve(str);
            }, function (error) {
                 console.log('Error defer reject at sendData');
                 d.reject(new Error(error));
            });
         });
		 if (postdata != ""){
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
         headers: {
	        "Authorization": env.BasicAuth,
            "Content-Type": "application/json;"
        }
	};
	return options;
}

// Here is the starting point
startJiveToJiveMigration()
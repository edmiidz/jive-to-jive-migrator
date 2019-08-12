// Jive Source configuration
 config = {}
 // if your content has false static images path, keep the following config to true, other wise thouse contents will not be migrated 
 config.ignore_static_images = true;
 config.proxyurl = ""; // the proxy url that will help to move the media files from one instance to another 

 config.source = {
     basicUrl          : '', // without http/https (https://abc.com should be abc.com)
     username          : '',
     password          : '',
     placeUrl          : '', // complete path (including https)
     placeId           : 0  // Do not change this
  };
 
// Jive Destination configuration
config.destination = {
    basicUrl          : '', // without http/https (https://abc.com should be abc.com)
    username          : '',
    password          : '',
    placeUrl          : '', // complete path (including https)
    placeId           : 0  // Do not change this 
};

// Database configuration
config.database = {
     usedatabase      : true,
     host             : "localhost",
     database         : "jive_jive_migrator",
     user             : "root",
     password         : "",
     table            : "migrator_data"
}

 module.exports = config;
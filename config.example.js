// Jive Source configuration
 config = {}
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

 module.exports = config;
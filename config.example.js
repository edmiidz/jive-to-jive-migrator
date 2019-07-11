
var config = {
    urlType              : 'https://',
    apiCore              : '/api/core/v3/',
    peopleUrl            : '/api/core/v3/people',
    placeUrl             : '/api/core/v3/places',
    contentUrl           : '/api/core/v3/contents',
    membersUrl           : '/api/core/v3/members',
    imagesUrl            : '/api/core/v3/images'
};

//Jive instances

config.source = {
    username         : '', //username
    password         : '', //password
    basicUrl         : '', //prod.jiveon.com/
    placeUrl         : '', //Jive Place URL
};

config.destination = {
    username         : '', //username
    password         : '', //password
    basicUrl         : '', //sandbox.jiveon.com/
    placeUrl         : '', //Jive Place URL
};


//Mysql connection
config.connection = {
    host     : '',
    database : '',
    user     : '',
    password : '',
    port     : ''
};

//Mysql tables
config.tables = {
    source_content  : 'source_content'
};

module.exports = config;
// Body Parsing Tests
 
var assert = require('assert'),
http = require('http'),
vows = require('vows'),
request = require('request'),
director = require('../../../lib/director');

function helloWorld(id) {
  this.res.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  this.res.end(typeof this.req.body);
}

var bufferBody;

function createServer (router) {
  return http.createServer(function (req, res) {
    req.body = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
      req.body += chunk;
    });
    req.on('end', function(){
      router.dispatch(req, res, function (err) {
        if (err) {
          res.writeHead(404);
          res.end();
        }
      });
    });
        
  });
}


vows.describe('director/server/http/bodyParsing').addBatch({
  "An instance of director.http.Router": {
    "instantiated with a Routing table with body parsing": {
      topic: new director.http.Router({
        '/': {
          get: helloWorld
        }
      }).configure({
        parseBody : true
      }),
      "should have the correct routes defined": function (router) {
        assert.isObject(router.routes);
        assert.isFunction(router.routes.get);
      },
      "when passed to an http.Server instance": {
        topic: function (router) {
          var server = createServer(router),
          that = this;
              
          server.listen(9090, this.callback);
        },
        "a request to /": {
          topic: function () {
            request({
              uri: 'http://localhost:9090/',
              json : {
                me:'I am the body'
              }
            }, this.callback);
          },
          "should respond with Object": function (err, res, body) {
            assert.isNull(err);
            assert.equal(res.statusCode, 200);
            assert.equal(body, 'object');
          }
        }
      }
    }, 
    "instantiated with a Routing table without body parsing": {
      topic: new director.http.Router({
        '/': {
          get: helloWorld
        }
      }).configure({
        parseBody : false
      }),
      "should have the correct routes defined": function (router) {
        assert.isObject(router.routes);
        assert.isFunction(router.routes.get);
      },
      "when passed to an http.Server instance": {
        topic: function (router) {
          var server = createServer(router),
          that = this;
              
          server.listen(9091, this.callback);
        },
        "a request to /": {
          topic: function () {
            request({
              uri: 'http://localhost:9091/',
              json : {
                me:'I am the body'
              }
            }, this.callback);
          },
          "should respond with string": function (err, res, body) {
            assert.isNull(err);
            assert.equal(res.statusCode, 200);
            assert.equal(body, 'string');
          }
        }
      }
    }
  }
}).export(module);
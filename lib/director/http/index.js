
var events = require('events'),
    qs = require('querystring'),
    util = require('util'),
    director = require('../../director'),
    responses = require('./responses');

//
// ### Expose all HTTP methods and responses
//
exports.methods   = require('./methods');
Object.keys(responses).forEach(function (name) {
  exports[name] = responses[name];
})

//
// ### function Router (routes)
// #### @routes {Object} **Optional** Routing table for this instance.
// Constuctor function for the HTTP Router object responsible for building 
// and dispatching from a given routing table.
//
var Router = exports.Router = function (routes) {
  //
  // ### Extend the `Router` prototype with all of the RFC methods.
  //
  this.params   = {};
  this.routes   = {};
  this.methods  = ['on', 'after', 'before'];
  this.scope    = [];
  this._methods = {};
  this.recurse = 'backward';
  
  this.extend(exports.methods.concat(['before', 'after']));
  this.configure();
  this.mount(routes || {});
};

//
// Inherit from `director.Router`.
//
util.inherits(Router, director.Router);

//
// ### function on (method, path, route)
// #### @method {string} **Optional** Method to use 
// #### @path {string} Path to set this route on.
// #### @route {Array|function} Handler for the specified method and path.
// Adds a new `route` to this instance for the specified `method`
// and `path`.
//
Router.prototype.on = function (method, path) {
  var args = Array.prototype.slice.call(arguments, 2),
      route = args.pop(),
      options = args.pop();
  
  if (options && options.stream) {
    route.stream = true;
  }
  
  director.Router.prototype.on.call(this, method, path, route);
};

//
// ### function dispatch (method, path)
// #### @req {http.ServerRequest} Incoming request to dispatch.
// #### @res {http.ServerResponse} Outgoing response to dispatch.
// #### @callback {function} **Optional** Continuation to respond to for async scenarios. 
// Finds a set of functions on the traversal towards
// `method` and `path` in the core routing table then 
// invokes them based on settings in this instance.
//
Router.prototype.dispatch = function (req, res, callback) {
  //
  // Dispatch `HEAD` requests to `GET`
  //  
  var method = req.method === 'HEAD' ? 'get' : req.method.toLowerCase(),
      fns = this.traverse(method, req.url, this.routes, ''),
      self = this,
      runlist,
      stream;
  
  if (!fns || fns.length === 0) {
    if (callback) {
      callback(new Error('Could not find path: ' + req.url));
    }
    return false;
  }
  
  if (this.recurse === 'forward') {
    fns = fns.reverse();
  }
  
  runlist = this.runlist(fns);
  
 this.invoke(runlist, { req: req, res: res }, callback);
 return true;
};



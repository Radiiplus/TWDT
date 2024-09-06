const xss = require('xss');

const globalMiddleware = [];
const endpointMiddleware = {
  'signup': async (req, rep) => {},
  'login': async (req, rep) => {},
  'validate': async (req, rep) => {},
  'check': async (req, rep) => {},
  'user': async (req, rep) => {},
  'analytic': async (req, rep) => {},
  'message': async (req, rep) => {},
  'message-delete': async (req, rep) => {}
};

const addGlobalMiddleware = middleware => globalMiddleware.push(middleware);

const addEndpointMiddleware = (tag, middleware) => endpointMiddleware[tag] = middleware;

addGlobalMiddleware(async (req, rep) => {
  if (['POST', 'GET'].includes(req.method) && req.body) {
    req.body = sanitizeObject(req.body);
  }
});

const sanitizeObject = obj => {
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object') {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
  }
  return obj;
};

Object.keys(endpointMiddleware).forEach(tag => addEndpointMiddleware(tag, endpointMiddleware[tag]));

const applyMiddleware = fastify => fastify.addHook('onRequest', async (req, rep) => {
  if (!req.url.startsWith('/static/') && !req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
    await Promise.all([
      ...globalMiddleware.map(mw => mw(req, rep)),
      endpointMiddleware[req.routeOptions?.config?.tag]?.(req, rep)
    ]);
  }
});

module.exports = { applyMiddleware, addGlobalMiddleware, addEndpointMiddleware };

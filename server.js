const Fastify = require('fastify');
const path = require('path');
const fs = require('fs').promises;
const pino = require('pino');
const fastifyCookie = require('fastify-cookie');
const easyWaf = require('easy-waf').default;
const hpp = require('hpp');
const xssClean = require('xss-clean');
const DOMPurify = require('isomorphic-dompurify');
const { applyMiddleware } = require('./module/middlware');

const fastify = Fastify({
  logger: pino({
    level: 'info',
    transport: { target: 'pino-pretty', options: { colorize: true, translateTime: true } }
  })
});

applyMiddleware(fastify);

const wafMiddleware = easyWaf({
  allowedHTTPMethods: ['GET', 'POST'],
  queryUrlWhitelist: ['riffconnect.web.app'],
  modules: { directoryTraversal: { enabled: true, excludePaths: /^\/exclude$/i } },
  dryMode: true
});

const hppMiddleware = hpp();
const xssCleanMiddleware = xssClean();
const sanitize = (req) => { req.body = DOMPurify.sanitize(req.body); };

fastify.register(fastifyCookie);
fastify.register(require('@fastify/static'), { root: path.join(__dirname, 'public') });

fastify.addHook('onRequest', async (req, reply) => {
  wafMiddleware(req.raw, reply.raw, () => {});
  hppMiddleware(req.raw, reply.raw, () => {});
  xssCleanMiddleware(req.raw, reply.raw, () => {});
  sanitize(req);
});

fastify.get('/', (req, reply) => reply.sendFile('index.html'));

fastify.get('/:page', async (req, reply) => {
  try {
    await fs.access(path.join(__dirname, 'public', `${req.params.page}.html`));
    return reply.type('text/html').sendFile(`${req.params.page}.html`);
  } catch {
    return reply.redirect('/404');
  }
});

fastify.get('/404', (req, reply) => reply.status(404).sendFile('404.html'));
fastify.setNotFoundHandler((req, reply) => reply.redirect('/404'));

['signup', 'login', 'check', 'validate', 'user', 'chat', 'sse', 'logout', 'analytic'].forEach(endpoint => {
  fastify.register(require(`./endpoints/${endpoint}`), { prefix: '/access' });
});

(async () => {
  try {
    await fastify.listen({ port: 5000, host: '0.0.0.0' });
    fastify.log.info('Server listening at http://localhost:5000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();

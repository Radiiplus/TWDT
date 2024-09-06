const { getItem } = require('../module/supabase');

const checkHandler = async (request, reply) => {
  const { email, username } = request.body;

  try {
    if (email) {
      const existingEmail = await getItem('users', 'email', email);
      return reply.send({
        exists: !!existingEmail,
        type: 'email',
        message: existingEmail ? 'Email already exists.' : 'Email does not exist.'
      });
    }

    if (username) {
      const lowerUsername = username.toLowerCase();
      const existingUser = await getItem('users', 'username', lowerUsername);
      return reply.send({
        exists: !!existingUser,
        type: 'username',
        message: existingUser ? 'Username already exists.' : 'Username does not exist.'
      });
    }

    return reply.status(400).send({
      success: false,
      message: 'Please provide either an email or a username.'
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      message: error.message
    });
  }
};

module.exports = async (fastify, opts) => {
  fastify.post('/check', { config: { tag: 'check' }, handler: checkHandler });
  console.log('Server started: /check route registered.');
};

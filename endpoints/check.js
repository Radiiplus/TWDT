const { getItem } = require('../module/supabase');

const sanitizeInput = (input) => {
  return input.replace(/\s+/g, '').toLowerCase();
};

const isValidUsername = (username) => {
  const usernamePattern = /^[a-zA-Z0-9]+$/;
  return usernamePattern.test(username);
};

const checkHandler = async (request, reply) => {
  const { email, username } = request.body;

  try {
    if (email) {
      const sanitizedEmail = sanitizeInput(email);
      const existingEmail = await getItem('users', 'email', sanitizedEmail);
      return reply.send({
        exists: !!existingEmail,
        type: 'email',
        message: existingEmail ? 'Email already exists.' : 'Email does not exist.'
      });
    }

    if (username) {
      const sanitizedUsername = sanitizeInput(username);

      if (!isValidUsername(sanitizedUsername)) {
        return reply.status(400).send({
          success: false,
          message: 'Username can only contain letters and numbers.'
        });
      }

      const existingUser = await getItem('users', 'username', sanitizedUsername);
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

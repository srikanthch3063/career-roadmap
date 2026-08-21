const jwt = require('jsonwebtoken');

const token = jwt.sign({ sub: '123' }, 'secret', { algorithm: 'HS256' });
try {
  jwt.verify(token, 'wrongsecret', { algorithms: ['RS256'] });
} catch(e) {
  console.log('Error 1:', e.message);
}

try {
  jwt.verify(token, 'wrongsecret');
} catch(e) {
  console.log('Error 2:', e.message);
}

const rsToken = jwt.sign({ sub: '123' }, require('crypto').generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey, { algorithm: 'RS256' });
try {
  jwt.verify(rsToken, 'stringsecret');
} catch(e) {
  console.log('Error 3:', e.message);
}

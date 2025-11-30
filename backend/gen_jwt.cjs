const jwt = require('jsonwebtoken');
const secret = 'secret123456789012345678901234567890';
const token = jwt.sign({ role: 'anon' }, secret);
console.log(token);

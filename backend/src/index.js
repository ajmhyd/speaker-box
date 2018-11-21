const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

server.express.use(cookieParser());
// TODO: use express middleware to populate current user
// decode the jwt to get the user id on each request

server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if(token) {
    const {userId} = jwt.verify(token, process.env.APP_SECRET);
    // put userIUd onto the req for future request to access
    req.userId = userId;
  }
  next();
})
server.start({
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL,
  },
}, details => {
  console.log(`Server is running on port http:/localhost:${details.port}`);
});
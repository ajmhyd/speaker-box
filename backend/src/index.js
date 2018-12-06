const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

server.express.use(cookieParser());

// decode the jwt to get the user id on each request
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if(token) {
    const {userId} = jwt.verify(token, process.env.APP_SECRET);
    // put userId onto the req for future request to access
    req.userId = userId;
  }
  next();
});

// create middleware that populates user on each request
server.express.use(async(req, res, next) => {
  // if they aren't logged in skip this
  if(!req.userId) return next();
  // query and populate user
  const user = await db.query.user(
    { where: { id: req.userId } },
    '{ id, permissions, email, name }'
    );
    req.user = user;
    next();
});
// start server
server.start({
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL,
  },
}, details => {
  console.log(`Server is running on port http:/localhost:${details.port}`);
});
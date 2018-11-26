const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth :{
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const niceEmail = text => `
  <div className="email" style="
    border: px solid black;
    padding: 20px;
    font-family: sans-serif;
    line-height: 2;
    font-size: 20px
  ">
    <h2>Hello There!</p>
    <p>${text}</p>

    <p> Tësh</P>
  </div>
`;

exports.transport = transport;
exports.niceEmail = niceEmail;
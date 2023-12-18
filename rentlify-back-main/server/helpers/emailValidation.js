const nodemailer = require("nodemailer");

function emailValidation(email, id) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "mintxdev@gmail.com",
      pass: "qpgsokozlhqxloya",
    },
    secure: true,
  });
  const url = `http://localhost:3000/v1/customers/validate/${id}`;

  const mailOptions = {
    from: "mintxdev@gmail.com",
    to: email,
    subject: "Email verification",
    html: `<div style="max-width: 600px; margin: 0 auto;text-align:center; padding: 20px; background-color: #222; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
      <h3 style="color: white; background-color: #007bff; padding: 10px; margin: 0; border-radius: 5px 5px 0 0;">Thanks for your registration</h3>
      <p style="color: white;">Please confirm your email by clicking the link below:</p> <br/>
      <a href='${url}' style='color:white; text-style:underline;'>Click here</a>
    </div>`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(`emailSender: ${error}`);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

module.exports = emailValidation;

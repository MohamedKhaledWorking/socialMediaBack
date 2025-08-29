import nodemailer from "nodemailer";

export const sendEmail = async ({
  to = "",
  subject = "",
  text = "",
  html = "",
}) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASSWORD,
    },
  });

  (async () => {
    const info = await transporter.sendMail({
      from: `"SocialUs" <${process.env.AUTH_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent:", info.messageId);
  })();
};

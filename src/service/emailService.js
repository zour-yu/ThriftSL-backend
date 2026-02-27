const Mailjet = require("node-mailjet");

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

async function sendItemCreatedEmail({ toEmail, toName, item }) {
  // Mailjet Send API v3.1 expects Messages array
  const payload = {
    Messages: [
      {
        From: {
          Email: process.env.MAIL_FROM_EMAIL,
          Name: process.env.MAIL_FROM_NAME || "ThriftSL",
        },
        To: [
          {
            Email: toEmail,
            Name: toName || "User",
          },
        ],
        Subject: "Your item was posted successfully ✅",
        TextPart: `Hi ${toName || "there"}, your item "${item.title}" was posted successfully.`,
        HTMLPart: `
          <h3>Item posted successfully ✅</h3>
          <p>Hi ${toName || "there"},</p>
          <p>Your item <b>${item.title}</b> was posted successfully.</p>
          <p><b>Price:</b> ${item.price}</p>
          <p><b>Description:</b> ${item.description || "-"}</p>
        `,
      },
    ],
  };

  return mailjet.post("send", { version: "v3.1" }).request(payload);
}

module.exports = { sendItemCreatedEmail };

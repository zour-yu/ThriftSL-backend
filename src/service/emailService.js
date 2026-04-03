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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          
          <h2 style="color:#4CAF50;">🎉 Item Listed Successfully!</h2>

          <p>Hi ${toName || "there"},</p>

          <p>Your item <strong>${item.title}</strong> is now live on ThriftSL 🚀</p>

          ${
            item.images && item.images.length > 0
              ? `
              <img 
                src="${item.images[0]}" 
                alt="Item Image" 
                style="width:100%; max-height:300px; object-fit:cover; border-radius:10px; margin:10px 0;"
              />
              `
              : ""
          }

          <div style="background:#f9f9f9; padding:15px; border-radius:10px;">
            <p><strong>💰 Price:</strong> Rs. ${item.price}</p>
            <p><strong>📂 Category:</strong> ${item.category}</p>
            <p><strong>📍 Location:</strong> ${item.location || "N/A"}</p>
          </div>

          <p style="margin-top:15px;">
            ${item.description || ""}
          </p>

          <a 
            href="http://localhost:5173/item/${item._id}" 
            style="
              display:inline-block;
              margin-top:20px;
              padding:12px 20px;
              background:#4CAF50;
              color:white;
              text-decoration:none;
              border-radius:8px;
            "
          >
            View Your Item
          </a>

          <p style="margin-top:30px; font-size:12px; color:#888;">
            ThriftSL Marketplace
          </p>

        </div>
      `,
      },
    ],
  };

  return mailjet.post("send", { version: "v3.1" }).request(payload);
}

module.exports = { sendItemCreatedEmail };

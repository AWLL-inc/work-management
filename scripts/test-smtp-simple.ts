/**
 * Simple SMTP connection test
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import nodemailer from "nodemailer";

config({ path: resolve(process.cwd(), ".env.local") });

async function testSMTP() {
  console.log("Testing SMTP connection to Mailpit...\n");

  const transporter = nodemailer.createTransport({
    host: "127.0.0.1",
    port: 1025,
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
  });

  console.log("Transport created. Verifying connection...");

  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified!\n");

    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: "noreply@work-management.local",
      to: "test@example.com",
      subject: "Test Email from Work Management",
      text: "This is a test email sent via Mailpit",
      html: "<p>This is a <strong>test email</strong> sent via Mailpit</p>",
    });

    console.log("✅ Email sent successfully!");
    console.log(`   Message ID: ${info.messageId}`);
    console.log("\n🌐 View email at: http://localhost:8025");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testSMTP();

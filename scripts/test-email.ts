/**
 * Email sending test script
 * Tests welcome email and password reset email functionality
 *
 * Usage:
 *   tsx scripts/test-email.ts
 */

import { resolve } from "node:path";
// Load environment variables from .env.local
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

import { emailService } from "../lib/services/email";

async function testEmails() {
  console.log("🧪 Testing Email Service\n");
  console.log("=".repeat(50));

  // Test 1: Welcome Email
  console.log("\n📧 Test 1: Sending Welcome Email");
  console.log("-".repeat(50));

  const welcomeResult = await emailService.sendWelcomeEmail(
    "test.user@example.com",
    "Test User",
    "test.user@example.com",
    "TempPassword123!@#",
  );

  if (welcomeResult.success) {
    console.log("✅ Welcome email sent successfully");
    console.log(`   Message ID: ${welcomeResult.messageId}`);
  } else {
    console.error("❌ Failed to send welcome email");
    console.error(`   Error: ${welcomeResult.error}`);
  }

  // Test 2: Password Reset Email
  console.log("\n📧 Test 2: Sending Password Reset Email");
  console.log("-".repeat(50));

  const resetToken = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6";
  const resetResult = await emailService.sendPasswordResetEmail(
    "test.user@example.com",
    "Test User",
    resetToken,
  );

  if (resetResult.success) {
    console.log("✅ Password reset email sent successfully");
    console.log(`   Message ID: ${resetResult.messageId}`);
  } else {
    console.error("❌ Failed to send password reset email");
    console.error(`   Error: ${resetResult.error}`);
  }

  // Summary
  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 Test Summary:");
  console.log(
    `   Welcome Email: ${welcomeResult.success ? "✅ PASS" : "❌ FAIL"}`,
  );
  console.log(
    `   Password Reset Email: ${resetResult.success ? "✅ PASS" : "❌ FAIL"}`,
  );

  console.log("\n🌐 View emails in Mailpit:");
  console.log("   http://localhost:8025\n");

  // Exit with error if any test failed
  if (!welcomeResult.success || !resetResult.success) {
    process.exit(1);
  }
}

// Run tests
testEmails().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

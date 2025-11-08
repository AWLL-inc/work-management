import { Resend } from "resend";

/**
 * Email service configuration
 */
interface EmailConfig {
  provider: "smtp" | "resend";
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpSecure?: boolean;
  previewMode?: boolean;
}

/**
 * Email data structure
 */
export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email service result
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email service abstraction layer
 * Supports multiple email providers (Resend, SMTP)
 */
export class EmailService {
  private config: EmailConfig;
  private resendClient?: Resend;

  constructor() {
    this.config = this.loadConfig();
    if (this.config.provider === "resend" && this.config.resendApiKey) {
      this.resendClient = new Resend(this.config.resendApiKey);
    }
  }

  /**
   * Load email configuration from environment variables
   */
  private loadConfig(): EmailConfig {
    return {
      provider: (process.env.EMAIL_PROVIDER as "smtp" | "resend") || "smtp",
      resendApiKey: process.env.RESEND_API_KEY,
      smtpHost: process.env.SMTP_HOST || "localhost",
      smtpPort: Number.parseInt(process.env.SMTP_PORT || "1025", 10),
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
      smtpFrom: process.env.SMTP_FROM || "noreply@work-management.local",
      smtpSecure: process.env.SMTP_SECURE === "true",
      previewMode: process.env.EMAIL_PREVIEW_MODE === "true",
    };
  }

  /**
   * Send an email using the configured provider
   */
  async send(emailData: EmailData): Promise<EmailResult> {
    try {
      // Preview mode: log email to console
      if (this.config.previewMode) {
        console.log("📧 Email Preview Mode:");
        console.log("To:", emailData.to);
        console.log("Subject:", emailData.subject);
        console.log("HTML:", emailData.html);
        console.log("Text:", emailData.text);
        return { success: true, messageId: "preview-mode" };
      }

      // Send via configured provider
      if (this.config.provider === "resend") {
        return await this.sendViaResend(emailData);
      }
      return await this.sendViaSMTP(emailData);
    } catch (error) {
      console.error("Email send error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send email via Resend
   */
  private async sendViaResend(emailData: EmailData): Promise<EmailResult> {
    if (!this.resendClient) {
      throw new Error("Resend client not initialized. Check RESEND_API_KEY.");
    }

    try {
      const { data, error } = await this.resendClient.emails.send({
        from: this.config.smtpFrom || "noreply@work-management.local",
        to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Resend error",
      };
    }
  }

  /**
   * Send email via SMTP (for development with Mailpit)
   */
  private async sendViaSMTP(emailData: EmailData): Promise<EmailResult> {
    // For SMTP, we'll use nodemailer in a future implementation
    // For now, log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("📧 SMTP Email (Development Mode):");
      console.log("To:", emailData.to);
      console.log("Subject:", emailData.subject);
      console.log("From:", this.config.smtpFrom);
      console.log(
        "SMTP Config:",
        `${this.config.smtpHost}:${this.config.smtpPort}`,
      );
      console.log("HTML Preview:", `${emailData.html.substring(0, 200)}...`);

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }

    // Production SMTP would require nodemailer implementation
    throw new Error("SMTP provider not fully implemented yet");
  }

  /**
   * Send welcome email with initial password
   */
  async sendWelcomeEmail(
    to: string,
    name: string,
    email: string,
    temporaryPassword: string,
  ): Promise<EmailResult> {
    const subject = "Welcome to Work Management System";

    // Import React Email template (will be created next)
    // For now, use a simple HTML template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
            .password { font-family: monospace; font-size: 18px; font-weight: bold; color: #DC2626; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background-color: #FEF2F2; border: 1px solid #FEE2E2; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Work Management</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Your account has been created successfully. Here are your login credentials:</p>

              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <span class="password">${temporaryPassword}</span></p>
              </div>

              <div class="warning">
                <p><strong>⚠️ Important Security Notice:</strong></p>
                <ul>
                  <li>You will be required to change this password upon first login</li>
                  <li>Do not share this password with anyone</li>
                  <li>This email contains sensitive information - please delete it after changing your password</li>
                </ul>
              </div>

              <p>To get started:</p>
              <ol>
                <li>Visit the login page</li>
                <li>Enter your email and temporary password</li>
                <li>Follow the prompts to set your new password</li>
              </ol>

              <p>If you did not expect this email or have any questions, please contact your system administrator.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Work Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to Work Management System

Hello ${name},

Your account has been created successfully.

Login Credentials:
- Email: ${email}
- Temporary Password: ${temporaryPassword}

IMPORTANT: You will be required to change this password upon first login.

To get started:
1. Visit the login page
2. Enter your email and temporary password
3. Follow the prompts to set your new password

If you did not expect this email, please contact your system administrator.
    `.trim();

    return this.send({ to, subject, html, text });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<EmailResult> {
    const subject = "Password Reset Request";

    // Construct reset URL (adjust baseUrl for production)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background-color: #FEF2F2; border: 1px solid #FEE2E2; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .link { color: #4F46E5; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>We received a request to reset your password for your Work Management account.</p>

              <p>Click the button below to reset your password:</p>

              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>

              <p>Or copy and paste this link into your browser:</p>
              <p class="link">${resetUrl}</p>

              <div class="warning">
                <p><strong>⚠️ Security Information:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you did not request this reset, please ignore this email</li>
                  <li>Your password will remain unchanged until you create a new one</li>
                </ul>
              </div>

              <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Work Management System. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request

Hello ${name},

We received a request to reset your password for your Work Management account.

To reset your password, visit the following link:
${resetUrl}

IMPORTANT:
- This link will expire in 1 hour
- If you did not request this reset, please ignore this email
- Your password will remain unchanged until you create a new one

If you're having trouble with the link, copy and paste it into your web browser.
    `.trim();

    return this.send({ to, subject, html, text });
  }
}

// Export singleton instance
export const emailService = new EmailService();

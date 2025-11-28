import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  from?: string;
}

/**
 * Create Gmail SMTP transporter
 */
function createTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.warn('[EMAIL] Gmail credentials not configured');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });
}

/**
 * Send email via Gmail SMTP
 */
export async function sendEmail({ to, subject, htmlBody, textBody, from }: EmailParams) {
  const transporter = createTransporter();
  
  // Use Gmail account as sender if not specified
  const senderEmail = from || process.env.GMAIL_USER || 'noreply@example.com';

  // If Gmail not configured, log and return
  if (!transporter) {
    console.warn('[EMAIL] Gmail SMTP not configured. Email would be sent to:', to);
    console.log('[EMAIL] Subject:', subject);
    console.log('[EMAIL] Body (text):\n', textBody);
    return { success: false, reason: 'Gmail SMTP not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: senderEmail,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log('[EMAIL] Successfully sent to:', to, '| MessageId:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      to,
    };
  } catch (error) {
    console.error('[EMAIL] Failed to send email to:', to, error);
    throw error;
  }
}

/**
 * Generate HTML email template
 */
export function generateEmailHTML(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: white;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    strong {
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">📚 Proactive AI Reading Study</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>This is an automated message from the Proactive AI Assistance in Reading study.</p>
  </div>
</body>
</html>
  `.trim();
}

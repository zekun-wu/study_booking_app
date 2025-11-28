import nodemailer from 'nodemailer';
const { createTransport } = nodemailer;
import { ENV } from './_core/env';

// Create reusable transporter
const createTransporter = () => {
  if (!ENV.emailPassword) {
    console.warn('[Email] EMAIL_PASSWORD not configured. Email sending disabled.');
    return null;
  }

  return createTransport({
    service: 'gmail',
    auth: {
      user: ENV.emailUser,
      pass: ENV.emailPassword,
    },
  });
};

interface BookingDetails {
  parentName: string;
  childName: string;
  childAge: number;
  userEmail: string;
  userPhone?: string;
  location: string;
  slotTitle: string;
  startTime: Date;
  endTime: Date;
}

export async function sendBookingNotifications(booking: BookingDetails) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('[Email] Skipping email notifications (not configured)');
    return { success: false, reason: 'Email not configured' };
  }

  try {
    const startTimeStr = booking.startTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const endTimeStr = booking.endTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Determine admin email based on location
    const adminEmail = booking.location === 'Saarland' 
      ? ENV.saarlandAdminEmail 
      : ENV.iwmAdminEmail;

    // 1. Send notice email to admin
    const noticeEmailHtml = `
      <h2>New Booking Notification</h2>
      <p>A new booking has been made for <strong>${booking.location}</strong>:</p>
      
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Time Slot:</strong> ${booking.slotTitle}</li>
        <li><strong>Date & Time:</strong> ${startTimeStr} - ${endTimeStr}</li>
        <li><strong>Location:</strong> ${booking.location}</li>
      </ul>

      <h3>Participant Information:</h3>
      <ul>
        <li><strong>Parent Name:</strong> ${booking.parentName}</li>
        <li><strong>Child Name:</strong> ${booking.childName}</li>
        <li><strong>Child Age:</strong> ${booking.childAge}</li>
        <li><strong>Email:</strong> ${booking.userEmail}</li>
        ${booking.userPhone ? `<li><strong>Phone:</strong> ${booking.userPhone}</li>` : ''}
      </ul>

      <p>Please log in to the admin dashboard to view more details.</p>
    `;

    await transporter.sendMail({
      from: `"Study Booking System" <${ENV.emailUser}>`,
      to: adminEmail,
      subject: `New Booking: ${booking.location} - ${booking.slotTitle}`,
      html: noticeEmailHtml,
    });

    console.log(`[Email] Notice email sent to ${adminEmail}`);

    // 2. Send confirmation email to user
    const confirmationEmailHtml = `
      <h2>Booking Confirmation</h2>
      <p>Dear ${booking.parentName},</p>
      
      <p>Thank you for booking a session for the <strong>Proactive AI Assistance in Reading with Parents and Children</strong> study.</p>

      <h3>Your Booking Details:</h3>
      <ul>
        <li><strong>Time Slot:</strong> ${booking.slotTitle}</li>
        <li><strong>Date & Time:</strong> ${startTimeStr} - ${endTimeStr}</li>
        <li><strong>Location:</strong> ${booking.location}</li>
        <li><strong>Child Name:</strong> ${booking.childName}</li>
        <li><strong>Child Age:</strong> ${booking.childAge}</li>
      </ul>

      <h3>Important Information:</h3>
      <p>Please note that this study is conducted <strong>entirely in German</strong>. Make sure you and your child are comfortable with German language before attending.</p>

      <h3>Contact Information:</h3>
      <p>If you have any questions or need to reschedule, please contact us at:</p>
      <ul>
        <li><strong>Email:</strong> ${ENV.emailUser}</li>
        ${booking.location === 'Saarland' 
          ? `<li><strong>Study Coordinator:</strong> ${ENV.saarlandAdminEmail}</li>`
          : `<li><strong>Study Coordinator:</strong> ${ENV.iwmAdminEmail}</li>`
        }
      </ul>

      <p>We look forward to seeing you!</p>
      
      <p>Best regards,<br>
      The Research Team</p>
    `;

    await transporter.sendMail({
      from: `"Study Booking System" <${ENV.emailUser}>`,
      to: booking.userEmail,
      subject: `Booking Confirmation - ${booking.location} Study Session`,
      html: confirmationEmailHtml,
    });

    console.log(`[Email] Confirmation email sent to ${booking.userEmail}`);

    return { success: true };
  } catch (error) {
    console.error('[Email] Error sending emails:', error);
    return { success: false, error };
  }
}

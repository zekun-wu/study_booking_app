import { Resend } from 'resend';
import { ENV } from './_core/env';

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
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.log('[Email] Skipping email notifications (RESEND_API_KEY not configured)');
    return { success: false, reason: 'Email not configured' };
  }

  const resend = new Resend(resendApiKey);

  try {
    const startTimeStr = booking.startTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Determine admin email based on location
    const adminEmail = booking.location === 'Saarland' 
      ? 'wuzekun@cs.uni-saarland.de'
      : 'm.su@iwm-tuebingen.de';

    // Send notice email to admin
    const noticeEmailHtml = `
      <h2>New Booking Notification</h2>
      <p>A new booking has been made for <strong>${booking.location}</strong>.</p>
      
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Time Slot:</strong> ${booking.slotTitle}</li>
        <li><strong>Date & Time:</strong> ${startTimeStr}</li>
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

    const noticeResult = await resend.emails.send({
      from: 'Study Booking <onboarding@resend.dev>',
      to: adminEmail,
      subject: `New Booking: ${booking.location} - ${booking.slotTitle}`,
      html: noticeEmailHtml,
    });

    console.log(`[Email] Notice email result:`, JSON.stringify(noticeResult));
    console.log(`[Email] Notice email sent to ${adminEmail}`);

    // Send confirmation email to user
    const confirmationEmailHtml = `
      <h2>Booking Confirmation</h2>
      <p>Dear ${booking.parentName},</p>
      
      <p>Thank you for booking a session for our study on <strong>Proactive AI Assistance in Reading with Parents and Children</strong>.</p>
      
      <h3>Your Booking Details:</h3>
      <ul>
        <li><strong>Location:</strong> ${booking.location}</li>
        <li><strong>Time Slot:</strong> ${booking.slotTitle}</li>
        <li><strong>Date & Time:</strong> ${startTimeStr}</li>
        <li><strong>Child:</strong> ${booking.childName} (Age: ${booking.childAge})</li>
      </ul>
      
      <h3>What to Expect:</h3>
      <p>The study session will take approximately 60 minutes and will be conducted entirely in German.</p>
      
      <h3>Important Notes:</h3>
      <ul>
        <li>Please arrive 5-10 minutes before your scheduled time</li>
        <li>The study is conducted in German</li>
        <li>Both parent and child should be present</li>
      </ul>
      
      <p>If you need to cancel or reschedule, please contact us as soon as possible.</p>
      
      <p>We look forward to seeing you!</p>
      
      <p>Best regards,<br>
      The Research Team</p>
    `;

    const confirmResult = await resend.emails.send({
      from: 'Study Booking <onboarding@resend.dev>',
      to: booking.userEmail,
      subject: `Booking Confirmation - ${booking.location} Study Session`,
      html: confirmationEmailHtml,
    });

    console.log(`[Email] Confirmation email result:`, JSON.stringify(confirmResult));
    console.log(`[Email] Confirmation email sent to ${booking.userEmail}`);

    return { success: true };
  } catch (error) {
    console.error('[Email] Error sending emails:', error);
    console.error('[Email] Error details:', JSON.stringify(error, null, 2));
    return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' };
  }
}

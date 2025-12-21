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
  
  console.log('[Email] Checking Resend API key...', resendApiKey ? `Key present (${resendApiKey.substring(0, 8)}...)` : 'Key missing');
  
  if (!resendApiKey) {
    console.log('[Email] Skipping email notifications (RESEND_API_KEY not configured)');
    return { success: false, reason: 'Email not configured' };
  }

  const resend = new Resend(resendApiKey);
  console.log('[Email] Resend client initialized');

  try {
    const startTimeStr = booking.startTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Determine admin emails based on location
    const adminEmails = booking.location === 'Saarland' 
      ? ['wuzekun@cs.uni-saarland.de', 'philipprudakov@gmail.com']
      : ['m.su@iwm-tuebingen.de'];

    // Send notice email to admin(s)
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

    // Send to all admin emails for this location
    for (const adminEmail of adminEmails) {
      console.log(`[Email] Attempting to send notice email to ${adminEmail}...`);
      const noticeResult = await resend.emails.send({
        from: 'Study Booking <study-booking@zekunwu.com>',
        to: adminEmail,
        subject: `New Booking: ${booking.location} - ${booking.slotTitle}`,
        html: noticeEmailHtml,
      });

      console.log(`[Email] Notice email result:`, JSON.stringify(noticeResult));
      
      if (noticeResult.error) {
        console.error(`[Email] Notice email to ${adminEmail} failed:`, noticeResult.error);
        // Continue sending to other admins even if one fails
      } else {
        console.log(`[Email] ✅ Notice email sent to ${adminEmail} (ID: ${noticeResult.data?.id})`);
      }
    }

    // Send confirmation email to user
    const confirmationEmailHtml = `
      <h2>Booking Confirmation</h2>
      <p>Dear ${booking.parentName},</p>
      
      <p>Thank you for booking a session for our study on <strong>Proactive AI Assistance in Reading with Parents and Children</strong>.</p>
      
      <h3>Your Confirmed Time Slot:</h3>
      <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 8px 0;"><strong>Location:</strong> ${booking.location}</p>
        <p style="margin: 8px 0;"><strong>Time Slot:</strong> ${booking.slotTitle}</p>
        <p style="margin: 8px 0;"><strong>Date & Time:</strong> ${startTimeStr}</p>
        <p style="margin: 8px 0;"><strong>Child:</strong> ${booking.childName} (Age: ${booking.childAge})</p>
      </div>
      
      <p style="color: #059669; font-weight: bold;">This is your final confirmed time slot. Please mark it in your calendar.</p>
      
      <h3>What to Expect:</h3>
      <p>The study session will take approximately 60 minutes and will be conducted entirely in German.</p>
      
      <h3>Important Notes:</h3>
      <ul>
        <li>Please arrive 5-10 minutes before your scheduled time</li>
        <li>The study is conducted in German</li>
        <li>Both parent and child should be present</li>
      </ul>
      
      <p>If you need to cancel or reschedule, please contact us as soon as possible at: <a href="mailto:${booking.location === 'Saarland' ? 'philipprudakov@gmail.com' : 'm.su@iwm-tuebingen.de'}">${booking.location === 'Saarland' ? 'philipprudakov@gmail.com' : 'm.su@iwm-tuebingen.de'}</a></p>
      
      <p>We look forward to seeing you!</p>
      
      <p>Best regards,<br>
      The Research Team</p>
    `;

    console.log(`[Email] Attempting to send confirmation email to ${booking.userEmail}...`);
    const confirmResult = await resend.emails.send({
      from: 'Study Booking <study-booking@zekunwu.com>',
      to: booking.userEmail,
      subject: `Booking Confirmation - ${booking.location} Study Session`,
      html: confirmationEmailHtml,
    });

    console.log(`[Email] Confirmation email result:`, JSON.stringify(confirmResult));
    
    if (confirmResult.error) {
      console.error(`[Email] Confirmation email failed:`, confirmResult.error);
      throw new Error(`Confirmation email failed: ${JSON.stringify(confirmResult.error)}`);
    }
    
    console.log(`[Email] ✅ Confirmation email sent to ${booking.userEmail} (ID: ${confirmResult.data?.id})`);

    return { success: true };
  } catch (error) {
    console.error('[Email] ❌ Error sending emails:', error);
    if (error instanceof Error) {
      console.error('[Email] Error message:', error.message);
      console.error('[Email] Error stack:', error.stack);
    }
    console.error('[Email] Error details:', JSON.stringify(error, null, 2));
    return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' };
  }
}

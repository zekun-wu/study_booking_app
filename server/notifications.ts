import { notifyOwner } from './_core/notification';
import { sendEmail, generateEmailHTML } from './services/emailService';
import type { TimeSlot } from '../drizzle/schema';

interface BookingData {
  parentName: string;
  childName: string;
  childAge: number;
  userEmail: string;
  userPhone?: string;
  notes?: string;
}

interface NotificationParams {
  booking: BookingData;
  slot: TimeSlot;
}

/**
 * Send booking notifications to admins and participant
 */
export async function sendBookingNotifications({ booking, slot }: NotificationParams) {
  const slotDate = new Date(slot.startTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Determine location-specific admin email
  const adminEmail = slot.location === 'IWM' 
    ? 'm.su@iwm-tuebingen.de' 
    : 'wuzekun@cs.uni-saarland.de';

  // Admin notification content
  const adminTextBody = `
📅 New Booking Received

Location: ${slot.location}
Date & Time: ${slotDate}

Participant Information:
- Parent Name: ${booking.parentName}
- Child Name: ${booking.childName}
- Child Age: ${booking.childAge}
- Email: ${booking.userEmail}
${booking.userPhone ? `- Phone: ${booking.userPhone}` : ''}
${booking.notes ? `\nNotes: ${booking.notes}` : ''}
  `.trim();

  const adminHTMLBody = generateEmailHTML(`
    <h2>📅 New Booking Received</h2>
    <div class="info-box">
      <p><strong>Location:</strong> ${slot.location}</p>
      <p><strong>Date & Time:</strong> ${slotDate}</p>
    </div>
    <h3>Participant Information</h3>
    <ul>
      <li><strong>Parent Name:</strong> ${booking.parentName}</li>
      <li><strong>Child Name:</strong> ${booking.childName}</li>
      <li><strong>Child Age:</strong> ${booking.childAge}</li>
      <li><strong>Email:</strong> ${booking.userEmail}</li>
      ${booking.userPhone ? `<li><strong>Phone:</strong> ${booking.userPhone}</li>` : ''}
    </ul>
    ${booking.notes ? `<div class="info-box"><strong>Notes:</strong><br>${booking.notes}</div>` : ''}
  `);

  // Send notification to admin via email
  try {
    await sendEmail({
      to: adminEmail,
      subject: `New Study Booking - ${slot.location}`,
      htmlBody: adminHTMLBody,
      textBody: adminTextBody,
    });
  } catch (error) {
    console.error('Failed to send admin email:', error);
  }

  // Owner notifications removed - only location-specific admins receive emails

  // Participant confirmation
  const locationAddress = slot.location === 'IWM' 
    ? 'Leibniz-Institut für Wissensmedien, Schleichstraße 6, 72076 Tübingen, Germany'
    : 'Saarland University, Campus, 66123 Saarbrücken, Germany';

  const participantTextBody = `
Dear ${booking.parentName},

Thank you for booking a session for our research study "Proactive AI Assistance in Reading with Parents and Children"!

Your booking details:
- Location: ${slot.location}
- Date & Time: ${slotDate}
- Child Name: ${booking.childName}
- Child Age: ${booking.childAge}

Location Address:
${locationAddress}

If you need to make any changes or have questions, please contact us at ${adminEmail}.

We look forward to seeing you!

Best regards,
Research Team
  `.trim();

  const participantHTMLBody = generateEmailHTML(`
    <h2>Booking Confirmation</h2>
    <p>Dear <strong>${booking.parentName}</strong>,</p>
    <p>Thank you for booking a session for our research study <strong>"Proactive AI Assistance in Reading with Parents and Children"</strong>!</p>
    
    <div class="info-box">
      <h3>Your Booking Details</h3>
      <p><strong>Location:</strong> ${slot.location}</p>
      <p><strong>Date & Time:</strong> ${slotDate}</p>
      <p><strong>Child Name:</strong> ${booking.childName}</p>
      <p><strong>Child Age:</strong> ${booking.childAge}</p>
    </div>

    <div class="info-box">
      <h3>📍 Location Address</h3>
      <p>${locationAddress}</p>
    </div>

    <p>If you need to make any changes or have questions, please contact us at <a href="mailto:${adminEmail}">${adminEmail}</a>.</p>
    <p>We look forward to seeing you!</p>
    <p><strong>Best regards,</strong><br>Research Team</p>
  `);

  // Send confirmation to participant
  try {
    await sendEmail({
      to: booking.userEmail,
      subject: 'Booking Confirmation - Study Session',
      htmlBody: participantHTMLBody,
      textBody: participantTextBody,
    });
  } catch (error) {
    console.error('Failed to send participant confirmation email:', error);
  }

  // Return success
  return {
    adminEmail,
    participantEmail: booking.userEmail,
    sent: true,
  };
}

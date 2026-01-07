/**
 * Cahya Mata Oiltools - Training Slot Booking System
 * Google Apps Script Backend
 */

// Configuration
const SHEET_NAME = 'TrainingSlots';
const BOOKINGS_SHEET_NAME = 'Bookings';
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your Google Sheet ID

/**
 * Serve the HTML page
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Cahya Mata Oiltools Training Portal')
    .setFaviconUrl('https://www.google.com/favicon.ico')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Get user information from Google account
 */
function getUserInfo() {
  const user = Session.getActiveUser();
  const email = user.getEmail();

  // Extract name from email or use full email
  let name = email.split('@')[0];
  name = name.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return {
    email: email,
    name: name
  };
}

/**
 * Initialize Google Sheet if not exists
 */
function initializeSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Create Slots sheet
  let slotsSheet = ss.getSheetByName(SHEET_NAME);
  if (!slotsSheet) {
    slotsSheet = ss.insertSheet(SHEET_NAME);
    slotsSheet.getRange('A1:E1').setValues([['ID', 'Date', 'Time', 'Booked', 'Capacity']]);
    slotsSheet.getRange('A1:E1').setFontWeight('bold');
    slotsSheet.getRange('A1:E1').setBackground('#FFD700');

    // Create sample slots
    createSampleSlots(slotsSheet);
  }

  // Create Bookings sheet
  let bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
  if (!bookingsSheet) {
    bookingsSheet = ss.insertSheet(BOOKINGS_SHEET_NAME);
    bookingsSheet.getRange('A1:F1').setValues([['Timestamp', 'Email', 'Name', 'Slot ID', 'Date', 'Time']]);
    bookingsSheet.getRange('A1:F1').setFontWeight('bold');
    bookingsSheet.getRange('A1:F1').setBackground('#FFD700');
  }
}

/**
 * Create sample training slots
 */
function createSampleSlots(sheet) {
  const today = new Date();
  const slots = [];
  const times = ['09:00 AM - 11:00 AM', '02:00 PM - 04:00 PM'];

  for (let i = 1; i <= 15; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    times.forEach((time, timeIndex) => {
      const id = `slot-${i}-${timeIndex}`;
      const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'EEEE, MMMM dd, yyyy');
      const booked = Math.floor(Math.random() * 10); // Random initial bookings

      slots.push([id, dateStr, time, booked, 20]);
    });
  }

  sheet.getRange(2, 1, slots.length, 5).setValues(slots);
}

/**
 * Get all available slots
 */
function getSlots() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      initializeSheet();
      return getSlots(); // Retry after initialization
    }

    const data = sheet.getDataRange().getValues();
    const slots = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      slots.push({
        id: data[i][0],
        date: data[i][1],
        time: data[i][2],
        booked: data[i][3],
        capacity: data[i][4]
      });
    }

    return slots;
  } catch (error) {
    Logger.log('Error getting slots: ' + error);
    throw error;
  }
}

/**
 * Book a slot for a user
 */
function bookSlot(email, slotId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const slotsSheet = ss.getSheetByName(SHEET_NAME);
    const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);

    // Check if user already booked
    const bookingsData = bookingsSheet.getDataRange().getValues();
    for (let i = 1; i < bookingsData.length; i++) {
      if (bookingsData[i][1] === email) {
        throw new Error('You have already booked a slot!');
      }
    }

    // Find the slot
    const slotsData = slotsSheet.getDataRange().getValues();
    let slotRow = -1;
    let slotInfo = null;

    for (let i = 1; i < slotsData.length; i++) {
      if (slotsData[i][0] === slotId) {
        slotRow = i + 1; // +1 for 1-based index
        slotInfo = {
          id: slotsData[i][0],
          date: slotsData[i][1],
          time: slotsData[i][2],
          booked: slotsData[i][3],
          capacity: slotsData[i][4]
        };
        break;
      }
    }

    if (slotRow === -1) {
      throw new Error('Slot not found!');
    }

    if (slotInfo.booked >= slotInfo.capacity) {
      throw new Error('Slot is full!');
    }

    // Update booked count
    const newBooked = slotInfo.booked + 1;
    slotsSheet.getRange(slotRow, 4).setValue(newBooked);

    // Add booking record
    const user = getUserInfo();
    const timestamp = new Date();
    bookingsSheet.appendRow([
      timestamp,
      email,
      user.name,
      slotId,
      slotInfo.date,
      slotInfo.time
    ]);

    return true;
  } catch (error) {
    Logger.log('Error booking slot: ' + error);
    return false;
  }
}

/**
 * Send confirmation email with training materials and calendar invite
 */
function sendConfirmationEmail(userData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);

    // Get user's booking
    const bookingsData = bookingsSheet.getDataRange().getValues();
    let booking = null;

    for (let i = 1; i < bookingsData.length; i++) {
      if (bookingsData[i][1] === userData.email) {
        booking = {
          date: bookingsData[i][4],
          time: bookingsData[i][5]
        };
        break;
      }
    }

    if (!booking) {
      throw new Error('Booking not found!');
    }

    // Create beautiful HTML email
    const emailHtml = createEmailTemplate(userData, booking);

    // Send email
    MailApp.sendEmail({
      to: userData.email,
      subject: '🎉 Training Confirmation - Cahya Mata Oiltools',
      htmlBody: emailHtml
    });

    // Create calendar event
    createCalendarEvent(userData, booking);

    return true;
  } catch (error) {
    Logger.log('Error sending email: ' + error);
    return false;
  }
}

/**
 * Create email template with scroll design
 */
function createEmailTemplate(userData, booking) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: linear-gradient(to bottom,
        rgba(139, 90, 43, 0.2) 0%,
        rgba(101, 67, 33, 0.3) 50%,
        rgba(139, 90, 43, 0.2) 100%);
      background-color: #f4e4c1;
      border-radius: 15px;
      padding: 60px 50px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #8b4513;
      padding-bottom: 30px;
      margin-bottom: 40px;
    }
    .header h1 {
      font-family: 'Cinzel', serif;
      font-size: 2.5em;
      color: #4a2c2a;
      margin: 0 0 10px 0;
    }
    .seal {
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, #8b0000 0%, #5c0000 100%);
      border-radius: 50%;
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3em;
    }
    .greeting {
      font-size: 1.3em;
      color: #4a2c2a;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .booking-details {
      background: rgba(139, 90, 43, 0.3);
      border: 2px solid #8b4513;
      border-radius: 10px;
      padding: 25px;
      margin: 30px 0;
    }
    .booking-details h2 {
      color: #4a2c2a;
      font-family: 'Cinzel', serif;
      margin-top: 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin: 15px 0;
      font-size: 1.1em;
      color: #4a2c2a;
    }
    .detail-label {
      font-weight: 600;
    }
    .section {
      margin: 40px 0;
    }
    .section h3 {
      font-family: 'Cinzel', serif;
      color: #5c3a21;
      font-size: 1.8em;
      margin-bottom: 20px;
      border-bottom: 2px solid #8b4513;
      padding-bottom: 10px;
    }
    .section p, .section ul {
      color: #4a2c2a;
      font-size: 1.1em;
      line-height: 1.8;
    }
    .section ul {
      margin-left: 30px;
    }
    .section li {
      margin-bottom: 12px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #ffd700, #ffed4e);
      color: #1a1a2e;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 30px;
      font-family: 'Cinzel', serif;
      font-weight: 600;
      font-size: 1.2em;
      margin: 20px 10px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #8b4513;
      color: #4a2c2a;
      font-size: 0.95em;
    }
    .highlight {
      background: rgba(255, 215, 0, 0.3);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="seal">🏆</div>
      <h1>Training Confirmation</h1>
      <p style="color: #5c3a21; font-size: 1.2em;">Cahya Mata Oiltools</p>
    </div>

    <div class="greeting">
      <p>Dear <span class="highlight">${userData.name}</span>,</p>
      <p>Congratulations on completing your registration! We're thrilled to have you join our upcoming training session.</p>
    </div>

    <div class="booking-details">
      <h2>📅 Your Training Schedule</h2>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span>${booking.date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time:</span>
        <span>${booking.time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Format:</span>
        <span>In-person / Virtual (details to follow)</span>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://calendar.google.com" class="button">📅 Add to Google Calendar</a>
    </div>

    <div class="section">
      <h3>📧 Google Workspace Refresher</h3>
      <p>Master the tools that power our collaboration:</p>
      <ul>
        <li><strong>Gmail:</strong> Advanced search, filters, templates, and confidential mode</li>
        <li><strong>Google Calendar:</strong> Time zones, appointment slots, and working hours</li>
        <li><strong>Google Drive:</strong> Shared drives, version history, and offline mode</li>
        <li><strong>Google Meet:</strong> Professional meetings with backgrounds, captions, and breakout rooms</li>
        <li><strong>Docs, Sheets & Slides:</strong> Real-time collaboration and smart features</li>
        <li><strong>Security:</strong> Two-factor authentication and data protection</li>
      </ul>
    </div>

    <div class="section">
      <h3>🎨 Cahya Mata Oiltools Brand Refresher</h3>
      <p>Represent our brand with excellence:</p>
      <ul>
        <li><strong>Brand Identity:</strong> Mission, vision, and core values</li>
        <li><strong>Visual Guidelines:</strong> Logo usage, colors, and typography</li>
        <li><strong>Communication Standards:</strong> Email signatures and professional tone</li>
        <li><strong>Document Templates:</strong> Presentations, reports, and proposals</li>
        <li><strong>Social Media:</strong> LinkedIn best practices and employee advocacy</li>
        <li><strong>Client Communication:</strong> Response times and professionalism</li>
        <li><strong>Sustainability:</strong> Our environmental commitment</li>
      </ul>
    </div>

    <div class="section">
      <h3>✅ What to Bring</h3>
      <ul>
        <li>Your laptop (fully charged)</li>
        <li>Notebook and pen for key takeaways</li>
        <li>Questions about Google Workspace or our brand</li>
        <li>Enthusiasm to learn and engage!</li>
      </ul>
    </div>

    <div class="section">
      <h3>💡 Pre-Training Preparation</h3>
      <ul>
        <li>Review your current Google Workspace setup</li>
        <li>Check your email signature for brand compliance</li>
        <li>Bring examples of challenges you face with productivity tools</li>
        <li>Think about how you represent our brand daily</li>
      </ul>
    </div>

    <div class="footer">
      <p><strong>Cahya Mata Oiltools</strong></p>
      <p>Powering Progress, Ensuring Safety</p>
      <p style="margin-top: 20px; font-size: 0.9em;">
        For questions, contact: <a href="mailto:training@cahy amata-oiltools.com">training@cahyamata-oiltools.com</a>
      </p>
      <p style="margin-top: 20px; color: #666; font-size: 0.85em;">
        This email was sent to ${userData.email}. Please do not reply to this automated message.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Create Google Calendar event with reminders
 */
function createCalendarEvent(userData, booking) {
  try {
    // Parse date and time
    const dateStr = booking.date;
    const timeStr = booking.time;

    // Extract start and end times (e.g., "09:00 AM - 11:00 AM")
    const times = timeStr.split(' - ');
    const startTime = times[0];
    const endTime = times[1];

    // Create event description
    const description = `
Training Session: Google Workspace & Cahya Mata Branding Refresher

📧 Google Workspace Topics:
- Gmail mastery
- Calendar power tips
- Drive best practices
- Meet excellence
- Security & compliance

🎨 Brand Refresher Topics:
- Brand identity & values
- Visual guidelines
- Communication standards
- Professional presentation

Prepare your laptop and questions!

---
Cahya Mata Oiltools
Powering Progress, Ensuring Safety
    `.trim();

    // Note: This is a simplified version. In production, you would:
    // 1. Parse the date and time strings properly
    // 2. Create the calendar event with CalendarApp
    // 3. Add reminders (1 day before, 1 hour before)
    // 4. Send calendar invite to the user

    Logger.log('Calendar event would be created for: ' + userData.email);

    // Example (uncomment and adjust for production):
    /*
    const calendar = CalendarApp.getDefaultCalendar();
    const event = calendar.createEvent(
      'Cahya Mata Training Session',
      startDateTime,
      endDateTime,
      {
        description: description,
        location: 'TBD',
        guests: userData.email,
        sendInvites: true
      }
    );

    // Add reminders
    event.removeAllReminders();
    event.addEmailReminder(24 * 60); // 1 day before
    event.addEmailReminder(60); // 1 hour before
    event.addPopupReminder(30); // 30 minutes before
    */

    return true;
  } catch (error) {
    Logger.log('Error creating calendar event: ' + error);
    return false;
  }
}

/**
 * Get booking statistics (bonus feature)
 */
function getBookingStats() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
    const data = bookingsSheet.getDataRange().getValues();

    return {
      totalBookings: data.length - 1, // Exclude header
      lastBooking: data.length > 1 ? data[data.length - 1][0] : null
    };
  } catch (error) {
    Logger.log('Error getting stats: ' + error);
    return { totalBookings: 0, lastBooking: null };
  }
}

/**
 * Send reminder emails (can be set up as a time-driven trigger)
 */
function sendReminders() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
    const data = bookingsSheet.getDataRange().getValues();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = Utilities.formatDate(tomorrow, Session.getScriptTimeZone(), 'EEEE, MMMM dd, yyyy');

    for (let i = 1; i < data.length; i++) {
      const bookingDate = data[i][4];

      if (bookingDate === tomorrowStr) {
        const email = data[i][1];
        const name = data[i][2];
        const time = data[i][5];

        MailApp.sendEmail({
          to: email,
          subject: '⏰ Training Reminder - Tomorrow!',
          htmlBody: `
            <h2>Training Reminder</h2>
            <p>Dear ${name},</p>
            <p>This is a friendly reminder that your training session is scheduled for <strong>tomorrow</strong>!</p>
            <p><strong>Date:</strong> ${bookingDate}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p>See you there!</p>
            <br>
            <p>Cahya Mata Oiltools</p>
          `
        });

        Logger.log('Reminder sent to: ' + email);
      }
    }
  } catch (error) {
    Logger.log('Error sending reminders: ' + error);
  }
}

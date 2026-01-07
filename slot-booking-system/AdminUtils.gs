/**
 * Admin Utilities for Training Slot Booking System
 * Helper functions for system management and maintenance
 *
 * Add this file to your Apps Script project for additional admin capabilities
 */

/**
 * View all bookings in a formatted way
 */
function viewAllBookings() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
  const data = bookingsSheet.getDataRange().getValues();

  Logger.log('=== ALL BOOKINGS ===');
  Logger.log(`Total Bookings: ${data.length - 1}`);
  Logger.log('');

  for (let i = 1; i < data.length; i++) {
    Logger.log(`Booking #${i}:`);
    Logger.log(`  Name: ${data[i][2]}`);
    Logger.log(`  Email: ${data[i][1]}`);
    Logger.log(`  Date: ${data[i][4]}`);
    Logger.log(`  Time: ${data[i][5]}`);
    Logger.log(`  Booked at: ${data[i][0]}`);
    Logger.log('');
  }
}

/**
 * Get booking statistics
 */
function getDetailedStats() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
  const slotsSheet = ss.getSheetByName(SHEET_NAME);

  const bookingsData = bookingsSheet.getDataRange().getValues();
  const slotsData = slotsSheet.getDataRange().getValues();

  // Count bookings per slot
  const slotCounts = {};
  for (let i = 1; i < bookingsData.length; i++) {
    const slotId = bookingsData[i][3];
    slotCounts[slotId] = (slotCounts[slotId] || 0) + 1;
  }

  // Find most popular slots
  const popularity = [];
  for (let i = 1; i < slotsData.length; i++) {
    const slotId = slotsData[i][0];
    const count = slotCounts[slotId] || 0;
    popularity.push({
      slot: slotId,
      date: slotsData[i][1],
      time: slotsData[i][2],
      bookings: count,
      capacity: slotsData[i][4],
      percentFull: (count / slotsData[i][4] * 100).toFixed(1) + '%'
    });
  }

  popularity.sort((a, b) => b.bookings - a.bookings);

  Logger.log('=== BOOKING STATISTICS ===');
  Logger.log(`Total Bookings: ${bookingsData.length - 1}`);
  Logger.log(`Total Slots: ${slotsData.length - 1}`);
  Logger.log('');
  Logger.log('Most Popular Slots:');

  for (let i = 0; i < Math.min(5, popularity.length); i++) {
    Logger.log(`${i + 1}. ${popularity[i].date} at ${popularity[i].time}`);
    Logger.log(`   ${popularity[i].bookings}/${popularity[i].capacity} booked (${popularity[i].percentFull})`);
  }

  return popularity;
}

/**
 * Cancel a specific booking
 * @param {string} email - User's email to cancel
 */
function cancelBooking(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
  const slotsSheet = ss.getSheetByName(SHEET_NAME);

  const bookingsData = bookingsSheet.getDataRange().getValues();

  // Find the booking
  for (let i = 1; i < bookingsData.length; i++) {
    if (bookingsData[i][1] === email) {
      const slotId = bookingsData[i][3];

      // Delete the booking row
      bookingsSheet.deleteRow(i + 1);

      // Decrease booked count in slots
      const slotsData = slotsSheet.getDataRange().getValues();
      for (let j = 1; j < slotsData.length; j++) {
        if (slotsData[j][0] === slotId) {
          const currentBooked = slotsData[j][3];
          slotsSheet.getRange(j + 1, 4).setValue(Math.max(0, currentBooked - 1));
          break;
        }
      }

      Logger.log(`Booking cancelled for: ${email}`);

      // Optionally send cancellation email
      MailApp.sendEmail({
        to: email,
        subject: 'Training Booking Cancelled',
        body: `Your training booking has been cancelled. Please contact us if this was done in error.`
      });

      return true;
    }
  }

  Logger.log(`No booking found for: ${email}`);
  return false;
}

/**
 * Add a new training slot manually
 * @param {string} date - Date string (e.g., "Monday, January 15, 2026")
 * @param {string} time - Time range (e.g., "09:00 AM - 11:00 AM")
 * @param {number} capacity - Maximum capacity (default 20)
 */
function addSlot(date, time, capacity = 20) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const slotsSheet = ss.getSheetByName(SHEET_NAME);

  // Generate unique ID
  const timestamp = new Date().getTime();
  const id = `slot-custom-${timestamp}`;

  slotsSheet.appendRow([id, date, time, 0, capacity]);

  Logger.log(`Slot added: ${date} at ${time}`);
  Logger.log(`Slot ID: ${id}`);

  return id;
}

/**
 * Remove a slot (only if no bookings)
 * @param {string} slotId - Slot ID to remove
 */
function removeSlot(slotId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const slotsSheet = ss.getSheetByName(SHEET_NAME);
  const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);

  // Check if slot has bookings
  const bookingsData = bookingsSheet.getDataRange().getValues();
  for (let i = 1; i < bookingsData.length; i++) {
    if (bookingsData[i][3] === slotId) {
      Logger.log('ERROR: Cannot remove slot with existing bookings!');
      return false;
    }
  }

  // Find and delete the slot
  const slotsData = slotsSheet.getDataRange().getValues();
  for (let i = 1; i < slotsData.length; i++) {
    if (slotsData[i][0] === slotId) {
      slotsSheet.deleteRow(i + 1);
      Logger.log(`Slot removed: ${slotId}`);
      return true;
    }
  }

  Logger.log(`Slot not found: ${slotId}`);
  return false;
}

/**
 * Export all bookings to CSV format
 */
function exportBookingsToCSV() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
  const data = bookingsSheet.getDataRange().getValues();

  let csv = '';

  // Add header
  csv += data[0].join(',') + '\n';

  // Add data rows
  for (let i = 1; i < data.length; i++) {
    csv += data[i].join(',') + '\n';
  }

  Logger.log('CSV Export:');
  Logger.log(csv);

  return csv;
}

/**
 * Send bulk reminder to all participants
 * @param {string} customMessage - Optional custom message
 */
function sendBulkReminder(customMessage = '') {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
  const data = bookingsSheet.getDataRange().getValues();

  const message = customMessage || 'This is a reminder about your upcoming training session.';

  let sentCount = 0;

  for (let i = 1; i < data.length; i++) {
    const email = data[i][1];
    const name = data[i][2];
    const date = data[i][4];
    const time = data[i][5];

    try {
      MailApp.sendEmail({
        to: email,
        subject: '📢 Training Reminder - Cahya Mata Oiltools',
        htmlBody: `
          <h2>Training Reminder</h2>
          <p>Dear ${name},</p>
          <p>${message}</p>
          <br>
          <p><strong>Your Schedule:</strong></p>
          <p>Date: ${date}</p>
          <p>Time: ${time}</p>
          <br>
          <p>See you there!</p>
          <p>Cahya Mata Oiltools Team</p>
        `
      });

      sentCount++;
      Logger.log(`Reminder sent to: ${email}`);

      // Respect Gmail quota - pause if needed
      if (sentCount % 50 === 0) {
        Utilities.sleep(1000); // Pause 1 second every 50 emails
      }
    } catch (error) {
      Logger.log(`Failed to send to ${email}: ${error}`);
    }
  }

  Logger.log(`Bulk reminder sent to ${sentCount} participants`);
  return sentCount;
}

/**
 * Find available slots
 */
function findAvailableSlots() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const slotsSheet = ss.getSheetByName(SHEET_NAME);
  const data = slotsSheet.getDataRange().getValues();

  Logger.log('=== AVAILABLE SLOTS ===');

  let availableCount = 0;

  for (let i = 1; i < data.length; i++) {
    const booked = data[i][3];
    const capacity = data[i][4];
    const spotsLeft = capacity - booked;

    if (spotsLeft > 0) {
      Logger.log(`${data[i][1]} at ${data[i][2]}`);
      Logger.log(`  ${spotsLeft} spots remaining`);
      availableCount++;
    }
  }

  Logger.log('');
  Logger.log(`Total available slots: ${availableCount}`);

  return availableCount;
}

/**
 * Reset all bookings (USE WITH CAUTION!)
 * This will delete all bookings and reset slot counts
 */
function resetAllBookings() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Reset All Bookings',
    'Are you sure you want to delete ALL bookings? This cannot be undone!',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
    const slotsSheet = ss.getSheetByName(SHEET_NAME);

    // Clear all bookings except header
    const lastRow = bookingsSheet.getLastRow();
    if (lastRow > 1) {
      bookingsSheet.deleteRows(2, lastRow - 1);
    }

    // Reset all slot counts to 0
    const slotsData = slotsSheet.getDataRange().getValues();
    for (let i = 1; i < slotsData.length; i++) {
      slotsSheet.getRange(i + 1, 4).setValue(0);
    }

    Logger.log('All bookings have been reset!');
    ui.alert('All bookings have been reset successfully.');
  } else {
    Logger.log('Reset cancelled by user');
  }
}

/**
 * Generate attendance report
 */
function generateAttendanceReport() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);

  // Create or get Attendance sheet
  let attendanceSheet = ss.getSheetByName('Attendance');
  if (!attendanceSheet) {
    attendanceSheet = ss.insertSheet('Attendance');
    attendanceSheet.getRange('A1:E1').setValues([['Date', 'Time', 'Name', 'Email', 'Attended']]);
    attendanceSheet.getRange('A1:E1').setFontWeight('bold');
    attendanceSheet.getRange('A1:E1').setBackground('#FFD700');
  } else {
    // Clear existing data
    attendanceSheet.clear();
    attendanceSheet.getRange('A1:E1').setValues([['Date', 'Time', 'Name', 'Email', 'Attended']]);
    attendanceSheet.getRange('A1:E1').setFontWeight('bold');
    attendanceSheet.getRange('A1:E1').setBackground('#FFD700');
  }

  const bookingsData = bookingsSheet.getDataRange().getValues();

  // Sort by date and time
  const sortedBookings = [];
  for (let i = 1; i < bookingsData.length; i++) {
    sortedBookings.push([
      bookingsData[i][4], // Date
      bookingsData[i][5], // Time
      bookingsData[i][2], // Name
      bookingsData[i][1], // Email
      '' // Attended (empty for manual checking)
    ]);
  }

  if (sortedBookings.length > 0) {
    attendanceSheet.getRange(2, 1, sortedBookings.length, 5).setValues(sortedBookings);

    // Add data validation for Attended column
    const attendedRange = attendanceSheet.getRange(2, 5, sortedBookings.length, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Yes', 'No', 'Late'], true)
      .build();
    attendedRange.setDataValidation(rule);
  }

  Logger.log('Attendance report generated successfully');
  Logger.log(`Sheet: ${ss.getUrl()}#gid=${attendanceSheet.getSheetId()}`);

  return attendanceSheet.getSheetId();
}

/**
 * Check for duplicate bookings (should not happen, but good to verify)
 */
function checkForDuplicates() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
  const data = bookingsSheet.getDataRange().getValues();

  const emails = {};
  const duplicates = [];

  for (let i = 1; i < data.length; i++) {
    const email = data[i][1];

    if (emails[email]) {
      duplicates.push(email);
    } else {
      emails[email] = true;
    }
  }

  if (duplicates.length > 0) {
    Logger.log('DUPLICATES FOUND:');
    duplicates.forEach(email => Logger.log(`  - ${email}`));
    return duplicates;
  } else {
    Logger.log('No duplicate bookings found. System integrity OK!');
    return [];
  }
}

/**
 * Menu creation for easy access
 * Run this once to add custom menu to Google Sheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Training Admin')
    .addItem('View All Bookings', 'viewAllBookings')
    .addItem('Get Statistics', 'getDetailedStats')
    .addItem('Find Available Slots', 'findAvailableSlots')
    .addSeparator()
    .addItem('Generate Attendance Report', 'generateAttendanceReport')
    .addItem('Check for Duplicates', 'checkForDuplicates')
    .addSeparator()
    .addItem('Send Bulk Reminder', 'sendBulkReminder')
    .addSeparator()
    .addItem('Reset All Bookings', 'resetAllBookings')
    .addToUi();
}

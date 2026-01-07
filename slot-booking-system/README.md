# 🎯 Cahya Mata Oiltools - Training Slot Booking System

An immersive, beautifully designed training slot booking system with Google Workspace integration, featuring ancient scroll designs, dramatic animations, and FOMO elements to encourage engagement.

## ✨ Features

### 🎨 Visual Experience
- **Animated Background**: Floating golden particles creating an ethereal atmosphere
- **Dramatic Transformations**: Calendar morphs into ancient scrolls with seal-breaking animations
- **Progress Tracking**: Real-time reading progress with visual indicators
- **Confetti Celebrations**: Celebratory animations for completed actions
- **Achievement Badges**: Instant feedback for user accomplishments

### 📅 Slot Booking System
- **Interactive Calendar**: Beautiful grid layout with hover effects
- **Capacity Indicators**: Visual progress bars showing slot availability
- **FOMO Elements**:
  - "Only X spots left!" warnings
  - Countdown timers for early bird bonuses
  - Social proof elements
  - Limited availability alerts
- **Real-time Updates**: Slots grey out when full
- **One Booking Per User**: Prevents double bookings

### 📜 Training Modules
- **Ancient Scroll Design**: Parchment texture with wax seal aesthetics
- **Interactive Unlocking**: Click red seal to open scrolls
- **Two Training Modules**:
  1. **Google Workspace Refresher**: Gmail, Calendar, Drive, Meet, Docs, Security
  2. **Cahya Mata Brand Refresher**: Identity, guidelines, communication, sustainability
- **Progress Tracking**: Scroll percentage indicator
- **Completion Detection**: Automatic recognition when user reaches 90%

### 📧 Email & Calendar Integration
- **Beautiful HTML Emails**: Scroll-themed confirmation emails
- **Google Calendar Integration**: Automatic event creation with reminders
- **Multi-reminder System**: 24 hours, 1 hour, and 30 minutes before
- **Training Materials Included**: Full syllabus in email

### 🎁 Surprise Features
- **Early Bird Rewards**: First 10 bookings get exclusive swag mention
- **Dynamic Animations**: Smooth transitions and transformations
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: Screen reader friendly with ARIA labels
- **Sound-ready**: Framework for adding sound effects (optional)
- **Achievement System**: Gamification elements
- **Auto-reminders**: Scheduled email reminders day before training

---

## 🚀 Deployment Guide

### Prerequisites
- Google Account with Google Workspace
- Google Apps Script access
- Google Sheets access

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: **"Cahya Mata Training Slots"**
4. Note the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Step 2: Set Up Google Apps Script

1. **Create a New Apps Script Project**:
   - Go to [Google Apps Script](https://script.google.com)
   - Click **"New Project"**
   - Name it: **"Training Slot Booking System"**

2. **Upload Files**:
   - Delete the default `Code.gs` content
   - Copy the content from `Code.gs` and paste it
   - Click the **"+"** next to Files
   - Add HTML file named `index`
   - Copy the content from `index.html` and paste it
   - Add another file: `appsscript.json`
   - Copy the content from `appsscript.json` and paste it

3. **Configure Spreadsheet ID**:
   - In `Code.gs`, find line 9:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
   ```
   - Replace `YOUR_SPREADSHEET_ID` with your actual Spreadsheet ID

4. **Initialize the Sheet**:
   - In the Apps Script editor, select `initializeSheet` function
   - Click **"Run"**
   - Authorize the script when prompted
   - Check your Google Sheet - it should now have two tabs: `TrainingSlots` and `Bookings`

### Step 3: Deploy as Web App

1. **Deploy**:
   - Click **"Deploy"** → **"New deployment"**
   - Click gear icon, select **"Web app"**
   - Configure:
     - **Description**: "Training Booking System v1.0"
     - **Execute as**: "Me"
     - **Who has access**: "Anyone within [Your Domain]" (for Google Workspace)
     - Or "Anyone" for public access (not recommended for internal use)
   - Click **"Deploy"**
   - Copy the **Web App URL**

2. **Test the Deployment**:
   - Open the Web App URL in a browser
   - You should see the loading screen, then the training portal
   - Test the booking flow

### Step 4: Customize Content (Optional)

#### Update Training Slots
Edit the `createSampleSlots` function in `Code.gs` to match your actual training dates and times.

#### Customize Training Content
In `index.html`, find the `getScrollContent` function (around line 850) and update:
- Google Workspace training topics
- Branding guidelines specific to your organization
- Add/remove sections as needed

#### Branding Customization
Update colors and styles in the `<style>` section:
- **Primary Color**: Search for `#ffd700` (gold) and replace
- **Background**: Search for `#1a1a2e`, `#16213e` (navy blues)
- **Font**: Change `'Cinzel'` and `'Spectral'` to your brand fonts

#### Email Template
Edit the `createEmailTemplate` function in `Code.gs` to customize:
- Company logo
- Contact information
- Footer content
- Color scheme

### Step 5: Set Up Automated Reminders (Optional)

1. In Apps Script, go to **Triggers** (clock icon)
2. Click **"Add Trigger"**
3. Configure:
   - **Function**: `sendReminders`
   - **Event source**: "Time-driven"
   - **Type**: "Day timer"
   - **Time**: Choose early morning (e.g., 8:00 AM)
4. Click **"Save"**

This will automatically send reminder emails to users 24 hours before their training.

---

## 📊 Google Sheet Structure

### TrainingSlots Sheet
| Column | Description |
|--------|-------------|
| A - ID | Unique slot identifier (e.g., "slot-1-0") |
| B - Date | Training date (formatted as "Monday, January 15, 2026") |
| C - Time | Time slot (e.g., "09:00 AM - 11:00 AM") |
| D - Booked | Number of current bookings |
| E - Capacity | Maximum capacity (default: 20) |

### Bookings Sheet
| Column | Description |
|--------|-------------|
| A - Timestamp | When the booking was made |
| B - Email | User's email address |
| C - Name | User's name |
| D - Slot ID | Reference to TrainingSlots |
| E - Date | Training date |
| F - Time | Training time |

---

## 🎨 Customization Guide

### Adding More Training Slots

1. Open your Google Sheet
2. Go to the "TrainingSlots" tab
3. Add new rows with:
   - Unique ID
   - Date
   - Time
   - Initial booked count (usually 0)
   - Capacity (usually 20)

### Changing Slot Capacity

Default capacity is 20. To change:
1. Update the Google Sheet directly
2. Or modify the `createSampleSlots` function in `Code.gs` (line with `20`)

### Adding More Training Modules

To add a third scroll:

1. **In `index.html`**, find the scrolls-container section (around line 650)
2. Add a new scroll:
```html
<div class="scroll" data-scroll="newmodule">
    <div class="scroll-seal">
        <div class="seal-icon">🔒</div>
    </div>
    <div class="scroll-title">New Module Title</div>
</div>
```

3. **In the JavaScript section**, update the `getScrollContent` function to include your new content:
```javascript
const contents = {
    google: `...existing...`,
    branding: `...existing...`,
    newmodule: `
        <h2>Your New Module</h2>
        <p>Content here...</p>
    `
};
```

4. **Update tracking**:
```javascript
userData.newmoduleProgress = 0;
userData.completedNewmodule = false;
```

### Styling Changes

All styles are in the `<style>` section of `index.html`. Key sections:

- **Colors**: Search for hex codes (e.g., `#ffd700`, `#16213e`)
- **Fonts**: Update Google Fonts link and `font-family` properties
- **Animations**: Modify `@keyframes` sections
- **Layout**: Adjust grid properties in `.slots-grid`

---

## 🔒 Security Considerations

### Access Control
- Set deployment to "Anyone within [Your Domain]" for internal use only
- The script automatically captures user email via Google authentication
- One booking per user is enforced

### Data Privacy
- User emails are stored in Google Sheets (within your domain)
- No external data transmission
- All data stays within Google Workspace ecosystem

### Best Practices
1. Regularly backup your Google Sheet
2. Monitor bookings for duplicates
3. Test changes in a copy before updating production
4. Use version control for the scripts (deploy new versions)

---

## 📱 Mobile Optimization

The system is fully responsive:
- **Desktop**: Full grid layout with hover effects
- **Tablet**: Adjusted grid, touch-friendly
- **Mobile**: Single column, optimized scrolling

Test on multiple devices before launch.

---

## 🐛 Troubleshooting

### "Script not authorized" Error
**Solution**: Run `initializeSheet` function manually and authorize all permissions.

### Slots Not Loading
**Solution**:
1. Check `SPREADSHEET_ID` in `Code.gs`
2. Ensure the sheet has "TrainingSlots" tab
3. Check browser console for errors

### Emails Not Sending
**Solution**:
1. Verify email quota (Gmail has daily limits)
2. Check spam folder
3. Ensure correct email addresses
4. Review Apps Script execution logs

### Calendar Events Not Creating
**Solution**:
1. Uncomment calendar code in `createCalendarEvent` function
2. Parse date/time strings correctly for your format
3. Ensure calendar permissions are granted

### Booking Fails
**Solution**:
1. Check if slot is full
2. Verify user hasn't already booked
3. Check Apps Script logs for errors

---

## 🎯 Usage Analytics

### Track Bookings
View the "Bookings" sheet to see:
- Who booked
- When they booked
- Which slots are popular

### Monitor Capacity
The "TrainingSlots" sheet shows real-time capacity for each slot.

### Export Data
Download sheets as CSV for external analysis.

---

## 🚀 Advanced Features (Future Enhancements)

### Potential Additions:
- **Waitlist System**: Auto-promote when someone cancels
- **Multi-language Support**: Toggle between English/Malay/Chinese
- **Certificate Generation**: Auto-create completion certificates
- **Quiz Integration**: Test knowledge after reading modules
- **Video Embeds**: Add training videos to scrolls
- **Chat Support**: Live chat for questions
- **Admin Dashboard**: Manage slots and view analytics
- **SMS Reminders**: Via third-party integration
- **QR Code Check-in**: For in-person attendance
- **Feedback Forms**: Post-training surveys

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Google Apps Script documentation
3. Contact your Google Workspace administrator

---

## 📄 License

This project is proprietary to Cahya Mata Oiltools. All rights reserved.

---

## 🙏 Credits

**Designed and Developed for Cahya Mata Oiltools**

Technologies Used:
- Google Apps Script
- Google Sheets API
- Google Calendar API
- Gmail API
- HTML5 / CSS3 / JavaScript
- Google Fonts (Cinzel, Spectral)

---

## 📝 Version History

### v1.0.0 (Initial Release)
- ✅ Google Authentication
- ✅ Slot booking system with capacity management
- ✅ Ancient scroll design with animations
- ✅ Two training modules (Google Workspace & Branding)
- ✅ Progress tracking
- ✅ Email confirmations
- ✅ Calendar integration
- ✅ FOMO elements and achievements
- ✅ Responsive design
- ✅ Automated reminders

---

## 🎉 Enjoy Your Training Portal!

Your colleagues will love this immersive booking experience. The combination of beautiful design, smooth animations, and practical functionality creates an unforgettable user journey.

**Pro Tip**: Take screenshots of the booking process and share them with your team to build excitement before launch!

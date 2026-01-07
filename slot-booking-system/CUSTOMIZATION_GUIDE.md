# 🎨 Customization Guide

Easy copy-paste customizations for non-developers. No coding knowledge required!

---

## 📝 Updating Training Content

### Editing Google Workspace Module

**Location:** `index.html` - Line ~865 (inside `getScrollContent` function)

**Find this section:**
```html
google: `
    <h2>📧 Google Workspace Refresher</h2>
    <h3>🎯 Overview</h3>
    <p>Master the essential tools...</p>
```

**How to customize:**
1. Change the `<h2>` heading to your title
2. Add/remove `<h3>` sections as needed
3. Add/remove `<ul><li>` bullet points
4. Keep the HTML tags intact (`<h2>`, `<h3>`, `<p>`, `<ul>`, `<li>`)

**Example - Adding a new section:**
```html
<h3>🎵 Your New Section</h3>
<ul>
    <li><strong>Topic 1:</strong> Description here</li>
    <li><strong>Topic 2:</strong> Description here</li>
    <li><strong>Topic 3:</strong> Description here</li>
</ul>
```

---

### Editing Branding Module

**Location:** `index.html` - Line ~945 (inside `getScrollContent` function)

**Find this section:**
```html
branding: `
    <h2>🎨 Cahya Mata Oiltools Brand Refresher</h2>
    <h3>🌟 Our Brand Identity</h3>
    <p>Cahya Mata Oiltools stands as...</p>
```

**Same structure as above** - just change the text content.

---

## 🎨 Changing Colors

### Primary Gold Color

**Find and replace ALL occurrences:**
- Current: `#ffd700`
- Replace with: `#YOUR_COLOR`

**Common alternatives:**
- Orange: `#ff9800`
- Green: `#4ade80`
- Blue: `#3b82f6`
- Purple: `#a855f7`

### Background Navy Color

**Find and replace:**
- Current: `#16213e` and `#0f3460`
- Replace with your brand colors

**Example combinations:**
- Tech Blue: `#1e3a8a` and `#1e40af`
- Forest Green: `#064e3b` and `#065f46`
- Royal Purple: `#581c87` and `#6b21a8`

---

## 🏢 Changing Company Name

**Find and replace ALL instances of:**
- `Cahya Mata Oiltools` → `Your Company Name`

**Files to update:**
1. `index.html` - All occurrences
2. `Code.gs` - Email templates
3. `ANNOUNCEMENT_EMAIL_TEMPLATE.html`

**Quick Find:**
- Press `Ctrl+F` (Windows) or `Cmd+F` (Mac)
- Type: `Cahya Mata Oiltools`
- Replace all with your company name

---

## 📅 Adding Training Slots

### Option 1: Directly in Google Sheet

1. Open your Google Sheet
2. Go to "TrainingSlots" tab
3. Add a new row:
   - **Column A (ID):** `slot-custom-1` (must be unique)
   - **Column B (Date):** `Monday, January 20, 2026`
   - **Column C (Time):** `09:00 AM - 11:00 AM`
   - **Column D (Booked):** `0`
   - **Column E (Capacity):** `20`

### Option 2: Using Admin Utils

1. Open Apps Script
2. Select `addSlot` function
3. Modify the test parameters:
```javascript
function testAddSlot() {
  addSlot("Monday, January 20, 2026", "09:00 AM - 11:00 AM", 20);
}
```
4. Run the function

---

## ✉️ Customizing Email Template

**Location:** `Code.gs` - `createEmailTemplate` function (around line 200)

### Change Email Subject

**Find:**
```javascript
subject: '🎉 Training Confirmation - Cahya Mata Oiltools',
```

**Change to:**
```javascript
subject: '🎉 Your Custom Subject Here',
```

### Change Email Header

**Find:**
```html
<h1>Training Confirmation</h1>
<p style="color: #5c3a21; font-size: 1.2em;">Cahya Mata Oiltools</p>
```

**Change to:**
```html
<h1>Your Custom Title</h1>
<p style="color: #5c3a21; font-size: 1.2em;">Your Company Name</p>
```

### Change Tagline

**Find:**
```
Powering Progress, Ensuring Safety
```

**Replace with:**
```
Your Company Tagline Here
```

---

## 🎯 Modifying FOMO Elements

### Changing "First 10 Bookings" Message

**Location:** `index.html` - Line ~650

**Find:**
```html
<div class="countdown-timer">
    ⏰ Early Bird Bonus: First 10 Bookings Get Exclusive Swag!
</div>
```

**Change to:**
```html
<div class="countdown-timer">
    ⏰ Your Custom FOMO Message Here!
</div>
```

### Changing "Limited Seats" Banner

**Location:** `index.html` - Line ~645

**Find:**
```html
<div class="fomo-banner">
    🔥 Limited Seats Available! Book Now! 🔥
</div>
```

**Change to:**
```html
<div class="fomo-banner">
    🚀 Your Urgent Message Here! 🚀
</div>
```

---

## 📱 Changing Slot Capacity

### Default Capacity (20 people)

**Option 1: In Google Sheet**
- Change Column E value for any slot

**Option 2: In Code**

**Location:** `Code.gs` - Line ~65

**Find:**
```javascript
slots.push([id, dateStr, time, booked, 20]);
```

**Change to:**
```javascript
slots.push([id, dateStr, time, booked, 30]); // Now 30 people per slot
```

---

## 🖼️ Adding Your Company Logo

### Option 1: In Email Template

**Location:** `Code.gs` - `createEmailTemplate` function

**Find the header section and add:**
```html
<div class="header">
    <img src="YOUR_LOGO_URL" alt="Company Logo" style="max-width: 200px; margin-bottom: 20px;">
    <h1>Training Confirmation</h1>
    ...
</div>
```

**Where to get YOUR_LOGO_URL:**
1. Upload logo to Google Drive
2. Right-click → "Get link"
3. Change permissions to "Anyone with the link"
4. Copy the file ID from URL
5. Use: `https://drive.google.com/uc?id=FILE_ID`

### Option 2: In Main Portal

**Location:** `index.html` - Line ~640 (header section)

**Add after the `<h1>` tag:**
```html
<img src="YOUR_LOGO_URL" alt="Company Logo" style="max-width: 150px; margin-bottom: 15px;">
```

---

## 🔔 Changing Reminder Timing

**Location:** `Code.gs` - `sendReminders` function (line ~360)

**Current:** Sends reminders 1 day before

**To change to 2 days before:**

**Find:**
```javascript
tomorrow.setDate(tomorrow.getDate() + 1);
```

**Change to:**
```javascript
tomorrow.setDate(tomorrow.getDate() + 2);
```

**To change reminder subject:**

**Find:**
```javascript
subject: '⏰ Training Reminder - Tomorrow!',
```

**Change to:**
```javascript
subject: '⏰ Your Custom Reminder Subject',
```

---

## 📝 Modifying Scroll Titles

**Location:** `index.html` - Line ~670

**Find:**
```html
<div class="scroll-title">Google Workspace Refresher</div>
```

**Change to:**
```html
<div class="scroll-title">Your Custom Module Name</div>
```

---

## ⚙️ Changing Number of Training Days

**Location:** `Code.gs` - `createSampleSlots` function (line ~60)

**Find:**
```javascript
for (let i = 1; i <= 15; i++) {
```

**Change to:**
```javascript
for (let i = 1; i <= 30; i++) { // Now creates 30 days of slots
```

---

## 🎨 Changing Fonts

### Current Fonts:
- Headings: `Cinzel` (elegant serif)
- Body: `Spectral` (readable serif)

### To Change:

**Location:** `index.html` - Line ~10 (Google Fonts import)

**Find:**
```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Spectral:wght@300;400;600&display=swap" rel="stylesheet">
```

**Replace with your fonts from [Google Fonts](https://fonts.google.com):**
```html
<link href="https://fonts.googleapis.com/css2?family=YourFont:wght@400;700&display=swap" rel="stylesheet">
```

**Then find and replace in CSS:**
- `'Cinzel'` → `'YourHeadingFont'`
- `'Spectral'` → `'YourBodyFont'`

---

## 🌐 Changing Time Zone

**Location:** `appsscript.json` - Line 2

**Find:**
```json
"timeZone": "Asia/Kuala_Lumpur",
```

**Change to your timezone:**
```json
"timeZone": "America/New_York",
```

**Common time zones:**
- New York: `America/New_York`
- London: `Europe/London`
- Singapore: `Asia/Singapore`
- Dubai: `Asia/Dubai`
- Sydney: `Australia/Sydney`

[Full list of timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

---

## 📊 Testing Your Changes

After making changes:

1. **Save all files**
2. **Deploy new version:**
   - Apps Script → Deploy → "Manage deployments"
   - Click pencil icon → "New version"
   - Deploy
3. **Test in incognito mode** (simulates fresh user)
4. **Check on mobile device**

---

## 🚨 Common Mistakes to Avoid

❌ **DON'T** remove closing tags (`</div>`, `</h2>`, etc.)
✅ **DO** keep HTML structure intact

❌ **DON'T** change function names in Code.gs
✅ **DO** only change string values in quotes

❌ **DON'T** delete comma in arrays/objects
✅ **DO** keep proper JSON/JavaScript syntax

❌ **DON'T** change SPREADSHEET_ID format
✅ **DO** copy-paste exact ID from sheet URL

---

## 💾 Backup Before Customizing

**Always:**
1. Make a copy of your Google Sheet
2. Save original files locally
3. Test changes in a copy first
4. Deploy as new version (don't overwrite)

---

## 🆘 Undo Changes

If something breaks:

1. **Apps Script:**
   - Deploy → Manage deployments
   - Switch to previous version

2. **Google Sheet:**
   - File → Version history
   - Restore previous version

3. **Code:**
   - Keep backups of original files
   - Copy-paste original code back

---

## 📞 Need More Help?

**Resources:**
- Full documentation: `README.md`
- Quick start: `QUICKSTART.md`
- Admin functions: `AdminUtils.gs`

**Online Resources:**
- [Google Apps Script Docs](https://developers.google.com/apps-script)
- [HTML/CSS Tutorial](https://www.w3schools.com/)
- [Google Sheets Help](https://support.google.com/sheets)

---

## ✅ Customization Checklist

Before launching:

- [ ] Company name updated everywhere
- [ ] Colors match your brand
- [ ] Training content is accurate
- [ ] Email template customized
- [ ] Logo added (if desired)
- [ ] Slots created for correct dates
- [ ] Time zone set correctly
- [ ] Tested booking flow completely
- [ ] Email sending works
- [ ] Calendar integration tested
- [ ] Checked on mobile device
- [ ] Announcement email ready

---

**Happy Customizing! 🎨**

Remember: Small changes first, test often, backup everything!

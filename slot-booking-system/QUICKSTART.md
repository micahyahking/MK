# ⚡ Quick Start Guide - 5 Minutes to Launch

Get your training portal running in just 5 minutes!

## 🎯 Step-by-Step (5 Minutes)

### Minute 1: Create Google Sheet
1. Go to https://sheets.google.com
2. Click "Blank" to create new sheet
3. Name it: "Cahya Mata Training Slots"
4. Copy the ID from URL (the long string between `/d/` and `/edit`)

### Minute 2: Set Up Apps Script
1. Go to https://script.google.com
2. Click "New Project"
3. Name it: "Training Booking System"
4. Delete the default code

### Minute 3: Upload Files
1. Paste `Code.gs` content into the editor
2. Update line 9 with your Spreadsheet ID:
   ```javascript
   const SPREADSHEET_ID = 'paste-your-id-here';
   ```
3. Click "+" next to Files → "HTML"
4. Name it: `index`
5. Paste `index.html` content

### Minute 4: Initialize & Test
1. Select `initializeSheet` from dropdown
2. Click "Run"
3. Authorize when prompted (click "Advanced" → "Go to...")
4. Check your Google Sheet - should have 2 tabs now!

### Minute 5: Deploy
1. Click "Deploy" → "New deployment"
2. Click gear icon → "Web app"
3. Set "Who has access" to your preference
4. Click "Deploy"
5. Copy the Web App URL
6. Open it in browser → **YOU'RE LIVE!** 🎉

---

## 🎨 Quick Customizations

### Change Your Company Name
Search and replace in `index.html`:
- "Cahya Mata Oiltools" → "Your Company Name"

### Update Training Dates
Edit the `TrainingSlots` sheet in Google Sheets directly:
- Add/remove rows
- Change dates and times
- Adjust capacity

### Modify Colors
In `index.html`, find these hex codes and replace:
- `#ffd700` (Gold) → Your brand color
- `#16213e` (Navy) → Your background color

---

## ✅ Checklist

Before launching to your team:

- [ ] Spreadsheet created and ID updated
- [ ] Apps Script deployed as web app
- [ ] Tested booking flow yourself
- [ ] Customized company name
- [ ] Updated training content (optional)
- [ ] Set up automated reminders trigger (optional)
- [ ] Shared web app URL with team
- [ ] Tested on mobile device

---

## 🚨 Common First-Time Issues

**"Script not authorized"**
→ Click "Advanced" then "Go to [project name]" during authorization

**"Slots not showing"**
→ Make sure you ran `initializeSheet` function first

**"Can't find spreadsheet"**
→ Double-check the SPREADSHEET_ID in Code.gs line 9

**"Email not sending"**
→ Check your Gmail sending limits, try sending test from Apps Script

---

## 📞 Need Help?

1. Check the full README.md for detailed guide
2. Review Google Apps Script documentation
3. Test in incognito mode to simulate user experience

---

## 🎉 You're Ready!

Share the Web App URL with your team and watch the bookings roll in!

**Pro Tip**: Send a teaser email with a screenshot before sharing the link to build anticipation!

# CSR System Email Audit Report
**Date:** 2026-01-05
**System:** CSR Management System v4.0

---

## EXECUTIVE SUMMARY

This report analyzes all email templates to identify **missing data fields** in email notifications. The system captures extensive data during submission but **only passes partial information** to email recipients.

---

## FIELDS CAPTURED IN DATABASE (Code.gs:1153-1199)

### User Information
- ✅ CSR Rep Name (D)
- ✅ CSR Rep Email (E)
- ✅ CSR Rep Company (F)
- ✅ Requester Name (G)
- ✅ Requester Email (H)
- ✅ Requester Contact (I)
- ✅ Organization Name (J)
- ✅ Organization NRIC/RN (K)

### Request Details
- ✅ Request Type (L)
- ✅ Event Name (M)
- ✅ Event Date (N)
- ✅ Event Location (O)
- ✅ Event Focus Area (P)
- ✅ Event Description (Q)
- ✅ Event Objectives (R)
- ✅ Amount Requested (S)
- ✅ Purpose (T)

### Payment Information
- ✅ Payee Name (U)
- ✅ Payee Bank (V)
- ✅ Payee Account (W)

### Documents & Metadata
- ✅ Supporting Documents (X)
- ✅ Verification Checklist (Y)
- ✅ Contribution History (Z)
- ✅ SDG Goals (AW)
- ✅ Impact Category (AX)
- ✅ Beneficiary Count (AY)
- ✅ Geographic Area (AZ)
- ✅ Duration (BA)

---

## EMAIL ANALYSIS BY TYPE

### 📧 EMAIL 1: Acknowledgement (Code.gs:2597-2632)

**Sent To:** Requester
**CC:** CSR Rep

**Variables Passed:**
```javascript
{
  REQUEST_ID: requestId,
  REQUESTER_NAME: requestData.requesterName,
  ORGANIZATION: requestData.organizationName,
  AMOUNT: requestData.amountRequested,
  PURPOSE: requestData.purpose,
  REQUEST_TYPE: requestData.requestType,
  SUBMISSION_DATE: new Date().toLocaleDateString()
}
```

**Template Shows (Code.gs:3664-3719):**
- ✅ Request ID
- ✅ Organization
- ✅ Request Type
- ✅ Amount
- ✅ Submission Date

**❌ MISSING CRITICAL FIELDS:**
- ❌ Event Name
- ❌ Event Date
- ❌ Event Location
- ❌ Event Description
- ❌ Event Objectives
- ❌ Requester Contact Number
- ❌ Organization NRIC/RN
- ❌ Duration
- ❌ Purpose (only briefly mentioned, not detailed)

**IMPACT:** Requester gets minimal confirmation, cannot verify all submitted details

---

### 📧 EMAIL 2: CSR Verification Request (Code.gs:2638-2677)

**Sent To:** CSR Team (michaelk@cahyamata.com)

**Variables Passed:**
```javascript
{
  REQUEST_ID: requestId,
  REQUESTER_NAME: requestData.requesterName,
  ORGANIZATION: requestData.organizationName,
  AMOUNT: requestData.amountRequested,
  PURPOSE: requestData.purpose,
  REQUEST_TYPE: requestData.requestType,
  RECOMMEND_URL: recommendUrl,
  REJECT_URL: rejectUrl
}
```

**Template Shows (Code.gs:3724-3780):**
- ✅ Request ID
- ✅ Requester Name
- ✅ Organization
- ✅ Request Type
- ✅ Amount
- ✅ Purpose

**❌ MISSING CRITICAL VERIFICATION FIELDS:**
- ❌ **Event Name** - CSR team can't identify the event!
- ❌ **Event Date** - Critical for scheduling verification
- ❌ **Event Location** - Need to know where it's happening
- ❌ **Event Description** - Context for verification
- ❌ **Event Objectives** - Impact assessment
- ❌ **Requester Email** - Can't contact requester directly
- ❌ **Requester Contact** - Phone number for follow-up
- ❌ **Organization NRIC/RN** - Legal verification
- ❌ **Payee Name** - Who gets the money
- ❌ **Payee Bank** - Banking verification
- ❌ **Payee Account** - Account verification
- ❌ **Supporting Documents List** - What docs were uploaded
- ❌ **Beneficiary Count** - Impact scale
- ❌ **Geographic Area** - Regional priority
- ❌ **Duration** - Timeline
- ❌ **SDG Goals** - Alignment check
- ❌ **Contribution History** - Past performance

**IMPACT:** ⚠️ **CRITICAL** - CSR team must open spreadsheet to verify, defeating email workflow purpose!

---

### 📧 EMAIL 3: GCC Approval Request (Code.gs:2750-2792)

**Sent To:** Head of GCC (jason.lee@cahyamata.com)

**Variables Passed:**
```javascript
{
  REQUEST_ID: requestId,
  REQUESTER_NAME: data[6] || data[3],
  ORGANIZATION: data[9] || "",
  AMOUNT: formatCurrency(data[18]),
  PURPOSE: data[19] || "",
  REQUEST_TYPE: data[11] || "",
  CSR_COMMENTS: csrComments,
  RECOMMEND_URL: recommendUrl,
  REJECT_URL: rejectUrl
}
```

**Template Shows (Code.gs:3785-3846):**
- ✅ Request ID
- ✅ Requester Name
- ✅ Organization
- ✅ Request Type
- ✅ Amount
- ✅ Purpose
- ✅ CSR Team Comments

**❌ MISSING CRITICAL APPROVAL FIELDS:**
- ❌ **Event Name** - What event is being approved?
- ❌ **Event Date** - When does GM need to attend/review?
- ❌ **Event Location** - Geographic consideration
- ❌ **Event Description** - Full context
- ❌ **Event Objectives** - Success criteria
- ❌ **Payee Details** - Who receives funds (critical for approval!)
- ❌ **Beneficiary Count** - Impact scale for decision
- ❌ **Duration** - Project timeline
- ❌ **SDG Alignment** - Strategic fit
- ❌ **Requester Contact** - Direct communication

**IMPACT:** ⚠️ **CRITICAL** - GCC/GM cannot make informed approval decision from email alone!

---

### 📧 EMAIL 4: PDF Generated (Code.gs:2944-2968)

**Sent To:** CSR Team

**Variables Passed:**
```javascript
{
  REQUEST_ID: requestId,
  REQUESTER_NAME: data[6] || data[3],
  ORGANIZATION: data[9] || "",
  AMOUNT: formatCurrency(data[18]),
  PDF_URL: pdfUrl,
  GCC_COMMENTS: gccComments,
  ADMIN_URL: ScriptApp.getService().getUrl() + "?page=admin"
}
```

**Template Shows (Code.gs:3851-3911):**
- ✅ Request ID
- ✅ Requester Name
- ✅ Organization
- ✅ Amount
- ✅ PDF Download Link
- ✅ GCC Comments
- ✅ Admin Panel Link

**❌ MISSING FIELDS:**
- ❌ Event Name
- ❌ Event Date (important for signature collection urgency)
- ❌ Approval deadline

**IMPACT:** Moderate - CSR team has PDF, but lacks context for prioritization

---

### 📧 EMAIL 5: Approval Success (Code.gs:3129-3165)

**Sent To:** Requester
**CC:** CSR Rep

**Variables Passed:**
```javascript
{
  REQUEST_ID: requestId,
  REQUESTER_NAME: data[6] || data[3],
  ORGANIZATION: data[9] || "",
  AMOUNT: formatCurrency(data[18]),
  APPROVAL_DATE: new Date().toLocaleDateString(),
  SIGNED_PDF_URL: signedPdfUrl,
  FOLDER_URL: folderUrl
}
```

**Template Shows (Code.gs:3916-3983):**
- ✅ Request ID
- ✅ Requester Name
- ✅ Organization
- ✅ Approved Amount
- ✅ Approval Date
- ✅ Signed PDF Link
- ✅ Google Drive Folder Link

**❌ MISSING FIELDS:**
- ❌ Event Name (requester doesn't know which event was approved!)
- ❌ Event Date (when can they proceed?)
- ❌ Purpose reminder
- ❌ Payee account confirmation (where money goes)
- ❌ CSR Rep contact (who to reach for questions)

**IMPACT:** ⚠️ **MODERATE** - If requester submitted multiple requests, they can't tell which one was approved!

---

### 📧 EMAIL 6: GMD Notification (Code.gs:3171-3223)

**Sent To:** GMD

**Variables Passed:**
```javascript
{
  REQUEST_ID: requestId,
  REQUESTER_NAME: data[6] || data[3],
  ORGANIZATION: data[9] || "",
  AMOUNT: formatCurrency(data[18]),
  PURPOSE: data[19] || "",
  APPROVAL_DATE: new Date().toLocaleDateString(),
  SIGNED_PDF_URL: signedPdfUrl
}
```

**Template Shows (Code.gs:3988-4040):**
- ✅ Request ID
- ✅ Requester Name
- ✅ Organization
- ✅ Amount
- ✅ Purpose
- ✅ Approval Date
- ✅ PDF Link

**❌ MISSING FIELDS:**
- ❌ Event Name
- ❌ Event Date
- ❌ Event Location
- ❌ SDG Impact Summary
- ❌ Beneficiary Count

**IMPACT:** Low - FYI email, but GMD lacks full context

---

### 📧 EMAIL 7: Folder Created (Code.gs:3227-3250)

**Sent To:** CSR Rep

**Variables Passed:**
```javascript
{
  REQUEST_ID: requestId,
  CSR_REP_NAME: data[3],
  REQUESTER_NAME: data[6] || data[3],
  ORGANIZATION: data[9] || "",
  FOLDER_URL: folderUrl
}
```

**Template Shows (Code.gs:4045-4099):**
- ✅ Request ID
- ✅ CSR Rep Name
- ✅ Requester Name
- ✅ Organization
- ✅ Folder URL

**❌ MISSING FIELDS:**
- ❌ Event Name
- ❌ Event Date
- ❌ Requester Email (to forward the link)
- ❌ Upload deadline

**IMPACT:** Moderate - CSR Rep doesn't know which event to remind about

---

### 📧 EMAIL 8: Weekly Story Reminder (Code.gs:3377-3398)

**Sent To:** CSR Rep

**Variables Passed:**
```javascript
{
  REQUEST_ID: requestId,
  CSR_REP_NAME: "",  // ⚠️ EMPTY!
  FOLDER_URL: folderUrl,
  REMINDER_COUNT: reminderCount + 1
}
```

**Template Shows (Code.gs:4104-4157):**
- ✅ Request ID
- ❌ CSR Rep Name (EMPTY in code!)
- ✅ Folder URL
- ✅ Reminder Count

**❌ MISSING CRITICAL FIELDS:**
- ❌ Event Name (which event needs documentation?)
- ❌ Event Date (how overdue is it?)
- ❌ Organization Name
- ❌ Requester Name
- ❌ Days since approval

**IMPACT:** ⚠️ **HIGH** - CSR Rep gets generic reminder with no context about which event!

---

### 📧 EMAIL 9: Rejection (Code.gs:3404-3443)

**Sent To:** Requester

**Variables Passed:**
```javascript
{
  REQUEST_ID: requestId,
  REQUESTER_NAME: data[6] || data[3],
  ORGANIZATION: data[9] || "",
  AMOUNT: formatCurrency(data[18]),
  REJECTED_BY: rejectedBy,
  REASON: reason
}
```

**Template Shows (Code.gs:4162-4224):**
- ✅ Request ID
- ✅ Requester Name
- ✅ Organization
- ✅ Amount
- ✅ Rejected By
- ✅ Reason

**❌ MISSING FIELDS:**
- ❌ Event Name (which request was rejected?)
- ❌ Request Type
- ❌ Purpose

**IMPACT:** Moderate - Requester can identify from ID, but lacks detail

---

## CRITICAL GAPS SUMMARY

### 🔴 HIGHEST PRIORITY (Breaks Workflow)

1. **EMAIL 2 (CSR Verification)** - Missing almost ALL event details
   - CSR team cannot verify without opening spreadsheet
   - Defeats purpose of email-based workflow

2. **EMAIL 3 (GCC Approval)** - Missing event context
   - GCC/GM cannot make informed decision
   - Lacks payee information (critical for financial approval!)

3. **EMAIL 8 (Weekly Reminder)** - Missing event identification
   - CSR Rep name is EMPTY
   - No event name to know what to follow up on

### 🟡 MEDIUM PRIORITY (Reduces Efficiency)

4. **EMAIL 5 (Approval Success)** - Missing event name
   - Requester with multiple submissions can't identify which one

5. **EMAIL 1 (Acknowledgement)** - Missing submission details
   - Requester can't verify all data was captured correctly

### 🟢 LOW PRIORITY (Nice to Have)

6. **EMAIL 6 (GMD Notification)** - Missing impact metrics
7. **EMAIL 7 (Folder Created)** - Missing requester contact to forward link

---

## RECOMMENDED ADDITIONS BY EMAIL

### EMAIL 1 (Acknowledgement)
```javascript
// ADD these fields:
EVENT_NAME: requestData.eventName || "N/A",
EVENT_DATE: requestData.eventDate || "N/A",
EVENT_LOCATION: requestData.eventLocation || "N/A",
REQUESTER_CONTACT: requestData.requesterContact || "N/A",
ORGANIZATION_NRIC: requestData.organizationNRIC || "N/A",
DURATION: requestData.duration || "N/A"
```

### EMAIL 2 (CSR Verification) ⚠️ CRITICAL
```javascript
// ADD these fields:
EVENT_NAME: requestData.eventName || "N/A",
EVENT_DATE: requestData.eventDate || "TBD",
EVENT_LOCATION: requestData.eventLocation || "N/A",
EVENT_DESCRIPTION: requestData.eventDescription || "N/A",
EVENT_OBJECTIVES: requestData.eventObjectives || "N/A",
EVENT_FOCUS_AREA: requestData.eventFocusArea || "N/A",
REQUESTER_EMAIL: requestData.requesterEmail || "N/A",
REQUESTER_CONTACT: requestData.requesterContact || "N/A",
ORGANIZATION_NRIC: requestData.organizationNRIC || "N/A",
PAYEE_NAME: requestData.payeeName || "N/A",
PAYEE_BANK: requestData.payeeBank || "N/A",
PAYEE_ACCOUNT: requestData.payeeAccount || "N/A",
BENEFICIARY_COUNT: requestData.beneficiaryCount || "N/A",
GEOGRAPHIC_AREA: requestData.geographicArea || "N/A",
DURATION: requestData.duration || "N/A",
SDG_GOALS: (requestData.sdgGoals || []).join(", ") || "None specified"
```

### EMAIL 3 (GCC Approval) ⚠️ CRITICAL
```javascript
// ADD these fields:
EVENT_NAME: data[12] || "N/A",          // M: Event Name
EVENT_DATE: data[13] || "TBD",          // N: Event Date
EVENT_LOCATION: data[14] || "N/A",      // O: Event Location
EVENT_DESCRIPTION: data[16] || "N/A",   // Q: Event Description
EVENT_OBJECTIVES: data[17] || "N/A",    // R: Event Objectives
PAYEE_NAME: data[20] || "N/A",          // U: Payee Name
PAYEE_BANK: data[21] || "N/A",          // V: Payee Bank
PAYEE_ACCOUNT: data[22] || "N/A",       // W: Payee Account
BENEFICIARY_COUNT: data[38] || "N/A",   // AY: Beneficiary Count
DURATION: data[40] || "N/A"             // BA: Duration
```

### EMAIL 5 (Approval Success)
```javascript
// ADD these fields:
EVENT_NAME: data[12] || "N/A",
EVENT_DATE: data[13] || "TBD",
PAYEE_NAME: data[20] || "N/A",
CSR_REP_NAME: data[3],
CSR_REP_EMAIL: data[4]
```

### EMAIL 8 (Weekly Reminder) ⚠️ CRITICAL
```javascript
// FIX and ADD:
CSR_REP_NAME: data[3],           // Currently EMPTY!
EVENT_NAME: data[12] || "N/A",
EVENT_DATE: data[13] || "N/A",
ORGANIZATION: data[9] || "N/A",
REQUESTER_NAME: data[6] || data[3],
APPROVAL_DATE: data[41] || "N/A", // AP: Signed PDF Upload Date
DAYS_SINCE_APPROVAL: calculateDays(data[41])
```

---

## TEMPLATE UPDATE REQUIREMENTS

Each email template HTML also needs to be updated to display the new fields. For example:

### EMAIL 2 Template Addition (after line 3750):
```html
<div class="info-box">
  <strong>🎯 EVENT DETAILS</strong>
  <p style="margin: 5px 0;">
    <strong>Event Name:</strong> ${variables.EVENT_NAME}<br/>
    <strong>Event Date:</strong> ${variables.EVENT_DATE}<br/>
    <strong>Event Location:</strong> ${variables.EVENT_LOCATION}<br/>
    <strong>Duration:</strong> ${variables.DURATION}<br/>
    <strong>Beneficiary Count:</strong> ${variables.BENEFICIARY_COUNT}
  </p>
</div>

<div class="info-box">
  <strong>📋 EVENT DESCRIPTION</strong>
  <p>${variables.EVENT_DESCRIPTION}</p>
</div>

<div class="info-box">
  <strong>🎯 OBJECTIVES</strong>
  <p>${variables.EVENT_OBJECTIVES}</p>
</div>

<div class="info-box">
  <strong>💰 PAYMENT DETAILS</strong>
  <p style="margin: 5px 0;">
    <strong>Payee Name:</strong> ${variables.PAYEE_NAME}<br/>
    <strong>Bank:</strong> ${variables.PAYEE_BANK}<br/>
    <strong>Account Number:</strong> ${variables.PAYEE_ACCOUNT}
  </p>
</div>

<div class="info-box">
  <strong>📞 CONTACT INFORMATION</strong>
  <p style="margin: 5px 0;">
    <strong>Requester Email:</strong> ${variables.REQUESTER_EMAIL}<br/>
    <strong>Requester Phone:</strong> ${variables.REQUESTER_CONTACT}<br/>
    <strong>Organization NRIC/RN:</strong> ${variables.ORGANIZATION_NRIC}
  </p>
</div>

<div class="info-box" style="border-left-color: #27ae60;">
  <strong>🌍 SDG ALIGNMENT</strong>
  <p>${variables.SDG_GOALS}</p>
</div>
```

---

## RISK ASSESSMENT

| Email | Current Risk | Post-Fix Risk |
|-------|-------------|---------------|
| EMAIL 1 (Acknowledgement) | 🟡 Medium | 🟢 Low |
| EMAIL 2 (CSR Verification) | 🔴 **CRITICAL** | 🟢 Low |
| EMAIL 3 (GCC Approval) | 🔴 **CRITICAL** | 🟢 Low |
| EMAIL 4 (PDF Generated) | 🟡 Medium | 🟢 Low |
| EMAIL 5 (Approval Success) | 🟡 Medium | 🟢 Low |
| EMAIL 6 (GMD Notification) | 🟢 Low | 🟢 Low |
| EMAIL 7 (Folder Created) | 🟡 Medium | 🟢 Low |
| EMAIL 8 (Weekly Reminder) | 🔴 **CRITICAL** | 🟢 Low |
| EMAIL 9 (Rejection) | 🟡 Medium | 🟢 Low |

---

## CONCLUSION

**Current State:** Email system captures only **25-30%** of available data fields. Critical workflows (verification, approval, reminders) are broken because recipients lack context to make decisions via email.

**Root Cause:** Variables passed to `getEmailHTML()` function are minimal (5-7 fields) while database stores 54+ fields.

**Solution:** Update all 9 email-sending functions to pass complete data sets, and update corresponding HTML templates to display them in organized sections.

**Estimated Effort:**
- Code updates: ~2 hours
- Testing: ~1 hour
- **Total: 3 hours**

**Business Impact:**
- ✅ CSR team can verify from email (save 10-15 min per request)
- ✅ GCC/GM can approve from email (save 5-10 min per approval)
- ✅ Weekly reminders become actionable (CSR rep knows which event)
- ✅ Requester confidence increases (full transparency)

---

**Report Prepared By:** Claude Code
**Next Action:** Implement recommended variable additions in Code.gs functions

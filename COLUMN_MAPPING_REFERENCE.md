# CSR SYSTEM DATABASE - COMPLETE COLUMN MAPPING ANALYSIS

## Executive Summary

This document provides the definitive column mapping for the CSR System database, extracted from `/home/user/MK/Code.gs`. This mapping is the **source of truth** for all column index references throughout the codebase.

---

## COMPLETE COLUMN MAPPING TABLE

```
Index | Column | Header Name                    | Description
------|--------|--------------------------------|----------------------------------------------
0     | A      | Request ID                     | Unique identifier for each CSR request
1     | B      | Submission Date                | Date when the request was submitted
2     | C      | Submission Time                | Time when the request was submitted
3     | D      | CSR Rep Name                   | Name of the CSR representative
4     | E      | CSR Rep Email                  | Email of the CSR representative
5     | F      | CSR Rep Company                | Company of the CSR representative
6     | G      | Requester Name                 | Name of the person making the request
7     | H      | Requester Email                | Email of the requester
8     | I      | Requester Contact              | Contact number of the requester
9     | J      | Organization Name              | Name of the requesting organization
10    | K      | Organization NRIC/RN           | Organization registration/identification number
11    | L      | Request Type                   | Type of CSR request (e.g., event, donation)
12    | M      | Event Name                     | Name of the event
13    | N      | Event Date                     | Date of the event
14    | O      | Event Location                 | Location where event will be held
15    | P      | Event Focus Area               | Primary focus area of the event
16    | Q      | Event Description              | Detailed description of the event
17    | R      | Event Objectives               | Objectives to be achieved
18    | S      | Amount Requested               | Financial amount being requested
19    | T      | Purpose                        | Purpose of the financial request
20    | U      | Payee Name                     | Name of the payee
21    | V      | Payee Bank                     | Bank details of the payee
22    | W      | Payee Account                  | Account number of the payee
23    | X      | Supporting Documents           | Links to supporting documentation
24    | Y      | Verification Checklist         | Checklist for verification
25    | Z      | Contribution History           | Previous contribution history
26    | AA     | Status                         | Current status of the request
27    | AB     | Workflow Stage                 | Current stage in the workflow
28    | AC     | Current Approver               | Person currently responsible for approval
29    | AD     | Last Updated                   | Last update timestamp
30    | AE     | CSR Team Comments              | Comments from CSR team
31    | AF     | CSR Team Decision              | Decision made by CSR team
32    | AG     | CSR Team Date                  | Date of CSR team decision
33    | AH     | GCC Comments                   | Comments from GCC
34    | AI     | GCC Decision                   | Decision made by GCC
35    | AJ     | GCC Date                       | Date of GCC decision
36    | AK     | PDF Generated                  | Flag indicating if PDF was generated
37    | AL     | PDF URL                        | URL to the generated PDF
38    | AM     | PDF Format                     | Format of the PDF
39    | AN     | Signed PDF Uploaded            | Flag indicating if signed PDF was uploaded
40    | AO     | Signed PDF URL                 | URL to the signed PDF
41    | AP     | Signed PDF Date                | Date when signed PDF was uploaded
42    | AQ     | Drive Folder ID                | Google Drive folder ID
43    | AR     | Drive Folder URL               | URL to Google Drive folder
44    | AS     | Story Upload Status            | Status of story upload
45    | AT     | Story Upload Date              | Date when story was uploaded
46    | AU     | GMD Notified                   | Flag indicating if GMD was notified
47    | AV     | GMD Notification Date          | Date when GMD was notified
48    | AW     | SDG Goals                      | UN Sustainable Development Goals alignment
49    | AX     | Impact Category                | Category of impact
50    | AY     | Beneficiary Count              | Number of beneficiaries
51    | AZ     | Geographic Area                | Geographic area of impact
52    | BA     | Duration                       | Duration of the program/event
53    | BB     | Priority Level                 | Priority level of the request
54    | BC     | Approval Chain                 | Chain of approvers
55    | BD     | Rejection Reason               | Reason for rejection if applicable
```

**Total Columns: 56**

---

## CRITICAL INDEXING RULES

### 1. Array Access (0-based)
When accessing data from `getDataRange().getValues()`:
```javascript
var data = sheet.getDataRange().getValues();
var requestId = data[rowIndex][0];          // Column A
var status = data[rowIndex][26];            // Column AA
var beneficiaryCount = data[rowIndex][50];  // Column AY
```

### 2. getRange() Method (1-based)
When using `getRange()` to read/write cells:
```javascript
sheet.getRange(rowIndex, 1).setValue(requestId);      // Column A
sheet.getRange(rowIndex, 27).setValue(status);        // Column AA
sheet.getRange(rowIndex, 51).setValue(beneficiaries); // Column AY
```

### 3. Conversion Formula
```
Array Index → getRange Column: arrayIndex + 1
getRange Column → Array Index: columnNumber - 1
```

---

## RECENT BUG FIXES

### Fixed in Commit 8583fa7
**Issue**: Email functions were using wrong indices for SDG/Impact columns

**Changes Made**:
- `SDG_GOALS`: `data[46]` → `data[48]` (Column AW)
- `BENEFICIARY_COUNT`: `data[48]` → `data[50]` (Column AY)
- `GEOGRAPHIC_AREA`: `data[49]` → `data[51]` (Column AZ)
- `DURATION`: `data[50]` → `data[52]` (Column BA)

**Impact**:
- BEFORE: Payee Name was showing timestamps, Bank showing CSR comments
- AFTER: All fields display correct data from spreadsheet

---

## CRITICAL ISSUES IDENTIFIED

### ⚠️ CRITICAL BUG: approveRequest() and rejectRequest() Functions (Lines 1400-1550)

**Location**: `/home/user/MK/Code.gs`, lines 1408-1511

**Issue**: These functions are writing to WRONG columns, overwriting critical financial data!

**Current Code (WRONG)**:
```javascript
// Line 1408-1411 - approveRequest()
submissionsSheet.getRange(i + 1, 17).setValue(CONFIG.STATUS.APPROVED);  // ❌ Column Q (Event Objectives)
submissionsSheet.getRange(i + 1, 18).setValue("Completed");             // ❌ Column R (Event Objectives)
submissionsSheet.getRange(i + 1, 19).setValue("");                      // ❌ Column S (Amount Requested) !!!
submissionsSheet.getRange(i + 1, 21).setValue(new Date().toISOString());// ❌ Column U (Payee Name) !!!

// Line 1462
submissionsSheet.getRange(i + 1, 27).setValue(JSON.stringify(chain));   // ❌ Column AA (Status)

// Line 1511 - rejectRequest()
submissionsSheet.getRange(i + 1, 29).setValue(reason);                  // ❌ Column AC (Current Approver)
```

**Should Be (CORRECT)**:
```javascript
// Status and Workflow updates
submissionsSheet.getRange(i + 1, 27).setValue(CONFIG.STATUS.APPROVED);  // ✓ Column AA (Status)
submissionsSheet.getRange(i + 1, 28).setValue("Completed");             // ✓ Column AB (Workflow Stage)
submissionsSheet.getRange(i + 1, 29).setValue("");                      // ✓ Column AC (Current Approver)
submissionsSheet.getRange(i + 1, 30).setValue(new Date().toISOString());// ✓ Column AD (Last Updated)

// Approval Chain
submissionsSheet.getRange(i + 1, 55).setValue(JSON.stringify(chain));   // ✓ Column BC (Approval Chain)

// Rejection Reason
submissionsSheet.getRange(i + 1, 56).setValue(reason);                  // ✓ Column BD (Rejection Reason)
```

**Impact**:
- ❌ Overwrites Event Objectives with status values
- ❌ **DESTROYS Amount Requested data** (critical financial information!)
- ❌ **DESTROYS Payee Name** (payment recipient information!)
- ❌ Approval Chain stored in wrong column
- ❌ Rejection Reason stored in wrong column

---

## COMMONLY ACCESSED COLUMNS

### Email Notification Fields
```javascript
// Requester Info
data[6]   // G:  Requester Name (NOT data[3] which is CSR Rep!)
data[7]   // H:  Requester Email
data[9]   // J:  Organization Name

// Event Details
data[12]  // M:  Event Name
data[13]  // N:  Event Date
data[14]  // O:  Event Location

// Financial
data[18]  // S:  Amount Requested (CRITICAL - used in PDF)
data[19]  // T:  Purpose
data[20]  // U:  Payee Name
data[21]  // V:  Payee Bank
data[22]  // W:  Payee Account

// SDG & Impact (Most Commonly Misindexed!)
data[48]  // AW: SDG Goals
data[50]  // AY: Beneficiary Count
data[51]  // AZ: Geographic Area
data[52]  // BA: Duration
```

### Workflow Update Fields (getRange - 1-based)
```javascript
// Status & Workflow
getRange(row, 27)  // AA: Status
getRange(row, 28)  // AB: Workflow Stage
getRange(row, 29)  // AC: Current Approver
getRange(row, 30)  // AD: Last Updated

// CSR Team Decision
getRange(row, 31)  // AE: CSR Team Comments
getRange(row, 32)  // AF: CSR Team Decision
getRange(row, 33)  // AG: CSR Team Date

// GCC Decision
getRange(row, 34)  // AH: GCC Comments
getRange(row, 35)  // AI: GCC Decision
getRange(row, 36)  // AJ: GCC Date

// GMD Notification
getRange(row, 47)  // AU: GMD Notified
getRange(row, 48)  // AV: GMD Notification Date

// Additional Tracking
getRange(row, 55)  // BC: Approval Chain
getRange(row, 56)  // BD: Rejection Reason
```

---

## VERIFICATION CHECKLIST

When fixing column index bugs:

1. ✅ Verify if using array access (0-based) or getRange() (1-based)
2. ✅ Check column letter in comments matches the index
3. ✅ Test with actual data to ensure correct field is updated
4. ✅ Review email notifications to ensure correct data is displayed
5. ✅ Verify financial columns (18-22) are never overwritten by workflow updates
6. ✅ Check SDG/Impact columns (48-52) are using correct indices

---

## SOURCE CODE LOCATION

**File**: `/home/user/MK/Code.gs`
**Header Definition**: Lines 858-907
**Function**: `setupSubmissionsSheet()`

This is the authoritative source for the column structure. Any discrepancies between code and this document indicate a bug in the code.

---

## NEXT STEPS

### URGENT - Fix Critical Bugs:
1. Fix `approveRequest()` function (lines 1408-1462)
2. Fix `rejectRequest()` function (lines 1507-1522)
3. Verify all other functions using columns 17-29

### Testing:
1. Test approval workflow end-to-end
2. Verify financial data is preserved
3. Check all email notifications show correct data
4. Validate GMD notification columns

---

**Document Version**: 1.0
**Date**: 2026-01-05
**Generated From**: /home/user/MK/Code.gs

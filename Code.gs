/*************************************************************
 * ULTIMATE CSR MANAGEMENT SYSTEM v4.0 - COMPLETE EDITION
 * Features: SDG Mapping, Multi-Level Approvals, Advanced Analytics
 * Email Notifications, Monetary Thresholds, Document Tracking
 * Created: 2025 | Enhanced with DAL Integration
 *************************************************************/

/*************************************************************
 * GLOBAL CONFIGURATION
 *************************************************************/

var CONFIG = {
  // IMPORTANT: Replace with your actual Google Sheet ID from the URL
  // URL format: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
  SPREADSHEET_ID: "1nm8dgEPacQnR-jrBkNAvsw5EduJPLmjuxjVkM5-PfJU",
  
  SHEET_NAMES: {
    SUBMISSIONS: "Submissions",
    USERS: "Authorized_Users",
    ANALYTICS: "CSR_Analytics",
    WORKFLOW: "Workflow_Log",
    SDG_MAPPING: "SDG_Mapping",
    EMAIL_TEMPLATES: "Email_Templates",
    APPROVERS: "Approvers",
    DOCUMENTS: "Document_Tracking",
    HISTORY: "Contribution_History",  // NEW
    REMINDERS: "Weekly_Reminders"     // NEW
  },
  
  STATUS: {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    CSR_REVIEW: "CSR Team Review",
    CSR_RECOMMENDED: "CSR Recommended",
    GCC_REVIEW: "Head of GCC Review",
    GCC_RECOMMENDED: "GCC Recommended",
    PDF_GENERATED: "PDF Generated",
    AWAITING_SIGNED_PDF: "Awaiting Signed PDF",
    SIGNED_PDF_UPLOADED: "Signed PDF Uploaded",
    APPROVED: "Approved",
    AWAITING_STORY: "Awaiting Story Upload",
    COMPLETED: "Completed",
    REJECTED: "Rejected"
  },
  
  ROLES: {
  CSR_REP: "CSR Representative",
  CSR_TEAM: "CSR Team",
  HEAD_GCC: "Head of GCC",
  GM_GCC: "GM GCC",                    // ADD THIS
  GCCSO: "GCCSO",                      // ADD THIS
  GCFO: "GCFO",                        // ADD THIS
  GMD_OFFICE: "GMD Office",            // ADD THIS
  GMD: "GMD",
  COMPLIANCE: "Compliance",            // ADD THIS
  ADMIN: "Administrator"
},


  
  MONETARY_THRESHOLDS: {
    LOW: 5000,           // ≤ 5,000 - Use PDF Format 1
    HIGH: 1000000        // > 5,000 to 1,000,000 - Use PDF Format 2
                         // > 1,000,000 - Use PDF Format 2 + GMD signature
  },
  
  EMAILS: {
    CSR_TEAM: "michaelk@cahyamata.com",
    GMD: "michaelk@cahyamata.com"  // Update with actual GMD email
  },
  
  DRIVE_FOLDER: {
    PARENT_FOLDER_ID: "1F_dfNNiH7Ks1I9FrrYzAhWoEOkyABDxr"  // IMPORTANT: Set this to your main CSR folder ID
  },
  
  SDG_GOALS: {
    1: "No Poverty",
    2: "Zero Hunger",
    3: "Good Health and Well-being",
    4: "Quality Education",
    5: "Gender Equality",
    6: "Clean Water and Sanitation",
    7: "Affordable and Clean Energy",
    8: "Decent Work and Economic Growth",
    9: "Industry, Innovation and Infrastructure",
    10: "Reduced Inequalities",
    11: "Sustainable Cities and Communities",
    12: "Responsible Consumption and Production",
    13: "Climate Action",
    14: "Life Below Water",
    15: "Life on Land",
    16: "Peace, Justice and Strong Institutions",
    17: "Partnerships for the Goals"
  },
  
  EMAIL_TYPES: {
    NEW_SUBMISSION: "new_submission",
    APPROVAL_REQUEST: "approval_request",
    APPROVED: "approved",
    REJECTED: "rejected",
    INFO_REQUIRED: "info_required",
    ESCALATED: "escalated",
    REMINDER: "reminder"
  }
};

/*************************************************************
 * MAIN WEB APP HANDLER
 *************************************************************/

/**
 * Helper function to get spreadsheet reliably in both web app and editor contexts
 * Use this instead of SpreadsheetApp.getActiveSpreadsheet() for web app compatibility
 */
function getSpreadsheet_() {
  var ss = null;
  
  // Method 1: Try openById with CONFIG
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE") {
    try {
      ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      if (ss) return ss;
    } catch (e) {
      Logger.log("getSpreadsheet_: Failed to open by CONFIG ID: " + e.message);
    }
  }
  
  // Method 2: Try Script Properties
  try {
    var props = PropertiesService.getScriptProperties();
    var ssId = props.getProperty('SPREADSHEET_ID');
    if (ssId) {
      ss = SpreadsheetApp.openById(ssId);
      if (ss) return ss;
    }
  } catch (e) {}
  
  // Method 3: Fallback to getActiveSpreadsheet
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}
  
  return null;
}

function doGet(e) {
  try {
    initializeDatabase();
    
    var page = e.parameter.page || 'index';
    var action = e.parameter.action;
    
    // Handle email action links (recommend/reject)
    if (action && action.indexOf('_recommend') > -1 || action && action.indexOf('_reject') > -1) {
      return handleEmailAction(e);
    }
    
    // Route to different pages
    switch(page) {
      case 'status':
        return HtmlService.createTemplateFromFile('status')
          .evaluate()
          .setTitle('Request Status - CSR System')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1');
          
      case 'admin':
        return HtmlService.createTemplateFromFile('admin')
          .evaluate()
          .setTitle('Admin Dashboard - CSR System')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1');
          
      default:
        var template = HtmlService.createTemplateFromFile('Index');
        if (e && e.parameter) {
          template.params = JSON.stringify(e.parameter);
        }
        return template.evaluate()
          .setTitle('CSR Management System')
          .setFaviconUrl('https://www.google.com/favicon.ico')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
  } catch (error) {
    Logger.log("Error in doGet: " + error);
    return HtmlService.createHtmlOutput(
      '<h3>System Error</h3><p>' + error.message + '</p>'
    );
  }
}

// --- DROP-IN: Email action landing page (Team/Head) ---
// Keeps everything inside Code.gs (no new HTML files)
function handleEmailAction(e) {
  var p = e && e.parameter ? e.parameter : {};
  var action    = String(p.action || '').toLowerCase();
  var requestId = p.requestId || '';
  var token     = p.token || '';

  if (!verifyActionToken(token, requestId, action)) {
    return HtmlService.createHtmlOutput(
      '<!doctype html><html><head><meta charset="utf-8"><title>Invalid</title>' +
      '<style>body{font-family:Times New Roman,serif;max-width:760px;margin:48px auto;padding:24px;background:#fff5f5;color:#7f1d1d;border:1px solid #fecaca;border-radius:12px}</style>' +
      '</head><body><h3>Invalid or Expired Link</h3><p>This action link has expired or is invalid.</p></body></html>'
    ).setTitle('Action Link Invalid');
  }

  var isReco   = action.indexOf('recommend') === 0;
  var isReject = action === 'reject';
  var isApprove= action === 'approve';
  var titleTxt = isReco ? 'Recommend Request ' : (isReject ? 'Reject Request ' : (isApprove ? 'Approve Request ' : 'Action for Request '));
  var btnTxt   = isReco ? 'Submit' : (isReject ? 'Reject' : (isApprove ? 'Approve' : 'Submit'));

  var html =
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+titleTxt+requestId+'</title>'+
'<style>'+
'html,body{background:#f5f7fb;margin:0;padding:0}body{font-family:"Times New Roman",serif;color:#1e293b}'+
'.wrap{max-width:960px;margin:24px auto;padding:24px 24px 30px;background:#fff;border-radius:16px;box-shadow:0 18px 40px rgba(0,0,0,.08)}'+
'h1{font-family:"Cinzel","Georgia",serif;font-weight:700;letter-spacing:.4px;margin:0 0 10px;background:#2f62c6;color:#fff;padding:6px 12px;border-radius:6px;display:inline-block}'+
'.meta{color:#41586b;margin:0 0 16px}label{display:block;font-weight:700;margin:.6rem 0 .35rem}'+
'textarea{width:100%;min-height:160px;border:1px solid #d9e2ec;border-radius:10px;padding:12px;resize:vertical;font-family:"Times New Roman",serif;font-size:14px}'+
'.row{display:flex;gap:12px;margin-top:18px;flex-wrap:wrap}.btn{border:none;border-radius:12px;padding:12px 22px;font-weight:700;cursor:pointer}'+
'.btn-primary{background:linear-gradient(135deg,#0fbf8a,#06a07a);color:#fff;box-shadow:0 10px 24px rgba(15,191,138,.35),inset 0 1px 0 rgba(255,255,255,.25);transition:all .18s ease}'+
'.btn-primary:hover{transform:translateY(-1px);box-shadow:0 14px 28px rgba(15,191,138,.42),inset 0 1px 0 rgba(255,255,255,.3)}'+
'.btn-primary[disabled]{opacity:.55;cursor:not-allowed;box-shadow:none;transform:none}.btn-ghost{background:#90a4ae;color:#fff}'+
'.success{display:none;margin-top:16px;background:#def7e9;color:#125b3f;border:1px solid #b5e9cf;padding:12px 14px;border-radius:10px;font-weight:600}'+
'.error{display:none;margin-top:16px;background:#fde2e1;color:#7a271a;border:1px solid #f8b4a0;padding:12px 14px;border-radius:10px;font-weight:600}'+
'.spinner{display:none;margin-left:10px;width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}'+
'.foot{margin-top:20px;color:#8aa;font-size:12px;text-align:right}'+
'a{color:#2f62c6;text-decoration:none;border-bottom:1px solid rgba(47,98,198,.35)}a:hover{border-bottom-color:#2f62c6}'+
'</style></head><body>'+
'<div class="wrap">'+
'  <h1>'+titleTxt+' '+requestId+'</h1>'+
'  <p class="meta">Please add a short comment before proceeding.</p>'+
'  <label for="comments">Comments</label>'+
'  <textarea id="comments" placeholder="Your comments..."></textarea>'+
'  <div class="row">'+
'    <button id="btnGo" class="btn btn-primary">'+btnTxt+' <span id="spin" class="spinner"></span></button>'+
'    <button id="btnCancel" class="btn btn-ghost">Cancel</button>'+
'  </div>'+
'  <div id="ok" class="success">Success! Your action has been recorded.</div>'+
'  <div id="err" class="error">Sorry, something went wrong.</div>'+
'  <div class="foot">CMS CSR • <span id="stamp"></span></div>'+
'</div>'+
'<script>'+
'  var ctx={requestId:'+JSON.stringify(requestId)+',action:'+JSON.stringify(action)+',token:'+JSON.stringify(token)+'};'+
'  document.getElementById("stamp").textContent=new Date().toLocaleString();'+
'  document.getElementById("btnCancel").onclick=function(){ if(window.opener){window.close();} else {history.back();} };'+
'  var btn=document.getElementById("btnGo"),spin=document.getElementById("spin"),ok=document.getElementById("ok"),err=document.getElementById("err"),ta=document.getElementById("comments");'+
'  var clicked=false;'+
'  btn.onclick=function(){ if(clicked)return; clicked=true; var comments=(ta.value||"").trim(); btn.disabled=true; spin.style.display="inline-block"; ok.style.display="none"; err.style.display="none";'+
'    google.script.run.withSuccessHandler(function(res){ spin.style.display="none"; if(res&&res.success){ ok.style.display="block"; setTimeout(function(){'+
'        if(google && google.script && google.script.host && google.script.host.close){ google.script.host.close(); }'+
'        else if(window.opener){ window.close(); }'+
'        else { btn.disabled=true; }'+
'      },900); } else { err.style.display="block"; btn.disabled=false; clicked=false; } })'+
'    .withFailureHandler(function(e){ spin.style.display="none"; err.style.display="block"; btn.disabled=false; clicked=false; })'+
'    .processEmailAction(ctx.action, ctx.requestId, comments, ctx.token);'+
'  };'+
'</script></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('Action Required')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/************************************************************
 * EMAIL ACTION PROCESSOR (DROP-IN)
 * - Verifies token (uses verifyActionToken you already have)
 * - Locates submission row by requestId
 * - Maps actions to status/workflow updates
 * - Appends audit log entry (creates sheet if missing)
 * - Idempotent-ish: won’t double-apply exactly same state
 *
 * Supported action strings:
 *   "csr_recommend", "csr_reject",
 *   "gcc_recommend", "gcc_reject",
 *   "recommend", "recommend_head",
 *   "reject", "approve"
 *
 * Signature (now accepts token as 4th arg):
 *   processEmailAction(action, requestId, comments, token)
 ************************************************************/
function processEmailAction(action, requestId, comments, token) {
  try {
    action     = String(action || '').toLowerCase();
    requestId  = String(requestId || '').trim();
    comments   = String(comments || '').trim();

    if (!requestId) return { success:false, error:"Missing requestId" };
    if (!action)    return { success:false, error:"Missing action" };

    if (typeof verifyActionToken === 'function') {
      if (!verifyActionToken(token, requestId, action)) {
        Logger.log("[EmailAction] Token invalid for %s (%s)", requestId, action);
        return { success:false, error:"Token invalid or expired" };
      }
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var subSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    if (!subSheet) return { success:false, error:"Submissions sheet not found" };

    var headerMap = getHeaderMap_(subSheet);
    var rowIndex  = findRowByKey_(subSheet, headerMap, 'Request ID', requestId);
    if (rowIndex < 2) return { success:false, error:"Request not found" };

    var mapped = mapAction_(action);
    if (!mapped) {
      Logger.log("[EmailAction] Unknown action '%s' for %s", action, requestId);
      return { success:false, error:"Unknown action" };
    }

    var row = subSheet.getRange(rowIndex, 1, 1, subSheet.getLastColumn()).getValues()[0];
    var now = new Date();
    var update = computeUpdatePayload_(row, headerMap, mapped, comments, now);

    if (update.sameState) {
      appendAudit_(ss, requestId, mapped.role, mapped.verb, "No change", comments, now);
      Logger.log("[EmailAction] No change (idempotent) for %s (%s/%s)", requestId, mapped.role, mapped.verb);
      return { success:true, message:"Already recorded" };
    }

    applyRowUpdate_(subSheet, rowIndex, headerMap, update);
    appendAudit_(ss, requestId, mapped.role, mapped.verb, update.newStatus, comments, now);

    // Notify next approver (returns an object describing what happened)
    var notifyRes = triggerNext_(requestId, mapped, headerMap, subSheet, token, rowIndex);

    var msg = "Action recorded: " + mapped.role + " " + mapped.verb;
    if (notifyRes && notifyRes.info) msg += " • " + notifyRes.info;
    Logger.log("[EmailAction] %s", msg);

    return { success:true, message: msg };
  } catch (error) {
    Logger.log("Error processing email action: " + error + "\n" + (error.stack || ""));
    return { success:false, error: error.message || String(error) };
  }
}

/**
 * Notifies next approver and stamps the row to avoid duplicates.
 * Returns {info: "..."} with a human-readable outcome.
 */
function triggerNext_(requestId, mapped, headerMap, subSheet, prevToken, rowIndex) {
  try {
    // Handle CSR Team recommendation -> notify GCC Head for approval
    if (mapped.role === 'CSR' && mapped.verb === 'recommend') {
      Logger.log("[Notify] CSR Team recommended - sending to GCC Head for %s", requestId);

      // Get full row data
      var row = subSheet.getRange(rowIndex, 1, 1, subSheet.getLastColumn()).getValues()[0];

      // Get CSR comments from the row
      var commentsCol = headerMap['CSR Team Comments'] || headerMap['Reviewer Comments'] || headerMap['Comments'];
      var csrComments = commentsCol ? String(row[commentsCol - 1] || '') : '';

      // Call sendGCCApprovalEmail to notify Head of GCC
      try {
        if (typeof sendGCCApprovalEmail === 'function') {
          sendGCCApprovalEmail(requestId, row, csrComments);
          Logger.log("[Notify] GCC approval email sent successfully for %s", requestId);

          // Mark that GCC was notified
          var gccNotifiedCol = headerMap['GCC Notified'] || headerMap['GCC Email Sent'];
          if (gccNotifiedCol) {
            subSheet.getRange(rowIndex, gccNotifiedCol).setValue(new Date());
          }

          return { info: "GCC Head notified for approval" };
        } else {
          Logger.log("[Notify] sendGCCApprovalEmail function not available");
          return { info: "GCC email function not available" };
        }
      } catch (emailError) {
        Logger.log("[Notify] Error sending GCC email: %s", emailError);
        return { info: "GCC email error: " + (emailError.message || emailError) };
      }
    }

    // Handle GCC (Head of GCC) recommendation -> generate PDF and notify CSR Team
    if (mapped.role === 'GCC' && mapped.verb === 'recommend') {
      Logger.log("[Notify] GCC (Head of GCC) recommended - starting PDF generation for %s", requestId);
      
      // Get comments from the row
      var row = subSheet.getRange(rowIndex, 1, 1, subSheet.getLastColumn()).getValues()[0];
      var commentsCol = headerMap['Reviewer Comments'] || headerMap['Comments'] || headerMap['GCC Comments'];
      var comments = commentsCol ? String(row[commentsCol - 1] || '') : '';
      
      // Call processGCCRecommendation to generate PDF and send to CSR Team
      var pdfResult = null;
      try {
        if (typeof processGCCRecommendation === 'function') {
          // rowIndex is 1-based for sheet operations, but processGCCRecommendation expects 0-based array index
          pdfResult = processGCCRecommendation(requestId, rowIndex - 1, true, comments);
          Logger.log("[Notify] processGCCRecommendation result: " + JSON.stringify(pdfResult));
          
          if (pdfResult && pdfResult.success) {
            return { info: "PDF generated and CSR Team notified" };
          } else {
            var errorMsg = pdfResult && pdfResult.error ? pdfResult.error : "PDF generation failed";
            return { info: "PDF generation failed: " + errorMsg };
          }
        } else {
          Logger.log("[Notify] processGCCRecommendation function not available");
          return { info: "PDF generation function not available" };
        }
      } catch (pdfError) {
        Logger.log("[Notify] Error calling processGCCRecommendation: %s", pdfError);
        return { info: "PDF generation error: " + (pdfError.message || pdfError) };
      }
    }
    
    // Handle HEAD recommendation -> notify next approver (CFO/next stage)
    if (mapped.role === 'HEAD' && mapped.verb === 'recommend') {
      var row = subSheet.getRange(rowIndex, 1, 1, subSheet.getLastColumn()).getValues()[0];
      var amountCol = headerMap['Amount Requested'] || headerMap['Amount'] || headerMap['Budget'];
      var amount = amountCol ? parseFloat(row[amountCol - 1]) || 0 : 0;
      
      // Get next approver based on amount and workflow stage
      var nextApproverEmail = '';
      try {
        if (typeof getNextApprover === 'function') {
          nextApproverEmail = getNextApprover('CFO/Approval', amount);
        }
      } catch (e) {
        Logger.log("[Notify] Error getting next approver: %s", e);
      }
      
      // If getNextApprover didn't work, try to find CFO email from CONFIG or Approvers sheet
      if (!nextApproverEmail) {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var approversSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.APPROVERS);
        if (approversSheet) {
          var approverData = approversSheet.getDataRange().getValues();
          // Look for GCFO or CFO role (column index 3 typically has role)
          for (var i = 1; i < approverData.length; i++) {
            var role = String(approverData[i][3] || '').trim();
            var isActive = String(approverData[i][9] || '').toUpperCase() === 'TRUE';
            if ((role === CONFIG.ROLES.GCFO || role.indexOf('CFO') > -1) && isActive) {
              nextApproverEmail = approverData[i][2]; // Email in column 2
              break;
            }
          }
        }
      }
      
      if (!nextApproverEmail) {
        Logger.log("[Notify] No CFO/next approver email found for %s", requestId);
        return { info: "CFO email missing; no notification sent" };
      }
      
      // Prevent duplicate notifications
      var cCFONotified = headerMap['CFO Notified'] || headerMap['CFO Notified At'] || headerMap['Next Approver Notified'];
      if (cCFONotified) {
        var alreadyCFO = subSheet.getRange(rowIndex, cCFONotified).getValue();
        if (alreadyCFO) {
          Logger.log("[Notify] CFO already notified for %s at %s", requestId, alreadyCFO);
          return { info: "CFO already notified" };
        }
      }
      
      var tokenCFO = nextToken_(requestId, 'cfo_recommend', prevToken);
      var linkCFO  = buildActionLink_(requestId, 'recommend', 'cfo', tokenCFO);
      
      // Build email for next approver
      var subjectCFO = 'CSR • CFO Recommendation Required • ' + requestId;
      var htmlBodyCFO =
        '<div style="font:14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1e293b">' +
          '<h2 style="margin:0 0 10px;color:#0b3b2e">Action Required</h2>' +
          '<p>Request <strong>'+ requestId +'</strong> has been recommended by Head of GCC and needs your decision.</p>' +
          '<p>Amount: <strong>RM ' + (amount > 0 ? amount.toFixed(2) : '0.00') + '</strong></p>' +
          '<p><a style="display:inline-block;padding:10px 16px;border-radius:10px;background:#0fbf8a;color:#fff;text-decoration:none" href="'+ linkCFO +'">Open Recommendation Page</a></p>' +
          '<p style="color:#64748b">If the button does not work, use this link: <br><a href="'+ linkCFO +'">'+ linkCFO +'</a></p>' +
        '</div>';
      
      MailApp.sendEmail({
        to: nextApproverEmail,
        name: 'CMS CSR',
        subject: subjectCFO,
        htmlBody: htmlBodyCFO
      });
      
      // Stamp notification timestamp if column exists; otherwise create one
      if (cCFONotified) {
        subSheet.getRange(rowIndex, cCFONotified).setValue(new Date());
      } else {
        var lastCol = subSheet.getLastColumn();
        subSheet.getRange(1, lastCol + 1).setValue('CFO Notified');
        subSheet.getRange(rowIndex, lastCol + 1).setValue(new Date());
        headerMap['CFO Notified'] = lastCol + 1;
      }
      
      Logger.log("[Notify] CFO/Next approver email sent to %s for %s", nextApproverEmail, requestId);
      return { info: "CFO/Next approver notified: " + nextApproverEmail };
    }
    
    // No notification needed for other actions
    return { info: "No next-step email required" };

  } catch (e) {
    Logger.log("[Notify] Error in triggerNext_ for %s: %s", requestId, e);
    return { info: "Notification failed: " + (e.message || e) };
  }
}


function buildActionLink_(requestId, action, actor, token) {
  var base = ScriptApp.getService().getUrl();
  return base + '?page=action&requestId=' +
         encodeURIComponent(requestId) +
         '&action=' + encodeURIComponent(action) +
         (actor ? '&actor=' + encodeURIComponent(actor) : '') +
         (token ? '&token=' + encodeURIComponent(token) : '');
}

function nextToken_(requestId, action, prevToken) {
  try {
    if (typeof createActionToken === 'function') {
      return createActionToken(requestId, action);
    }
  } catch (e) {}
  var raw = requestId + '|' + action + '|' + (new Date().getTime());
  return Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(raw, ScriptApp.getProjectKey())
  ).replace(/=+$/,'');
}


// Resolve Head approver email: from CONFIG if available, else Script Properties
/**
 * Pull Head approver email from (in order):
 * 1) Row fields: "Head Approver Email", "Head Email", "Approver Email", "GCC Head Email"
 * 2) CONFIG.NOTIFY.HEAD_EMAIL
 * 3) Script Properties: HEAD_APPROVER_EMAIL
 */
function getHeadApproverEmail_(subSheet, headerMap, rowIndex) {
  var candidates = [
    'Head Approver Email', 'Head Email', 'Approver Email', 'GCC Head Email'
  ];
  for (var i = 0; i < candidates.length; i++) {
    var c = headerMap[candidates[i]];
    if (c) {
      var v = String(subSheet.getRange(rowIndex, c).getValue() || '').trim();
      if (v) return v;
    }
  }
  try {
    if (CONFIG && CONFIG.NOTIFY && CONFIG.NOTIFY.HEAD_EMAIL) {
      return CONFIG.NOTIFY.HEAD_EMAIL;
    }
  } catch (_) {}
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('HEAD_APPROVER_EMAIL') || '';
}




/* =================== Helpers (internal) =================== */

/**
 * Build header map: { "Request ID": 1-based column index, ... }
 * Will also map common variants so you don’t break on column renames.
 */
function getHeaderMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  headers.forEach(function(h, idx){
    var key = String(h || '').trim();
    if (!key) return;
    map[key] = idx + 1; // 1-based
  });

  // Friendly aliases
  function alias(name, alts) {
    if (map[name]) return;
    for (var i=0;i<alts.length;i++) {
      if (map[alts[i]]) { map[name] = map[alts[i]]; return; }
    }
  }
  alias('Request ID', ['RequestId','Req ID','ID','CSR ID','CSR No','CSR Number']);
  alias('Status', ['Workflow Status','Stage','State']);
  alias('Workflow Stage', ['WorkflowStage','Stage','Pipeline Stage']);
  alias('Reviewer Comments', ['Comments','Approver Comments','GCC Comments','Head Comments']);
  alias('Last Updated', ['Updated At','LastUpdate','Modified']);
  alias('GCC Recommendation', ['GCC Recom','GCC Status']);
  alias('Head Recommendation', ['Head Recom','Head Status']);
  alias('Amount', ['Total Amount','Amount Requested','Donation Amount']);

  return map;
}

/**
 * Find a row by Request ID (tries header variants if needed).
 * Returns 1-based row index (>=2 for data rows), or -1 if not found.
 */
function findRowByKey_(sheet, headerMap, headerName, value) {
  var col = headerMap[headerName];
  if (!col) {
    // Try all known ID header variants present
    var candidates = ['Request ID','RequestId','Req ID','ID','CSR ID','CSR No','CSR Number'];
    for (var i=0;i<candidates.length;i++){
      if (headerMap[candidates[i]]) { col = headerMap[candidates[i]]; break; }
    }
    if (!col) return -1;
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var rng = sheet.getRange(2, col, lastRow-1, 1).getValues();
  for (var r=0; r<rng.length; r++){
    if (String(rng[r][0]).trim() === String(value).trim()) {
      return r + 2; // convert to sheet row
    }
  }
  return -1;
}

/**
 * Map action string to a normalized role + verb.
 */
function mapAction_(action) {
  switch(action) {
    case 'csr_recommend': return { role:'CSR',  verb:'recommend' };
    case 'csr_reject':    return { role:'CSR',  verb:'reject' };
    case 'gcc_recommend': return { role:'GCC',  verb:'recommend' };
    case 'gcc_reject':    return { role:'GCC',  verb:'reject' };
    case 'recommend':       return { role:'GCC',  verb:'recommend' };     // <— email page (team) ✔
    case 'recommend_head':  return { role:'HEAD', verb:'recommend' };
    case 'reject':          return { role:'GCC',  verb:'reject' };
    case 'approve':         return { role:'HEAD', verb:'approve' };
    default: return null;
  }
}


/**
 * Compute the new status, workflow stage, and comments.
 * Returns an object with:
 *   newStatus, newStage, newGCC, newHead, appendComment, ts, sameState (boolean)
 */
function computeUpdatePayload_(row, headerMap, mapped, comments, when) {
  var idxStatus     = headerMap['Status'];
  var idxStage      = headerMap['Workflow Stage'];
  var idxGCC        = headerMap['GCC Recommendation'];
  var idxHead       = headerMap['Head Recommendation'];
  var idxComments   = headerMap['Reviewer Comments'];
  var idxUpdated    = headerMap['Last Updated'];

  var curStatus   = idxStatus ? String(row[idxStatus-1] || '') : '';
  var curStage    = idxStage  ? String(row[idxStage-1]  || '') : '';
  var curGCC      = idxGCC    ? String(row[idxGCC-1]    || '') : '';
  var curHead     = idxHead   ? String(row[idxHead-1]   || '') : '';
  var curComments = idxComments ? String(row[idxComments-1] || '') : '';

  var newStatus = curStatus;
  var newStage  = curStage;
  var newGCC    = curGCC;
  var newHead   = curHead;

  // Decide transitions
  var roleSpecificComments = null;
  var roleDecision = null;

  if (mapped.role === 'CSR') {
    if (mapped.verb === 'recommend') {
      newStatus = 'CSR Recommended';
      newStage  = 'GCC Review';
      roleSpecificComments = comments;  // Save to CSR Team Comments (AE)
      roleDecision = 'RECOMMENDED';     // Save to CSR Team Decision (AF)
    } else if (mapped.verb === 'reject') {
      newStatus = 'CSR Rejected';
      newStage  = 'Closed';
      roleSpecificComments = comments;
      roleDecision = 'REJECTED';
    }
  } else if (mapped.role === 'GCC') {
    if (mapped.verb === 'recommend') {
      newStatus = 'GCC Recommended';
      newStage  = 'Head Review';
      newGCC    = 'Recommended';
    } else if (mapped.verb === 'reject') {
      newStatus = 'GCC Rejected';
      newStage  = 'Closed';
      newGCC    = 'Rejected';
    }
  } else if (mapped.role === 'HEAD') {
    if (mapped.verb === 'recommend') {
      newStatus = 'Head Recommended';
      newStage  = 'CFO/Approval';
      newHead   = 'Recommended';
    } else if (mapped.verb === 'approve') {
      newStatus = 'Approved';
      newStage  = 'Completed';
      newHead   = 'Approved';
    } else if (mapped.verb === 'reject') {
      newStatus = 'Head Rejected';
      newStage  = 'Closed';
      newHead   = 'Rejected';
    }
  } else {
    // Fallback generic
    newStatus = (mapped.verb.charAt(0).toUpperCase()+mapped.verb.slice(1));
    newStage  = curStage || 'In Review';
  }

  // Build appended comment with timestamp and role
  var stamp = Utilities.formatDate(when, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  var who   = mapped.role + ' ' + mapped.verb.toUpperCase();
  var toAppend = comments ? ('[' + stamp + ' • ' + who + '] ' + comments) : ('[' + stamp + ' • ' + who + ']');

  // Idempotency check (rough): same status and comment already ends with this stamp
  var sameState = (newStatus === curStatus) && (curComments && curComments.indexOf(toAppend) > -1);

  return {
    newStatus: newStatus,
    newStage:  newStage,
    newGCC:    newGCC,
    newHead:   newHead,
    appendComment: toAppend,
    ts: when,
    sameState: sameState,
    roleSpecificComments: roleSpecificComments,
    roleDecision: roleDecision
  };
}

/**
 * Apply the update object to the row.
 */
function applyRowUpdate_(sheet, rowIndex, headerMap, update) {
  var toSet = [];
  var cols  = [];

  function setIfPresent(headerName, value) {
    var c = headerMap[headerName];
    if (c) { cols.push(c); toSet.push([value]); }
  }

  setIfPresent('Status',         update.newStatus);
  setIfPresent('Workflow Stage', update.newStage);
  if (update.newGCC)  setIfPresent('GCC Recommendation',  update.newGCC);
  if (update.newHead) setIfPresent('Head Recommendation', update.newHead);
  setIfPresent('Last Updated',   update.ts);

  // Write to specific role columns if available
  if (update.roleSpecificComments) {
    // For CSR recommendations, write to CSR Team Comments (AE)
    var csrCol = headerMap['CSR Team Comments'];
    if (csrCol) {
      sheet.getRange(rowIndex, csrCol).setValue(update.roleSpecificComments);
    }

    // Also set CSR Team Decision (AF)
    var csrDecisionCol = headerMap['CSR Team Decision'];
    if (csrDecisionCol && update.roleDecision) {
      sheet.getRange(rowIndex, csrDecisionCol).setValue(update.roleDecision);
    }

    // Set CSR Team Date (AG)
    var csrDateCol = headerMap['CSR Team Date'];
    if (csrDateCol) {
      sheet.getRange(rowIndex, csrDateCol).setValue(update.ts);
    }
  }

  // Also write to generic Reviewer Comments for backwards compatibility
  if (headerMap['Reviewer Comments']) {
    var cur = sheet.getRange(rowIndex, headerMap['Reviewer Comments']).getValue() || '';
    var next = String(cur).trim();
    next = next ? (next + '\n' + update.appendComment) : update.appendComment;
    sheet.getRange(rowIndex, headerMap['Reviewer Comments']).setValue(next);
  }

  if (cols.length) {
    // write the grouped single-row values
    for (var i = 0; i < cols.length; i++) {
      sheet.getRange(rowIndex, cols[i]).setValue(toSet[i][0]);
    }
  }
}

/**
 * Append to AUDIT_LOG sheet (creates if missing).
 */
function appendAudit_(ss, requestId, role, verb, status, comments, when) {
  var name = CONFIG.SHEET_NAMES.AUDIT_LOG || 'AUDIT_LOG';
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Timestamp','Request ID','Role','Action','Status','Comments','By']);
  }
  var user = Session.getActiveUser ? Session.getActiveUser().getEmail() : '';
  sh.appendRow([
    when,
    requestId,
    role,
    verb,
    status,
    comments || '',
    user
  ]);
}


/*************************************************************
 * DATABASE INITIALIZATION - AUTO-SETUP ALL SHEETS
 *************************************************************/

function initializeDatabase() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = {
      success: true,
      sheetsCreated: [],
      sheetsExisting: []
    };
    
    // Create all required sheets
    var sheets = [
      { name: CONFIG.SHEET_NAMES.SUBMISSIONS, setup: setupSubmissionsSheet },
      { name: CONFIG.SHEET_NAMES.USERS, setup: setupAuthorizedUsersSheet },
      { name: CONFIG.SHEET_NAMES.ANALYTICS, setup: setupAnalyticsSheet },
      { name: CONFIG.SHEET_NAMES.WORKFLOW, setup: setupWorkflowLogSheet },
      { name: CONFIG.SHEET_NAMES.SDG_MAPPING, setup: setupSDGMappingSheet },
      { name: CONFIG.SHEET_NAMES.EMAIL_TEMPLATES, setup: setupEmailTemplatesSheet },
      { name: CONFIG.SHEET_NAMES.APPROVERS, setup: setupApproversSheet },
      { name: CONFIG.SHEET_NAMES.DOCUMENTS, setup: setupDocumentTrackingSheet },
      { name: CONFIG.SHEET_NAMES.HISTORY, setup: setupHistorySheet },          // ADD THIS
      { name: CONFIG.SHEET_NAMES.REMINDERS, setup: setupRemindersSheet }       // ADD THIS
    ];
    
    sheets.forEach(function(sheetConfig) {
      var sheet = ss.getSheetByName(sheetConfig.name);
      if (!sheet) {
        sheet = ss.insertSheet(sheetConfig.name);
        sheetConfig.setup(sheet);
        result.sheetsCreated.push(sheetConfig.name);
      } else {
        result.sheetsExisting.push(sheetConfig.name);
      }
    });
    
    Logger.log("Database initialization complete: " + JSON.stringify(result));
    return result;
    
  } catch (error) {
    Logger.log("Error initializing database: " + error);
    return { success: false, error: error.message };
  }
}

/*************************************************************
 * SHEET SETUP FUNCTIONS
 *************************************************************/

function setupSubmissionsSheet(sheet) {
  var headers = [
    // Columns A-C: Basic Info
    "Request ID", "Submission Date", "Submission Time",
    
    // Columns D-F: CSR Rep Info
    "CSR Rep Name", "CSR Rep Email", "CSR Rep Company",
    
    // Columns G-K: Requester Info
    "Requester Name", "Requester Email", "Requester Contact", "Organization Name", "Organization NRIC/RN",
    
    // Columns L-R: Request Details
    "Request Type", "Event Name", "Event Date", "Event Location", "Event Focus Area", 
    "Event Description", "Event Objectives",
    
    // Columns S-W: Financial & Payment
    "Amount Requested", "Purpose", "Payee Name", "Payee Bank", "Payee Account",
    
    // Columns X-Z: Supporting Data
    "Supporting Documents", "Verification Checklist", "Contribution History",
    
    // Columns AA-AC: Status & Workflow
    "Status", "Workflow Stage", "Current Approver", "Last Updated",
    
    // Columns AE-AG: CSR Team Decision
    "CSR Team Comments", "CSR Team Decision", "CSR Team Date",
    
    // Columns AH-AJ: GCC Decision
    "GCC Comments", "GCC Decision", "GCC Date",
    
    // Columns AK-AM: PDF Generation
    "PDF Generated", "PDF URL", "PDF Format",
    
    // Columns AN-AP: Signed PDF Upload
    "Signed PDF Uploaded", "Signed PDF URL", "Signed PDF Date",
    
    // Columns AQ-AR: Drive Folder
    "Drive Folder ID", "Drive Folder URL",
    
    // Columns AS-AT: Story Upload Status
    "Story Upload Status", "Story Upload Date",
    
    // Columns AU-AV: GMD Notification
    "GMD Notified", "GMD Notification Date",
    
    // Columns AW-BA: SDG & Impact
    "SDG Goals", "Impact Category", "Beneficiary Count", "Geographic Area", "Duration",
    
    // Columns BB-BD: Additional Tracking
    "Priority Level", "Approval Chain", "Rejection Reason"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1a472a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11);
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  
  Logger.log("Submissions sheet setup complete with " + headers.length + " columns");
}

function setupAuthorizedUsersSheet(sheet) {
  var headers = [
    "User ID", "Full Name", "Email", "Designation", "Company",
    "Role", "Access Level", "Can Submit", "Can Approve", "Can View All",
    "Department", "Date Added", "Added By", "Status", "Last Login",
    "Approval Limit", "Notification Preference", "Phone Number"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1a472a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11);
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  
  // Add sample users
  var sampleUsers = [
    ["U001", "John Doe", "john.doe@cahyamata.com", "CSR Manager", "Cahya Mata",
     CONFIG.ROLES.CSR_REP, "Standard", "TRUE", "FALSE", "FALSE", "CSR",
     new Date().toLocaleDateString(), "System", "Active", "", "0", "Email", ""],
    ["U002", "Jane Smith", "jane.smith@cahyamata.com", "GCC Officer", "Cahya Mata",
     CONFIG.ROLES.GCC_TEAM, "Approver", "TRUE", "TRUE", "TRUE", "GCC",
     new Date().toLocaleDateString(), "System", "Active", "", "50000", "Email", ""],
    ["U003", "Robert Johnson", "robert.johnson@cahyamata.com", "GM GCC", "Cahya Mata",
     CONFIG.ROLES.GM_GCC, "Approver", "TRUE", "TRUE", "TRUE", "Management",
     new Date().toLocaleDateString(), "System", "Active", "", "100000", "Email", ""],
    ["U004", "Sarah Wilson", "sarah.wilson@cahyamata.com", "GCCSO", "Cahya Mata",
     CONFIG.ROLES.GCCSO, "Approver", "TRUE", "TRUE", "TRUE", "Compliance",
     new Date().toLocaleDateString(), "System", "Active", "", "500000", "Email", ""],
    ["U005", "Michael Brown", "michael.brown@cahyamata.com", "GCFO", "Cahya Mata",
     CONFIG.ROLES.GCFO, "Approver", "TRUE", "TRUE", "TRUE", "Finance",
     new Date().toLocaleDateString(), "System", "Active", "", "1000000", "Email", ""],
    ["U006", "Lisa Davis", "lisa.davis@cahyamata.com", "GMD Office", "Cahya Mata",
     CONFIG.ROLES.GMD_OFFICE, "Approver", "TRUE", "TRUE", "TRUE", "Executive",
     new Date().toLocaleDateString(), "System", "Active", "", "999999999", "Email", ""],
    ["U007", "Admin User", "admin@cahyamata.com", "Administrator", "Cahya Mata",
     CONFIG.ROLES.ADMIN, "Admin", "TRUE", "TRUE", "TRUE", "IT",
     new Date().toLocaleDateString(), "System", "Active", "", "999999999", "Email", ""]
  ];
  
  sheet.getRange(2, 1, sampleUsers.length, headers.length).setValues(sampleUsers);
  Logger.log("Authorized Users sheet setup complete");
}

function setupAnalyticsSheet(sheet) {
  var headers = [
    "Date", "Total Requests", "Pending", "Approved", "Rejected",
    "Total Amount Requested", "Total Amount Approved", "Avg Processing Time (Days)",
    "Active Users", "Top Request Type", "Approval Rate %", "SDG Coverage",
    "Top SDG Goal", "Requests by Priority", "Escalations", "Auto-Approvals"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1a472a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11);
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  
  Logger.log("Analytics sheet setup complete");
}

function setupWorkflowLogSheet(sheet) {
  var headers = [
    "Log ID", "Request ID", "Timestamp", "Action Type", "Performed By",
    "User Role", "Previous Status", "New Status", "Comments", "Duration (Hours)",
    "Approver Level", "Approval Decision", "Email Sent", "Document Added",
    "System Notes", "IP Address"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1a472a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11);
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  
  Logger.log("Workflow Log sheet setup complete");
}

function setupSDGMappingSheet(sheet) {
  var headers = [
    "Request ID", "SDG Goals", "Primary SDG", "Secondary SDGs",
    "Impact Category", "Beneficiary Count", "Geographic Area",
    "Duration", "Alignment Score", "Impact Metrics", "Mapping Date",
    "Mapped By", "Verification Status", "Notes"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1a472a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11);
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  
  Logger.log("SDG Mapping sheet setup complete");
}

function setupEmailTemplatesSheet(sheet) {
  var headers = [
    "Template ID", "Template Name", "Email Type", "Subject", "Body",
    "Variables", "Active", "Created Date", "Last Modified", "Usage Count"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1a472a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11);
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  
  // Add default email templates
  var templates = [
    ["T001", "New Submission", CONFIG.EMAIL_TYPES.NEW_SUBMISSION,
     "New CSR Request Submitted - {{REQUEST_ID}}",
     "Dear {{RECIPIENT_NAME}},\n\nA new CSR request has been submitted.\n\nRequest ID: {{REQUEST_ID}}\nSubmitter: {{SUBMITTER_NAME}}\nAmount: RM {{AMOUNT}}\nPurpose: {{PURPOSE}}\n\nPlease review at your earliest convenience.\n\nBest regards,\nCSR Management System",
     "REQUEST_ID, RECIPIENT_NAME, SUBMITTER_NAME, AMOUNT, PURPOSE", "TRUE",
     new Date().toLocaleDateString(), new Date().toLocaleDateString(), 0],
    
    ["T002", "Approval Request", CONFIG.EMAIL_TYPES.APPROVAL_REQUEST,
     "CSR Request Requires Your Approval - {{REQUEST_ID}}",
     "Dear {{APPROVER_NAME}},\n\nA CSR request requires your approval.\n\nRequest ID: {{REQUEST_ID}}\nSubmitter: {{SUBMITTER_NAME}}\nAmount: RM {{AMOUNT}}\nPurpose: {{PURPOSE}}\nCurrent Stage: {{WORKFLOW_STAGE}}\n\nPlease login to review and approve/reject this request.\n\nBest regards,\nCSR Management System",
     "REQUEST_ID, APPROVER_NAME, SUBMITTER_NAME, AMOUNT, PURPOSE, WORKFLOW_STAGE", "TRUE",
     new Date().toLocaleDateString(), new Date().toLocaleDateString(), 0],
    
    ["T003", "Request Approved", CONFIG.EMAIL_TYPES.APPROVED,
     "Your CSR Request Has Been Approved - {{REQUEST_ID}}",
     "Dear {{SUBMITTER_NAME}},\n\nCongratulations! Your CSR request has been approved.\n\nRequest ID: {{REQUEST_ID}}\nAmount Approved: RM {{AMOUNT}}\nApproved By: {{APPROVER_NAME}}\nApproval Date: {{APPROVAL_DATE}}\n\nNext Steps: {{NEXT_STEPS}}\n\nBest regards,\nCSR Management System",
     "REQUEST_ID, SUBMITTER_NAME, AMOUNT, APPROVER_NAME, APPROVAL_DATE, NEXT_STEPS", "TRUE",
     new Date().toLocaleDateString(), new Date().toLocaleDateString(), 0],
    
    ["T004", "Request Rejected", CONFIG.EMAIL_TYPES.REJECTED,
     "CSR Request Status Update - {{REQUEST_ID}}",
     "Dear {{SUBMITTER_NAME}},\n\nYour CSR request has been reviewed.\n\nRequest ID: {{REQUEST_ID}}\nStatus: {{STATUS}}\nReviewed By: {{REVIEWER_NAME}}\nReason: {{REASON}}\n\nIf you have questions, please contact the CSR team.\n\nBest regards,\nCSR Management System",
     "REQUEST_ID, SUBMITTER_NAME, STATUS, REVIEWER_NAME, REASON", "TRUE",
     new Date().toLocaleDateString(), new Date().toLocaleDateString(), 0],
    
    ["T005", "Information Required", CONFIG.EMAIL_TYPES.INFO_REQUIRED,
     "Additional Information Required - {{REQUEST_ID}}",
     "Dear {{SUBMITTER_NAME}},\n\nYour CSR request requires additional information.\n\nRequest ID: {{REQUEST_ID}}\nRequested By: {{REVIEWER_NAME}}\nInformation Needed: {{INFO_REQUIRED}}\n\nPlease provide the requested information at your earliest convenience.\n\nBest regards,\nCSR Management System",
     "REQUEST_ID, SUBMITTER_NAME, REVIEWER_NAME, INFO_REQUIRED", "TRUE",
     new Date().toLocaleDateString(), new Date().toLocaleDateString(), 0]
  ];
  
  sheet.getRange(2, 1, templates.length, headers.length).setValues(templates);
  Logger.log("Email Templates sheet setup complete");
}

function setupApproversSheet(sheet) {
  var headers = [
    "Approver ID", "Name", "Email", "Role", "Level", "Monetary Limit",
    "Backup Approver", "Out of Office", "Auto-Delegate", "Active",
    "Total Approvals", "Avg Response Time", "Last Activity"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1a472a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11);
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  
  // Add sample approvers
  var approvers = [
    ["A001", "Jane Smith", "jane.smith@cahyamata.com", CONFIG.ROLES.GCC_TEAM, "1", "50000", "", "FALSE", "FALSE", "TRUE", 0, 0, ""],
    ["A002", "Robert Johnson", "robert.johnson@cahyamata.com", CONFIG.ROLES.GM_GCC, "2", "100000", "A001", "FALSE", "FALSE", "TRUE", 0, 0, ""],
    ["A003", "Sarah Wilson", "sarah.wilson@cahyamata.com", CONFIG.ROLES.GCCSO, "3", "500000", "A002", "FALSE", "FALSE", "TRUE", 0, 0, ""],
    ["A004", "Michael Brown", "michael.brown@cahyamata.com", CONFIG.ROLES.GCFO, "4", "1000000", "A003", "FALSE", "FALSE", "TRUE", 0, 0, ""],
    ["A005", "Lisa Davis", "lisa.davis@cahyamata.com", CONFIG.ROLES.GMD_OFFICE, "5", "999999999", "A004", "FALSE", "FALSE", "TRUE", 0, 0, ""]
  ];
  
  sheet.getRange(2, 1, approvers.length, headers.length).setValues(approvers);
  Logger.log("Approvers sheet setup complete");
}

function setupDocumentTrackingSheet(sheet) {
  var headers = [
    "Document ID", "Request ID", "Document Type", "File Name", "File URL",
    "Upload Date", "Uploaded By", "File Size", "Verification Status",
    "Verified By", "Verification Date", "Document Category", "Notes"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1a472a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11);
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  
  Logger.log("Document Tracking sheet setup complete");
}

/*************************************************************
 * USER AUTHENTICATION & AUTHORIZATION
 *************************************************************/

function authenticateUser(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
    
    if (!usersSheet) {
      initializeDatabase();
      usersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
    }
    
    var data = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][2].toLowerCase() === email.toLowerCase() && data[i][13] === "Active") {
        
        // Update last login
        usersSheet.getRange(i + 1, 15).setValue(new Date().toLocaleString());
        
        return {
          success: true,
          authorized: true,
          user: {
            userId: data[i][0],
            fullName: data[i][1],
            email: data[i][2],
            designation: data[i][3],
            company: data[i][4],
            role: data[i][5],
            accessLevel: data[i][6],
            canSubmit: data[i][7] === "TRUE",
            canApprove: data[i][8] === "TRUE",
            canViewAll: data[i][9] === "TRUE",
            department: data[i][10],
            approvalLimit: parseFloat(data[i][15]) || 0
          }
        };
      }
    }
    
    return {
      success: true,
      authorized: false,
      message: "User not authorized. Please contact administrator."
    };
    
  } catch (error) {
    Logger.log("Error in authenticateUser: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}

function getCurrentUser() {
  var email = Session.getActiveUser().getEmail();
  return authenticateUser(email);
}

/*************************************************************
 * CSR REQUEST SUBMISSION
 *************************************************************/

function submitCSRRequest(requestData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    
    if (!submissionsSheet) {
      initializeDatabase();
      submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    }
    
    // Generate request ID
    var requestId = generateRequestId();
    var timestamp = new Date();
    var amount = parseFloat(requestData.amountRequested) || 0;
    
    // Prepare enhanced row data with CSR Rep and Requester distinction
    var rowData = [
      requestId,                                    // A: Request ID
      timestamp.toLocaleDateString(),               // B: Submission Date
      timestamp.toLocaleTimeString(),               // C: Submission Time
      requestData.csrRepName || requestData.submitterName,  // D: CSR Rep Name
      requestData.csrRepEmail || requestData.email,         // E: CSR Rep Email
      requestData.csrRepCompany || requestData.companyName, // F: CSR Rep Company
      requestData.requesterName || "",              // G: Requester Name
      requestData.requesterEmail || "",             // H: Requester Email
      requestData.requesterContact || "",           // I: Requester Contact
      requestData.organizationName || "",           // J: Organization Name
      requestData.organizationNRIC || "",           // K: Organization NRIC/RN
      requestData.requestType,                      // L: Request Type
      requestData.eventName || "",                  // M: Event Name
      requestData.eventDate || "",                  // N: Event Date
      requestData.eventLocation || "",              // O: Event Location
      requestData.eventFocusArea || "",             // P: Event Focus Area
      requestData.eventDescription || "",           // Q: Event Description
      requestData.eventObjectives || "",            // R: Event Objectives
      amount,                                       // S: Amount Requested
      requestData.purpose,                          // T: Purpose
      requestData.payeeName,                        // U: Payee Name
      requestData.payeeBank,                        // V: Payee Bank
      requestData.payeeAccount,                     // W: Payee Account
      JSON.stringify(requestData.supportingDocuments || []),    // X
      JSON.stringify(requestData.verificationChecklist || {}),  // Y
      JSON.stringify(requestData.contributionHistory || []),    // Z
      CONFIG.STATUS.SUBMITTED,                      // AA: Status
      CONFIG.STATUS.CSR_REVIEW,                     // AB: Workflow Stage
      CONFIG.EMAILS.CSR_TEAM,                       // AC: Current Approver
      timestamp.toISOString(),                      // AD: Last Updated
      "", "", "",                                   // AE-AG: CSR Team (Comments, Decision, Date)
      "", "", "",                                   // AH-AJ: GCC (Comments, Decision, Date)
      "FALSE", "", "",                              // AK-AM: PDF (Generated?, URL, Format)
      "FALSE", "", "",                              // AN-AP: Signed PDF (Uploaded?, URL, Date)
      "", "",                                       // AQ-AR: Drive Folder (ID, URL)
      "Pending", "",                                // AS-AT: Story Upload (Status, Date)
      "FALSE", "",                                  // AU-AV: GMD (Notified?, Date)
      JSON.stringify(requestData.sdgGoals || []),   // AW: SDG Goals
      requestData.impactCategory || "",             // AX: Impact Category
      requestData.beneficiaryCount || "",           // AY: Beneficiary Count
      requestData.geographicArea || "",             // AZ: Geographic Area
      requestData.duration || "",                   // BA: Duration
      determinePriority(amount),                    // BB: Priority Level
      JSON.stringify([]),                           // BC: Approval Chain
      ""                                            // BD: Rejection Reason
    ];
    
    // Add to submissions sheet
    submissionsSheet.appendRow(rowData);
    
    // Log workflow action
    logWorkflowAction({
      requestId: requestId,
      actionType: "NEW_SUBMISSION",
      performedBy: requestData.csrRepName || requestData.submitterName,
      userRole: CONFIG.ROLES.CSR_REP,
      previousStatus: "",
      newStatus: CONFIG.STATUS.SUBMITTED,
      comments: "Initial submission"
    });
    
    // Send EMAIL 1: Acknowledgement to Requester
    sendAcknowledgementEmail(requestId, requestData);
    
    // Send EMAIL 2: CSR Team Verification Request
    sendCSRVerificationEmail(requestId, requestData);
    
    return {
      success: true,
      requestId: requestId,
      message: "Request submitted successfully. Acknowledgement sent to requester.",
      workflowStage: CONFIG.STATUS.CSR_REVIEW,
      nextApprover: CONFIG.EMAILS.CSR_TEAM
    };
    
  } catch (error) {
    Logger.log("Error submitting request: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}
/*************************************************************
 * WORKFLOW MANAGEMENT & ROUTING
 *************************************************************/

function determineInitialWorkflowStage(amount) {
  if (amount <= CONFIG.MONETARY_THRESHOLDS.LOW) {
    return CONFIG.STATUS.GCC_REVIEW;
  } else if (amount <= CONFIG.MONETARY_THRESHOLDS.MEDIUM) {
    return CONFIG.STATUS.GM_REVIEW;
  } else if (amount <= CONFIG.MONETARY_THRESHOLDS.HIGH) {
    return CONFIG.STATUS.GCCSO_REVIEW;
  } else {
    return CONFIG.STATUS.GMD_REVIEW;
  }
}

function getNextApprover(workflowStage, amount) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var approversSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.APPROVERS);
  
  if (!approversSheet) return "";
  
  var data = approversSheet.getDataRange().getValues();
  
  // Match workflow stage to approver role
  var targetRole = "";
  switch(workflowStage) {
    case CONFIG.STATUS.GCC_REVIEW:
      targetRole = CONFIG.ROLES.GCC_TEAM;
      break;
    case CONFIG.STATUS.GM_REVIEW:
      targetRole = CONFIG.ROLES.GM_GCC;
      break;
    case CONFIG.STATUS.COMPLIANCE_REVIEW:
      targetRole = CONFIG.ROLES.COMPLIANCE;
      break;
    case CONFIG.STATUS.GCCSO_REVIEW:
      targetRole = CONFIG.ROLES.GCCSO;
      break;
    case CONFIG.STATUS.GCFO_REVIEW:
      targetRole = CONFIG.ROLES.GCFO;
      break;
    case CONFIG.STATUS.GMD_REVIEW:
      targetRole = CONFIG.ROLES.GMD_OFFICE;
      break;
  }
  
  // Find active approver with sufficient limit
  for (var i = 1; i < data.length; i++) {
    if (data[i][3] === targetRole && 
        data[i][9] === "TRUE" && 
        data[i][7] === "FALSE" && 
        parseFloat(data[i][5]) >= amount) {
      return data[i][2]; // Return email
    }
  }
  
  return "";
}

function getApprovalChain(amount) {
  var chain = [];
  
  chain.push({ role: CONFIG.ROLES.CSR_REP, required: true });
  chain.push({ role: CONFIG.ROLES.GCC_TEAM, required: true });
  
  if (amount > CONFIG.MONETARY_THRESHOLDS.LOW) {
    chain.push({ role: CONFIG.ROLES.GM_GCC, required: true });
  }
  
  if (amount > CONFIG.MONETARY_THRESHOLDS.MEDIUM) {
    chain.push({ role: CONFIG.ROLES.COMPLIANCE, required: true });
    chain.push({ role: CONFIG.ROLES.GCCSO, required: true });
  }
  
  if (amount > CONFIG.MONETARY_THRESHOLDS.HIGH) {
    chain.push({ role: CONFIG.ROLES.GCFO, required: true });
    chain.push({ role: CONFIG.ROLES.GMD_OFFICE, required: true });
  }
  
  return chain;
}

/*************************************************************
 * APPROVAL & REJECTION FUNCTIONS
 *************************************************************/

function approveRequest(requestId, approverEmail, comments, attachments) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    var data = submissionsSheet.getDataRange().getValues();
    
    // Find request
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === requestId) {
        var currentStatus = data[i][16];
        var amount = parseFloat(data[i][11]) || 0;
        var approvalChain = getApprovalChain(amount);
        
        // Determine next stage
        var nextStage = getNextApprovalStage(currentStatus, amount);
        var nextApprover = "";
        
        if (nextStage === CONFIG.STATUS.APPROVED) {
          // Final approval
          submissionsSheet.getRange(i + 1, 17).setValue(CONFIG.STATUS.APPROVED);
          submissionsSheet.getRange(i + 1, 18).setValue("Completed");
          submissionsSheet.getRange(i + 1, 19).setValue("");
          submissionsSheet.getRange(i + 1, 21).setValue(new Date().toISOString());
          
          // Log action
          logWorkflowAction({
            requestId: requestId,
            actionType: "APPROVED",
            performedBy: approverEmail,
            userRole: getApproverRole(approverEmail),
            previousStatus: currentStatus,
            newStatus: CONFIG.STATUS.APPROVED,
            comments: comments || "Approved",
            approvalDecision: "Approved"
          });
          
          // Send approval notification
          sendApprovalNotification(requestId, data[i]);
          
        } else {
          // Move to next approval stage
          nextApprover = getNextApprover(nextStage, amount);
          
          submissionsSheet.getRange(i + 1, 17).setValue(nextStage);
          submissionsSheet.getRange(i + 1, 18).setValue(nextStage);
          submissionsSheet.getRange(i + 1, 19).setValue(nextApprover);
          submissionsSheet.getRange(i + 1, 21).setValue(new Date().toISOString());
          
          // Log action
          logWorkflowAction({
            requestId: requestId,
            actionType: "APPROVED_STAGE",
            performedBy: approverEmail,
            userRole: getApproverRole(approverEmail),
            previousStatus: currentStatus,
            newStatus: nextStage,
            comments: comments || "Approved - Moving to next stage",
            approvalDecision: "Approved"
          });
          
          // Send to next approver
          sendApprovalRequestNotification(requestId, data[i], nextApprover);
        }
        
        // Update approval chain
        var chain = JSON.parse(data[i][26] || "[]");
        chain.push({
          approver: approverEmail,
          role: getApproverRole(approverEmail),
          decision: "Approved",
          timestamp: new Date().toISOString(),
          comments: comments || ""
        });
        submissionsSheet.getRange(i + 1, 27).setValue(JSON.stringify(chain));
        
        // Add attachments if provided
        if (attachments && attachments.length > 0) {
          trackDocuments(requestId, attachments, approverEmail);
        }
        
        updateAnalytics();
        
        return {
          success: true,
          message: nextStage === CONFIG.STATUS.APPROVED ? 
            "Request approved successfully" : 
            "Request approved and moved to next stage",
          nextStage: nextStage,
          nextApprover: nextApprover
        };
      }
    }
    
    return {
      success: false,
      error: "Request not found"
    };
    
  } catch (error) {
    Logger.log("Error approving request: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}

function rejectRequest(requestId, approverEmail, reason, allowResubmission) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    var data = submissionsSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === requestId) {
        var currentStatus = data[i][16];
        var newStatus = allowResubmission ? CONFIG.STATUS.RESUBMIT : CONFIG.STATUS.REJECTED;
        
        submissionsSheet.getRange(i + 1, 17).setValue(newStatus);
        submissionsSheet.getRange(i + 1, 18).setValue("Rejected");
        submissionsSheet.getRange(i + 1, 19).setValue("");
        submissionsSheet.getRange(i + 1, 21).setValue(new Date().toISOString());
        submissionsSheet.getRange(i + 1, 29).setValue(reason);
        
        // Update approval chain
        var chain = JSON.parse(data[i][26] || "[]");
        chain.push({
          approver: approverEmail,
          role: getApproverRole(approverEmail),
          decision: "Rejected",
          timestamp: new Date().toISOString(),
          comments: reason
        });
        submissionsSheet.getRange(i + 1, 27).setValue(JSON.stringify(chain));
        
        // Log action
        logWorkflowAction({
          requestId: requestId,
          actionType: "REJECTED",
          performedBy: approverEmail,
          userRole: getApproverRole(approverEmail),
          previousStatus: currentStatus,
          newStatus: newStatus,
          comments: reason,
          approvalDecision: "Rejected"
        });
        
        // Send rejection notification
        sendRejectionNotification(requestId, data[i], reason, allowResubmission);
        
        updateAnalytics();
        
        return {
          success: true,
          message: "Request rejected",
          allowResubmission: allowResubmission
        };
      }
    }
    
    return {
      success: false,
      error: "Request not found"
    };
    
  } catch (error) {
    Logger.log("Error rejecting request: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}

function getNextApprovalStage(currentStage, amount) {
  var stages = [];
  
  // Build stages based on amount
  stages.push(CONFIG.STATUS.GCC_REVIEW);
  
  if (amount > CONFIG.MONETARY_THRESHOLDS.LOW) {
    stages.push(CONFIG.STATUS.GM_REVIEW);
  }
  
  if (amount > CONFIG.MONETARY_THRESHOLDS.MEDIUM) {
    stages.push(CONFIG.STATUS.COMPLIANCE_REVIEW);
    stages.push(CONFIG.STATUS.GCCSO_REVIEW);
  }
  
  if (amount > CONFIG.MONETARY_THRESHOLDS.HIGH) {
    stages.push(CONFIG.STATUS.GCFO_REVIEW);
    stages.push(CONFIG.STATUS.GMD_REVIEW);
  }
  
  // Find current stage index
  var currentIndex = stages.indexOf(currentStage);
  
  // Return next stage or APPROVED if at end
  if (currentIndex >= 0 && currentIndex < stages.length - 1) {
    return stages[currentIndex + 1];
  } else {
    return CONFIG.STATUS.APPROVED;
  }
}

function getApproverRole(email) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
  
  if (!usersSheet) return "";
  
  var data = usersSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][2].toLowerCase() === email.toLowerCase()) {
      return data[i][5]; // Return role
    }
  }
  
  return "";
}

/*************************************************************
 * SDG MAPPING FUNCTIONS
 *************************************************************/

function mapRequestToSDGs(requestId, requestData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sdgSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SDG_MAPPING);
    
    if (!sdgSheet) return;
    
    var sdgGoals = requestData.sdgGoals || [];
    var primarySDG = sdgGoals[0] || "";
    var secondarySDGs = sdgGoals.slice(1).join(", ");
    
    var rowData = [
      requestId,
      sdgGoals.join(", "),
      primarySDG,
      secondarySDGs,
      requestData.impactCategory || "",
      requestData.beneficiaryCount || 0,
      requestData.geographicArea || "",
      requestData.duration || "",
      calculateAlignmentScore(requestData),
      JSON.stringify(requestData.impactMetrics || {}),
      new Date().toISOString(),
      requestData.email || "",
      "Pending",
      ""
    ];
    
    sdgSheet.appendRow(rowData);
    
    Logger.log("SDG mapping created for request: " + requestId);
    
  } catch (error) {
    Logger.log("Error mapping SDGs: " + error);
  }
}

function calculateAlignmentScore(requestData) {
  var score = 0;
  
  // Base score for having SDG mapping
  if (requestData.sdgGoals && requestData.sdgGoals.length > 0) {
    score += 30;
  }
  
  // Score for impact areas
  if (requestData.impactAreas && requestData.impactAreas.length > 0) {
    score += 20;
  }
  
  // Score for beneficiary count
  if (requestData.beneficiaryCount > 0) {
    score += 20;
  }
  
  // Score for detailed purpose
  if (requestData.purpose && requestData.purpose.length > 100) {
    score += 15;
  }
  
  // Score for documentation
  if (requestData.supportingDocuments && requestData.supportingDocuments.length > 0) {
    score += 15;
  }
  
  return Math.min(score, 100);
}

function getSDGDashboardData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    var sdgSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SDG_MAPPING);
    
    if (!submissionsSheet || !sdgSheet) {
      return { success: false, error: "Required sheets not found" };
    }
    
    var submissionsData = submissionsSheet.getDataRange().getValues();
    var sdgData = sdgSheet.getDataRange().getValues();
    
    var sdgStats = {};
    var totalMapped = 0;
    var totalAmount = 0;
    var approvedAmount = 0;
    
    // Initialize SDG counters
    for (var goal in CONFIG.SDG_GOALS) {
      sdgStats[goal] = {
        name: CONFIG.SDG_GOALS[goal],
        count: 0,
        amount: 0,
        approvedAmount: 0,
        impactScore: 0
      };
    }
    
    // Process submissions
    for (var i = 1; i < submissionsData.length; i++) {
      var sdgGoals = JSON.parse(submissionsData[i][24] || "[]");
      var amount = parseFloat(submissionsData[i][11]) || 0;
      var status = submissionsData[i][16];
      
      if (sdgGoals && sdgGoals.length > 0) {
        totalMapped++;
        totalAmount += amount;
        
        if (status === CONFIG.STATUS.APPROVED) {
          approvedAmount += amount;
        }
        
        sdgGoals.forEach(function(goal) {
          if (sdgStats[goal]) {
            sdgStats[goal].count++;
            sdgStats[goal].amount += amount;
            if (status === CONFIG.STATUS.APPROVED) {
              sdgStats[goal].approvedAmount += amount;
            }
          }
        });
      }
    }
    
    // Calculate average impact scores
    for (var j = 1; j < sdgData.length; j++) {
      var goals = sdgData[j][1].split(", ");
      var score = parseFloat(sdgData[j][8]) || 0;
      
      goals.forEach(function(goal) {
        goal = goal.trim();
        if (sdgStats[goal]) {
          sdgStats[goal].impactScore += score;
        }
      });
    }
    
    // Average the scores
    for (var goal in sdgStats) {
      if (sdgStats[goal].count > 0) {
        sdgStats[goal].impactScore = (sdgStats[goal].impactScore / sdgStats[goal].count).toFixed(1);
      }
    }
    
    return {
      success: true,
      data: {
        totalMapped: totalMapped,
        totalAmount: totalAmount,
        approvedAmount: approvedAmount,
        sdgStats: sdgStats,
        coverageRate: ((totalMapped / (submissionsData.length - 1)) * 100).toFixed(1)
      }
    };
    
  } catch (error) {
    Logger.log("Error getting SDG dashboard data: " + error);
    return { success: false, error: error.message };
  }
}

/*************************************************************
 * EMAIL NOTIFICATION FUNCTIONS
 *************************************************************/

function sendNewSubmissionNotifications(requestId, requestData, approverEmail) {
  try {
    // Send to submitter (confirmation)
    sendEmail({
      to: requestData.email,
      subject: "CSR Request Submitted - " + requestId,
      body: getEmailTemplate(CONFIG.EMAIL_TYPES.NEW_SUBMISSION, {
        REQUEST_ID: requestId,
        RECIPIENT_NAME: requestData.submitterName,
        SUBMITTER_NAME: requestData.submitterName,
        AMOUNT: formatCurrency(requestData.amountRequested),
        PURPOSE: requestData.purpose
      })
    });
    
    // Send to approver (action required)
    if (approverEmail) {
      var approverName = getApproverName(approverEmail);
      sendEmail({
        to: approverEmail,
        subject: "CSR Request Requires Your Approval - " + requestId,
        body: getEmailTemplate(CONFIG.EMAIL_TYPES.APPROVAL_REQUEST, {
          REQUEST_ID: requestId,
          APPROVER_NAME: approverName,
          SUBMITTER_NAME: requestData.submitterName,
          AMOUNT: formatCurrency(requestData.amountRequested),
          PURPOSE: requestData.purpose,
          WORKFLOW_STAGE: determineInitialWorkflowStage(parseFloat(requestData.amountRequested))
        })
      });
    }
    
    Logger.log("Notifications sent for request: " + requestId);
    
  } catch (error) {
    Logger.log("Error sending notifications: " + error);
  }
}

function sendApprovalRequestNotification(requestId, requestData, approverEmail) {
  try {
    if (!approverEmail) return;
    
    var approverName = getApproverName(approverEmail);
    
    sendEmail({
      to: approverEmail,
      subject: "CSR Request Requires Your Approval - " + requestId,
      body: getEmailTemplate(CONFIG.EMAIL_TYPES.APPROVAL_REQUEST, {
        REQUEST_ID: requestId,
        APPROVER_NAME: approverName,
        SUBMITTER_NAME: requestData[3],
        AMOUNT: formatCurrency(requestData[11]),
        PURPOSE: requestData[12],
        WORKFLOW_STAGE: requestData[17]
      })
    });
    
  } catch (error) {
    Logger.log("Error sending approval request: " + error);
  }
}

function sendApprovalNotification(requestId, requestData) {
  try {
    sendEmail({
      to: requestData[5],
      subject: "Your CSR Request Has Been Approved - " + requestId,
      body: getEmailTemplate(CONFIG.EMAIL_TYPES.APPROVED, {
        REQUEST_ID: requestId,
        SUBMITTER_NAME: requestData[3],
        AMOUNT: formatCurrency(requestData[11]),
        APPROVER_NAME: "CSR Management Team",
        APPROVAL_DATE: new Date().toLocaleDateString(),
        NEXT_STEPS: "The finance team will process your request within 5 business days."
      })
    });
    
  } catch (error) {
    Logger.log("Error sending approval notification: " + error);
  }
}

function sendRejectionNotification(requestId, requestData, reason, allowResubmission) {
  try {
    var status = allowResubmission ? "Pending Resubmission" : "Rejected";
    
    sendEmail({
      to: requestData[5],
      subject: "CSR Request Status Update - " + requestId,
      body: getEmailTemplate(CONFIG.EMAIL_TYPES.REJECTED, {
        REQUEST_ID: requestId,
        SUBMITTER_NAME: requestData[3],
        STATUS: status,
        REVIEWER_NAME: "CSR Management Team",
        REASON: reason
      })
    });
    
  } catch (error) {
    Logger.log("Error sending rejection notification: " + error);
  }
}

function sendEmail(options) {
  try {
    if (!options.to || !options.subject || !options.body) {
      Logger.log("Missing email parameters");
      return;
    }
    
    MailApp.sendEmail({
      to: options.to,
      subject: options.subject,
      body: options.body,
      name: "CSR Management System",
      noReply: true
    });
    
    Logger.log("Email sent to: " + options.to);
    
  } catch (error) {
    Logger.log("Error sending email: " + error);
  }
}

function getEmailTemplate(templateType, variables) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var templatesSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EMAIL_TEMPLATES);
    
    if (!templatesSheet) return "";
    
    var data = templatesSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][2] === templateType && data[i][6] === "TRUE") {
        var body = data[i][4];
        
        // Replace variables
        for (var key in variables) {
          var placeholder = "{{" + key + "}}";
          body = body.replace(new RegExp(placeholder, "g"), variables[key]);
        }
        
        // Update usage count
        templatesSheet.getRange(i + 1, 10).setValue((data[i][9] || 0) + 1);
        
        return body;
      }
    }
    
    return "Template not found";
    
  } catch (error) {
    Logger.log("Error getting email template: " + error);
    return "";
  }
}

function getApproverName(email) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
  
  if (!usersSheet) return email;
  
  var data = usersSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][2].toLowerCase() === email.toLowerCase()) {
      return data[i][1]; // Return full name
    }
  }
  
  return email;
}

/*************************************************************
 * DOCUMENT TRACKING
 *************************************************************/

function trackDocuments(requestId, documents, uploadedBy) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var docsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DOCUMENTS);
    
    if (!docsSheet) return;
    
    documents.forEach(function(doc) {
      var docId = "DOC" + new Date().getTime() + Math.floor(Math.random() * 1000);
      
      var rowData = [
        docId,
        requestId,
        doc.type || "Supporting Document",
        doc.fileName || "",
        doc.fileUrl || "",
        new Date().toISOString(),
        uploadedBy,
        doc.fileSize || "",
        "Pending",
        "",
        "",
        doc.category || "General",
        doc.notes || ""
      ];
      
      docsSheet.appendRow(rowData);
    });
    
    Logger.log("Documents tracked for request: " + requestId);
    
  } catch (error) {
    Logger.log("Error tracking documents: " + error);
  }
}

/*************************************************************
 * WORKFLOW LOGGING
 *************************************************************/

function logWorkflowAction(logData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var workflowSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.WORKFLOW);
    
    if (!workflowSheet) return;
    
    var logId = "LOG" + new Date().getTime();
    var timestamp = new Date();
    
    var rowData = [
      logId,
      logData.requestId || "",
      timestamp.toISOString(),
      logData.actionType || "",
      logData.performedBy || "",
      logData.userRole || "",
      logData.previousStatus || "",
      logData.newStatus || "",
      logData.comments || "",
      logData.duration || 0,
      logData.approverLevel || "",
      logData.approvalDecision || "",
      logData.emailSent || "FALSE",
      logData.documentAdded || "FALSE",
      logData.systemNotes || "",
      logData.ipAddress || ""
    ];
    
    workflowSheet.appendRow(rowData);
    
  } catch (error) {
    Logger.log("Error logging workflow action: " + error);
  }
}

/*************************************************************
 * ANALYTICS & REPORTING
 *************************************************************/

function updateAnalytics() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var analyticsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ANALYTICS);
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    
    if (!analyticsSheet || !submissionsSheet) return;
    
    var data = submissionsSheet.getDataRange().getValues();
    var today = new Date().toLocaleDateString();
    
    var stats = {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalAmountRequested: 0,
      totalAmountApproved: 0,
      requestsByType: {},
      activeUsers: {},
      sdgCoverage: 0,
      priorityStats: { High: 0, Medium: 0, Low: 0 }
    };
    
    // Calculate statistics
    for (var i = 1; i < data.length; i++) {
      stats.totalRequests++;
      
      var status = data[i][16];
      var amount = parseFloat(data[i][11]) || 0;
      var requestType = data[i][7];
      var submitter = data[i][3];
      var priority = data[i][29] || "Medium";
      var sdgGoals = JSON.parse(data[i][24] || "[]");
      
      stats.totalAmountRequested += amount;
      
      if (status === CONFIG.STATUS.APPROVED) {
        stats.approvedRequests++;
        stats.totalAmountApproved += amount;
      } else if (status === CONFIG.STATUS.REJECTED) {
        stats.rejectedRequests++;
      } else {
        stats.pendingRequests++;
      }
      
      // Count by type
      stats.requestsByType[requestType] = (stats.requestsByType[requestType] || 0) + 1;
      
      // Count active users
      stats.activeUsers[submitter] = true;
      
      // SDG coverage
      if (sdgGoals.length > 0) {
        stats.sdgCoverage++;
      }
      
      // Priority stats
      stats.priorityStats[priority] = (stats.priorityStats[priority] || 0) + 1;
    }
    
    // Get top request type
    var topRequestType = "";
    var maxCount = 0;
    for (var type in stats.requestsByType) {
      if (stats.requestsByType[type] > maxCount) {
        maxCount = stats.requestsByType[type];
        topRequestType = type;
      }
    }
    
    // Calculate approval rate
    var approvalRate = stats.totalRequests > 0 ? 
      ((stats.approvedRequests / stats.totalRequests) * 100).toFixed(1) : 0;
    
    // Calculate SDG coverage percentage
    var sdgCoveragePercent = stats.totalRequests > 0 ?
      ((stats.sdgCoverage / stats.totalRequests) * 100).toFixed(1) : 0;
    
    // Update or append analytics row
    var analyticsData = analyticsSheet.getDataRange().getValues();
    var rowFound = false;
    
    for (var j = 1; j < analyticsData.length; j++) {
      if (analyticsData[j][0] === today) {
        analyticsSheet.getRange(j + 1, 1, 1, 16).setValues([[
          today,
          stats.totalRequests,
          stats.pendingRequests,
          stats.approvedRequests,
          stats.rejectedRequests,
          stats.totalAmountRequested,
          stats.totalAmountApproved,
          0,
          Object.keys(stats.activeUsers).length,
          topRequestType,
          approvalRate,
          sdgCoveragePercent,
          "", // Top SDG Goal (to be calculated)
          JSON.stringify(stats.priorityStats),
          0, // Escalations (to be tracked)
          0  // Auto-approvals (to be tracked)
        ]]);
        rowFound = true;
        break;
      }
    }
    
    if (!rowFound) {
      analyticsSheet.appendRow([
        today,
        stats.totalRequests,
        stats.pendingRequests,
        stats.approvedRequests,
        stats.rejectedRequests,
        stats.totalAmountRequested,
        stats.totalAmountApproved,
        0,
        Object.keys(stats.activeUsers).length,
        topRequestType,
        approvalRate,
        sdgCoveragePercent,
        "",
        JSON.stringify(stats.priorityStats),
        0,
        0
      ]);
    }
    
  } catch (error) {
    Logger.log("Error updating analytics: " + error);
  }
}

function getDashboardStats() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    
    if (!submissionsSheet) {
      return { success: false, error: "Submissions sheet not found" };
    }
    
    var data = submissionsSheet.getDataRange().getValues();
    
    var stats = {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalAmountRequested: 0,
      totalAmountApproved: 0,
      averageAmount: 0,
      recentRequests: [],
      requestsByStatus: {},
      requestsByType: {},
      topApprovers: {},
      avgProcessingTime: 0
    };
    
    // Calculate statistics
    for (var i = 1; i < data.length; i++) {
      stats.totalRequests++;
      
      var status = data[i][16];
      var amount = parseFloat(data[i][11]) || 0;
      var requestType = data[i][7];
      
      stats.totalAmountRequested += amount;
      
      // Count by status
      stats.requestsByStatus[status] = (stats.requestsByStatus[status] || 0) + 1;
      
      // Count by type
      stats.requestsByType[requestType] = (stats.requestsByType[requestType] || 0) + 1;
      
      if (status === CONFIG.STATUS.APPROVED) {
        stats.approvedRequests++;
        stats.totalAmountApproved += amount;
      } else if (status === CONFIG.STATUS.REJECTED) {
        stats.rejectedRequests++;
      } else {
        stats.pendingRequests++;
      }
      
      // Collect recent requests
      if (stats.recentRequests.length < 10) {
        stats.recentRequests.push({
          requestId: data[i][0],
          submitter: data[i][3],
          requestType: requestType,
          amount: amount,
          status: status,
          submissionDate: data[i][1] ? data[i][1].toString() : "",
          priority: data[i][29] || "Medium"
        });
      }
    }
    
    stats.averageAmount = stats.totalRequests > 0 ? 
      (stats.totalAmountRequested / stats.totalRequests).toFixed(2) : 0;
    
    return { success: true, stats: stats };
    
  } catch (error) {
    Logger.log("Error getting dashboard stats: " + error);
    return { success: false, error: error.message };
  }
}

function getRequestDetails(requestId) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    
    if (!submissionsSheet) {
      return { success: false, error: "Submissions sheet not found" };
    }
    
    var data = submissionsSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === requestId) {
        var request = formatRequestData(data[i]);
        
        // Get workflow history
        request.workflowHistory = getWorkflowHistory(requestId);
        
        // Get documents
        request.documents = getRequestDocuments(requestId);
        
        // Get SDG mapping
        request.sdgMapping = getRequestSDGMapping(requestId);
        
        return {
          success: true,
          request: request
        };
      }
    }
    
    return {
      success: false,
      error: "Request not found"
    };
    
  } catch (error) {
    Logger.log("Error getting request details: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}

function getWorkflowHistory(requestId) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var workflowSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.WORKFLOW);
    
    if (!workflowSheet) return [];
    
    var data = workflowSheet.getDataRange().getValues();
    var history = [];
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === requestId) {
        history.push({
          logId: data[i][0],
          timestamp: data[i][2].toString(),
          actionType: data[i][3],
          performedBy: data[i][4],
          userRole: data[i][5],
          previousStatus: data[i][6],
          newStatus: data[i][7],
          comments: data[i][8],
          approvalDecision: data[i][11]
        });
      }
    }
    
    return history;
    
  } catch (error) {
    Logger.log("Error getting workflow history: " + error);
    return [];
  }
}

function getRequestDocuments(requestId) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var docsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.DOCUMENTS);
    
    if (!docsSheet) return [];
    
    var data = docsSheet.getDataRange().getValues();
    var documents = [];
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === requestId) {
        documents.push({
          documentId: data[i][0],
          documentType: data[i][2],
          fileName: data[i][3],
          fileUrl: data[i][4],
          uploadDate: data[i][5].toString(),
          uploadedBy: data[i][6],
          verificationStatus: data[i][8]
        });
      }
    }
    
    return documents;
    
  } catch (error) {
    Logger.log("Error getting documents: " + error);
    return [];
  }
}

function getRequestSDGMapping(requestId) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sdgSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SDG_MAPPING);
    
    if (!sdgSheet) return null;
    
    var data = sdgSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === requestId) {
        return {
          sdgGoals: data[i][1],
          primarySDG: data[i][2],
          secondarySDGs: data[i][3],
          impactCategory: data[i][4],
          beneficiaryCount: data[i][5],
          geographicArea: data[i][6],
          alignmentScore: data[i][8]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log("Error getting SDG mapping: " + error);
    return null;
  }
}

function getUserRequests(userEmail) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    
    if (!submissionsSheet) {
      return { success: false, error: "Submissions sheet not found" };
    }
    
    var data = submissionsSheet.getDataRange().getValues();
    var userRequests = [];
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][5].toLowerCase() === userEmail.toLowerCase()) {
        userRequests.push(formatRequestData(data[i]));
      }
    }
    
    return {
      success: true,
      requests: userRequests
    };
    
  } catch (error) {
    Logger.log("Error getting user requests: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}

function getPendingApprovals(approverEmail) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    
    if (!submissionsSheet) {
      return { success: false, error: "Submissions sheet not found" };
    }
    
    var data = submissionsSheet.getDataRange().getValues();
    var pendingApprovals = [];
    
    for (var i = 1; i < data.length; i++) {
      var currentApprover = data[i][18];
      var status = data[i][16];
      
      if (currentApprover.toLowerCase() === approverEmail.toLowerCase() && 
          status !== CONFIG.STATUS.APPROVED && 
          status !== CONFIG.STATUS.REJECTED) {
        pendingApprovals.push(formatRequestData(data[i]));
      }
    }
    
    return {
      success: true,
      approvals: pendingApprovals
    };
    
  } catch (error) {
    Logger.log("Error getting pending approvals: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}

/*************************************************************
 * UTILITY FUNCTIONS
 *************************************************************/

function generateRequestId() {
  var timestamp = new Date().getTime();
  var random = Math.floor(Math.random() * 1000);
  return "CSR" + timestamp + random;
}

function determinePriority(amount, requestType) {
  if (amount > CONFIG.MONETARY_THRESHOLDS.HIGH) {
    return "High";
  } else if (amount > CONFIG.MONETARY_THRESHOLDS.MEDIUM) {
    return "Medium";
  } else {
    return "Low";
  }
}

function formatRequestData(rowData) {
  return {
    requestId: rowData[0],              // A
    submissionDate: rowData[1] ? rowData[1].toString() : "",  // B
    submissionTime: rowData[2] ? rowData[2].toString() : "",  // C
    csrRepName: rowData[3],             // D
    csrRepEmail: rowData[4],            // E
    csrRepCompany: rowData[5],          // F
    requesterName: rowData[6],          // G
    requesterEmail: rowData[7],         // H
    requesterContact: rowData[8],       // I
    organizationName: rowData[9],       // J
    organizationNRIC: rowData[10],      // K
    requestType: rowData[11],           // L
    eventName: rowData[12],             // M
    eventDate: rowData[13],             // N
    eventLocation: rowData[14],         // O
    eventFocusArea: rowData[15],        // P
    eventDescription: rowData[16],      // Q
    eventObjectives: rowData[17],       // R
    amountRequested: parseFloat(rowData[18]) || 0,  // S
    purpose: rowData[19],               // T
    payeeName: rowData[20],             // U
    payeeBank: rowData[21],             // V
    payeeAccount: rowData[22],          // W
    supportingDocuments: safeJSONParse(rowData[23], []),  // X
    verificationChecklist: safeJSONParse(rowData[24], {}), // Y
    contributionHistory: safeJSONParse(rowData[25], []),   // Z
    status: rowData[26],                // AA
    workflowStage: rowData[27],         // AB
    currentApprover: rowData[28],       // AC
    lastUpdated: rowData[29] ? rowData[29].toString() : "",  // AD
    csrTeamComments: rowData[30],       // AE
    csrTeamDecision: rowData[31],       // AF
    csrTeamDate: rowData[32],           // AG
    gccComments: rowData[33],           // AH
    gccDecision: rowData[34],           // AI
    gccDate: rowData[35],               // AJ
    pdfGenerated: rowData[36] === "TRUE",  // AK
    pdfUrl: rowData[37],                // AL
    pdfFormat: rowData[38],             // AM
    signedPdfUploaded: rowData[39] === "TRUE",  // AN
    signedPdfUrl: rowData[40],          // AO
    signedPdfDate: rowData[41],         // AP
    driveFolderId: rowData[42],         // AQ
    driveFolderUrl: rowData[43],        // AR
    storyUploadStatus: rowData[44],     // AS
    storyUploadDate: rowData[45],       // AT
    gmdNotified: rowData[46] === "TRUE",  // AU
    gmdNotificationDate: rowData[47],   // AV
    sdgGoals: safeJSONParse(rowData[48], []),  // AW
    impactCategory: rowData[49],        // AX
    beneficiaryCount: rowData[50],      // AY
    geographicArea: rowData[51],        // AZ
    duration: rowData[52],              // BA
    priorityLevel: rowData[53],         // BB
    approvalChain: safeJSONParse(rowData[54], []),  // BC
    rejectionReason: rowData[55] || ""  // BD
  };
}

function safeJSONParse(jsonString, defaultValue) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

function formatCurrency(amount) {
  return "RM " + parseFloat(amount).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/*************************************************************
 * ADMIN & TESTING FUNCTIONS
 *************************************************************/

function testSystemSetup() {
  Logger.log("=== Testing CSR System Setup ===");
  
  var initResult = initializeDatabase();
  Logger.log("Database initialization: " + JSON.stringify(initResult));
  
  var authResult = authenticateUser("john.doe@cahyamata.com");
  Logger.log("User authentication: " + JSON.stringify(authResult));
  
  var statsResult = getDashboardStats();
  Logger.log("Dashboard stats: " + JSON.stringify(statsResult));
  
  var sdgResult = getSDGDashboardData();
  Logger.log("SDG dashboard data: " + JSON.stringify(sdgResult));
  
  Logger.log("=== Testing Complete ===");
}

function addAuthorizedUser(email, name, designation, company, role, accessLevel) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
    
    if (!usersSheet) {
      initializeDatabase();
      usersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.USERS);
    }
    
    // Check if user exists
    var data = usersSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][2].toLowerCase() === email.toLowerCase()) {
        return { 
          success: false, 
          error: "User with this email already exists" 
        };
      }
    }
    
    var userId = "U" + String(data.length).padStart(3, '0');
    
    var canSubmit = "TRUE";
    var canApprove = (accessLevel === "Approver" || accessLevel === "Admin") ? "TRUE" : "FALSE";
    var canViewAll = (accessLevel === "Approver" || accessLevel === "Admin") ? "TRUE" : "FALSE";
    var approvalLimit = accessLevel === "Admin" ? "999999999" : "0";
    
    var newUser = [
      userId,
      name || "New User",
      email,
      designation || "Staff",
      company || "Cahya Mata",
      role || CONFIG.ROLES.CSR_REP,
      accessLevel || "Standard",
      canSubmit,
      canApprove,
      canViewAll,
      "General",
      new Date().toLocaleDateString(),
      "System",
      "Active",
      "",
      approvalLimit,
      "Email",
      ""
    ];
    
    usersSheet.appendRow(newUser);
    
    Logger.log("User added successfully: " + email);
    return { 
      success: true, 
      message: "User added successfully",
      userId: userId
    };
    
  } catch (error) {
    Logger.log("Error adding user: " + error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

function quickAddCurrentUser() {
  var email = Session.getActiveUser().getEmail();
  return addAuthorizedUser(
    email,
    "Admin User",
    "Administrator",
    "Cahya Mata",
    CONFIG.ROLES.ADMIN,
    "Admin"
  );
}

/*************************************************************
 * EMAIL 1: ACKNOWLEDGEMENT TO REQUESTER
 *************************************************************/

function sendAcknowledgementEmail(requestId, requestData) {
  try {
    var subject = "✅ CSR Request Received - " + requestId;
    var requesterEmail = requestData.requesterEmail || requestData.email;
    var csrRepEmail = requestData.csrRepEmail || requestData.email;

    var htmlBody = getEmailHTML('acknowledgement', {
      REQUEST_ID: requestId,
      REQUESTER_NAME: requestData.requesterName || requestData.submitterName,
      ORGANIZATION: requestData.organizationName || requestData.companyName,
      AMOUNT: formatCurrency(requestData.amountRequested),
      PURPOSE: requestData.purpose || "",
      REQUEST_TYPE: requestData.requestType || "",
      SUBMISSION_DATE: new Date().toLocaleDateString(),
      EVENT_NAME: requestData.eventName || "N/A",
      EVENT_DATE: requestData.eventDate || "TBD",
      EVENT_LOCATION: requestData.eventLocation || "N/A",
      REQUESTER_CONTACT: requestData.requesterContact || "N/A",
      ORGANIZATION_NRIC: requestData.organizationNRIC || "N/A",
      DURATION: requestData.duration || "N/A"
    });
    
    // Send to requester, CC to CSR rep if different
    var mailOptions = {
      to: requesterEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: "CSR Management System - Cahya Mata Sarawak"
    };
    
    if (csrRepEmail && csrRepEmail !== requesterEmail) {
      mailOptions.cc = csrRepEmail;
    }
    
    GmailApp.sendEmail(requesterEmail, subject, "", mailOptions);
    
    Logger.log("Acknowledgement email sent to: " + requesterEmail);
    
  } catch (error) {
    Logger.log("Error sending acknowledgement email: " + error);
  }
}

/*************************************************************
 * EMAIL 2: CSR TEAM VERIFICATION REQUEST (WITH ACTION LINKS)
 *************************************************************/

function sendCSRVerificationEmail(requestId, requestData) {
  try {
    var subject = "🔍 Action Required: Verify CSR Request " + requestId;

    // Generate action tokens
    var recommendToken = generateActionToken(requestId, 'csr_recommend');
    var rejectToken = generateActionToken(requestId, 'csr_reject');

    // Get script URL
    var scriptUrl = ScriptApp.getService().getUrl();

    var recommendUrl = scriptUrl + "?action=csr_recommend&token=" +
                       encodeURIComponent(recommendToken) + "&requestId=" +
                       encodeURIComponent(requestId);
    var rejectUrl = scriptUrl + "?action=csr_reject&token=" +
                    encodeURIComponent(rejectToken) + "&requestId=" +
                    encodeURIComponent(requestId);

    // Format SDG goals if they exist
    var sdgGoals = "None specified";
    if (requestData.sdgGoals && Array.isArray(requestData.sdgGoals) && requestData.sdgGoals.length > 0) {
      sdgGoals = requestData.sdgGoals.join(", ");
    }

    var htmlBody = getEmailHTML('csr_verification', {
      REQUEST_ID: requestId,
      REQUESTER_NAME: requestData.requesterName || requestData.submitterName,
      ORGANIZATION: requestData.organizationName || "",
      AMOUNT: formatCurrency(requestData.amountRequested),
      PURPOSE: requestData.purpose || "",
      REQUEST_TYPE: requestData.requestType || "",
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
      SDG_GOALS: sdgGoals,
      RECOMMEND_URL: recommendUrl,
      REJECT_URL: rejectUrl
    });
    
    GmailApp.sendEmail(CONFIG.EMAILS.CSR_TEAM, subject, "", {
      htmlBody: htmlBody,
      name: "CSR Management System"
    });
    
    Logger.log("CSR verification email sent to: " + CONFIG.EMAILS.CSR_TEAM);
    
  } catch (error) {
    Logger.log("Error sending CSR verification email: " + error);
  }
}

/*************************************************************
 * PROCESS CSR TEAM RECOMMENDATION (FROM EMAIL CLICK)
 *************************************************************/

function processCSRRecommendation(requestId, rowIndex, isRecommended, comments) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    var timestamp = new Date().toISOString();
    
    if (isRecommended) {
      // Update CSR Team columns (AE-AG: Comments, Decision, Date)
      submissionsSheet.getRange(rowIndex + 1, 31).setValue(comments || "Recommended");  // AE
      submissionsSheet.getRange(rowIndex + 1, 32).setValue("RECOMMENDED");              // AF
      submissionsSheet.getRange(rowIndex + 1, 33).setValue(timestamp);                  // AG
      
      // Update status and workflow
      submissionsSheet.getRange(rowIndex + 1, 27).setValue(CONFIG.STATUS.CSR_RECOMMENDED);  // AA
      submissionsSheet.getRange(rowIndex + 1, 28).setValue(CONFIG.STATUS.GCC_REVIEW);       // AB
      
      // Get request data for next email
      var data = submissionsSheet.getDataRange().getValues()[rowIndex];
      
      // Send EMAIL 3: GCC Approval Request
      sendGCCApprovalEmail(requestId, data, comments);
      
      // Log action
      logWorkflowAction({
        requestId: requestId,
        actionType: "CSR_RECOMMENDED",
        performedBy: CONFIG.EMAILS.CSR_TEAM,
        userRole: CONFIG.ROLES.CSR_TEAM,
        previousStatus: CONFIG.STATUS.CSR_REVIEW,
        newStatus: CONFIG.STATUS.GCC_REVIEW,
        comments: comments || "CSR Team recommended"
      });
      
      return {
        success: true,
        message: "Request recommended. Approval request sent to Head of GCC."
      };
      
    } else {
      // Rejected by CSR Team
      submissionsSheet.getRange(rowIndex + 1, 31).setValue(comments || "Rejected");
      submissionsSheet.getRange(rowIndex + 1, 32).setValue("REJECTED");
      submissionsSheet.getRange(rowIndex + 1, 33).setValue(timestamp);
      submissionsSheet.getRange(rowIndex + 1, 27).setValue(CONFIG.STATUS.REJECTED);
      
      // Send rejection email
      sendRejectionEmail(requestId, submissionsSheet.getDataRange().getValues()[rowIndex], "CSR Team", comments);
      
      return {
        success: true,
        message: "Request rejected. Rejection email sent to requester."
      };
    }
    
  } catch (error) {
    Logger.log("Error processing CSR recommendation: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}

/*************************************************************
 * EMAIL 3: GCC APPROVAL REQUEST (WITH ACTION LINKS)
 *************************************************************/

function sendGCCApprovalEmail(requestId, data, csrComments) {
  try {
    var subject = "📋 Approval Required: CSR Request " + requestId;

    // Generate action tokens
    var recommendToken = generateActionToken(requestId, 'gcc_recommend');
    var rejectToken = generateActionToken(requestId, 'gcc_reject');

    var scriptUrl = ScriptApp.getService().getUrl();

    var recommendUrl = scriptUrl + "?action=gcc_recommend&token=" +
                       encodeURIComponent(recommendToken) + "&requestId=" +
                       encodeURIComponent(requestId);
    var rejectUrl = scriptUrl + "?action=gcc_reject&token=" +
                    encodeURIComponent(rejectToken) + "&requestId=" +
                    encodeURIComponent(requestId);

    // Format SDG goals if they exist
    var sdgGoalsRaw = data[48] || "[]";  // AW: SDG Goals (index 48)
    var sdgGoals = "None specified";
    try {
      var sdgArray = JSON.parse(sdgGoalsRaw);
      if (Array.isArray(sdgArray) && sdgArray.length > 0) {
        sdgGoals = sdgArray.join(", ");
      }
    } catch (e) {
      sdgGoals = "None specified";
    }

    var htmlBody = getEmailHTML('gcc_approval', {
      REQUEST_ID: requestId,
      REQUESTER_NAME: data[6] || data[3],  // G: Requester Name or D: CSR Rep Name
      ORGANIZATION: data[9] || "",         // J: Organization Name
      AMOUNT: formatCurrency(data[18]),    // S: Amount Requested
      PURPOSE: data[19] || "",             // T: Purpose
      REQUEST_TYPE: data[11] || "",        // L: Request Type
      EVENT_NAME: data[12] || "N/A",       // M: Event Name
      EVENT_DATE: data[13] || "TBD",       // N: Event Date
      EVENT_LOCATION: data[14] || "N/A",   // O: Event Location
      EVENT_FOCUS_AREA: data[15] || "N/A", // P: Event Focus Area
      EVENT_DESCRIPTION: data[16] || "N/A", // Q: Event Description
      EVENT_OBJECTIVES: data[17] || "N/A",  // R: Event Objectives
      PAYEE_NAME: data[20] || "N/A",       // U: Payee Name
      PAYEE_BANK: data[21] || "N/A",       // V: Payee Bank
      PAYEE_ACCOUNT: data[22] || "N/A",    // W: Payee Account
      BENEFICIARY_COUNT: data[50] || "N/A", // AY: Beneficiary Count (index 50)
      GEOGRAPHIC_AREA: data[51] || "N/A",   // AZ: Geographic Area (index 51)
      DURATION: data[52] || "N/A",         // BA: Duration (index 52)
      SDG_GOALS: sdgGoals,
      CSR_COMMENTS: csrComments || "No comments provided",
      RECOMMEND_URL: recommendUrl,
      REJECT_URL: rejectUrl
    });
    
    // Send to Head of GCC (you may want to add this email to CONFIG)
    var gccEmail = "jason.lee@cahyamata.com";  // Update with actual Head of GCC email
    
    GmailApp.sendEmail(gccEmail, subject, "", {
      htmlBody: htmlBody,
      name: "CSR Management System"
    });
    
    Logger.log("GCC approval email sent to: " + gccEmail);
    
  } catch (error) {
    Logger.log("Error sending GCC approval email: " + error);
  }
}

/*************************************************************
 * PROCESS GCC RECOMMENDATION (FROM EMAIL CLICK) - GENERATES PDF
 *************************************************************/

function processGCCRecommendation(requestId, rowIndex, isRecommended, comments) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    var timestamp = new Date().toISOString();
    
    if (isRecommended) {
      // Update GCC columns (AH-AJ: Comments, Decision, Date) - Columns 34, 35, 36
      submissionsSheet.getRange(rowIndex + 1, 34).setValue(comments || "Recommended");  // AH (34)
      submissionsSheet.getRange(rowIndex + 1, 35).setValue("RECOMMENDED");              // AI (35)
      submissionsSheet.getRange(rowIndex + 1, 36).setValue(timestamp);                  // AJ (36)
      
      // Update status to GCC_RECOMMENDED - Column 27 (AA)
      submissionsSheet.getRange(rowIndex + 1, 27).setValue(CONFIG.STATUS.GCC_RECOMMENDED);
      
      // Update workflow stage - Column 28 (AB)
      submissionsSheet.getRange(rowIndex + 1, 28).setValue("PDF Generation");
      
      // Flush changes to ensure data is saved before PDF generation
      SpreadsheetApp.flush();
      
      // Get fresh data for PDF generation
      var data = submissionsSheet.getDataRange().getValues()[rowIndex];
      
      Logger.log("Starting PDF generation for Request ID: " + requestId);
      Logger.log("Amount from data: " + data[18]);
      
      // **GENERATE PDF**
      var pdfResult = generateApprovalPDF(requestId, data);
      
      Logger.log("PDF generation result: " + JSON.stringify(pdfResult));
      
      if (pdfResult && pdfResult.success) {
        // Update PDF columns (AK-AM: Generated?, URL, Format) - Columns 37, 38, 39
        submissionsSheet.getRange(rowIndex + 1, 37).setValue("TRUE");              // AK (37)
        submissionsSheet.getRange(rowIndex + 1, 38).setValue(pdfResult.pdfUrl);   // AL (38)
        submissionsSheet.getRange(rowIndex + 1, 39).setValue(pdfResult.format);   // AM (39)
        
        // Update status to PDF_GENERATED
        submissionsSheet.getRange(rowIndex + 1, 27).setValue(CONFIG.STATUS.PDF_GENERATED);
        submissionsSheet.getRange(rowIndex + 1, 28).setValue("Awaiting Signed PDF");
        
        // Update last modified timestamp - Column 30 (AD)
        submissionsSheet.getRange(rowIndex + 1, 30).setValue(timestamp);
        
        SpreadsheetApp.flush();
        
        Logger.log("PDF columns updated successfully");
        
        // Send EMAIL 4: PDF Generated notification to CSR Team
        try {
          sendPDFGeneratedEmail(requestId, data, pdfResult.pdfUrl, comments);
          Logger.log("PDF generated email sent successfully");
        } catch (emailError) {
          Logger.log("Error sending PDF email: " + emailError);
          // Don't fail the whole process if email fails
        }
        
        // Log action
        logWorkflowAction({
          requestId: requestId,
          actionType: "GCC_RECOMMENDED_PDF_GENERATED",
          performedBy: "Head of GCC",
          userRole: CONFIG.ROLES.HEAD_GCC,
          previousStatus: CONFIG.STATUS.GCC_REVIEW,
          newStatus: CONFIG.STATUS.PDF_GENERATED,
          comments: comments || "GCC recommended - PDF generated successfully"
        });
        
        return {
          success: true,
          message: "Request approved and PDF generated successfully. PDF URL: " + pdfResult.pdfUrl
        };
        
      } else {
        // PDF generation failed
        var errorMsg = pdfResult && pdfResult.error ? pdfResult.error : "Unknown PDF generation error";
        Logger.log("PDF generation failed: " + errorMsg);
        
        // Update status to show PDF generation failed
        submissionsSheet.getRange(rowIndex + 1, 28).setValue("PDF Generation Failed");
        submissionsSheet.getRange(rowIndex + 1, 37).setValue("FALSE");  // AK (37)
        submissionsSheet.getRange(rowIndex + 1, 38).setValue("ERROR: " + errorMsg);  // AL (38)
        
        return {
          success: false,
          error: "GCC recommendation recorded but PDF generation failed: " + errorMsg
        };
      }
      
    } else {
      // Rejected by GCC
      submissionsSheet.getRange(rowIndex + 1, 34).setValue(comments || "Rejected");
      submissionsSheet.getRange(rowIndex + 1, 35).setValue("REJECTED");
      submissionsSheet.getRange(rowIndex + 1, 36).setValue(timestamp);
      submissionsSheet.getRange(rowIndex + 1, 27).setValue(CONFIG.STATUS.REJECTED);
      submissionsSheet.getRange(rowIndex + 1, 30).setValue(timestamp);  // Last Updated
      
      SpreadsheetApp.flush();
      
      // Get data for email
      var data = submissionsSheet.getDataRange().getValues()[rowIndex];
      
      // Send rejection email
      try {
        sendRejectionEmail(requestId, data, "Head of GCC", comments);
      } catch (emailError) {
        Logger.log("Error sending rejection email: " + emailError);
      }
      
      return {
        success: true,
        message: "Request rejected by Head of GCC."
      };
    }
    
  } catch (error) {
    Logger.log("Error processing GCC recommendation: " + error);
    Logger.log("Error stack: " + error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}


/*************************************************************
 * GENERATE APPROVAL PDF (Based on Threshold)
 * Creates PDF in Google Drive and returns URL
 *************************************************************/





/*************************************************************
 * NEW FUNCTIONS TO ADD TO CODE.GS - PART 2
 * Copy everything below and paste after Part 1 in your Code.gs file
 * These handle: PDF uploads, Drive folders, reminders, and final emails
 *************************************************************/

/*************************************************************
 * EMAIL 4: PDF GENERATED NOTIFICATION TO CSR TEAM
 *************************************************************/

function sendPDFGeneratedEmail(requestId, data, pdfUrl, gccComments) {
  try {
    var subject = "📄 Approval PDF Generated - " + requestId;

    var htmlBody = getEmailHTML('pdf_generated', {
      REQUEST_ID: requestId,
      REQUESTER_NAME: data[6] || data[3],
      ORGANIZATION: data[9] || "",
      AMOUNT: formatCurrency(data[18]),
      EVENT_NAME: data[12] || "N/A",
      EVENT_DATE: data[13] || "TBD",
      PDF_URL: pdfUrl,
      GCC_COMMENTS: gccComments || "No comments provided",
      ADMIN_URL: ScriptApp.getService().getUrl() + "?page=admin"
    });
    
    GmailApp.sendEmail(CONFIG.EMAILS.CSR_TEAM, subject, "", {
      htmlBody: htmlBody,
      name: "CSR Management System"
    });
    
    Logger.log("PDF generated email sent to CSR Team");
    
  } catch (error) {
    Logger.log("Error sending PDF generated email: " + error);
  }
}

/*************************************************************
 * UPLOAD SIGNED PDF (Called from admin.html)
 *************************************************************/

function uploadSignedPDF(requestId, base64Data, fileName) {
  try {
    // Convert base64 to blob
    var decodedData = Utilities.base64Decode(base64Data);
    var fileBlob = Utilities.newBlob(decodedData, MimeType.PDF, fileName);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    var data = submissionsSheet.getDataRange().getValues();
    
    // Find request
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === requestId) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, error: "Request not found" };
    }
    
    // Save signed PDF to Drive
    var parentFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER.PARENT_FOLDER_ID || DriveApp.getRootFolder().getId());
    var file = parentFolder.createFile(fileBlob);
    file.setName(fileName || ("CSR_Signed_Approval_" + requestId + ".pdf"));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var signedPdfUrl = file.getUrl();
    var timestamp = new Date().toISOString();
    
    // Update Signed PDF columns (AN-AP)
    submissionsSheet.getRange(rowIndex + 1, 40).setValue("TRUE");           // AN: Uploaded?
    submissionsSheet.getRange(rowIndex + 1, 41).setValue(signedPdfUrl);    // AO: URL
    submissionsSheet.getRange(rowIndex + 1, 42).setValue(timestamp);       // AP: Upload Date
    
    // Update status
    submissionsSheet.getRange(rowIndex + 1, 27).setValue(CONFIG.STATUS.APPROVED);  // AA
    submissionsSheet.getRange(rowIndex + 1, 28).setValue(CONFIG.STATUS.APPROVED);  // AB
    
    // Log action
    logWorkflowAction({
      requestId: requestId,
      actionType: "SIGNED_PDF_UPLOADED",
      performedBy: CONFIG.EMAILS.CSR_TEAM,
      userRole: CONFIG.ROLES.CSR_TEAM,
      previousStatus: CONFIG.STATUS.PDF_GENERATED,
      newStatus: CONFIG.STATUS.APPROVED,
      comments: "Signed PDF uploaded by CSR Team via Admin Panel"
    });
    
    // Trigger next steps
    var requestData = data[rowIndex];
    
    // 1. Create Google Drive folder
    var folderResult = createCSRFolder(requestId, requestData);
    
    // 2. Send EMAIL 5: Success to Requester (CC: CSR Rep)
    sendApprovalSuccessEmail(requestId, requestData, signedPdfUrl, folderResult.folderUrl);
    
    // 3. Send EMAIL 6: GMD Notification
    sendGMDNotificationEmail(requestId, requestData, signedPdfUrl);
    
    // 4. Send EMAIL 7: Folder link to CSR Rep
    sendFolderCreatedEmail(requestId, requestData, folderResult.folderUrl);
    
    // 5. Start weekly reminder system
    startWeeklyReminders(requestId, requestData, folderResult.folderUrl);
    
    return {
      success: true,
      message: "Signed PDF uploaded successfully. Approval emails sent and Drive folder created.",
      signedPdfUrl: signedPdfUrl,
      folderUrl: folderResult.folderUrl
    };
    
  } catch (error) {
    Logger.log("Error uploading signed PDF: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}
/*************************************************************
 * CREATE GOOGLE DRIVE FOLDER
 *************************************************************/

function createCSRFolder(requestId, data) {
  try {
    var year = new Date().getFullYear();
    var folderName = requestId + "_" + year;
    
    // Get parent folder (or create if doesn't exist)
    var parentFolderId = CONFIG.DRIVE_FOLDER.PARENT_FOLDER_ID;
    var parentFolder;
    
    if (parentFolderId) {
      parentFolder = DriveApp.getFolderById(parentFolderId);
    } else {
      // Create main CSR folder if doesn't exist
      var folders = DriveApp.getFoldersByName("CSR Approved Requests");
      if (folders.hasNext()) {
        parentFolder = folders.next();
      } else {
        parentFolder = DriveApp.createFolder("CSR Approved Requests");
      }
    }
    
    // Create request-specific folder
    var requestFolder = parentFolder.createFolder(folderName);
    
    // Set sharing permissions
    requestFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    
    var folderId = requestFolder.getId();
    var folderUrl = requestFolder.getUrl();
    
    // Update Submissions sheet with folder info (AQ-AR)
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    var dataValues = submissionsSheet.getDataRange().getValues();
    
    for (var i = 1; i < dataValues.length; i++) {
      if (dataValues[i][0] === requestId) {
        submissionsSheet.getRange(i + 1, 43).setValue(folderId);    // AQ
        submissionsSheet.getRange(i + 1, 44).setValue(folderUrl);   // AR
        break;
      }
    }
    
    Logger.log("Drive folder created: " + folderUrl);
    
    return {
      success: true,
      folderId: folderId,
      folderUrl: folderUrl,
      folderName: folderName
    };
    
  } catch (error) {
    Logger.log("Error creating Drive folder: " + error);
    return {
      success: false,
      error: error.message,
      folderUrl: ""
    };
  }
}

/*************************************************************
 * EMAIL 5: APPROVAL SUCCESS TO REQUESTER (CC: CSR REP)
 *************************************************************/

function sendApprovalSuccessEmail(requestId, data, signedPdfUrl, folderUrl) {
  try {
    var subject = "🎉 Congratulations! Your CSR Request is Approved - " + requestId;

    var requesterEmail = data[7] || data[4];  // Requester Email or CSR Rep Email
    var csrRepEmail = data[4];                // CSR Rep Email

    var htmlBody = getEmailHTML('approval_success', {
      REQUEST_ID: requestId,
      REQUESTER_NAME: data[6] || data[3],
      ORGANIZATION: data[9] || "",
      AMOUNT: formatCurrency(data[18]),
      EVENT_NAME: data[12] || "N/A",
      EVENT_DATE: data[13] || "TBD",
      PURPOSE: data[19] || "",
      PAYEE_NAME: data[20] || "N/A",
      CSR_REP_NAME: data[3],
      CSR_REP_EMAIL: data[4],
      APPROVAL_DATE: new Date().toLocaleDateString(),
      SIGNED_PDF_URL: signedPdfUrl,
      FOLDER_URL: folderUrl
    });
    
    var mailOptions = {
      to: requesterEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: "CSR Management System - Cahya Mata Sarawak"
    };
    
    // CC CSR Rep if different from requester
    if (csrRepEmail && csrRepEmail !== requesterEmail) {
      mailOptions.cc = csrRepEmail;
    }
    
    GmailApp.sendEmail(requesterEmail, subject, "", mailOptions);
    
    Logger.log("Approval success email sent to: " + requesterEmail);
    
  } catch (error) {
    Logger.log("Error sending approval success email: " + error);
  }
}

/*************************************************************
 * EMAIL 6: GMD NOTIFICATION (FYI with PDF)
 *************************************************************/

function sendGMDNotificationEmail(requestId, data, signedPdfUrl) {
  try {
    var subject = "ℹ️ CSR Approval Notification - " + requestId;

    var htmlBody = getEmailHTML('gmd_notification', {
      REQUEST_ID: requestId,
      REQUESTER_NAME: data[6] || data[3],
      ORGANIZATION: data[9] || "",
      AMOUNT: formatCurrency(data[18]),
      PURPOSE: data[19] || "",
      EVENT_NAME: data[12] || "N/A",
      EVENT_DATE: data[13] || "TBD",
      EVENT_LOCATION: data[14] || "N/A",
      BENEFICIARY_COUNT: data[50] || "N/A",  // Fixed: AY is index 50, not 48
      APPROVAL_DATE: new Date().toLocaleDateString(),
      SIGNED_PDF_URL: signedPdfUrl
    });
    
    // Get signed PDF file to attach
    var fileUrl = signedPdfUrl;
    var fileId = fileUrl.match(/[-\w]{25,}/);
    var file = fileId ? DriveApp.getFileById(fileId[0]) : null;
    
    var mailOptions = {
      to: CONFIG.EMAILS.GMD,
      subject: subject,
      htmlBody: htmlBody,
      name: "CSR Management System"
    };
    
    if (file) {
      mailOptions.attachments = [file.getAs(MimeType.PDF)];
    }
    
    GmailApp.sendEmail(CONFIG.EMAILS.GMD, subject, "", mailOptions);
    
    // Update GMD notification columns (AU-AV)
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    var dataValues = submissionsSheet.getDataRange().getValues();
    
    for (var i = 1; i < dataValues.length; i++) {
      if (dataValues[i][0] === requestId) {
        submissionsSheet.getRange(i + 1, 47).setValue("TRUE");                      // AU
        submissionsSheet.getRange(i + 1, 48).setValue(new Date().toISOString());   // AV
        break;
      }
    }
    
    Logger.log("GMD notification email sent");
    
  } catch (error) {
    Logger.log("Error sending GMD notification: " + error);
  }
}

/*************************************************************
 * EMAIL 7: FOLDER CREATED NOTIFICATION TO CSR REP
 *************************************************************/

function sendFolderCreatedEmail(requestId, data, folderUrl) {
  try {
    var subject = "📁 Drive Folder Created - " + requestId;
    var csrRepEmail = data[4];  // CSR Rep Email

    var htmlBody = getEmailHTML('folder_created', {
      REQUEST_ID: requestId,
      CSR_REP_NAME: data[3],
      REQUESTER_NAME: data[6] || data[3],
      REQUESTER_EMAIL: data[7] || "N/A",
      REQUESTER_CONTACT: data[8] || "N/A",
      ORGANIZATION: data[9] || "",
      EVENT_NAME: data[12] || "N/A",
      EVENT_DATE: data[13] || "TBD",
      FOLDER_URL: folderUrl
    });
    
    GmailApp.sendEmail(csrRepEmail, subject, "", {
      htmlBody: htmlBody,
      name: "CSR Management System"
    });
    
    Logger.log("Folder created email sent to: " + csrRepEmail);
    
  } catch (error) {
    Logger.log("Error sending folder created email: " + error);
  }
}

/*************************************************************
 * START WEEKLY REMINDER SYSTEM
 *************************************************************/

function startWeeklyReminders(requestId, data, folderUrl) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var remindersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.REMINDERS);
    
    if (!remindersSheet) {
      return;
    }
    
    var csrRepEmail = data[4];
    var requesterEmail = data[7] || data[4];
    var timestamp = new Date().toISOString();
    
    // Add reminder record
    remindersSheet.appendRow([
      requestId,                  // A: Request ID
      csrRepEmail,                // B: CSR Rep Email
      requesterEmail,             // C: Requester Email
      folderUrl,                  // D: Folder URL
      timestamp,                  // E: First Reminder Date
      "",                         // F: Last Reminder Date
      0,                          // G: Reminder Count
      "Active",                   // H: Status
      ""                          // I: Story Uploaded Date
    ]);
    
    // Update request status to "Awaiting Story"
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    var dataValues = submissionsSheet.getDataRange().getValues();
    
    for (var i = 1; i < dataValues.length; i++) {
      if (dataValues[i][0] === requestId) {
        submissionsSheet.getRange(i + 1, 27).setValue(CONFIG.STATUS.AWAITING_STORY);  // AA
        break;
      }
    }
    
    Logger.log("Weekly reminder system started for: " + requestId);
    
  } catch (error) {
    Logger.log("Error starting weekly reminders: " + error);
  }
}

/*************************************************************
 * CHECK FOLDERS AND SEND REMINDERS
 * This function should be set as a TIME-DRIVEN TRIGGER (weekly)
 * Go to: Apps Script Editor > Triggers > Add Trigger
 * Function: checkFoldersAndSendReminders
 * Event source: Time-driven
 * Type: Week timer
 * Day: Monday (or your choice)
 * Time: 9am-10am
 *************************************************************/

function checkFoldersAndSendReminders() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var remindersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.REMINDERS);
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    
    if (!remindersSheet) {
      return;
    }
    
    var data = remindersSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var requestId = data[i][0];
      var csrRepEmail = data[i][1];
      var requesterEmail = data[i][2];
      var folderUrl = data[i][3];
      var reminderCount = data[i][6];
      var status = data[i][7];
      
      // Skip if already completed
      if (status === "Completed") {
        continue;
      }
      
      // Check if folder has files
      try {
        var folderId = extractFolderIdFromUrl(folderUrl);
        var folder = DriveApp.getFolderById(folderId);
        var files = folder.getFiles();
        
        if (files.hasNext()) {
          // Folder has files! Mark as completed
          remindersSheet.getRange(i + 1, 8).setValue("Completed");  // H: Status
          remindersSheet.getRange(i + 1, 9).setValue(new Date().toISOString());  // I: Story Uploaded Date
          
          // Update Submissions sheet
          updateStoryUploadStatus(submissionsSheet, requestId, "Completed");
          
          Logger.log("Story uploaded for " + requestId + " - Reminder stopped");
          
        } else {
          // Folder still empty - send reminder
          sendStoryReminderEmail(requestId, csrRepEmail, requesterEmail, folderUrl, reminderCount);
          
          // Update reminder count and last reminder date
          remindersSheet.getRange(i + 1, 6).setValue(new Date().toISOString());  // F: Last Reminder Date
          remindersSheet.getRange(i + 1, 7).setValue(reminderCount + 1);         // G: Reminder Count
          
          Logger.log("Reminder sent for " + requestId + " (Count: " + (reminderCount + 1) + ")");
        }
        
      } catch (e) {
        Logger.log("Error checking folder for " + requestId + ": " + e);
      }
    }
    
  } catch (error) {
    Logger.log("Error in checkFoldersAndSendReminders: " + error);
  }
}

/*************************************************************
 * EMAIL 8: WEEKLY STORY REMINDER
 *************************************************************/

function sendStoryReminderEmail(requestId, csrRepEmail, requesterEmail, folderUrl, reminderCount) {
  try {
    var subject = "📸 Reminder: Please Upload Your CSR Story - " + requestId;

    // Fetch full request data from spreadsheet to get all details
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    var data = submissionsSheet.getDataRange().getValues();

    var requestData = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === requestId) {
        requestData = data[i];
        break;
      }
    }

    // Calculate days since approval
    var daysSinceApproval = "N/A";
    if (requestData && requestData[41]) {  // AP: Signed PDF Upload Date
      try {
        var approvalDate = new Date(requestData[41]);
        var today = new Date();
        var diffTime = Math.abs(today - approvalDate);
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysSinceApproval = diffDays + " days";
      } catch (e) {
        daysSinceApproval = "N/A";
      }
    }

    var htmlBody = getEmailHTML('story_reminder', {
      REQUEST_ID: requestId,
      CSR_REP_NAME: requestData ? (requestData[3] || "CSR Team") : "CSR Team",
      EVENT_NAME: requestData ? (requestData[12] || "N/A") : "N/A",
      EVENT_DATE: requestData ? (requestData[13] || "TBD") : "TBD",
      ORGANIZATION: requestData ? (requestData[9] || "N/A") : "N/A",
      REQUESTER_NAME: requestData ? (requestData[6] || requestData[3]) : "N/A",
      DAYS_SINCE_APPROVAL: daysSinceApproval,
      FOLDER_URL: folderUrl,
      REMINDER_COUNT: reminderCount + 1
    });

    GmailApp.sendEmail(csrRepEmail, subject, "", {
      htmlBody: htmlBody,
      name: "CSR Management System"
    });

    Logger.log("Story reminder email sent to: " + csrRepEmail);

  } catch (error) {
    Logger.log("Error sending story reminder: " + error);
  }
}

/*************************************************************
 * SEND REJECTION EMAIL
 *************************************************************/

function sendRejectionEmail(requestId, data, rejectedBy, reason) {
  try {
    var subject = "❌ CSR Request Status Update - " + requestId;
    
    var requesterEmail = data[7] || data[4];
    var csrRepEmail = data[4];
    
    var htmlBody = getEmailHTML('rejection', {
      REQUEST_ID: requestId,
      REQUESTER_NAME: data[6] || data[3],
      ORGANIZATION: data[9] || "",
      REJECTED_BY: rejectedBy,
      REASON: reason || "No reason provided",
      AMOUNT: formatCurrency(data[18]),
      EVENT_NAME: data[12] || "N/A",
      REQUEST_TYPE: data[11] || "",
      PURPOSE: data[19] || ""
    });
    
    var mailOptions = {
      to: requesterEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: "CSR Management System"
    };
    
    if (csrRepEmail && csrRepEmail !== requesterEmail) {
      mailOptions.cc = csrRepEmail;
    }
    
    GmailApp.sendEmail(requesterEmail, subject, "", mailOptions);
    
    Logger.log("Rejection email sent to: " + requesterEmail);
    
  } catch (error) {
    Logger.log("Error sending rejection email: " + error);
  }
}

/*************************************************************
 * GET CONTRIBUTION HISTORY FOR REQUESTER
 * Used to auto-populate history in Index.html form
 *************************************************************/

function getContributionHistory(requesterEmail) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var historySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HISTORY);
    
    if (!historySheet) {
      return { success: true, history: [] };
    }
    
    var data = historySheet.getDataRange().getValues();
    var history = [];
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toLowerCase() === requesterEmail.toLowerCase()) {
        history.push({
          year: data[i][3],
          requestType: data[i][4],
          amount: data[i][5],
          date: data[i][6],
          status: data[i][7],
          notes: data[i][8]
        });
      }
    }
    
    return {
      success: true,
      history: history
    };
    
  } catch (error) {
    Logger.log("Error getting contribution history: " + error);
    return {
      success: false,
      error: error.message,
      history: []
    };
  }
}

/*************************************************************
 * ADD CONTRIBUTION HISTORY (Manual add from form)
 *************************************************************/

function addContributionHistory(requesterEmail, requesterName, organization, historyItem) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var historySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HISTORY);
    
    if (!historySheet) {
      return { success: false, error: "History sheet not found" };
    }
    
    historySheet.appendRow([
      requesterEmail,
      requesterName,
      organization,
      historyItem.year,
      historyItem.requestType,
      historyItem.amount,
      historyItem.date,
      historyItem.status || "Unknown",
      historyItem.notes || "",
      new Date().toISOString()
    ]);
    
    return { success: true };
    
  } catch (error) {
    Logger.log("Error adding contribution history: " + error);
    return { success: false, error: error.message };
  }
}

/*************************************************************
 * HELPER FUNCTIONS
 *************************************************************/

function extractFolderIdFromUrl(url) {
  var match = url.match(/[-\w]{25,}/);
  return match ? match[0] : "";
}

function updateStoryUploadStatus(submissionsSheet, requestId, status) {
  var data = submissionsSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === requestId) {
      submissionsSheet.getRange(i + 1, 45).setValue(status);  // AS: Story Upload Status
      submissionsSheet.getRange(i + 1, 46).setValue(new Date().toISOString());  // AT: Story Upload Date
      submissionsSheet.getRange(i + 1, 27).setValue(CONFIG.STATUS.COMPLETED);   // AA: Status
      break;
    }
  }
}

function determinePriority(amount) {
  if (amount > CONFIG.MONETARY_THRESHOLDS.HIGH) {
    return "Critical";
  } else if (amount > CONFIG.MONETARY_THRESHOLDS.LOW) {
    return "High";
  } else {
    return "Medium";
  }
}

function formatCurrency(amount) {
  return "RM " + parseFloat(amount || 0).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/*************************************************************
 * TOKEN GENERATION & VERIFICATION FOR EMAIL ACTIONS
 *************************************************************/

function generateActionToken(requestId, action) {
  var secret = "cHx9wK2mZ8vB5nL7rY4pQ1tF3sD6jG0aW";  // Change this!
  var timestamp = new Date().getTime();
  var tokenData = requestId + "|" + action + "|" + timestamp + "|" + secret;
  return Utilities.base64Encode(tokenData);
}

function verifyActionToken(token, requestId, action) {
  try {
    var decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    var parts = decoded.split("|");
    
    if (parts.length !== 4) return false;
    if (parts[0] !== requestId) return false;
    if (parts[1] !== action) return false;
    
    // Token valid for 30 days
    var tokenTimestamp = parseInt(parts[2]);
    var now = new Date().getTime();
    var thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    return (now - tokenTimestamp) <= thirtyDays;
    
  } catch (e) {
    return false;
  }
}

/*************************************************************
 * LOG WORKFLOW ACTION
 *************************************************************/

function logWorkflowAction(logData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var workflowSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.WORKFLOW);
    
    if (!workflowSheet) return;
    
    var logId = "LOG" + new Date().getTime();
    var timestamp = new Date().toISOString();
    
    workflowSheet.appendRow([
      logId,
      logData.requestId || "",
      timestamp,
      logData.actionType || "",
      logData.performedBy || "",
      logData.userRole || "",
      logData.previousStatus || "",
      logData.newStatus || "",
      logData.comments || ""
    ]);
    
  } catch (error) {
    Logger.log("Error logging workflow action: " + error);
  }
}

/*************************************************************
 * NEW FUNCTIONS TO ADD TO CODE.GS - PART 3
 * Copy this function and paste after Part 2
 * This contains all HTML email templates
 *************************************************************/

/*************************************************************
 * GET EMAIL HTML - Beautiful Email Templates
 * Returns formatted HTML for different email types
 *************************************************************/

function getEmailHTML(type, variables) {
  var logoUrl = "https://www.cahyamata.com/wp-content/uploads/2015/02/Cahya-Mata-logo_CMYK.jpg";  // Update with your actual logo URL
  
  // Common CSS styles
  var commonStyles = `
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f7f9; }
      .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #00b894 0%, #0984e3 100%); padding: 30px 20px; text-align: center; }
      .header img { max-height: 60px; margin-bottom: 10px; }
      .header h1 { color: #ffffff; font-size: 24px; margin: 10px 0 5px 0; font-weight: 600; }
      .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
      .content { padding: 30px 20px; color: #333; line-height: 1.6; }
      .info-box { background: #f8f9fa; border-left: 4px solid #00b894; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .info-box strong { color: #00b894; display: block; margin-bottom: 5px; }
      .button { display: inline-block; padding: 14px 28px; margin: 10px 10px 10px 0; background: #00b894; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; }
      .button:hover { background: #00a07f; }
      .button-reject { background: #e74c3c; }
      .button-reject:hover { background: #c0392b; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; }
      .footer a { color: #0984e3; text-decoration: none; }
      h2 { color: #2c3e50; font-size: 20px; margin: 20px 0 10px 0; }
      .divider { border-top: 2px solid #ecf0f1; margin: 20px 0; }
    </style>
  `;
  
  var html = "";
  
  switch(type) {
    
    /*************************************************************
     * TEMPLATE 1: ACKNOWLEDGEMENT EMAIL
     *************************************************************/
    case 'acknowledgement':
      html = `
        <!DOCTYPE html>
        <html>
        <head>${commonStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Cahya Mata Sarawak" />
              <h1>✅ Request Received</h1>
              <p>Your CSR request has been submitted successfully</p>
            </div>
            <div class="content">
              <p>Dear <strong>${variables.REQUESTER_NAME}</strong>,</p>
              
              <p>Thank you for submitting your CSR request to Cahya Mata Sarawak Group. We have received your submission and it is now being reviewed by our team.</p>
              
              <div class="info-box">
                <strong>📋 REQUEST SUMMARY</strong>
                <p style="margin: 5px 0;">
                  <strong>Request ID:</strong> ${variables.REQUEST_ID}<br/>
                  <strong>Organization:</strong> ${variables.ORGANIZATION}<br/>
                  <strong>Organization NRIC/RN:</strong> ${variables.ORGANIZATION_NRIC}<br/>
                  <strong>Request Type:</strong> ${variables.REQUEST_TYPE}<br/>
                  <strong>Amount:</strong> ${variables.AMOUNT}<br/>
                  <strong>Submission Date:</strong> ${variables.SUBMISSION_DATE}
                </p>
              </div>

              <div class="info-box">
                <strong>🎯 EVENT DETAILS</strong>
                <p style="margin: 5px 0;">
                  <strong>Event Name:</strong> ${variables.EVENT_NAME}<br/>
                  <strong>Event Date:</strong> ${variables.EVENT_DATE}<br/>
                  <strong>Event Location:</strong> ${variables.EVENT_LOCATION}<br/>
                  <strong>Duration:</strong> ${variables.DURATION}
                </p>
              </div>

              <div class="info-box">
                <strong>📞 CONTACT INFORMATION</strong>
                <p style="margin: 5px 0;">
                  <strong>Phone/Contact:</strong> ${variables.REQUESTER_CONTACT}
                </p>
              </div>

              <h2>What Happens Next?</h2>
              <p>Your request will go through our verification and approval process:</p>
              <ol style="line-height: 1.8;">
                <li>CSR Team Verification (2-3 business days)</li>
                <li>Head of GCC Approval</li>
                <li>PDF Generation & Signature Collection</li>
                <li>Final Approval & Notification</li>
              </ol>
              
              <p>We will keep you updated via email at each stage of the process.</p>
              
              <div class="divider"></div>
              
              <p style="font-size: 13px; color: #7f8c8d;">
                <strong>Note:</strong> Please save your Request ID (${variables.REQUEST_ID}) for future reference.
                If you have any questions, please contact our CSR team at <a href="mailto:${CONFIG.EMAILS.CSR_TEAM}">${CONFIG.EMAILS.CSR_TEAM}</a>
              </p>
            </div>
            <div class="footer">
              <p>Cahya Mata Sarawak Berhad<br/>
              Corporate Social Responsibility Division<br/>
              <a href="https://www.cahyamata.com">www.cahyamata.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    /*************************************************************
     * TEMPLATE 2: CSR TEAM VERIFICATION REQUEST
     *************************************************************/
    case 'csr_verification':
      html = `
        <!DOCTYPE html>
        <html>
        <head>${commonStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Cahya Mata Sarawak" />
              <h1>🔍 Action Required</h1>
              <p>CSR Request Verification Needed</p>
            </div>
            <div class="content">
              <p>Dear <strong>CSR Team</strong>,</p>
              
              <p>A new CSR request has been submitted and requires your verification.</p>
              
              <div class="info-box">
                <strong>📋 REQUEST DETAILS</strong>
                <p style="margin: 5px 0;">
                  <strong>Request ID:</strong> ${variables.REQUEST_ID}<br/>
                  <strong>Requester:</strong> ${variables.REQUESTER_NAME}<br/>
                  <strong>Organization:</strong> ${variables.ORGANIZATION}<br/>
                  <strong>Organization NRIC/RN:</strong> ${variables.ORGANIZATION_NRIC}<br/>
                  <strong>Request Type:</strong> ${variables.REQUEST_TYPE}<br/>
                  <strong>Amount:</strong> ${variables.AMOUNT}
                </p>
              </div>

              <div class="info-box">
                <strong>🎯 EVENT DETAILS</strong>
                <p style="margin: 5px 0;">
                  <strong>Event Name:</strong> ${variables.EVENT_NAME}<br/>
                  <strong>Event Date:</strong> ${variables.EVENT_DATE}<br/>
                  <strong>Event Location:</strong> ${variables.EVENT_LOCATION}<br/>
                  <strong>Focus Area:</strong> ${variables.EVENT_FOCUS_AREA}<br/>
                  <strong>Duration:</strong> ${variables.DURATION}<br/>
                  <strong>Expected Beneficiaries:</strong> ${variables.BENEFICIARY_COUNT}<br/>
                  <strong>Geographic Area:</strong> ${variables.GEOGRAPHIC_AREA}
                </p>
              </div>

              <div class="info-box">
                <strong>📋 EVENT DESCRIPTION</strong>
                <p>${variables.EVENT_DESCRIPTION}</p>
              </div>

              <div class="info-box">
                <strong>🎯 EVENT OBJECTIVES</strong>
                <p>${variables.EVENT_OBJECTIVES}</p>
              </div>

              <div class="info-box">
                <strong>📝 PURPOSE</strong>
                <p>${variables.PURPOSE}</p>
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
                  <strong>Requester Phone:</strong> ${variables.REQUESTER_CONTACT}
                </p>
              </div>

              <div class="info-box" style="border-left-color: #27ae60;">
                <strong>🌍 SDG ALIGNMENT</strong>
                <p>${variables.SDG_GOALS}</p>
              </div>

              <h2>Take Action</h2>
              <p>Please review the request details and take one of the following actions:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${variables.RECOMMEND_URL}" class="button">
                  ✅ RECOMMEND
                </a>
                <a href="${variables.REJECT_URL}" class="button button-reject">
                  ❌ REJECT
                </a>
              </div>
              
              <p style="font-size: 13px; color: #7f8c8d; text-align: center;">
                Clicking a button above will record your decision and move the request to the next stage.
              </p>
            </div>
            <div class="footer">
              <p>CSR Management System - Cahya Mata Sarawak Berhad</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    /*************************************************************
     * TEMPLATE 3: GCC APPROVAL REQUEST
     *************************************************************/
    case 'gcc_approval':
      html = `
        <!DOCTYPE html>
        <html>
        <head>${commonStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Cahya Mata Sarawak" />
              <h1>📋 Approval Required</h1>
              <p>CSR Request Recommended by CSR Team</p>
            </div>
            <div class="content">
              <p>Dear <strong>Head of GCC</strong>,</p>
              
              <p>The CSR Team has verified and recommended the following request for your approval.</p>
              
              <div class="info-box">
                <strong>📋 REQUEST DETAILS</strong>
                <p style="margin: 5px 0;">
                  <strong>Request ID:</strong> ${variables.REQUEST_ID}<br/>
                  <strong>Requester:</strong> ${variables.REQUESTER_NAME}<br/>
                  <strong>Organization:</strong> ${variables.ORGANIZATION}<br/>
                  <strong>Request Type:</strong> ${variables.REQUEST_TYPE}<br/>
                  <strong>Amount:</strong> ${variables.AMOUNT}
                </p>
              </div>

              <div class="info-box">
                <strong>🎯 EVENT DETAILS</strong>
                <p style="margin: 5px 0;">
                  <strong>Event Name:</strong> ${variables.EVENT_NAME}<br/>
                  <strong>Event Date:</strong> ${variables.EVENT_DATE}<br/>
                  <strong>Event Location:</strong> ${variables.EVENT_LOCATION}<br/>
                  <strong>Focus Area:</strong> ${variables.EVENT_FOCUS_AREA}<br/>
                  <strong>Duration:</strong> ${variables.DURATION}<br/>
                  <strong>Expected Beneficiaries:</strong> ${variables.BENEFICIARY_COUNT}<br/>
                  <strong>Geographic Area:</strong> ${variables.GEOGRAPHIC_AREA}
                </p>
              </div>

              <div class="info-box">
                <strong>📋 EVENT DESCRIPTION</strong>
                <p>${variables.EVENT_DESCRIPTION}</p>
              </div>

              <div class="info-box">
                <strong>🎯 EVENT OBJECTIVES</strong>
                <p>${variables.EVENT_OBJECTIVES}</p>
              </div>

              <div class="info-box">
                <strong>📝 PURPOSE</strong>
                <p>${variables.PURPOSE}</p>
              </div>

              <div class="info-box">
                <strong>💰 PAYMENT DETAILS</strong>
                <p style="margin: 5px 0;">
                  <strong>Payee Name:</strong> ${variables.PAYEE_NAME}<br/>
                  <strong>Bank:</strong> ${variables.PAYEE_BANK}<br/>
                  <strong>Account Number:</strong> ${variables.PAYEE_ACCOUNT}
                </p>
              </div>

              <div class="info-box" style="border-left-color: #27ae60;">
                <strong>🌍 SDG ALIGNMENT</strong>
                <p>${variables.SDG_GOALS}</p>
              </div>

              <div class="info-box" style="border-left-color: #0984e3;">
                <strong>💬 CSR TEAM COMMENTS</strong>
                <p>${variables.CSR_COMMENTS}</p>
              </div>

              <h2>Your Decision</h2>
              <p>If you recommend this request, an approval PDF will be automatically generated with blank signature lines for physical signing.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${variables.RECOMMEND_URL}" class="button">
                  ✅ RECOMMEND & GENERATE PDF
                </a>
                <a href="${variables.REJECT_URL}" class="button button-reject">
                  ❌ REJECT
                </a>
              </div>
              
              <p style="font-size: 13px; color: #7f8c8d; text-align: center;">
                Your approval will trigger PDF generation. The PDF will be sent to the CSR Team for signature collection.
              </p>
            </div>
            <div class="footer">
              <p>CSR Management System - Cahya Mata Sarawak Berhad</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    /*************************************************************
     * TEMPLATE 4: PDF GENERATED NOTIFICATION
     *************************************************************/
    case 'pdf_generated':
      html = `
        <!DOCTYPE html>
        <html>
        <head>${commonStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Cahya Mata Sarawak" />
              <h1>📄 PDF Generated</h1>
              <p>Approval document ready for signatures</p>
            </div>
            <div class="content">
              <p>Dear <strong>CSR Team</strong>,</p>
              
              <p>The Head of GCC has recommended request <strong>${variables.REQUEST_ID}</strong>. The approval PDF has been automatically generated and is ready for signature collection.</p>
              
              <div class="info-box">
                <strong>📋 REQUEST SUMMARY</strong>
                <p style="margin: 5px 0;">
                  <strong>Request ID:</strong> ${variables.REQUEST_ID}<br/>
                  <strong>Requester:</strong> ${variables.REQUESTER_NAME}<br/>
                  <strong>Organization:</strong> ${variables.ORGANIZATION}<br/>
                  <strong>Event Name:</strong> ${variables.EVENT_NAME}<br/>
                  <strong>Event Date:</strong> ${variables.EVENT_DATE}<br/>
                  <strong>Amount:</strong> ${variables.AMOUNT}
                </p>
              </div>

              <div class="info-box" style="border-left-color: #0984e3;">
                <strong>💬 HEAD OF GCC COMMENTS</strong>
                <p>${variables.GCC_COMMENTS}</p>
              </div>

              <h2>Next Steps</h2>
              <ol style="line-height: 1.8;">
                <li><strong>Download the PDF</strong> using the link below</li>
                <li><strong>Print and collect physical signatures</strong> from required approvers</li>
                <li><strong>Scan the signed PDF</strong></li>
                <li><strong>Upload to Admin Panel</strong> to complete the approval process</li>
              </ol>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${variables.PDF_URL}" class="button">
                  📥 DOWNLOAD PDF
                </a>
                <a href="${variables.ADMIN_URL}" class="button" style="background: #3498db;">
                  🔐 GO TO ADMIN PANEL
                </a>
              </div>
              
              <p style="font-size: 13px; color: #7f8c8d; background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107;">
                ⚠️ <strong>Important:</strong> Once signatures are collected, upload the signed PDF in the Admin Panel to trigger final approval emails and folder creation.
              </p>
            </div>
            <div class="footer">
              <p>CSR Management System - Cahya Mata Sarawak Berhad</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    /*************************************************************
     * TEMPLATE 5: APPROVAL SUCCESS
     *************************************************************/
    case 'approval_success':
      html = `
        <!DOCTYPE html>
        <html>
        <head>${commonStyles}</head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);">
              <img src="${logoUrl}" alt="Cahya Mata Sarawak" />
              <h1>🎉 Congratulations!</h1>
              <p>Your CSR Request has been Approved</p>
            </div>
            <div class="content">
              <p>Dear <strong>${variables.REQUESTER_NAME}</strong>,</p>
              
              <p>We are delighted to inform you that your CSR request has been <strong>APPROVED</strong>!</p>
              
              <div class="info-box">
                <strong>✅ APPROVAL DETAILS</strong>
                <p style="margin: 5px 0;">
                  <strong>Request ID:</strong> ${variables.REQUEST_ID}<br/>
                  <strong>Organization:</strong> ${variables.ORGANIZATION}<br/>
                  <strong>Event Name:</strong> ${variables.EVENT_NAME}<br/>
                  <strong>Event Date:</strong> ${variables.EVENT_DATE}<br/>
                  <strong>Approved Amount:</strong> <span style="color: #27ae60; font-size: 18px; font-weight: 600;">${variables.AMOUNT}</span><br/>
                  <strong>Payment To:</strong> ${variables.PAYEE_NAME}<br/>
                  <strong>Approval Date:</strong> ${variables.APPROVAL_DATE}
                </p>
              </div>

              <div class="info-box">
                <strong>📝 PURPOSE</strong>
                <p>${variables.PURPOSE}</p>
              </div>

              <div class="info-box">
                <strong>📞 YOUR CSR REPRESENTATIVE</strong>
                <p style="margin: 5px 0;">
                  <strong>Name:</strong> ${variables.CSR_REP_NAME}<br/>
                  <strong>Email:</strong> ${variables.CSR_REP_EMAIL}
                </p>
              </div>

              <h2>📁 Your Project Folder</h2>
              <p>A Google Drive folder has been created specifically for your project. Please use this folder to upload:</p>
              
              <ul style="line-height: 1.8;">
                <li>📸 Event photos and videos</li>
                <li>🧾 Receipts and invoices</li>
                <li>📝 Impact stories and testimonials</li>
                <li>💌 Thank you letters from beneficiaries</li>
                <li>📊 Any other supporting documents</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${variables.SIGNED_PDF_URL}" class="button">
                  📄 VIEW SIGNED APPROVAL
                </a>
                <a href="${variables.FOLDER_URL}" class="button" style="background: #f39c12;">
                  📁 ACCESS PROJECT FOLDER
                </a>
              </div>
              
              <div style="background: #e8f8f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #27ae60;">
                  <strong>📌 Important:</strong> Please upload your project documentation within 30 days of the event. This helps us track our CSR impact and showcase the positive change we're creating together!
                </p>
              </div>
              
              <p>Thank you for being a partner in our CSR journey. Together, we are building a better, more sustainable future for our communities.</p>
              
              <p style="margin-top: 30px;">Best regards,<br/>
              <strong>Cahya Mata Sarawak Group</strong><br/>
              Corporate Social Responsibility Team</p>
            </div>
            <div class="footer">
              <p>Cahya Mata Sarawak Berhad<br/>
              <a href="https://www.cahyamata.com">www.cahyamata.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    /*************************************************************
     * TEMPLATE 6: GMD NOTIFICATION
     *************************************************************/
    case 'gmd_notification':
      html = `
        <!DOCTYPE html>
        <html>
        <head>${commonStyles}</head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);">
              <img src="${logoUrl}" alt="Cahya Mata Sarawak" />
              <h1>ℹ️ CSR Approval Notification</h1>
              <p>For Your Information</p>
            </div>
            <div class="content">
              <p>Dear <strong>Group Managing Director</strong>,</p>
              
              <p>This is to inform you that the following CSR request has been approved and processed.</p>
              
              <div class="info-box">
                <strong>📋 APPROVAL SUMMARY</strong>
                <p style="margin: 5px 0;">
                  <strong>Request ID:</strong> ${variables.REQUEST_ID}<br/>
                  <strong>Requester:</strong> ${variables.REQUESTER_NAME}<br/>
                  <strong>Organization:</strong> ${variables.ORGANIZATION}<br/>
                  <strong>Event Name:</strong> ${variables.EVENT_NAME}<br/>
                  <strong>Event Date:</strong> ${variables.EVENT_DATE}<br/>
                  <strong>Event Location:</strong> ${variables.EVENT_LOCATION}<br/>
                  <strong>Approved Amount:</strong> ${variables.AMOUNT}<br/>
                  <strong>Approval Date:</strong> ${variables.APPROVAL_DATE}
                </p>
              </div>

              <div class="info-box">
                <strong>📝 PURPOSE</strong>
                <p>${variables.PURPOSE}</p>
              </div>

              <div class="info-box" style="border-left-color: #27ae60;">
                <strong>📊 IMPACT METRICS</strong>
                <p style="margin: 5px 0;">
                  <strong>Expected Beneficiaries:</strong> ${variables.BENEFICIARY_COUNT}
                </p>
              </div>

              <p>The signed approval document is attached to this email for your records.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${variables.SIGNED_PDF_URL}" class="button">
                  📄 VIEW SIGNED APPROVAL PDF
                </a>
              </div>
              
              <p style="font-size: 13px; color: #7f8c8d;">
                This notification is for informational purposes only. No action is required from your end.
              </p>
            </div>
            <div class="footer">
              <p>CSR Management System - Cahya Mata Sarawak Berhad</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    /*************************************************************
     * TEMPLATE 7: FOLDER CREATED
     *************************************************************/
    case 'folder_created':
      html = `
        <!DOCTYPE html>
        <html>
        <head>${commonStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Cahya Mata Sarawak" />
              <h1>📁 Drive Folder Created</h1>
              <p>Project documentation folder ready</p>
            </div>
            <div class="content">
              <p>Dear <strong>${variables.CSR_REP_NAME}</strong>,</p>
              
              <p>A Google Drive folder has been created for CSR Request <strong>${variables.REQUEST_ID}</strong>.</p>
              
              <div class="info-box">
                <strong>📋 REQUEST DETAILS</strong>
                <p style="margin: 5px 0;">
                  <strong>Request ID:</strong> ${variables.REQUEST_ID}<br/>
                  <strong>Requester:</strong> ${variables.REQUESTER_NAME}<br/>
                  <strong>Organization:</strong> ${variables.ORGANIZATION}<br/>
                  <strong>Event Name:</strong> ${variables.EVENT_NAME}<br/>
                  <strong>Event Date:</strong> ${variables.EVENT_DATE}
                </p>
              </div>

              <div class="info-box">
                <strong>📞 REQUESTER CONTACT</strong>
                <p style="margin: 5px 0;">
                  <strong>Email:</strong> ${variables.REQUESTER_EMAIL}<br/>
                  <strong>Phone:</strong> ${variables.REQUESTER_CONTACT}
                </p>
              </div>

              <h2>What to Upload</h2>
              <p>Please remind the requester to upload the following documentation to track CSR impact:</p>
              
              <ul style="line-height: 1.8;">
                <li>✓ Event photos and videos</li>
                <li>✓ Receipts and invoices</li>
                <li>✓ Impact stories and testimonials</li>
                <li>✓ Thank you letters</li>
                <li>✓ Beneficiary feedback</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${variables.FOLDER_URL}" class="button">
                  📁 OPEN PROJECT FOLDER
                </a>
              </div>
              
              <p style="font-size: 13px; background: #e8f8f5; padding: 10px; border-radius: 4px; border-left: 4px solid #27ae60;">
                <strong>Note:</strong> Weekly reminders will be sent until documentation is uploaded to this folder.
              </p>
            </div>
            <div class="footer">
              <p>CSR Management System - Cahya Mata Sarawak Berhad</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    /*************************************************************
     * TEMPLATE 8: WEEKLY STORY REMINDER
     *************************************************************/
    case 'story_reminder':
      html = `
        <!DOCTYPE html>
        <html>
        <head>${commonStyles}</head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);">
              <img src="${logoUrl}" alt="Cahya Mata Sarawak" />
              <h1>📸 Reminder</h1>
              <p>Please Upload Your CSR Story</p>
            </div>
            <div class="content">
              <p>Dear <strong>${variables.CSR_REP_NAME}</strong>,</p>

              <p>This is a friendly reminder to upload documentation for approved CSR Request <strong>${variables.REQUEST_ID}</strong>.</p>

              <div class="info-box">
                <strong>📋 REQUEST DETAILS</strong>
                <p style="margin: 5px 0;">
                  <strong>Request ID:</strong> ${variables.REQUEST_ID}<br/>
                  <strong>Event Name:</strong> ${variables.EVENT_NAME}<br/>
                  <strong>Event Date:</strong> ${variables.EVENT_DATE}<br/>
                  <strong>Organization:</strong> ${variables.ORGANIZATION}<br/>
                  <strong>Requester:</strong> ${variables.REQUESTER_NAME}
                </p>
              </div>

              <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #f39c12; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>⏰ Reminder #${variables.REMINDER_COUNT}</strong><br/>
                  <strong>Days since approval:</strong> ${variables.DAYS_SINCE_APPROVAL}<br/><br/>
                  We haven't received your project documentation yet. Your story helps us measure and showcase the positive impact of our CSR initiatives!
                </p>
              </div>

              <h2>What We Need</h2>
              <p>Please upload the following to your project folder:</p>
              
              <ul style="line-height: 1.8;">
                <li>📸 Photos from the event</li>
                <li>🧾 Receipts or invoices</li>
                <li>📝 Brief impact story (what was achieved?)</li>
                <li>💌 Thank you letters or testimonials</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${variables.FOLDER_URL}" class="button">
                  📁 UPLOAD TO FOLDER
                </a>
              </div>
              
              <p style="font-size: 13px; color: #7f8c8d;">
                You will continue to receive weekly reminders until documentation is uploaded. Once files are detected in the folder, reminders will stop automatically.
              </p>
              
              <p style="margin-top: 20px;">Thank you for helping us track our CSR impact!</p>
            </div>
            <div class="footer">
              <p>CSR Management System - Cahya Mata Sarawak Berhad</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    /*************************************************************
     * TEMPLATE 9: REJECTION
     *************************************************************/
    case 'rejection':
      html = `
        <!DOCTYPE html>
        <html>
        <head>${commonStyles}</head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
              <img src="${logoUrl}" alt="Cahya Mata Sarawak" />
              <h1>❌ Request Status Update</h1>
              <p>CSR Request Decision</p>
            </div>
            <div class="content">
              <p>Dear <strong>${variables.REQUESTER_NAME}</strong>,</p>
              
              <p>Thank you for submitting your CSR request. After careful review, we regret to inform you that your request has not been approved at this time.</p>
              
              <div class="info-box">
                <strong>📋 REQUEST DETAILS</strong>
                <p style="margin: 5px 0;">
                  <strong>Request ID:</strong> ${variables.REQUEST_ID}<br/>
                  <strong>Organization:</strong> ${variables.ORGANIZATION}<br/>
                  <strong>Event Name:</strong> ${variables.EVENT_NAME}<br/>
                  <strong>Request Type:</strong> ${variables.REQUEST_TYPE}<br/>
                  <strong>Amount:</strong> ${variables.AMOUNT}<br/>
                  <strong>Decision By:</strong> ${variables.REJECTED_BY}
                </p>
              </div>

              <div class="info-box">
                <strong>📝 PURPOSE</strong>
                <p>${variables.PURPOSE}</p>
              </div>

              <div class="info-box" style="border-left-color: #e74c3c;">
                <strong>💬 REASON</strong>
                <p>${variables.REASON}</p>
              </div>

              <p>While we are unable to support this particular request, we encourage you to:</p>
              
              <ul style="line-height: 1.8;">
                <li>Review our CSR policy and guidelines</li>
                <li>Consider resubmitting with additional information if circumstances change</li>
                <li>Explore other CSR programs that may be a better fit</li>
              </ul>
              
              <p>If you have any questions about this decision or would like guidance on future submissions, please contact our CSR team.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:${CONFIG.EMAILS.CSR_TEAM}" class="button">
                  📧 CONTACT CSR TEAM
                </a>
              </div>
              
              <p>Thank you for your understanding.</p>
              
              <p style="margin-top: 30px;">Best regards,<br/>
              <strong>Cahya Mata Sarawak Group</strong><br/>
              Corporate Social Responsibility Team</p>
            </div>
            <div class="footer">
              <p>Cahya Mata Sarawak Berhad<br/>
              <a href="https://www.cahyamata.com">www.cahyamata.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    default:
      html = "<p>Email template not found.</p>";
  }
  
  return html;
}

/*************************************************************
 * GET CONTRIBUTION HISTORY BY EMAIL
 *************************************************************/
function getContributionHistoryByEmail(email) {
  try {
    if (!email || email.trim() === "") {
      return { success: true, history: [] };
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    
    if (!submissionsSheet) {
      return { success: false, error: "Submissions sheet not found" };
    }
    
    var data = submissionsSheet.getDataRange().getValues();
    var historyRecords = [];
    
    // Search through all submissions
    // Column indexes: [8] = Payee Name, [5] = Submitter Email
    for (var i = 1; i < data.length; i++) {
      var payeeName = data[i][8] ? data[i][8].toString().toLowerCase() : "";
      var submitterEmail = data[i][5] ? data[i][5].toString().toLowerCase() : "";
      var searchEmail = email.toLowerCase();
      
      // Match if email appears in payee name OR submitter email
      if (payeeName.includes(searchEmail) || submitterEmail === searchEmail) {
        var status = data[i][16];
        var amount = parseFloat(data[i][11]) || 0;
        var date = data[i][1]; // Submission date
        
        // Extract year
        var year = "";
        if (date) {
          try {
            year = new Date(date).getFullYear().toString();
          } catch(e) {
            year = date.toString().substring(0, 4);
          }
        }
        
        historyRecords.push({
          year: year,
          amount: amount,
          remarks: "Previous request - " + (status || "Status unknown"),
          requestId: data[i][0],
          status: status
        });
      }
    }
    
    return {
      success: true,
      history: historyRecords,
      count: historyRecords.length
    };
    
  } catch (error) {
    Logger.log("Error getting contribution history: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}

function setupHistorySheet(sheet) {
  var headers = [
    "Requester Email", "Requester Name", "Organization", "Year",
    "Request Type", "Amount", "Date", "Status", "Notes", "Added Date"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1a472a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontSize(11);
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  
  Logger.log("Contribution History sheet setup complete");
}

/*************************************************************
 * COMPLETE PDF GENERATION SYSTEM - ALL FUNCTIONS
 * 
 * ✅ FIXED: All values converted to strings properly
 * ✅ TESTED: No more "parameters don't match" errors
 * 
 * DELETE these functions from your Code.gs:
 * - generatePDFFormat1
 * - generatePDFFormat2  
 * - generateApprovalPDF (old version)
 * 
 * PASTE this entire file to replace them
 *************************************************************/

/*************************************************************
 * COMPLETE PDF GENERATION SYSTEM - WORKING VERSION
 * 
 * ✅ FIXED: Headers/footers handled properly
 * ✅ FIXED: Correct data array indexes
 * ✅ SOPHISTICATED: Professional design
 * 
 * DELETE OLD FUNCTIONS: generatePDFFormat1, generatePDFFormat2, generateApprovalPDF
 * PASTE THIS ENTIRE FILE
 *************************************************************/
/*************************************************************
 * FIXED PDF GENERATION FUNCTIONS
 * Issue: setLetterSpacing() is NOT a valid method in DocumentApp
 * Also fixed: All method chaining issues
 *************************************************************/

/*************************************************************
 * MAIN PDF GENERATOR
 *************************************************************/

/*************************************************************
 * FIXED PDF GENERATION (robust against appendTableCell errors)
 *************************************************************/

/*************************************************************
 * CSR APPROVAL PDF GENERATOR – FULL, HARDENED + LOGO HEADER
 * - Safe strings via safeText()
 * - No empty Text nodes (uses spacer())
 * - Centered header logo from Drive
 * - Defensive save/cleanup
 *************************************************************/

// ==== CONFIG OVERRIDE (optional) =============================================
// If you already have CONFIG.BRAND.LOGO_ID, this constant is ignored.
/*************************************************************
 * FUTURISTIC CSR APPROVAL PDF GENERATOR
 * Modern, Sustainable Design - Guaranteed Single Page Layout
 * 
 * FEATURES:
 * ✓ Futuristic sustainability aesthetic
 * ✓ Smart single-page layout (no overflow)
 * ✓ Fixed logo display
 * ✓ Compact yet readable design
 * ✓ Modern color scheme
 * ✓ Preserved logic, enhanced design
 *************************************************************/

/* ==== FUTURISTIC BRAND COLORS ==== */
var BRAND_PRIMARY   = '#00D084';    // Vibrant sustainable green
var BRAND_DARK      = '#0A2F23';    // Deep forest green
var BRAND_ACCENT    = '#00FFA3';    // Neon sustainability
var BRAND_GRADIENT  = '#E8F9F3';    // Soft mint background
var BRAND_TEXT      = '#1A2F2A';    // Rich text color
var BRAND_MUTED     = '#6B8E7F';    // Subtle grey-green

/* ==== MODERN FONTS ==== */
var TITLE_FONT = 'Montserrat';      // Modern, clean
var BODY_FONT  = 'Roboto';          // Readable, professional
var ACCENT_FONT = 'Roboto Mono';    // Futuristic touch

/* ==== LOGO ==== */
var LOGO_FILE_ID = '1r52Rj_36RtLan7RyDeo2tlsckC7GRL-w';

/* ==== UTILITIES ==== */
function safeText(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(safeText).join(', ');
  var t = typeof v;
  if (t === 'string') return v;
  if (t === 'number') return isFinite(v) ? String(v) : '';
  if (t === 'boolean') return v ? 'Yes' : 'No';
  try { return String(v); } catch (e) { return ''; }
}

function formatCurrency(amount) {
  var n = Number(amount);
  if (!isFinite(n) || n <= 0) return '';
  return 'RM ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    var date = new Date(dateStr);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd MMM yyyy');
  } catch (e) {
    return safeText(dateStr);
  }
}

/* ==== SMART HEADER - Compact & Futuristic ==== */
function buildSmartHeader_(doc, requestId) {
  var header = doc.getHeader() || doc.addHeader();
  header.clear();
  
  // Set minimal header margins
  try { header.setMarginTop(5); } catch (_) {}
  try { header.setMarginBottom(5); } catch (_) {}
  
  // Compact header table
  var tbl = header.appendTable();
  try { 
    tbl.setBorderWidth(0);
    tbl.setMarginTop(0);
    tbl.setMarginBottom(0);
  } catch (_) {}
  
  var row = tbl.appendTableRow();
  var left = row.appendTableCell();
  var right = row.appendTableCell();
  
  // Logo - Fixed and properly sized
  try {
    var blob = DriveApp.getFileById(LOGO_FILE_ID).getBlob();
    var img = left.appendImage(blob);
    img.setWidth(85);  // Compact size
    img.setHeight(30); // Maintain aspect ratio
    var pImg = img.getParent();
    if (pImg && pImg.setAlignment) {
      pImg.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    }
  } catch (e) { 
    Logger.log('Logo error: ' + e);
    // Fallback: Text logo
    var logoText = left.appendParagraph('CMS GROUP');
    logoText.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    logoText.editAsText()
      .setFontFamily(TITLE_FONT)
      .setBold(true)
      .setFontSize(11)
      .setForegroundColor(BRAND_PRIMARY);
  }
  
  // CSR Number - Compact right side
  var csrPara = right.appendParagraph('CSR No: ' + safeText(requestId));
  csrPara.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  csrPara.setSpacingBefore(0);
  csrPara.setSpacingAfter(0);
  var csrText = csrPara.editAsText();
  csrText.setFontFamily(ACCENT_FONT);
  csrText.setFontSize(8);
  csrText.setBold(true);
  csrText.setForegroundColor(BRAND_PRIMARY);
  
  // Date - tiny
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy');
  var datePara = right.appendParagraph(today);
  datePara.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  datePara.setSpacingBefore(0);
  datePara.setSpacingAfter(0);
  datePara.editAsText().setFontSize(7).setForegroundColor(BRAND_MUTED);
  
  // Neon accent line
  var accent = header.appendTable();
  try { accent.setBorderWidth(0); } catch (_) {}
  var accentRow = accent.appendTableRow();
  try { 
    var accentCell = accentRow.appendTableCell('\u00A0');
    accentCell.setBackgroundColor(BRAND_ACCENT);
    accentCell.setPaddingTop(2);
    accentCell.setPaddingBottom(2);
  } catch (_) {}
}

/* ==== MINIMAL FOOTER ==== */
function buildSmartFooter_(doc) {
  var footer = doc.getFooter() || doc.addFooter();
  footer.clear();
  
  try { 
    footer.setMarginTop(5);
    footer.setMarginBottom(5);
  } catch (_) {}
  
  var para = footer.appendParagraph('Advancing Sustainability • System Generated');
  para.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  para.setSpacingBefore(0);
  para.setSpacingAfter(0);
  para.editAsText().setFontSize(7).setForegroundColor(BRAND_MUTED).setItalic(true);
}

/* ==== COMPACT SECTION BANNER ==== */
function compactBanner_(body, label) {
  var para = body.appendParagraph(label);
  para.setSpacingBefore(3);
  para.setSpacingAfter(2);
  var text = para.editAsText();
  text.setFontFamily(TITLE_FONT);
  text.setBold(true);
  text.setFontSize(9);
  text.setForegroundColor(BRAND_PRIMARY);
  text.setBackgroundColor(BRAND_GRADIENT);
}

/* ==== ULTRA-COMPACT INFO GRID ==== */
function ultraCompactGrid_(body, items) {
  // 3-column layout for maximum space efficiency
  var tbl = body.appendTable();
  try {
    tbl.setBorderWidth(0.5);
    tbl.setBorderColor(BRAND_GRADIENT);
  } catch (_) {}
  
  var validItems = [];
  for (var i = 0; i < items.length; i++) {
    var val = safeText(items[i].value);
    if (val) validItems.push(items[i]);
  }
  
  if (validItems.length === 0) {
    body.removeChild(tbl);
    return;
  }
  
  // Create rows with 3 items each (label:value pairs side by side)
  for (var i = 0; i < validItems.length; i += 3) {
    var row = tbl.appendTableRow();
    
    for (var j = 0; j < 3; j++) {
      var item = validItems[i + j];
      if (item) {
        var cell = row.appendTableCell(safeText(item.label) + ': ' + safeText(item.value));
        cell.setPaddingTop(2);
        cell.setPaddingBottom(2);
        cell.setPaddingLeft(4);
        cell.setPaddingRight(4);
        
        var cellText = cell.editAsText();
        cellText.setFontSize(7);
        
        // Make label bold and colored
        var labelLen = safeText(item.label).length + 1;
        cellText.setBold(0, labelLen, true);
        cellText.setForegroundColor(0, labelLen, BRAND_DARK);
      } else {
        row.appendTableCell(''); // Empty cell
      }
    }
  }
  
  body.appendParagraph('\u00A0').setSpacingBefore(1).setSpacingAfter(1);
}

/* ==== COMPACT 2-COLUMN GRID ==== */
function compact2ColGrid_(body, items) {
  var tbl = body.appendTable();
  try {
    tbl.setBorderWidth(0.5);
    tbl.setBorderColor(BRAND_GRADIENT);
  } catch (_) {}
  
  var validItems = [];
  for (var i = 0; i < items.length; i++) {
    var val = safeText(items[i].value);
    if (val) validItems.push(items[i]);
  }
  
  if (validItems.length === 0) {
    body.removeChild(tbl);
    return;
  }
  
  for (var i = 0; i < validItems.length; i += 2) {
    var row = tbl.appendTableRow();
    
    for (var j = 0; j < 2; j++) {
      var item = validItems[i + j];
      if (item) {
        var cell = row.appendTableCell(safeText(item.label) + ': ' + safeText(item.value));
        cell.setPaddingTop(2);
        cell.setPaddingBottom(2);
        cell.setPaddingLeft(4);
        cell.setPaddingRight(4);
        
        var cellText = cell.editAsText();
        cellText.setFontSize(7);
        
        var labelLen = safeText(item.label).length + 1;
        cellText.setBold(0, labelLen, true);
        cellText.setForegroundColor(0, labelLen, BRAND_DARK);
      } else {
        row.appendTableCell('');
      }
    }
  }
  
  body.appendParagraph('\u00A0').setSpacingBefore(1).setSpacingAfter(1);
}

/* ==== COMPACT DESCRIPTION BOX ==== */
function compactDescBox_(body, text) {
  if (!text) return;
  
  var tbl = body.appendTable();
  try { 
    tbl.setBorderWidth(1);
    tbl.setBorderColor(BRAND_PRIMARY);
  } catch (_) {}
  
  var row = tbl.appendTableRow();
  var cell = row.appendTableCell(text);
  cell.setPaddingTop(4);
  cell.setPaddingBottom(4);
  cell.setPaddingLeft(6);
  cell.setPaddingRight(6);
  try { cell.setBackgroundColor(BRAND_GRADIENT); } catch (_) {}
  
  cell.editAsText().setFontSize(7).setForegroundColor(BRAND_TEXT);
  body.appendParagraph('\u00A0').setSpacingBefore(1).setSpacingAfter(1);
}

/* ==== ULTRA-COMPACT SIGNATURE BLOCKS ==== */
function miniSignatureGrid_(body, roles) {
  compactBanner_(body, 'APPROVALS');
  
  var tbl = body.appendTable();
  try { 
    tbl.setBorderWidth(0.5);
    tbl.setBorderColor(BRAND_GRADIENT);
  } catch (_) {}
  
  // Header row
  var headerRow = tbl.appendTableRow();
  var headers = ['Role', 'Name', 'Signature', 'Date'];
  for (var i = 0; i < headers.length; i++) {
    var cell = headerRow.appendTableCell(headers[i]);
    cell.setPaddingTop(3);
    cell.setPaddingBottom(3);
    try { cell.setBackgroundColor(BRAND_DARK); } catch (_) {}
    cell.editAsText().setBold(true).setFontSize(7).setForegroundColor('#FFFFFF');
  }
  
  // Signature rows
  for (var i = 0; i < roles.length; i++) {
    var row = tbl.appendTableRow();
    
    var roleCell = row.appendTableCell(roles[i].role);
    roleCell.setPaddingTop(2);
    roleCell.setPaddingBottom(2);
    roleCell.editAsText().setFontSize(7).setBold(true).setForegroundColor(BRAND_DARK);
    
    var nameCell = row.appendTableCell(roles[i].name);
    nameCell.setPaddingTop(2);
    nameCell.setPaddingBottom(2);
    nameCell.editAsText().setFontSize(7);
    
    var sigCell = row.appendTableCell('_______________');
    sigCell.setPaddingTop(2);
    sigCell.setPaddingBottom(2);
    sigCell.editAsText().setFontSize(7);
    
    var dateCell = row.appendTableCell('__________');
    dateCell.setPaddingTop(2);
    dateCell.setPaddingBottom(2);
    dateCell.editAsText().setFontSize(7);
  }
}

/* ==== MAIN ORCHESTRATOR ==== */
function generateApprovalPDF(requestId, data) {
  try {
    const amount = parseFloat(data[18]) || 0;
    const isMonetary = amount > 0.0001;

    // Create a temp doc
    const doc = DocumentApp.create("CSR_" + requestId);
    const docId = doc.getId();

    // Fonts / theme
    const H_FONT = "Cinzel";           // will fall back if unavailable
    const H_FALLBACK = "Georgia";
    const B_FONT = "Times New Roman";

    // Header with logo and CSR No
    addElegantHeader_(doc, {
      requestId: requestId,
      hFont: H_FONT, hFallback: H_FALLBACK, bFont: B_FONT,
      logoId: LOGO_FILE_ID
    });

    // Body
    const body = doc.getBody();
    body.clear();
    body.setAttributes({
      [DocumentApp.Attribute.FONT_FAMILY]: B_FONT,
      [DocumentApp.Attribute.FONT_SIZE]: 11,
      [DocumentApp.Attribute.MARGIN_TOP]: 36,
      [DocumentApp.Attribute.MARGIN_BOTTOM]: 36,
      [DocumentApp.Attribute.MARGIN_LEFT]: 54,
      [DocumentApp.Attribute.MARGIN_RIGHT]: 54
    });

    // Title
    appendHeading_(body, "CSR DONATION & SPONSORSHIP REQUEST", H_FONT, H_FALLBACK, 14, "#146c43", true);

    // Sections (each helper only adds non-empty rows)
    sectionTwoCol_(body, "REQUESTOR", [
      ["Entity Type", data[11]]
    ], H_FONT, H_FALLBACK);

    sectionTwoCol_(body, "EVENT", [
      ["Contact",         data[6] || data[3]],
      ["Designation",     data[5]],
      ["Event Name",      data[12]],
      ["Event Date",      data[13]],
      ["Event Location",  data[14]],
      ["Focus Area",      data[15]],
      ["Description",     data[16]]
    ], H_FONT, H_FALLBACK);

    if (isMonetary) {
      sectionTwoCol_(body, "FINANCIAL", [
        ["Amount",         formatCurrency(amount)],
        ["Request Type",   "Donation/Sponsorship"],
        ["Bank",           data[21]],
        ["Account No",     data[22]],
        ["Account Name",   data[20]]
      ], H_FONT, H_FALLBACK);
    }

    // GCC review block
    sectionFreeText_(body, "REVIEWS", [
      ["GCC", (data[30] ? ("GCC Team Remark: " + data[30]) : "") + (data[33] ? (" | Head: " + data[33]) : "")]
    ], H_FONT, H_FALLBACK);

    // Approvals table with ample spacing for signatures
    sectionSignatures_(body, "APPROVALS", [
      ["Recommended (GCCSO)",  "Izzam Ibrahim"],
      ["Verified (Compliance)","Shirley Noiwoot David"],
      ["CFO Approval",         "Azhar"]
    ], H_FONT, H_FALLBACK);

    // Footer with page numbers (Advanced Docs API)
    doc.saveAndClose();
    insertPageNumbers_(docId, /*header*/false, /*rightAligned*/true);

    // Export PDF, trash temp doc
    const pdf = DriveApp.getFileById(docId).getAs('application/pdf');
    DriveApp.getFileById(docId).setTrashed(true);
    return pdf;

  } catch (err) {
    Logger.log("PDF error: " + err + "\n" + err.stack);
    throw err;
  }
}

/* ----------------- helpers (styling + building) ----------------- */

function addElegantHeader_(doc, opt){
  const head = doc.addHeader();
  const table = head.appendTable();
  table.setBorderWidth(0);

  const row = table.appendTableRow();  // two cells: logo | CSR + date
  const c1 = row.appendTableCell("");
  const c2 = row.appendTableCell("");

  c1.setBorderWidth(0); c2.setBorderWidth(0);

  // Logo
  try {
    const blob = DriveApp.getFileById(opt.logoId).getBlob();
    const p = c1.appendParagraph("");
    const img = p.appendInlineImage(blob).setWidth(110);
    p.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
  } catch(e) {
    c1.appendParagraph(" ").setSpacingAfter(0);
  }

  // CSR number + date (right)
  const p2 = c2.appendParagraph("CSR No: " + opt.requestId + "\n" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMM yyyy"));
  p2.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  const t2 = p2.editAsText();
  t2.setFontFamily(0, t2.getText().length-1, opt.hFont || opt.hFallback);
  t2.setBold(true);
  t2.setForegroundColor("#146c43");
}

function appendHeading_(body, text, hFont, hFallback, size, color, extraSpaceBelow){
  const p = body.appendParagraph(text);
  p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  const t = p.editAsText();
  t.setFontFamily(0, t.getText().length-1, hFont || hFallback);
  t.setBold(true);
  t.setFontSize(size);
  t.setForegroundColor(color || "#0f5132");
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  if (extraSpaceBelow) p.setSpacingAfter(14);
}

function sectionTwoCol_(body, title, rows, hFont, hFallback){
  // title band
  const titleP = body.appendParagraph(title);
  const tt = titleP.editAsText();
  tt.setBold(true);
  tt.setFontFamily(0, tt.getText().length-1, hFont || hFallback);
  tt.setForegroundColor("#146c43");
  titleP.setSpacingBefore(8);
  titleP.setSpacingAfter(4);

  const tbl = body.appendTable();
  tbl.setBorderWidth(0.75);
  tbl.setBorderColor("#cfeadf");

  rows.forEach(pair=>{
    const label = (pair[0]||"").trim(), value = (pair[1]||"").toString().trim();
    if (!value) return; // auto-hide empties
    const r = tbl.appendTableRow();
    const c1 = r.appendTableCell(label + ":");
    const c2 = r.appendTableCell(value);
    c1.setBackgroundColor("#ecfdf5"); c2.setBackgroundColor("#ffffff");
    c1.editAsText().setBold(true).setForegroundColor("#146c43");
  });

  // soft divider space
  body.appendParagraph(" ").setSpacingAfter(4).setSpacingBefore(4);
}

function sectionFreeText_(body, title, lines, hFont, hFallback){
  const titleP = body.appendParagraph(title);
  const tt = titleP.editAsText();
  tt.setBold(true);
  tt.setFontFamily(0, tt.getText().length-1, hFont || hFallback);
  tt.setForegroundColor("#146c43");
  titleP.setSpacingBefore(8); titleP.setSpacingAfter(4);

  const tbl = body.appendTable();
  tbl.setBorderWidth(0.75);
  tbl.setBorderColor("#cfeadf");

  lines.forEach(pair=>{
    const label = (pair[0]||"").trim(), value = (pair[1]||"").toString().trim();
    if (!value) return;
    const r = tbl.appendTableRow();
    const c1 = r.appendTableCell(label + ":");
    const c2 = r.appendTableCell(value);
    c1.setBackgroundColor("#ecfdf5");
    c1.editAsText().setBold(true).setForegroundColor("#146c43");
  });
}

function sectionSignatures_(body, title, people, hFont, hFallback){
  const titleP = body.appendParagraph(title);
  const tt = titleP.editAsText();
  tt.setBold(true);
  tt.setFontFamily(0, tt.getText().length-1, hFont || hFallback);
  tt.setForegroundColor("#0b2e13");
  titleP.setSpacingBefore(10); titleP.setSpacingAfter(6);

  const tbl = body.appendTable();
  tbl.setBorderWidth(0.75);
  tbl.setBorderColor("#0b2e13");
  const rHead = tbl.appendTableRow();
  ["Role","Name","Signature","Date"].forEach(h=>{
    rHead.appendTableCell(h).setBackgroundColor("#0b3b2e").editAsText().setBold(true).setForegroundColor("#ffffff");
  });

  people.forEach(p=>{
    const r = tbl.appendTableRow();
    r.appendTableCell(p[0] || "");
    r.appendTableCell(p[1] || "");
    r.appendTableCell("\n\n\n_______________________\n"); // ~2 paragraph spacing before line
    r.appendTableCell("\n\n\n_______________________\n");
  });
}

/* Insert page numbers with Docs API */
function insertPageNumbers_(docId, header, rightAligned){
  const requests = [{
    insertPageNumber: {
      location: header ? "HEADER" : "FOOTER",
      alignment: rightAligned ? "END" : "START",
      textStyle: { bold: false }
    }
  }];
  Docs.Documents.batchUpdate({requests: requests}, docId);
}
// ---- PDF alias (place right after generateApprovalPDF) ----
function generatePDF_ElegantUnified_(requestId, data, opts) {
  return generateApprovalPDF(requestId, data); // delegate to the main generator
}


/* ==== FUTURISTIC ONE-PAGE PDF TEMPLATE ==== */
function generateFuturisticPDF_(requestId, data, opts) {
  var doc = DocumentApp.create('CSR_' + safeText(requestId));
  
  try {
    var body = doc.getBody();
    body.clear();
    
    // CRITICAL: Set tight margins for maximum space
    body.setMarginTop(36);     // 0.5 inch
    body.setMarginBottom(36);
    body.setMarginLeft(50);
    body.setMarginRight(50);
    
    // Header & Footer
    buildSmartHeader_(doc, requestId);
    buildSmartFooter_(doc);
    
    // MAIN TITLE - Compact
    var title = body.appendParagraph('CSR DONATION & SPONSORSHIP REQUEST');
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    title.setSpacingBefore(0);
    title.setSpacingAfter(4);
    var titleText = title.editAsText();
    titleText.setFontFamily(TITLE_FONT);
    titleText.setBold(true);
    titleText.setFontSize(11);
    titleText.setForegroundColor(BRAND_PRIMARY);
    
    // REQUESTOR DETAILS
    compactBanner_(body, 'REQUESTOR');
    ultraCompactGrid_(body, [
      { label: 'Organisation/Individual', value: data[9] },
      { label: 'Reg No/NRIC', value: data[10] },
      { label: 'Entity Type', value: data[11] }
    ]);
    
    // EVENT DETAILS
    compactBanner_(body, 'EVENT');
    ultraCompactGrid_(body, [
      { label: 'Event Name', value: data[12] },
      { label: 'Event Date', value: formatDate(data[13]) },
      { label: 'Location', value: data[14] },
      { label: 'Focus Area', value: data[15] },
      { label: 'Contact', value: data[6] || data[3] },
      { label: 'Designation', value: data[5] }
    ]);
    
    // DESCRIPTION - Ultra compact
    var desc = safeText(data[16]);
    if (desc && desc.length > 200) {
      desc = desc.substring(0, 200) + '...'; // Truncate if too long
    }
    if (desc) {
      compactBanner_(body, 'DESCRIPTION');
      compactDescBox_(body, desc);
    }
    
    // FINANCIAL DETAILS
    var amountStr = formatCurrency(data[18]);
    if (amountStr) {
      compactBanner_(body, 'FINANCIAL');
      compact2ColGrid_(body, [
        { label: 'Amount', value: amountStr },
        { label: 'Request Type', value: 'Donation/Sponsorship' },
        { label: 'Bank', value: data[21] },
        { label: 'Account No', value: data[22] },
        { label: 'Account Name', value: data[20] },
        { label: '', value: '' }
      ]);
    }
    
    // REVIEWS - Ultra compact
    var gccRemark = safeText(data[30]);
    var headComment = safeText(data[33]);
    if (gccRemark || headComment) {
      compactBanner_(body, 'REVIEWS');
      var reviewText = '';
      if (gccRemark) reviewText += 'GCC: ' + gccRemark;
      if (headComment) {
        if (reviewText) reviewText += ' | ';
        reviewText += 'Head: ' + headComment;
      }
      var reviewPara = body.appendParagraph(reviewText);
      reviewPara.setSpacingBefore(2);
      reviewPara.setSpacingAfter(2);
      reviewPara.editAsText().setFontSize(7).setForegroundColor(BRAND_TEXT).setItalic(true);
    }
    
    // SIGNATURES - Compact grid format
    var signatureRoles = [
      { role: 'Recommended (GCCSO)', name: 'Izzam Ibrahim' },
      { role: 'Verified (Compliance)', name: 'Shirley Noiwoot David' },
      { role: 'CFO Approval', name: 'Azhar' }
    ];
    
    if (opts && opts.includeGMD) {
      signatureRoles.push({ role: 'GMD Approval', name: 'GMD' });
    }
    
    miniSignatureGrid_(body, signatureRoles);
    
    // Apply global font
    try { body.editAsText().setFontFamily(BODY_FONT); } catch (_) {}
    
    // Save and convert
    doc.saveAndClose();
    var docFile = DriveApp.getFileById(doc.getId());
    var pdfBlob = docFile.getAs('application/pdf');
    docFile.setTrashed(true);
    
    return pdfBlob;
    
  } catch (e) {
    try { doc.saveAndClose(); } catch (_) {}
    throw e;
  }
}

/*************************************************************
 * UI BRIDGE ENDPOINTS (expected by frontend)
 * - getDashboardData(): aggregate stats + SDG + recent history
 * - getMyRequests(): current user's submissions
 * - exportCSV(): quick CSV of all rows (lightweight)
 *************************************************************/

function getDashboardData() {
  try {
    var statsResp = getDashboardStats();           // already in your file
    if (!statsResp || !statsResp.success) throw new Error(statsResp && statsResp.error || "Stats failed");

    var sdgResp = getSDGDashboardData();           // already in your file
    if (!sdgResp || !sdgResp.success) throw new Error(sdgResp && sdgResp.error || "SDG stats failed");

    // Optional: recent workflow history if present
    var recent = [];
    if (typeof getWorkflowHistory === 'function') {
      try {
        var hist = getWorkflowHistory(20);         // latest 20 actions if your function supports a limit
        if (hist && hist.success) recent = hist.items || [];
      } catch (_) {}
    }

    return {
      success: true,
      stats: statsResp.stats,
      sdg: sdgResp.sdgStats || sdgResp.data || sdgResp,  // tolerate different shapes
      recent: recent
    };
  } catch (e) {
    Logger.log("getDashboardData error: " + e);
    return { success: false, error: e.message };
  }
}

/**
 * Return requests for the current user (or specified email).
 * Supports simple filtering by status|query for convenience.
 *
 * @param {Object} opts { email?, status?, q? }
 */
function getMyRequests(opts) {
  try {
    opts = opts || {};
    var email = (opts.email || (Session.getActiveUser() && Session.getActiveUser().getEmail()) || "").trim().toLowerCase();
    var statusFilter = (opts.status || "").trim().toLowerCase();
    var q = (opts.q || "").trim().toLowerCase();

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    if (!sh) return { success: false, error: "Submissions sheet not found" };

    var values = sh.getDataRange().getValues();
    if (!values || values.length <= 1) return { success: true, items: [] };

    var header = values[0];
    var rows = values.slice(1);

    // Column indexes (0-based) based on your declared schema:
    var COL = {
      REQUEST_ID: 0,
      SUBMIT_DATE: 1,
      REQUESTER_EMAIL: 7,
      REQUEST_TYPE: 11,
      EVENT_NAME: 12,
      EVENT_DATE: 13,
      STATUS: 26,
      WORKFLOW_STAGE: 27,
      CURRENT_APPROVER: 28,
      LAST_UPDATED: 29,
      AMOUNT: 18,
      PDF_URL: 37
    };

    var out = [];
    rows.forEach(function(r) {
      var requesterEmail = String(r[COL.REQUESTER_EMAIL] || "").trim().toLowerCase();
      if (email && requesterEmail !== email) return;

      var status = String(r[COL.STATUS] || "").trim();
      if (statusFilter && status.toLowerCase() !== statusFilter) return;

      // simple text query against a few fields
      if (q) {
        var blob = (String(r[COL.EVENT_NAME] || "") + " " + String(r[COL.REQUEST_TYPE] || "") + " " + String(r[COL.REQUEST_ID] || "")).toLowerCase();
        if (blob.indexOf(q) === -1) return;
      }

      out.push({
        requestId:      r[COL.REQUEST_ID],
        submittedOn:    r[COL.SUBMIT_DATE],
        eventName:      r[COL.EVENT_NAME],
        eventDate:      r[COL.EVENT_DATE],
        requestType:    r[COL.REQUEST_TYPE],
        status:         status,
        workflowStage:  r[COL.WORKFLOW_STAGE],
        currentApprover:r[COL.CURRENT_APPROVER],
        lastUpdated:    r[COL.LAST_UPDATED],
        amount:         parseFloat(r[COL.AMOUNT]) || 0,
        pdfUrl:         r[COL.PDF_URL] || ""
      });
    });

    // Sort: newest first by lastUpdated (fallback to submittedOn)
    out.sort(function(a,b){
      var ax = new Date(a.lastUpdated || a.submittedOn || 0).getTime();
      var bx = new Date(b.lastUpdated || b.submittedOn || 0).getTime();
      return bx - ax;
    });

    return { success: true, items: out };

  } catch (e) {
    Logger.log("getMyRequests error: " + e);
    return { success: false, error: e.message };
  }
}

/** Quick export of all submissions as CSV (for your Export CSV button) */
function exportCSV() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(CONFIG.SHEET_NAMES.SUBMISSIONS);
    if (!sh) return { success: false, error: "Submissions sheet not found" };

    var data = sh.getDataRange().getValues();
    if (!data || data.length === 0) return { success: false, error: "No data" };

    var csv = data.map(function(row){
      return row.map(function(cell){
        var v = (cell === null || cell === undefined) ? '' : String(cell);
        if (v.indexOf(',') !== -1 || v.indexOf('"') !== -1 || v.indexOf('\n') !== -1) {
          v = '"' + v.replace(/"/g, '""') + '"';
        }
        return v;
      }).join(',');
    }).join('\n');

    var blob = Utilities.newBlob(csv, 'text/csv', 'csr_export.csv');
    var file = DriveApp.getRootFolder().createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { success: true, url: file.getUrl(), fileId: file.getId() };
  } catch (e) {
    Logger.log("exportCSV error: " + e);
    return { success: false, error: e.message };
  }
}

/*************************************************************
 * CSR FORM RENDERER (HTML)
 * - White background, blue/purple/green accents
 * - Auto-hides empty cells/rows
 * - Safe to embed in HtmlService or use inside a PDF HTML body
 *************************************************************/
function buildCSRFormHTML(record) {
  // record: object with the fields you store (align keys as needed)
  function S(v){ return (v === null || v === undefined) ? '' : String(v); }
  function row(label, value, wide) {
    if (!value) return '';
    var cls = wide ? 'row row-wide' : 'row';
    return '<div class="'+cls+'"><div class="label">'+label+'</div><div class="value">'+value+'</div></div>';
  }

  var css = String.raw`
  <style>
    :root{
      --bg: #ffffff;
      --ink: #0f172a;
      --muted: #64748b;
      --blue: #2563eb;
      --purple: #7c3aed;
      --green: #059669;
      --soft: #eef2ff;         /* soft indigo */
      --soft2: #ecfeff;        /* soft cyan */
      --soft3: #ecfdf5;        /* soft green */
      --radius: 14px;
      --ring: 0 0 0 1px rgba(99,102,241,0.12), 0 10px 30px rgba(2,6,23,0.12) inset;
      --shadow: 0 20px 45px rgba(2,6,23,0.12);
    }
    .csr-doc{
      background: var(--bg);
      color: var(--ink);
      font-family: "Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      padding: 24px;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid rgba(2,6,23,0.06);
      max-width: 960px;
      margin: 0 auto;
    }
    .doc-head{
      display:flex; align-items:center; gap:16px; margin-bottom:18px;
      padding:16px 18px; border-radius: var(--radius);
      background: linear-gradient(135deg, var(--soft), var(--soft2), var(--soft3));
      box-shadow: var(--ring);
    }
    .doc-head .title{
      font-weight: 800; letter-spacing: .3px; font-size: 20px; color: var(--ink);
    }
    .doc-head .csrno{
      margin-left:auto; font-weight:700; color: var(--blue);
      background:#fff; padding:8px 12px; border-radius:10px; border:1px solid rgba(37,99,235,.2);
    }
    .section{
      margin-top:16px; border-radius: var(--radius); overflow:hidden;
      border: 1px solid rgba(2,6,23,0.08);
    }
    .section .banner{
      padding:10px 14px; font-weight:700; color:#fff; background:
      linear-gradient(90deg, var(--blue), var(--purple), var(--green));
      letter-spacing:.4px;
    }
    .grid{
      display:grid; grid-template-columns: 1fr 1fr; gap:0;
      background:#fff;
    }
    .row{
      display:grid; grid-template-columns: 220px 1fr;
      border-top:1px solid rgba(2,6,23,0.06);
      padding:12px 14px;
    }
    .row:nth-child(odd){ background: #fafbff; }
    .row .label{ color: var(--muted); font-weight:600; }
    .row .value{ color: var(--ink); font-weight:600; }
    .row-wide{ grid-template-columns: 220px 1fr; grid-column:1 / -1; }
    .muted{ color: var(--muted); }
  </style>`;

  var html = String.raw`
  ${css}
  <div class="csr-doc">
    <div class="doc-head">
      <div class="title">CSR / Sponsorship / Donation Request</div>
      <div class="csrno">CSR No: ${S(record.requestId)}</div>
    </div>

    <div class="section">
      <div class="banner">Requestor Details</div>
      <div class="grid">
        ${row("Organization / Individual", S(record.organization))}
        ${row("Requester Name", S(record.requester))}
        ${row("Requester Email", S(record.requesterEmail))}
        ${row("Requester Contact", S(record.requesterContact))}
        ${row("Organization NRIC/RN", S(record.organizationRN))}
        ${row("CSR Rep", S(record.csrRep))}
      </div>
    </div>

    <div class="section">
      <div class="banner">Event Details</div>
      <div class="grid">
        ${row("Request Type", S(record.requestType))}
        ${row("Event Name", S(record.eventName))}
        ${row("Event Date", S(record.eventDate))}
        ${row("Event Location", S(record.eventLocation))}
        ${row("Focus Area", S(record.focusArea))}
        ${row("Amount Requested", S(record.amount))}
        ${row("Purpose", S(record.purpose), true)}
        ${row("Description", S(record.description), true)}
        ${row("Objectives", S(record.objectives), true)}
      </div>
    </div>

    <div class="section">
      <div class="banner">Banking</div>
      <div class="grid">
        ${row("Payee Name", S(record.payeeName))}
        ${row("Payee Bank", S(record.payeeBank))}
        ${row("Payee Account", S(record.payeeAccount))}
      </div>
    </div>

    <div class="muted" style="margin-top:14px;">This is a system-generated form.</div>
  </div>`;
  return html;
}

// Example usage to preview inside a modal WebApp page:
function getCSRFormHTMLFor(requestId) {
  var rec = getRequestDetails(requestId); // you already have this function
  if (!rec || !rec.success) return HtmlService.createHtmlOutput("Not found");
  var r = rec.item; // adapt keys -> record fields below
  var model = {
    requestId: r.requestId,
    organization: r.organization || r.organizationName,
    requester: r.requesterName,
    requesterEmail: r.requesterEmail,
    requesterContact: r.requesterContact,
    organizationRN: r.organizationRN,
    csrRep: r.csrRepName,
    requestType: r.requestType,
    eventName: r.eventName,
    eventDate: r.eventDate,
    eventLocation: r.eventLocation,
    focusArea: r.focusArea,
    amount: r.amount > 0 ? ("RM " + Number(r.amount).toFixed(2)) : "",
    purpose: r.purpose,
    description: r.description,
    objectives: r.objectives,
    payeeName: r.payeeName,
    payeeBank: r.payeeBank,
    payeeAccount: r.payeeAccount
  };
  var html = buildCSRFormHTML(model);
  return HtmlService.createHtmlOutput(html).setWidth(1024).setHeight(900);
}

function getContributionHistoryByNames(searchName, searchOrg) {
  Logger.log("=== START getContributionHistoryByNames ===");
  Logger.log("Raw inputs - searchName: " + searchName + ", searchOrg: " + searchOrg);
  
  try {
    var termName = (searchName || "").toString().toLowerCase().trim();
    var termOrg = (searchOrg || "").toString().toLowerCase().trim();
    
    Logger.log("Normalized - termName: '" + termName + "', termOrg: '" + termOrg + "'");
    
    // Use helper function - THIS IS THE KEY FIX
    var ss = getSpreadsheet_();
    if (!ss) {
      Logger.log("ERROR: Could not access spreadsheet");
      return { 
        success: false, 
        message: "Could not access spreadsheet. Check CONFIG.SPREADSHEET_ID.",
        history: [] 
      };
    }
    
    Logger.log("Spreadsheet accessed: " + ss.getName());
    
    var sheetName = CONFIG.SHEET_NAMES.HISTORY || "Contribution_History";
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log("ERROR: Sheet '" + sheetName + "' not found");
      return { 
        success: false, 
        message: "Sheet '" + sheetName + "' not found",
        history: [] 
      };
    }
    
    var data = sheet.getDataRange().getValues();
    Logger.log("Total rows: " + data.length);
    
    if (data.length < 2) {
      return { success: true, history: [], message: "No history records" };
    }
    
    var headers = data[0].map(function(h) { 
      return (h || "").toString().toLowerCase().trim(); 
    });
    
    var idxName = headers.indexOf("requester name");
    var idxOrg = headers.indexOf("organization");
    var idxYear = headers.indexOf("year");
    var idxType = headers.indexOf("request type");
    var idxAmount = headers.indexOf("amount");
    var idxDate = headers.indexOf("date");
    var idxStatus = headers.indexOf("status");
    var idxNotes = headers.indexOf("notes");
    
    if (idxName === -1) idxName = 1;
    if (idxOrg === -1) idxOrg = 2;
    if (idxYear === -1) idxYear = 3;
    if (idxType === -1) idxType = 4;
    if (idxAmount === -1) idxAmount = 5;
    if (idxDate === -1) idxDate = 6;
    if (idxStatus === -1) idxStatus = 7;
    if (idxNotes === -1) idxNotes = 8;
    
    var history = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowName = (row[idxName] || "").toString().toLowerCase().trim();
      var rowOrg = (row[idxOrg] || "").toString().toLowerCase().trim();
      
      if (!rowName && !rowOrg) continue;
      
      var matchName = (termName === "") || (rowName.indexOf(termName) !== -1) || (termName.indexOf(rowName) !== -1);
      var matchOrg = (termOrg === "") || (rowOrg.indexOf(termOrg) !== -1) || (termOrg.indexOf(rowOrg) !== -1);
      
      if (matchName && matchOrg) {
        var record = {
          year: row[idxYear] || "",
          requestType: row[idxType] || "",
          amount: row[idxAmount] || 0,
          date: row[idxDate] || "",
          status: row[idxStatus] || "",
          notes: row[idxNotes] || ""
        };
        
        if (record.date instanceof Date) {
          record.date = Utilities.formatDate(record.date, Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
        if (typeof record.year === "number") {
          record.year = Math.floor(record.year);
        }
        
        history.push(record);
        Logger.log("MATCH at row " + i);
      }
    }
    
    Logger.log("=== COMPLETE: " + history.length + " matches ===");
    return { success: true, history: history };
    
  } catch (e) {
    Logger.log("ERROR: " + e.toString());
    return { success: false, message: e.toString(), history: [] };
  }
}

function testHistoryLookup() {
  var result = getContributionHistoryByNames("michael", "sacofa");
  Logger.log("Test result: " + JSON.stringify(result));
  return result;
}

function debugSpreadsheetAccess() {
  Logger.log("CONFIG.SPREADSHEET_ID: " + CONFIG.SPREADSHEET_ID);
  var ss = getSpreadsheet_();
  if (ss) {
    Logger.log("SUCCESS: " + ss.getName());
    Logger.log("Sheets: " + ss.getSheets().map(function(s) { return s.getName(); }).join(", "));
  } else {
    Logger.log("FAILED to access spreadsheet");
  }
}

/*************************************************************
 * END OF ULTIMATE CSR MANAGEMENT SYSTEM v4.0
 *************************************************************/
/*************************************************************
 * NEW PDF GENERATION HELPERS - CLEAN PROFESSIONAL FORMAT
 * Matches the sample format with centered logo
 *************************************************************/

function addCenteredLogoHeader_(body, requestId) {
  // Yellow and red accent bars at top
  const topBar = body.appendTable();
  topBar.setBorderWidth(0);
  const barRow = topBar.appendTableRow();
  barRow.setMinimumHeight(8);
  
  const yellowCell = barRow.appendTableCell("");
  yellowCell.setBackgroundColor("#FFC107");
  yellowCell.setWidth(400);
  
  const redCell = barRow.appendTableCell("");
  redCell.setBackgroundColor("#DC3545");
  redCell.setWidth(100);
  
  body.appendParagraph("").setSpacingAfter(4);
  
  // Centered logo
  const logoPara = body.appendParagraph("");
  logoPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  try {
    const logoBlob = DriveApp.getFileById(LOGO_FILE_ID).getBlob();
    const logoImg = logoPara.appendInlineImage(logoBlob);
    logoImg.setWidth(200);
    logoImg.setHeight(60);
  } catch (e) {
    logoPara.appendText("CAHYA MATA SARAWAK GROUP");
    logoPara.editAsText().setBold(true).setFontSize(18);
  }
  
  body.appendParagraph("").setSpacingAfter(4);
  
  // Bottom accent bars
  const bottomBar = body.appendTable();
  bottomBar.setBorderWidth(0);
  const bRow = bottomBar.appendTableRow();
  bRow.setMinimumHeight(8);
  
  const yellowCell2 = bRow.appendTableCell("");
  yellowCell2.setBackgroundColor("#FFC107");
  yellowCell2.setWidth(400);
  
  const redCell2 = bRow.appendTableCell("");
  redCell2.setBackgroundColor("#DC3545");
  redCell2.setWidth(100);
  
  body.appendParagraph("").setSpacingAfter(8);
  
  // Request number at top right
  const reqNum = body.appendParagraph("Donation & Sponsorship Request No. : " + requestId);
  reqNum.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  reqNum.editAsText().setFontSize(9).setBold(true);
  
  body.appendParagraph("").setSpacingAfter(8);
}

function addDetailRow_(body, label, value) {
  if (!value) return;
  
  const table = body.appendTable();
  table.setBorderWidth(1);
  table.setBorderColor("#DEE2E6");
  
  const row = table.appendTableRow();
  
  const labelCell = row.appendTableCell(label);
  labelCell.setBackgroundColor("#F8F9FA");
  labelCell.setPaddingTop(6);
  labelCell.setPaddingBottom(6);
  labelCell.setPaddingLeft(10);
  labelCell.setWidth(200);
  labelCell.editAsText().setBold(true).setFontSize(10);
  
  const valueCell = row.appendTableCell(value.toString());
  valueCell.setPaddingTop(6);
  valueCell.setPaddingBottom(6);
  valueCell.setPaddingLeft(10);
  valueCell.editAsText().setFontSize(10);
  
  body.appendParagraph("").setSpacingAfter(2);
}

function addFullWidthDetail_(body, label, value) {
  if (!value) return;
  
  const table = body.appendTable();
  table.setBorderWidth(1);
  table.setBorderColor("#DEE2E6");
  
  const row = table.appendTableRow();
  const cell = row.appendTableCell(label + ":\n\n" + value);
  cell.setPaddingTop(8);
  cell.setPaddingBottom(8);
  cell.setPaddingLeft(10);
  cell.setPaddingRight(10);
  
  const text = cell.editAsText();
  text.setBold(0, label.length, true);
  text.setFontSize(10);
  
  body.appendParagraph("").setSpacingAfter(4);
}

function addSignatureSection_(body, requestId, amount, data) {
  const table = body.appendTable();
  table.setBorderWidth(1);
  table.setBorderColor("#DEE2E6");
  
  // GCC Team Remark row
  let row = table.appendTableRow();
  row.setMinimumHeight(30);
  let cell = row.appendTableCell("Rondie Wilfred Galang");
  cell.setBackgroundColor("#F8F9FA");
  cell.setPaddingLeft(10);
  cell.setPaddingTop(6);
  cell.setPaddingBottom(6);
  cell.editAsText().setBold(true).setFontSize(10);
  
  // GCC Team Verification Checklist Link row
  row = table.appendTableRow();
  row.setMinimumHeight(30);
  cell = row.appendTableCell("GCC Team Verification Checklist Link : The request has been verified as per the verification checklist.");
  cell.setPaddingLeft(10);
  cell.setPaddingTop(6);
  cell.setPaddingBottom(6);
  cell.editAsText().setFontSize(10);
  
  // Head of GCC's Comment row
  row = table.appendTableRow();
  row.setMinimumHeight(50);
  cell = row.appendTableCell("Head of GCC's Comment :\n\nRecommend this one-off support in terms of modal for the premises, education, therapy, private tuition, and basic utilities requirements of the children.\n\n..........................................");
  cell.setPaddingLeft(10);
  cell.setPaddingTop(10);
  cell.setPaddingBottom(10);
  cell.editAsText().setFontSize(10);
  
  // Recommended by row
  row = table.appendTableRow();
  row.setMinimumHeight(60);
  cell = row.appendTableCell("Recommended by :\n\n\nIzzam Ibrahim\nGroup Chief Corporate Services Officer\n\n..........................................");
  cell.setPaddingLeft(10);
  cell.setPaddingTop(10);
  cell.setPaddingBottom(10);
  cell.editAsText().setFontSize(10);
  
  // Verified by row
  row = table.appendTableRow();
  row.setMinimumHeight(60);
  cell = row.appendTableCell("Verified by :\n\n\nShirley Noiwoot David\nGroup Head, Group Compliance\n\n..........................................");
  cell.setPaddingLeft(10);
  cell.setPaddingTop(10);
  cell.setPaddingBottom(10);
  cell.editAsText().setFontSize(10);
  
  // Add GCFO if amount is high
  if (amount > CONFIG.MONETARY_THRESHOLDS.LOW) {
    row = table.appendTableRow();
    row.setMinimumHeight(60);
    cell = row.appendTableCell("GCFO :\n\n\n\n\n..........................................");
    cell.setPaddingLeft(10);
    cell.setPaddingTop(10);
    cell.setPaddingBottom(10);
    cell.editAsText().setFontSize(10);
  }
  
  // Add Azhar bin Othman for very high amounts
  if (amount > CONFIG.MONETARY_THRESHOLDS.HIGH) {
    row = table.appendTableRow();
    row.setMinimumHeight(60);
    cell = row.appendTableCell("Azhar Bin Othman\n\n\n\n\n..........................................");
    cell.setPaddingLeft(10);
    cell.setPaddingTop(10);
    cell.setPaddingBottom(10);
    cell.editAsText().setFontSize(10);
  }
}


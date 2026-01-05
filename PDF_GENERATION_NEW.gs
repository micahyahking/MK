/*************************************************************
 * NEW PDF GENERATION - MATCHES SAMPLE FORMAT
 * Clean professional layout with centered logo
 *************************************************************/

// Color constants
const ACCENT_YELLOW = '#FFC107';
const ACCENT_RED = '#DC3545';
const HEADER_BG = '#F8F9FA';
const BORDER_COLOR = '#DEE2E6';
const LABEL_BG = '#F8F9FA';

// Logo file ID - UPDATE THIS with your actual logo file ID in Google Drive
const LOGO_FILE_ID = 'YOUR_LOGO_FILE_ID_HERE';

function generateApprovalPDF(requestId, data) {
  try {
    // Create document
    const doc = DocumentApp.create("CSR_Approval_" + requestId);
    const docId = doc.getId();
    const body = doc.getBody();
    body.clear();

    // Set margins
    body.setMarginTop(36);
    body.setMarginBottom(36);
    body.setMarginLeft(54);
    body.setMarginRight(54);

    // ===== HEADER WITH CENTERED LOGO =====
    addCenteredLogoHeader(body, requestId);

    // ===== TITLE =====
    addTitle(body, "DONATION & SPONSORSHIP - REQUEST");

    // ===== REQUESTOR DETAILS SECTION =====
    addSection(body, "REQUESTOR DETAILS");

    addDetailRow(body, "Organization/Individual Name", data[9] || "");
    addDetailRow(body, "Organization RN / Individual NRIC", data[10] || "");
    addDetailRow(body, "Event Focus Area", data[15] || "Community Well-Being & Development");
    addDetailRow(body, "Event Location", data[14] || "");
    addDetailRow(body, "Event Name", data[12] || "");

    // Event Description (full width)
    if (data[16]) {
      addFullWidthDetail(body, "Event Description and Objectives", data[16]);
    }

    // Objectives
    if (data[17]) {
      addFullWidthDetail(body, "Objectives", data[17]);
    }

    // Remarks (if any)
    addFullWidthDetail(body, "Remarks", "The donation will be disbursed directly to " +
      (data[9] || "the organization") + ", who will proceed with the purchase of the specified items.");

    // ===== TYPE OF ENTITY =====
    const amount = parseFloat(data[18]) || 0;
    addSection(body, "");

    const entityRow = body.appendTable();
    entityRow.setBorderWidth(1);
    entityRow.setBorderColor(BORDER_COLOR);
    const eRow = entityRow.appendTableRow();

    const typeLabel = eRow.appendTableCell("Type of Entity : NGO");
    typeLabel.setPaddingTop(6);
    typeLabel.setPaddingBottom(6);
    typeLabel.setPaddingLeft(10);
    typeLabel.editAsText().setBold(true);

    const requestFor = eRow.appendTableCell("Request for : Donation (Financial Contribution)");
    requestFor.setPaddingTop(6);
    requestFor.setPaddingBottom(6);
    requestFor.setPaddingLeft(10);
    requestFor.editAsText().setBold(true);

    body.appendParagraph("").setSpacingAfter(8);

    // ===== GENERAL DETAILS SECTION =====
    addSection(body, "GENERAL DETAILS");

    addDetailRow(body, "Contact Person's Management", "Ahsana's Management");
    addDetailRow(body, "Designation", "Ahsana's Management");
    addDetailRow(body, "Account Holder Name", data[20] || "");
    addDetailRow(body, "Bank Account Number", data[22] || "");
    addDetailRow(body, "Bank Name", data[21] || "CIMB Islamic");

    body.appendParagraph("").setSpacingAfter(8);

    const coordRow = body.appendTable();
    coordRow.setBorderWidth(1);
    coordRow.setBorderColor(BORDER_COLOR);
    const cRow = coordRow.appendTableRow();

    const csrRep = cRow.appendTableCell("CSR Rep/Coordinator Name : " + (data[3] || ""));
    csrRep.setPaddingTop(6);
    csrRep.setPaddingBottom(6);
    csrRep.setPaddingLeft(10);
    csrRep.editAsText().setBold(true);

    const csrRequest = cRow.appendTableCell("CSR Request for : Cahya Mata Sarawak");
    csrRequest.setPaddingTop(6);
    csrRequest.setPaddingBottom(6);
    csrRequest.setPaddingLeft(10);
    csrRequest.editAsText().setBold(true);

    body.appendParagraph("").setSpacingAfter(12);

    // ===== APPROVAL SIGNATURES SECTION =====
    addSignatureSection(body, requestId, amount);

    // ===== FOOTER =====
    addFooter(body);

    // Save and convert to PDF
    doc.saveAndClose();
    const pdf = DriveApp.getFileById(docId).getAs('application/pdf');

    // Save to drive folder
    const parentFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER.PARENT_FOLDER_ID || DriveApp.getRootFolder().getId());
    const pdfFile = parentFolder.createFile(pdf);
    pdfFile.setName("CSR_Approval_" + requestId + ".pdf");

    // Trash temp doc
    DriveApp.getFileById(docId).setTrashed(true);

    return {
      success: true,
      pdfUrl: pdfFile.getUrl(),
      pdfId: pdfFile.getId()
    };

  } catch (error) {
    Logger.log("PDF Generation Error: " + error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ===== HELPER FUNCTIONS =====

function addCenteredLogoHeader(body, requestId) {
  // Accent bars (yellow and red)
  const topBar = body.appendTable();
  topBar.setBorderWidth(0);
  const barRow = topBar.appendTableRow();
  barRow.setMinimumHeight(8);

  const yellowCell = barRow.appendTableCell("");
  yellowCell.setBackgroundColor(ACCENT_YELLOW);
  yellowCell.setWidth(400);

  const redCell = barRow.appendTableCell("");
  redCell.setBackgroundColor(ACCENT_RED);
  redCell.setWidth(100);

  body.appendParagraph("").setSpacingAfter(4);

  // Centered logo
  const logoPara = body.appendParagraph("");
  logoPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  try {
    const logoBlob = DriveApp.getFileById(LOGO_FILE_ID).getBlob();
    const logoImg = logoPara.appendInlineImage(logoBlob);
    logoImg.setWidth(200);
    logoImg.setHeight(60); // Adjust based on your logo aspect ratio
  } catch (e) {
    // Fallback if logo not found
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
  yellowCell2.setBackgroundColor(ACCENT_YELLOW);
  yellowCell2.setWidth(400);

  const redCell2 = bRow.appendTableCell("");
  redCell2.setBackgroundColor(ACCENT_RED);
  redCell2.setWidth(100);

  body.appendParagraph("").setSpacingAfter(8);

  // Request number in top right corner
  const reqNum = body.appendParagraph("Donation & Sponsorship Request No. : " + requestId);
  reqNum.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  reqNum.editAsText().setFontSize(9).setBold(true);

  body.appendParagraph("").setSpacingAfter(8);
}

function addTitle(body, titleText) {
  const title = body.appendParagraph(titleText);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  title.editAsText().setBold(true).setFontSize(16).setForegroundColor("#000000");
  body.appendParagraph("").setSpacingAfter(10);
}

function addSection(body, sectionTitle) {
  if (sectionTitle) {
    const section = body.appendParagraph(sectionTitle);
    section.editAsText().setBold(true).setFontSize(12).setForegroundColor("#000000");
    body.appendParagraph("").setSpacingAfter(4);
  }
}

function addDetailRow(body, label, value) {
  if (!value) return;

  const table = body.appendTable();
  table.setBorderWidth(1);
  table.setBorderColor(BORDER_COLOR);

  const row = table.appendTableRow();

  const labelCell = row.appendTableCell(label);
  labelCell.setBackgroundColor(LABEL_BG);
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

function addFullWidthDetail(body, label, value) {
  if (!value) return;

  const table = body.appendTable();
  table.setBorderWidth(1);
  table.setBorderColor(BORDER_COLOR);

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

function addSignatureSection(body, requestId, amount) {
  // Determine who needs to sign based on amount
  const signatures = getSignatureRoles(amount);

  const table = body.appendTable();
  table.setBorderWidth(1);
  table.setBorderColor(BORDER_COLOR);

  // Header row
  const headerRow = table.appendTableRow();
  headerRow.setMinimumHeight(25);
  const headerCell = headerRow.appendTableCell("Verified By:");
  headerCell.setBackgroundColor(LABEL_BG);
  headerCell.setPaddingLeft(10);
  headerCell.editAsText().setBold(true).setFontSize(10);

  // Add signature rows
  signatures.forEach(sig => {
    const row = table.appendTableRow();
    row.setMinimumHeight(50);

    const cell = row.appendTableCell(sig.label + "\n\n\n" +
      "___________________________\n" + sig.name);
    cell.setPaddingTop(10);
    cell.setPaddingBottom(10);
    cell.setPaddingLeft(10);
    cell.editAsText().setFontSize(10);
  });
}

function getSignatureRoles(amount) {
  // Default signatures
  const signatures = [
    { label: "Rondie Wilfred Galang", name: "GCC Team Remark: Verified" },
    { label: "Head of GCC's Comment:", name: "" },
    { label: "Recommended by:", name: "Izzam Ibrahim\nGroup Chief Corporate Services Officer" },
    { label: "Verified by:", name: "Shirley Noiwoot David\nGroup Head, Group Compliance" }
  ];

  // Add more approvers based on amount thresholds
  if (amount > CONFIG.MONETARY_THRESHOLDS.LOW) {
    signatures.push({ label: "GCFO:", name: "" });
  }

  if (amount > CONFIG.MONETARY_THRESHOLDS.HIGH) {
    signatures.push({ label: "Azhar Bin Othman", name: "" });
  }

  return signatures;
}

function addFooter(body) {
  body.appendParagraph("").setSpacingAfter(10);
  const footer = body.appendParagraph("This is a system generated document");
  footer.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  footer.editAsText().setFontSize(8).setItalic(true).setForegroundColor("#666666");
}

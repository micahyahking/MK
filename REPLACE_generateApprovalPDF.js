/*************************************************************
 * REPLACE THIS ENTIRE FUNCTION AT LINE 4954 in Code.gs
 * Copy everything between the START and END markers
 *************************************************************/

// ========== START: Copy from here ==========

function generateApprovalPDF(requestId, data) {
  try {
    const amount = parseFloat(data[18]) || 0;

    // Create document
    const doc = DocumentApp.create("CSR_Approval_" + requestId);
    const docId = doc.getId();
    const body = doc.getBody();
    body.clear();

    // Set page margins
    body.setMarginTop(36);
    body.setMarginBottom(36);
    body.setMarginLeft(54);
    body.setMarginRight(54);

    // ===== HEADER WITH CENTERED LOGO =====
    addCenteredLogoHeader_(body, requestId);

    // ===== TITLE =====
    const title = body.appendParagraph("DONATION & SPONSORSHIP - REQUEST");
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    title.editAsText().setBold(true).setFontSize(16).setForegroundColor("#000000");
    body.appendParagraph("").setSpacingAfter(10);

    // ===== REQUESTOR DETAILS SECTION =====
    const reqSection = body.appendParagraph("REQUESTOR DETAILS");
    reqSection.editAsText().setBold(true).setFontSize(12).setForegroundColor("#000000");
    body.appendParagraph("").setSpacingAfter(4);

    addDetailRow_(body, "Organization/Individual Name", data[9]);
    addDetailRow_(body, "Organization RN / Individual NRIC", data[10]);
    addDetailRow_(body, "Event Focus Area", data[15] || "Community Well-Being & Development");
    addDetailRow_(body, "Event Location", data[14]);
    addDetailRow_(body, "Event Name", data[12]);

    // Event Description (full width)
    if (data[16]) {
      addFullWidthDetail_(body, "Event Description and Objectives", data[16]);
    }

    // Objectives
    if (data[17]) {
      addFullWidthDetail_(body, "Objectives", data[17]);
    }

    // Remarks
    const remarksText = "The donation will be disbursed directly to " +
                        (data[9] || "the organization") +
                        ", who will proceed with the purchase of the specified items. " +
                        "All related receipts and invoices will be provided to the CSR Team for documentation and transparency purposes.";
    addFullWidthDetail_(body, "Remarks", remarksText);

    // ===== TYPE OF ENTITY ROW =====
    const entityRow = body.appendTable();
    entityRow.setBorderWidth(1);
    entityRow.setBorderColor("#DEE2E6");
    const eRow = entityRow.appendTableRow();

    const typeLabel = eRow.appendTableCell("Type of Entity : " + (data[11] || "NGO"));
    typeLabel.setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(10);
    typeLabel.editAsText().setBold(true).setFontSize(10);

    const requestFor = eRow.appendTableCell("Request for : Donation (Financial Contribution)");
    requestFor.setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(10);
    requestFor.editAsText().setBold(true).setFontSize(10);

    body.appendParagraph("").setSpacingAfter(8);

    // ===== GENERAL DETAILS SECTION =====
    const genSection = body.appendParagraph("GENERAL DETAILS");
    genSection.editAsText().setBold(true).setFontSize(12).setForegroundColor("#000000");
    body.appendParagraph("").setSpacingAfter(4);

    addDetailRow_(body, "Contact Person's Management", data[6] || data[3]);
    addDetailRow_(body, "Designation", data[5] || "Management");
    addDetailRow_(body, "Account Holder Name", data[20]);
    addDetailRow_(body, "Bank Account Number", data[22]);
    addDetailRow_(body, "Bank Name", data[21] || "CIMB Islamic");

    body.appendParagraph("").setSpacingAfter(8);

    // CSR Rep row
    const coordRow = body.appendTable();
    coordRow.setBorderWidth(1);
    coordRow.setBorderColor("#DEE2E6");
    const cRow = coordRow.appendTableRow();

    const csrRep = cRow.appendTableCell("CSR Rep/Coordinator Name : " + (data[3] || ""));
    csrRep.setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(10);
    csrRep.editAsText().setBold(true).setFontSize(10);

    const csrRequest = cRow.appendTableCell("CSR Request for : Cahya Mata Sarawak");
    csrRequest.setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(10);
    csrRequest.editAsText().setBold(true).setFontSize(10);

    body.appendParagraph("").setSpacingAfter(12);

    // ===== APPROVAL SIGNATURES SECTION =====
    addSignatureSection_(body, requestId, amount, data);

    // ===== FOOTER =====
    body.appendParagraph("").setSpacingAfter(10);
    const footer = body.appendParagraph("This is a system generated document");
    footer.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    footer.editAsText().setFontSize(8).setItalic(true).setForegroundColor("#666666");

    // Add page numbers
    doc.saveAndClose();
    insertPageNumbers_(docId, false, true);

    // Export PDF and save to drive folder
    const pdf = DriveApp.getFileById(docId).getAs('application/pdf');
    const parentFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER.PARENT_FOLDER_ID || DriveApp.getRootFolder().getId());
    const pdfFile = parentFolder.createFile(pdf);
    pdfFile.setName("CSR_Approval_" + requestId + ".pdf");
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Trash temp doc
    DriveApp.getFileById(docId).setTrashed(true);

    Logger.log("PDF generated successfully: " + pdfFile.getUrl());

    return {
      success: true,
      pdfUrl: pdfFile.getUrl(),
      pdfId: pdfFile.getId(),
      format: "Professional Clean Layout"
    };

  } catch (err) {
    Logger.log("PDF Generation Error: " + err + "\n" + err.stack);
    return {
      success: false,
      error: err.message,
      pdfUrl: "",
      format: "Error"
    };
  }
}

// ========== END: Copy until here ==========

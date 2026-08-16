/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * User-interface actions triggered from
 * buttons or other spreadsheet controls.
 *
 * Includes:
 *
 * - Clear Assembly
 * - Change default tolerance classes
 * - Toggle Statistical Analysis
 */


/**
 * Clears the target/component input and
 * normal analysis results.
 *
 * Requires user confirmation before clearing.
 */
function clearAssemblyComponents() {

  const ui =
    SpreadsheetApp.getUi();


  // ==========================================
  // CONFIRM
  // ==========================================

  const response =
    ui.alert(
      "Clear Assembly",
      "Are you sure you want to clear all components and analysis results?",
      ui.ButtonSet.YES_NO
    );


  if (
    response !==
    ui.Button.YES
  ) {

    return;

  }


  // ==========================================
  // GET ASSEMBLY SHEET
  // ==========================================

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEETS.ASSEMBLY
      );


  if (!sheet) {

    return;

  }


  const startRow =
    CONFIG.TARGET_ROW;


  const numRows =
    1 +
    CONFIG.MAX_COMPONENT_ROWS;


  // ==========================================
  // CLEAR USER INPUT
  // ==========================================
  //
  // A:I
  // Target row + component rows.
  // ==========================================

  sheet
    .getRange(
      startRow,
      CONFIG.COLUMNS.NAME,
      numRows,
      CONFIG.COLUMNS.COMMENT
    )
    .clearContent();


  // ==========================================
  // CLEAR ANALYSIS CACHE
  // ==========================================

  clearAnalysisCaches();

  clearAnalysisDataCache();


  // ==========================================
  // CLEAR NORMAL ANALYSIS OUTPUT
  // ==========================================

  sheet
    .getRange(
      "M2:R80"
    )
    .clearContent();


  // ==========================================
  // COMPLETE
  // ==========================================

  SpreadsheetApp
    .getActive()
    .toast(
      "Assembly cleared.",
      "Tolerance Analyzer",
      3
    );

}


/**
 * Allows the user to change the default
 * tolerance classes used by ISO 2768
 * and ISO 13920.
 *
 * Values are stored in the Settings sheet
 * and synchronized with both memory and
 * Document Cache.
 */
function changeDefaultToleranceClasses() {

  const ui =
    SpreadsheetApp.getUi();


  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const settingsSheet =
    ss.getSheetByName(
      CONFIG.SHEETS.SETTINGS
    );


  if (!settingsSheet) {

    ui.alert(
      "Settings sheet was not found."
    );

    return;

  }


  // ==========================================
  // CURRENT VALUES
  // ==========================================

  const currentValues =
    settingsSheet
      .getRange(
        "B2:B3"
      )
      .getValues();


  const current2768 =
    String(
      currentValues[0][0]
    )
      .trim()
      .toLowerCase() ||
    "m";


  const current13920 =
    String(
      currentValues[1][0]
    )
      .trim()
      .toUpperCase() ||
    "B";


  // ==========================================
  // ISO 2768
  // ==========================================

  const response2768 =
    ui.prompt(
      "ISO 2768 Default Class",
      "Current class: " +
        current2768 +
        "\n\nEnter f, m, c or v:",
      ui.ButtonSet.OK_CANCEL
    );


  if (
    response2768
      .getSelectedButton() !==
    ui.Button.OK
  ) {

    return;

  }


  const new2768 =
    response2768
      .getResponseText()
      .trim()
      .toLowerCase();


  if (
    ![
      "f",
      "m",
      "c",
      "v"
    ].includes(
      new2768
    )
  ) {

    ui.alert(
      "Invalid ISO 2768 class.\n\n" +
      "Allowed values: f, m, c or v."
    );

    return;

  }


  // ==========================================
  // ISO 13920
  // ==========================================

  const response13920 =
    ui.prompt(
      "ISO 13920 Default Class",
      "Current class: " +
        current13920 +
        "\n\nEnter A, B, C or D:",
      ui.ButtonSet.OK_CANCEL
    );


  if (
    response13920
      .getSelectedButton() !==
    ui.Button.OK
  ) {

    return;

  }


  const new13920 =
    response13920
      .getResponseText()
      .trim()
      .toUpperCase();


  if (
    ![
      "A",
      "B",
      "C",
      "D"
    ].includes(
      new13920
    )
  ) {

    ui.alert(
      "Invalid ISO 13920 class.\n\n" +
      "Allowed values: A, B, C or D."
    );

    return;

  }


  // ==========================================
  // SAVE TO SETTINGS
  // ==========================================

  settingsSheet
    .getRange(
      "B2:B3"
    )
    .setValues([
      [new2768],
      [new13920]
    ]);


  // ==========================================
  // UPDATE MEMORY CACHE
  // ==========================================

  defaultToleranceClassesCache = {

    iso2768:
      new2768,

    iso13920:
      new13920

  };


  // ==========================================
  // UPDATE DOCUMENT CACHE
  // ==========================================

  const cache =
    CacheService
      .getDocumentCache();


  if (cache) {

    cache.put(
      "DEFAULT_TOLERANCE_CLASSES_V1",
      JSON.stringify(
        defaultToleranceClassesCache
      ),
      21600
    );

  }


  // ==========================================
  // UPDATE READ ME
  // ==========================================

  updateReadMeCurrentDefaults();


  // ==========================================
  // COMPLETE
  // ==========================================

  ui.alert(
    "Default Classes Updated",
    "ISO 2768: " +
      new2768 +
      "\n" +
      "ISO 13920: " +
      new13920,
    ui.ButtonSet.OK
  );

}


/**
 * Enables or disables Advanced
 * Statistical Analysis.
 *
 * The state is stored in K8 and mirrored
 * to Document Cache.
 */
function toggleStatisticalAnalysis() {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEETS.ASSEMBLY
      );


  if (!sheet) {

    return;

  }


  const toggleCell =
    sheet.getRange(
      "K8"
    );


  const enabled =
    toggleCell.getValue() ===
    true;


  const newState =
    !enabled;


  // ==========================================
  // SAVE STATE
  // ==========================================

  toggleCell.setValue(
    newState
  );


  saveStatisticalEnabledCache(
    newState
  );


  // ==========================================
  // ENABLE
  // ==========================================

  if (newState) {

    // Show K:L.
    sheet.showColumns(
      CONFIG.COLUMNS.STATISTICAL_MODEL,
      2
    );


    // Reuse the normal A:H cache.
    const analysisData =
      loadCachedAnalysisData(
        sheet
      );


    // Load statistical K:L input.
    const statisticalData =
      loadStatisticalDataCache(
        sheet
      );


    writeStatisticalAnalysis(
      sheet,
      analysisData,
      statisticalData
    );


    SpreadsheetApp
      .getActive()
      .toast(
        "Statistical Analysis enabled.",
        "Tolerance Analyzer",
        3
      );


    return;

  }


  // ==========================================
  // DISABLE
  // ==========================================

  sheet.hideColumns(
    CONFIG.COLUMNS.STATISTICAL_MODEL,
    2
  );


  clearStatisticalResult(
    sheet
  );


  clearStatisticalContributions(
    sheet
  );


  SpreadsheetApp
    .getActive()
    .toast(
      "Statistical Analysis disabled.",
      "Tolerance Analyzer",
      3
    );

}

/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * Main spreadsheet edit handler.
 *
 * Handles:
 *
 * - Statistical Analysis ON/OFF
 * - Statistical K:L edits
 * - Component creation/removal
 * - Standard changes
 * - Nominal dimension changes
 * - Tolerance class changes
 * - Custom tolerance edits
 * - Stack direction changes
 *
 * The handler reuses cached spreadsheet data
 * wherever possible to reduce execution time.
 */


/**
 * Runs automatically whenever the user edits
 * the Assembly sheet.
 *
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e
 */
function onEdit(
  e
) {

  // ==========================================
  // EVENT CHECK
  // ==========================================

  if (
    !e ||
    !e.range
  ) {

    return;

  }


  const sheet =
    e.range.getSheet();


  // ==========================================
  // SHEET CHECK
  // ==========================================

  if (
    sheet.getName() !==
    CONFIG.SHEETS.ASSEMBLY
  ) {

    return;

  }


  const row =
    e.range.getRow();


  const column =
    e.range.getColumn();


  // ==========================================
  // STATISTICAL ON/OFF CHECKBOX K8
  // ==========================================
  //
  // This branch is used when the user changes
  // the K8 checkbox directly.
  //
  // toggleStatisticalAnalysis() can still be
  // used by a button or other UI control.
  // ==========================================

  if (
    row === 8 &&
    column ===
      CONFIG.COLUMNS.STATISTICAL_MODEL
  ) {

    const enabled =
      e.value ===
      "TRUE";


    saveStatisticalEnabledCache(
      enabled
    );


    if (enabled) {

      // Show K:L.
      sheet.showColumns(
        CONFIG.COLUMNS.STATISTICAL_MODEL,
        2
      );


      const analysisData =
        loadCachedAnalysisData(
          sheet,
          e
        );


      const statisticalData =
        loadStatisticalDataCache(
          sheet
        );


      writeStatisticalAnalysis(
        sheet,
        analysisData,
        statisticalData
      );

    } else {

      // Hide K:L.
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

    }


    return;

  }


  // ==========================================
  // STATISTICAL K:L EDIT
  // ==========================================
  //
  // Editing K or L must not trigger a complete
  // Worst Case / RSS recalculation.
  //
  // Only the smaller K:L cache and the
  // Statistical Analysis are updated.
  // ==========================================

  const isStatisticalColumn =
    column ===
      CONFIG.COLUMNS.STATISTICAL_MODEL ||
    column ===
      CONFIG.COLUMNS.STATISTICAL_VALUE;


  const isStatisticalComponentRow =
    row >=
      CONFIG.STACK_START_ROW &&
    row <
      CONFIG.STACK_START_ROW +
      CONFIG.MAX_COMPONENT_ROWS;


  if (
    isStatisticalColumn &&
    isStatisticalComponentRow
  ) {

    const statisticalData =
      loadStatisticalDataCache(
        sheet,
        e
      );


    // Immediately persist the current K/L edit
    // in the statistical data cache.
    saveStatisticalDataCache(
      statisticalData
    );


    // No further work is required when
    // Statistical Analysis is disabled.
    if (
      !loadStatisticalEnabledCache(
        sheet
      )
    ) {

      return;

    }


    // Reuse existing A:H data.
    const analysisData =
      loadCachedAnalysisData(
        sheet,
        e
      );


    writeStatisticalAnalysis(
      sheet,
      analysisData,
      statisticalData
    );


    return;

  }


  // ==========================================
  // NORMAL A:H RANGE CHECK
  // ==========================================

  if (
    row <
      CONFIG.START_ROW ||
    column >
      CONFIG.COLUMNS.DIRECTION
  ) {

    return;

  }


  // ==========================================
  // LOAD A:H ANALYSIS DATA
  // ==========================================
  //
  // loadCachedAnalysisData() also applies
  // the user's current edit to the cached copy.
  // ==========================================

  const allData =
    loadCachedAnalysisData(
      sheet,
      e
    );


  const rowIndex =
    row -
    CONFIG.TARGET_ROW;


  if (
    rowIndex < 0 ||
    rowIndex >=
      allData.length
  ) {

    return;

  }


  const rowData =
    allData[
      rowIndex
    ];


  const isComponentRow =
    row >=
      CONFIG.STACK_START_ROW &&
    row <
      CONFIG.STACK_START_ROW +
      CONFIG.MAX_COMPONENT_ROWS;


  // ==========================================
  // COMPONENT ROW REMOVED
  // ==========================================
  //
  // If both Nominal and Standard are empty,
  // the complete A:H component row is cleared.
  // ==========================================

  if (
    isComponentRow &&
    (
      column ===
        CONFIG.COLUMNS.NOMINAL ||
      column ===
        CONFIG.COLUMNS.STANDARD
    )
  ) {

    const nominal =
      rowData[1];


    const standard =
      String(
        rowData[2]
      ).trim();


    if (
      nominal === "" &&
      standard === ""
    ) {

      sheet
        .getRange(
          row,
          CONFIG.COLUMNS.NAME,
          1,
          CONFIG.COLUMNS.DIRECTION
        )
        .clearContent();


      // Keep the cached A:H representation
      // synchronized with the cleared row.
      for (
        let i = 0;
        i <
          CONFIG.COLUMNS.DIRECTION;
        i++
      ) {

        rowData[i] =
          "";

      }


      refreshAnalysisAfterEdit(
        sheet,
        allData,
        true
      );


      refreshStatisticalAfterEdit(
        sheet,
        allData
      );


      return;

    }

  }


  // ==========================================
  // COMPONENT NAME CHANGED
  // ==========================================

  if (
    column ===
      CONFIG.COLUMNS.NAME
  ) {

    setDefaultDirection(
      sheet,
      row,
      rowData
    );


    refreshAnalysisAfterEdit(
      sheet,
      allData,
      isComponentRow
    );


    refreshStatisticalAfterEdit(
      sheet,
      allData
    );


    return;

  }


  // ==========================================
  // STANDARD CHANGED
  // ==========================================

  if (
    column ===
      CONFIG.COLUMNS.STANDARD
  ) {

    updateClassDropdown(
      sheet,
      row,
      rowData,
      e.oldValue
    );


    setDefaultDirection(
      sheet,
      row,
      rowData
    );


    // true allows D:G to be updated together
    // when the selected standard changes.
    updateTolerance(
      sheet,
      row,
      rowData,
      true
    );


    refreshAnalysisAfterEdit(
      sheet,
      allData,
      isComponentRow
    );


    refreshStatisticalAfterEdit(
      sheet,
      allData
    );


    return;

  }


  // ==========================================
  // NOMINAL DIMENSION CHANGED
  // ==========================================

  if (
    column ===
      CONFIG.COLUMNS.NOMINAL
  ) {

    ensureDefaultClass(
      sheet,
      row,
      rowData
    );


    setDefaultDirection(
      sheet,
      row,
      rowData
    );


    updateTolerance(
      sheet,
      row,
      rowData
    );


    refreshAnalysisAfterEdit(
      sheet,
      allData,
      isComponentRow
    );


    refreshStatisticalAfterEdit(
      sheet,
      allData
    );


    return;

  }


  // ==========================================
  // TOLERANCE CLASS CHANGED
  // ==========================================

  if (
    column ===
      CONFIG.COLUMNS.CLASS
  ) {

    updateTolerance(
      sheet,
      row,
      rowData
    );


    refreshAnalysisAfterEdit(
      sheet,
      allData,
      isComponentRow
    );


    refreshStatisticalAfterEdit(
      sheet,
      allData
    );


    return;

  }


  // ==========================================
  // UPPER / LOWER / TOLERANCE CHANGED
  // ==========================================

  if (
    column ===
      CONFIG.COLUMNS.UPPER ||
    column ===
      CONFIG.COLUMNS.LOWER ||
    column ===
      CONFIG.COLUMNS.TOLERANCE
  ) {

    // For Custom tolerances, G is calculated
    // automatically from E and F.
    if (
      String(
        rowData[2]
      ).trim() ===
        "Custom" &&
      (
        column ===
          CONFIG.COLUMNS.UPPER ||
        column ===
          CONFIG.COLUMNS.LOWER
      )
    ) {

      updateTolerance(
        sheet,
        row,
        rowData
      );

    }


    refreshAnalysisAfterEdit(
      sheet,
      allData,
      isComponentRow
    );


    refreshStatisticalAfterEdit(
      sheet,
      allData
    );


    return;

  }


  // ==========================================
  // STACK DIRECTION CHANGED
  // ==========================================

  if (
    isComponentRow &&
    column ===
      CONFIG.COLUMNS.DIRECTION
  ) {

    refreshAnalysisAfterEdit(
      sheet,
      allData,
      true
    );


    refreshStatisticalAfterEdit(
      sheet,
      allData
    );


    return;

  }

}


/**
 * Refreshes the normal tolerance analysis
 * after an A:H edit.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Array[]} allData
 * @param {boolean} includeContribution
 */
function refreshAnalysisAfterEdit(
  sheet,
  allData,
  includeContribution
) {

  // ==========================================
  // PRIME IN-MEMORY ANALYSIS CACHE
  // ==========================================

  primeAnalysisCaches(
    allData
  );


  // ==========================================
  // WORST CASE + RSS
  // ==========================================

  writeWorstCaseResult(
    sheet
  );


  // ==========================================
  // CONTRIBUTION ANALYSIS
  // ==========================================

  if (
    includeContribution
  ) {

    writeContributionAnalysis(
      sheet
    );

  }


  // ==========================================
  // SAVE A:H DOCUMENT CACHE
  // ==========================================

  saveAnalysisDataCache(
    allData
  );

}


/**
 * Refreshes Statistical Analysis after
 * an A:H edit.
 *
 * No K:L spreadsheet read or statistical
 * calculation is performed while the feature
 * is disabled.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Array[]} analysisData
 */
function refreshStatisticalAfterEdit(
  sheet,
  analysisData
) {

  // ==========================================
  // STATISTICAL ANALYSIS OFF
  // ==========================================

  if (
    !loadStatisticalEnabledCache(
      sheet
    )
  ) {

    return;

  }


  // ==========================================
  // LOAD K:L
  // ==========================================

  const statisticalData =
    loadStatisticalDataCache(
      sheet
    );


  // ==========================================
  // WRITE COMPLETE STATISTICAL ANALYSIS
  // ==========================================

  writeStatisticalAnalysis(
    sheet,
    analysisData,
    statisticalData
  );

}

/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * Statistical tolerance analysis.
 *
 * Supported component models:
 *
 * - Tolerance basis
 * - Known σ
 *
 * Component variances are combined to calculate
 * the standard deviation of the complete stack.
 *
 * The current result presentation uses ±3σ.
 */


const STATISTICAL_DATA_CACHE_KEY =
  "STATISTICAL_DATA_CACHE_V1";


const STATISTICAL_ENABLED_CACHE_KEY =
  "STATISTICAL_ENABLED_CACHE_V1";


/**
 * Calculates the statistical tolerance stack.
 *
 * analysisData contains:
 *
 *   index 0    = Target row
 *   index 1... = Component rows
 *
 * statisticalData contains K:L data for
 * component rows only.
 *
 * @param {Array[]} analysisData A:H analysis data.
 * @param {Array[]} statisticalData K:L statistical input.
 *
 * @return {{
 *   stackSigma: number,
 *   totalVariance: number,
 *   range1Sigma: number,
 *   range2Sigma: number,
 *   range3Sigma: number,
 *   range4Sigma: number,
 *   components: Array
 * } | null}
 */
function calculateStatisticalAnalysis(
  analysisData,
  statisticalData
) {

  if (
    !Array.isArray(
      analysisData
    ) ||
    !Array.isArray(
      statisticalData
    )
  ) {

    return null;

  }


  let totalVariance =
    0;


  const components =
    [];


  // ==========================================
  // COMPONENTS
  // ==========================================

  for (
    let i = 0;
    i < CONFIG.MAX_COMPONENT_ROWS;
    i++
  ) {

    // ========================================
    // A:H COMPONENT DATA
    // ========================================
    //
    // analysisData[0] is the Target row,
    // therefore component i is located at i + 1.
    // ========================================

    const analysisRow =
      analysisData[
        i + 1
      ];


    if (!analysisRow) {

      continue;

    }


    // ========================================
    // K:L STATISTICAL DATA
    // ========================================

    const statisticalRow =
      statisticalData[i];


    if (!statisticalRow) {

      continue;

    }


    const sheetRow =
      CONFIG.STACK_START_ROW +
      i;


    const name =
      String(
        analysisRow[0]
      ).trim();


    // G = total tolerance width.
    const rawTolerance =
      analysisRow[6];


    const model =
      String(
        statisticalRow[0]
      ).trim();


    const rawStatisticalValue =
      statisticalRow[1];


    // ========================================
    // NO STATISTICAL MODEL
    // ========================================

    if (
      model === ""
    ) {

      continue;

    }


    // ========================================
    // COMPONENT NAME REQUIRED
    // ========================================

    if (
      name === ""
    ) {

      throw new Error(
        "Statistical data exists on row " +
        sheetRow +
        " but the component name is missing."
      );

    }


    let sigma =
      null;


    let basis =
      "";


    // ========================================
    // TOLERANCE BASIS
    // ========================================
    //
    // Example:
    //
    // Total tolerance width = 0.6 mm
    // Statistical value    = 3
    //
    // The tolerance represents ±3σ:
    //
    // σ = (0.6 / 2) / 3
    //   = 0.1 mm
    // ========================================

    if (
      model ===
      "Tolerance basis"
    ) {

      const tolerance =
        Number(
          rawTolerance
        );


      const sigmaLevel =
        typeof rawStatisticalValue ===
        "number"

          ? rawStatisticalValue

          : Number(
              String(
                rawStatisticalValue
              )
                .trim()
                .replace(
                  ",",
                  "."
                )
                .replace(
                  "−",
                  "-"
                )
            );


      if (
        !Number.isFinite(
          tolerance
        ) ||
        tolerance < 0
      ) {

        throw new Error(
          "Invalid tolerance on row " +
          sheetRow +
          " for component '" +
          name +
          "'."
        );

      }


      if (
        !Number.isFinite(
          sigmaLevel
        ) ||
        sigmaLevel <= 0
      ) {

        throw new Error(
          "Invalid sigma basis on row " +
          sheetRow +
          " for component '" +
          name +
          "'."
        );

      }


      sigma =
        (
          Math.abs(
            tolerance
          ) /
          2
        ) /
        sigmaLevel;


      basis =
        "±" +
        sigmaLevel +
        "σ tolerance basis";

    }


    // ========================================
    // KNOWN SIGMA
    // ========================================
    //
    // The user provides the process standard
    // deviation directly in millimetres.
    // ========================================

    else if (
      model ===
      "Known σ"
    ) {

      const knownSigma =
        typeof rawStatisticalValue ===
        "number"

          ? rawStatisticalValue

          : Number(
              String(
                rawStatisticalValue
              )
                .trim()
                .replace(
                  ",",
                  "."
                )
                .replace(
                  "−",
                  "-"
                )
            );


      if (
        !Number.isFinite(
          knownSigma
        ) ||
        knownSigma <= 0
      ) {

        throw new Error(
          "Invalid known σ on row " +
          sheetRow +
          " for component '" +
          name +
          "'."
        );

      }


      sigma =
        knownSigma;


      basis =
        "Known process σ";

    }


    // ========================================
    // UNKNOWN MODEL
    // ========================================

    else {

      throw new Error(
        "Unknown statistical model '" +
        model +
        "' on row " +
        sheetRow +
        "."
      );

    }


    // ========================================
    // VARIANCE
    // ========================================

    const variance =
      sigma *
      sigma;


    totalVariance +=
      variance;


    components.push({

      row:
        sheetRow,

      name:
        name,

      model:
        model,

      basis:
        basis,

      statisticalValue:
        rawStatisticalValue,

      sigma:
        sigma,

      variance:
        variance,

      share:
        0

    });

  }


  // ==========================================
  // NO STATISTICAL COMPONENTS
  // ==========================================

  if (
    components.length === 0
  ) {

    return null;

  }


  // ==========================================
  // STACK STANDARD DEVIATION
  // ==========================================
  //
  // Independent component variances are added:
  //
  // σstack = sqrt(
  //   σ1² + σ2² + ... + σn²
  // )
  // ==========================================

  const stackSigma =
    Math.sqrt(
      totalVariance
    );


  // ==========================================
  // VARIANCE CONTRIBUTION SHARE
  // ==========================================

  for (
    const component of
      components
  ) {

    component.share =
      totalVariance > 0

        ? component.variance /
          totalVariance

        : 0;

  }


  // Largest variance contributor first.
  components.sort(
    (a, b) =>
      b.variance -
      a.variance
  );


  return {

    stackSigma:
      stackSigma,

    totalVariance:
      totalVariance,

    range1Sigma:
      stackSigma,

    range2Sigma:
      stackSigma *
      2,

    range3Sigma:
      stackSigma *
      3,

    range4Sigma:
      stackSigma *
      4,

    components:
      components

  };

}


/**
 * Creates the Statistical Analysis checkbox
 * in cell K8.
 */
function setupStatisticalAnalysisToggle() {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEETS.ASSEMBLY
      );


  if (!sheet) {

    return;

  }


  sheet
    .getRange(
      "K8"
    )
    .insertCheckboxes()
    .setValue(
      false
    )
    .setNote(
      "Enable or disable Advanced Statistical Analysis."
    );

}


/**
 * Clears the main Statistical Analysis result.
 *
 * Output area:
 *
 *   S2:T13
 */
function clearStatisticalResult(
  sheet
) {

  if (!sheet) {

    sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(
          CONFIG.SHEETS.ASSEMBLY
        );

  }


  if (!sheet) {

    return;

  }


  sheet
    .getRange(
      2,
      19, // S
      12,
      2   // S:T
    )
    .clearContent()
    .setBackground(null)
    .setFontColor(null)
    .setFontWeight(
      "normal"
    );

}


/**
 * Writes the main Statistical Analysis result.
 *
 * The statistical calculation is centered on the
 * nominal tolerance-stack result from Analysis.gs.
 */
function writeStatisticalResult(
  sheet,
  statistical
) {

  if (
    !sheet ||
    !statistical
  ) {

    return;

  }


  // ==========================================
  // NOMINAL STACK
  // ==========================================

  const assembly =
    loadAssemblyAnalysis();


  if (!assembly) {

    clearStatisticalResult(
      sheet
    );

    return;

  }


  const nominal =
    assembly.nominalStack;


  // ==========================================
  // RESULT RANGE
  // ==========================================
  //
  // Version 1.0 presents the statistical
  // tolerance stack using ±3σ.
  // ==========================================

  const sigmaLevel =
    3;


  const statisticalRange =
    statistical.stackSigma *
    sigmaLevel;


  const minimum =
    nominal -
    statisticalRange;


  const maximum =
    nominal +
    statisticalRange;


  // ==========================================
  // TARGET EVALUATION
  // ==========================================

  const targetData =
    loadTargetData();


  let lowerMargin =
    null;

  let upperMargin =
    null;

  let criticalMargin =
    null;

  let passed =
    null;


  if (
    targetData &&
    targetData.target !== null &&
    targetData.upper !== null &&
    targetData.lower !== null
  ) {

    const target =
      Number(
        targetData.target
      );


    const targetUpper =
      Number(
        targetData.upper
      );


    const targetLower =
      Number(
        targetData.lower
      );


    if (
      Number.isFinite(
        target
      ) &&
      Number.isFinite(
        targetUpper
      ) &&
      Number.isFinite(
        targetLower
      )
    ) {

      const targetMin =
        target +
        targetLower;


      const targetMax =
        target +
        targetUpper;


      lowerMargin =
        minimum -
        targetMin;


      upperMargin =
        targetMax -
        maximum;


      criticalMargin =
        Math.min(
          lowerMargin,
          upperMargin
        );


      passed =
        lowerMargin >= 0 &&
        upperMargin >= 0;

    }

  }


  const status =
    passed === true

      ? "PASS"

      : passed === false

        ? "FAIL"

        : "N/A";


  // ==========================================
  // OUTPUT S:T
  // ==========================================

  const output = [

    [
      "STATISTICAL ANALYSIS",
      ""
    ],

    [
      "Nominal stack dimension",
      roundTolerance(
        nominal
      )
    ],

    [
      "Stack standard deviation σ",
      roundTolerance(
        statistical.stackSigma
      )
    ],

    [
      "±" +
      sigmaLevel +
      "σ range",

      roundTolerance(
        statisticalRange
      )
    ],

    [
      "Statistical minimum",
      roundTolerance(
        minimum
      )
    ],

    [
      "Statistical maximum",
      roundTolerance(
        maximum
      )
    ],

    [
      "",
      ""
    ],

    [
      "Lower margin",

      lowerMargin !== null
        ? roundTolerance(
            lowerMargin
          )
        : null
    ],

    [
      "Upper margin",

      upperMargin !== null
        ? roundTolerance(
            upperMargin
          )
        : null
    ],

    [
      "Critical margin",

      criticalMargin !== null
        ? roundTolerance(
            criticalMargin
          )
        : null
    ],

    [
      "",
      ""
    ],

    [
      "RESULT",
      status
    ]

  ];


  // One batch write.
  sheet
    .getRange(
      2,
      19, // S
      output.length,
      2
    )
    .setValues(
      output
    );


  const marginCell =
    sheet.getRange(
      "T11"
    );


  const statusCell =
    sheet.getRange(
      "T13"
    );


  // Header.
  sheet
    .getRange(
      "S2:T2"
    )
    .setFontWeight(
      "bold"
    );


  // ==========================================
  // CRITICAL MARGIN
  // ==========================================

  marginCell
    .setFontWeight(
      "bold"
    );


  if (
    criticalMargin === null
  ) {

    marginCell
      .setBackground(null)
      .setFontColor(null);

  } else if (
    criticalMargin < 0
  ) {

    marginCell
      .setBackground(
        "#f4c7c3"
      )
      .setFontColor(
        "#b31412"
      );

  } else {

    marginCell
      .setBackground(
        "#b7e1cd"
      )
      .setFontColor(
        "#0b8043"
      );

  }


  // ==========================================
  // STATUS
  // ==========================================

  statusCell
    .setFontWeight(
      "bold"
    );


  if (
    passed === true
  ) {

    statusCell
      .setBackground(
        "#b7e1cd"
      )
      .setFontColor(
        "#0b8043"
      );

  } else if (
    passed === false
  ) {

    statusCell
      .setBackground(
        "#f4c7c3"
      )
      .setFontColor(
        "#b31412"
      );

  } else {

    statusCell
      .setBackground(
        "#fff2cc"
      )
      .setFontColor(
        "#7f6000"
      );

  }

}


/**
 * Clears Statistical Contribution output.
 *
 * Output area:
 *
 *   S15:U44
 */
function clearStatisticalContributions(
  sheet
) {

  if (!sheet) {

    sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(
          CONFIG.SHEETS.ASSEMBLY
        );

  }


  if (!sheet) {

    return;

  }


  sheet
    .getRange(
      15,
      19, // S
      30,
      3   // S:U
    )
    .clearContent()
    .setBackground(null)
    .setFontColor(null)
    .setFontWeight(
      "normal"
    );

}


/**
 * Runs the complete statistical output workflow.
 *
 * The analysis is calculated only once and the
 * result is reused by both output functions.
 */
function writeStatisticalAnalysis(
  sheet,
  analysisData,
  statisticalData
) {

  if (
    !sheet ||
    !Array.isArray(
      analysisData
    ) ||
    !Array.isArray(
      statisticalData
    )
  ) {

    return;

  }


  // Reuse the already loaded A:H input.
  primeAnalysisCaches(
    analysisData
  );


  const statistical =
    calculateStatisticalAnalysis(
      analysisData,
      statisticalData
    );


  if (!statistical) {

    clearStatisticalResult(
      sheet
    );


    clearStatisticalContributions(
      sheet
    );


    return;

  }


  writeStatisticalResult(
    sheet,
    statistical
  );


  writeStatisticalContributions(
    sheet,
    statistical
  );

}


/**
 * Writes statistical component contributions.
 *
 * Output area:
 *
 *   S:U
 *
 * Share is based on each component's
 * contribution to total variance.
 */
function writeStatisticalContributions(
  sheet,
  statistical
) {

  if (
    !sheet ||
    !statistical ||
    !Array.isArray(
      statistical.components
    )
  ) {

    return;

  }


  const components =
    statistical.components;


  clearStatisticalContributions(
    sheet
  );


  if (
    components.length === 0
  ) {

    return;

  }


  // ==========================================
  // HEADER
  // ==========================================

  sheet
    .getRange(
      15,
      19, // S
      1,
      3   // S:U
    )
    .setValues([[
      "STATISTICAL CONTRIBUTIONS",
      "σ mm",
      "Share"
    ]])
    .setFontWeight(
      "bold"
    );


  // ==========================================
  // COMPONENT OUTPUT
  // ==========================================

  const output =
    components.map(
      function(component) {

        return [

          component.name,

          roundTolerance(
            component.sigma
          ),

          component.share

        ];

      }
    );


  sheet
    .getRange(
      16,
      19,
      output.length,
      3
    )
    .setValues(
      output
    );


  sheet
    .getRange(
      16,
      21, // U
      output.length,
      1
    )
    .setNumberFormat(
      "0.0%"
    );


  // Components are already sorted by
  // decreasing variance contribution.
  const critical =
    components[0];


  // One blank row between the component
  // table and the critical-component section.
  const criticalRow =
    17 +
    output.length;


  sheet
    .getRange(
      criticalRow,
      19,
      2,
      3
    )
    .setValues([

      [
        "CRITICAL STATISTICAL COMPONENT",
        critical.name,
        ""
      ],

      [
        "Largest variance contribution",
        roundTolerance(
          critical.sigma
        ),
        critical.share
      ]

    ]);


  sheet
    .getRange(
      criticalRow,
      19,
      2,
      3
    )
    .setFontWeight(
      "bold"
    );


  sheet
    .getRange(
      criticalRow + 1,
      21
    )
    .setNumberFormat(
      "0.0%"
    );

}


/**
 * Loads K:L statistical component data.
 *
 * Uses Document Cache first and reads the
 * spreadsheet only on a cache miss.
 *
 * If called from onEdit(), the current edited
 * value is applied directly to the cached copy.
 */
function loadStatisticalDataCache(
  sheet,
  e
) {

  const cache =
    CacheService
      .getDocumentCache();


  let data =
    null;


  // ==========================================
  // TRY DOCUMENT CACHE
  // ==========================================

  if (cache) {

    const cached =
      cache.get(
        STATISTICAL_DATA_CACHE_KEY
      );


    if (cached) {

      try {

        const parsed =
          JSON.parse(
            cached
          );


        if (
          Array.isArray(
            parsed
          ) &&
          parsed.length ===
            CONFIG.MAX_COMPONENT_ROWS
        ) {

          data =
            parsed;

        }

      } catch (error) {

        data =
          null;

      }

    }

  }


  // ==========================================
  // CACHE MISS -> READ K:L
  // ==========================================

  if (!data) {

    data =
      sheet
        .getRange(
          CONFIG.STACK_START_ROW,
          CONFIG.COLUMNS.STATISTICAL_MODEL,
          CONFIG.MAX_COMPONENT_ROWS,
          2
        )
        .getValues();

  }


  // ==========================================
  // APPLY CURRENT EDIT
  // ==========================================

  if (
    e &&
    e.range &&
    e.range.getNumRows() === 1 &&
    e.range.getNumColumns() === 1
  ) {

    const row =
      e.range.getRow();


    const column =
      e.range.getColumn();


    const rowIndex =
      row -
      CONFIG.STACK_START_ROW;


    const columnIndex =
      column -
      CONFIG.COLUMNS.STATISTICAL_MODEL;


    if (
      rowIndex >= 0 &&
      rowIndex < data.length &&
      columnIndex >= 0 &&
      columnIndex < 2
    ) {

      data[
        rowIndex
      ][
        columnIndex
      ] =
        typeof e.value ===
        "undefined"

          ? ""

          : e.value;

    }

  }


  return data;

}


/**
 * Saves K:L statistical data in Document Cache.
 */
function saveStatisticalDataCache(
  data
) {

  const cache =
    CacheService
      .getDocumentCache();


  if (!cache) {

    return;

  }


  cache.put(
    STATISTICAL_DATA_CACHE_KEY,
    JSON.stringify(
      data
    ),
    21600
  );

}


/**
 * Clears the cached K:L statistical data.
 */
function clearStatisticalDataCache() {

  const cache =
    CacheService
      .getDocumentCache();


  if (!cache) {

    return;

  }


  cache.remove(
    STATISTICAL_DATA_CACHE_KEY
  );

}


/**
 * Returns whether Statistical Analysis
 * is currently enabled.
 *
 * K8 is read only on a cache miss.
 */
function loadStatisticalEnabledCache(
  sheet
) {

  const cache =
    CacheService
      .getDocumentCache();


  if (cache) {

    const cached =
      cache.get(
        STATISTICAL_ENABLED_CACHE_KEY
      );


    if (
      cached ===
      "true"
    ) {

      return true;

    }


    if (
      cached ===
      "false"
    ) {

      return false;

    }

  }


  const enabled =
    sheet
      .getRange(
        "K8"
      )
      .getValue() ===
      true;


  saveStatisticalEnabledCache(
    enabled
  );


  return enabled;

}


/**
 * Stores the Statistical Analysis ON/OFF
 * state in Document Cache.
 */
function saveStatisticalEnabledCache(
  enabled
) {

  const cache =
    CacheService
      .getDocumentCache();


  if (!cache) {

    return;

  }


  cache.put(
    STATISTICAL_ENABLED_CACHE_KEY,

    enabled
      ? "true"
      : "false",

    21600
  );

}

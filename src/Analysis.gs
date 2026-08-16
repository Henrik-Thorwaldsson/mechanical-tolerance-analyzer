/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * Core one-dimensional tolerance stack analysis.
 *
 * This module calculates:
 *
 * - Nominal stack dimension
 * - Worst Case minimum / maximum
 * - RSS variation
 * - Target margins
 * - Worst Case contributions
 * - RSS contributions
 *
 * Result formatting and spreadsheet output are handled
 * separately by AnalysisOutput.gs.
 */


let analysisInputCache =
  null;

let assemblyDataCache =
  null;

let targetDataCache =
  null;

let assemblyAnalysisCache =
  null;


/**
 * Loads the complete A:H analysis input.
 *
 * Data layout:
 *
 *   index 0    = Target component
 *   index 1... = Stack components
 *
 * The target defines the requirement and is not
 * included in the dimensional stack itself.
 */
function loadAnalysisInputData() {

  if (
    analysisInputCache !== null
  ) {

    return analysisInputCache;

  }


  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEETS.ASSEMBLY
      );


  if (!sheet) {

    throw new Error(
      "Assembly sheet was not found."
    );

  }


  const numRows =
    1 +
    CONFIG.MAX_COMPONENT_ROWS;


  analysisInputCache =
    sheet
      .getRange(
        CONFIG.TARGET_ROW,
        CONFIG.COLUMNS.NAME,
        numRows,
        CONFIG.COLUMNS.DIRECTION
      )
      .getValues();


  return analysisInputCache;

}


/**
 * Returns only the component rows used by
 * the tolerance stack.
 *
 * The first analysis row is deliberately removed
 * because it contains the Target component.
 */
function loadAssemblyData() {

  if (
    assemblyDataCache !== null
  ) {

    return assemblyDataCache;

  }


  const data =
    loadAnalysisInputData();


  assemblyDataCache =
    data.slice(1);


  return assemblyDataCache;

}


/**
 * Returns target nominal and allowable deviations.
 */
function loadTargetData() {

  if (
    targetDataCache !== null
  ) {

    return targetDataCache;

  }


  const data =
    loadAnalysisInputData();


  if (
    !data ||
    data.length === 0
  ) {

    return {
      target: null,
      upper: null,
      lower: null
    };

  }


  const targetRow =
    data[0];


  const targetRaw =
    targetRow[1];

  const targetUpperRaw =
    targetRow[4];

  const targetLowerRaw =
    targetRow[5];


  targetDataCache = {

    target:
      targetRaw === ""
        ? null
        : Number(targetRaw),

    upper:
      targetUpperRaw === ""
        ? null
        : Number(targetUpperRaw),

    lower:
      targetLowerRaw === ""
        ? null
        : Number(targetLowerRaw)

  };


  return targetDataCache;

}


/**
 * Returns the cached common assembly analysis.
 */
function loadAssemblyAnalysis() {

  if (
    assemblyAnalysisCache !== null
  ) {

    return assemblyAnalysisCache;

  }


  assemblyAnalysisCache =
    calculateAssemblyAnalysis();


  return assemblyAnalysisCache;

}


/**
 * Clears in-memory analysis results.
 *
 * Used when component or target input changes.
 */
function clearAnalysisCaches() {

  analysisInputCache =
    null;

  assemblyDataCache =
    null;

  targetDataCache =
    null;

  assemblyAnalysisCache =
    null;

}


/**
 * Performs the shared assembly calculation.
 *
 * Worst Case and RSS are calculated during the same
 * pass through the component data to avoid duplicate
 * spreadsheet reads and repeated calculations.
 */
function calculateAssemblyAnalysis() {

  const data =
    loadAssemblyData();


  if (
    data.length === 0
  ) {

    return null;

  }


  let nominalStack = 0;
  let maxStack = 0;
  let minStack = 0;

  let sumSquares = 0;

  let totalContribution = 0;
  let totalVariance = 0;


  const wcContributions = [];
  const rssContributions = [];


  // ==========================================
  // COMPONENT ROWS
  // ==========================================

  for (
    const row of data
  ) {

    const name =
      String(
        row[0]
      ).trim();


    const rawNominal =
      row[1];

    const rawUpper =
      row[4];

    const rawLower =
      row[5];


    const direction =
      String(
        row[7]
      ).trim();


    // ========================================
    // INCOMPLETE / UNUSED ROW
    // ========================================
    //
    // Check raw values before Number().
    //
    // Number("") would otherwise become 0,
    // which could incorrectly include an
    // incomplete component in the analysis.
    // ========================================

    if (
      rawNominal === "" ||
      rawUpper === "" ||
      rawLower === "" ||
      (
        direction !== "+" &&
        direction !== "-"
      )
    ) {

      continue;

    }


    // ========================================
    // NORMALIZE NUMERIC VALUES
    // ========================================
    //
    // Comma decimals are accepted because
    // spreadsheets may use regional formatting.
    // ========================================

    const nominal =
      Number(
        String(rawNominal)
          .trim()
          .replace(",", ".")
          .replace("−", "-")
      );


    const upper =
      Number(
        String(rawUpper)
          .trim()
          .replace(",", ".")
          .replace("−", "-")
      );


    const lower =
      Number(
        String(rawLower)
          .trim()
          .replace(",", ".")
          .replace("−", "-")
      );


    if (
      !Number.isFinite(nominal) ||
      !Number.isFinite(upper) ||
      !Number.isFinite(lower)
    ) {

      continue;

    }


    // ========================================
    // NOMINAL + WORST CASE
    // ========================================
    //
    // For a negative stack direction the
    // tolerance limits reverse their effect:
    //
    // MAX uses the component minimum.
    // MIN uses the component maximum.
    //
    // Example:
    //
    // X = A - B
    //
    // Xmax = Amax - Bmin
    // Xmin = Amin - Bmax
    // ========================================

    if (
      direction === "+"
    ) {

      nominalStack +=
        nominal;


      maxStack +=
        nominal +
        upper;


      minStack +=
        nominal +
        lower;

    } else {

      nominalStack -=
        nominal;


      maxStack -=
        nominal +
        lower;


      minStack -=
        nominal +
        upper;

    }


    // ========================================
    // TOLERANCE WIDTH
    // ========================================

    const contribution =
      Math.abs(
        upper -
        lower
      );


    // RSS uses half of the full tolerance width.
    const rssTerm =
      contribution /
      2;


    const varianceContribution =
      rssTerm *
      rssTerm;


    // ========================================
    // CONTRIBUTIONS
    // ========================================

    if (
      name !== ""
    ) {

      totalContribution +=
        contribution;


      totalVariance +=
        varianceContribution;


      wcContributions.push({

        name:
          name,

        contribution:
          contribution,

        percentage:
          0

      });


      rssContributions.push({

        name:
          name,

        rssTerm:
          rssTerm,

        varianceContribution:
          varianceContribution,

        percentage:
          0

      });

    }


    // ========================================
    // RSS
    // ========================================

    sumSquares +=
      varianceContribution;

  }


  // ==========================================
  // WORST CASE CONTRIBUTION SHARE
  // ==========================================

  for (
    const item of
      wcContributions
  ) {

    item.percentage =
      totalContribution > 0

        ? (
            item.contribution /
            totalContribution
          ) * 100

        : 0;

  }


  // ==========================================
  // RSS CONTRIBUTION SHARE
  // ==========================================
  //
  // RSS contribution is based on variance.
  // Stored as fraction 0...1 for direct
  // percentage formatting in Google Sheets.
  // ==========================================

  for (
    const item of
      rssContributions
  ) {

    item.percentage =
      totalVariance > 0

        ? item.varianceContribution /
          totalVariance

        : 0;

  }


  // Largest contributor first.
  wcContributions.sort(
    (a, b) =>
      b.contribution -
      a.contribution
  );


  rssContributions.sort(
    (a, b) =>
      b.varianceContribution -
      a.varianceContribution
  );


  return {

    nominalStack:
      nominalStack,

    maxStack:
      maxStack,

    minStack:
      minStack,

    totalTolerance:
      maxStack -
      minStack,

    rss:
      Math.sqrt(
        sumSquares
      ),

    wcContributions:
      wcContributions,

    rssContributions:
      rssContributions

  };

}


/**
 * Calculates the Worst Case result and compares
 * it with the Target component limits.
 */
function calculateWorstCase() {

  const analysis =
    loadAssemblyAnalysis();


  if (!analysis) {

    return null;

  }


  const nominalStack =
    analysis.nominalStack;

  const maxStack =
    analysis.maxStack;

  const minStack =
    analysis.minStack;

  const totalTolerance =
    analysis.totalTolerance;


  const targetData =
    loadTargetData();


  const target =
    targetData.target;

  const targetUpper =
    targetData.upper;

  const targetLower =
    targetData.lower;


  let targetMin = null;
  let targetMax = null;

  let passed = null;

  let lowerMargin = null;
  let upperMargin = null;
  let worstMargin = null;


  if (
    target !== null &&
    targetUpper !== null &&
    targetLower !== null &&
    Number.isFinite(target) &&
    Number.isFinite(targetUpper) &&
    Number.isFinite(targetLower)
  ) {

    targetMin =
      target +
      targetLower;


    targetMax =
      target +
      targetUpper;


    lowerMargin =
      minStack -
      targetMin;


    upperMargin =
      targetMax -
      maxStack;


    worstMargin =
      Math.min(
        lowerMargin,
        upperMargin
      );


    passed =
      lowerMargin >= 0 &&
      upperMargin >= 0;

  }


  return {

    nominal:
      roundTolerance(
        nominalStack
      ),

    min:
      roundTolerance(
        minStack
      ),

    max:
      roundTolerance(
        maxStack
      ),

    tolerance:
      roundTolerance(
        totalTolerance
      ),

    target:
      target !== null
        ? roundTolerance(target)
        : null,

    targetMin:
      targetMin !== null
        ? roundTolerance(targetMin)
        : null,

    targetMax:
      targetMax !== null
        ? roundTolerance(targetMax)
        : null,

    lowerMargin:
      lowerMargin !== null
        ? roundTolerance(lowerMargin)
        : null,

    upperMargin:
      upperMargin !== null
        ? roundTolerance(upperMargin)
        : null,

    worstMargin:
      worstMargin !== null
        ? roundTolerance(worstMargin)
        : null,

    passed:
      passed

  };

}


/**
 * Calculates the RSS stack range and compares
 * it with the Target component limits.
 */
function calculateRSS() {

  const analysis =
    loadAssemblyAnalysis();


  if (!analysis) {

    return null;

  }


  const nominalStack =
    analysis.nominalStack;


  const rss =
    analysis.rss;


  const rssMin =
    nominalStack -
    rss;


  const rssMax =
    nominalStack +
    rss;


  const targetData =
    loadTargetData();


  const target =
    targetData.target;

  const targetUpper =
    targetData.upper;

  const targetLower =
    targetData.lower;


  let lowerMargin = null;
  let upperMargin = null;
  let worstMargin = null;

  let passed = null;


  if (
    target !== null &&
    targetUpper !== null &&
    targetLower !== null &&
    Number.isFinite(target) &&
    Number.isFinite(targetUpper) &&
    Number.isFinite(targetLower)
  ) {

    const targetMin =
      target +
      targetLower;


    const targetMax =
      target +
      targetUpper;


    lowerMargin =
      rssMin -
      targetMin;


    upperMargin =
      targetMax -
      rssMax;


    worstMargin =
      Math.min(
        lowerMargin,
        upperMargin
      );


    passed =
      lowerMargin >= 0 &&
      upperMargin >= 0;

  }


  return {

    nominal:
      roundTolerance(
        nominalStack
      ),

    rss:
      roundTolerance(
        rss
      ),

    min:
      roundTolerance(
        rssMin
      ),

    max:
      roundTolerance(
        rssMax
      ),

    lowerMargin:
      lowerMargin !== null
        ? roundTolerance(lowerMargin)
        : null,

    upperMargin:
      upperMargin !== null
        ? roundTolerance(upperMargin)
        : null,

    worstMargin:
      worstMargin !== null
        ? roundTolerance(worstMargin)
        : null,

    passed:
      passed

  };

}


/**
 * Returns Worst Case contribution data.
 */
function calculateToleranceContributions() {

  const analysis =
    loadAssemblyAnalysis();


  if (!analysis) {

    return [];

  }


  return analysis.wcContributions;

}


/**
 * Returns RSS contribution data.
 */
function calculateRSSContributions() {

  const analysis =
    loadAssemblyAnalysis();


  if (!analysis) {

    return [];

  }


  return analysis.rssContributions;

}


/**
 * Returns all components sharing the largest
 * Worst Case contribution.
 */
function getCriticalContributors(
  contributions
) {

  if (
    !contributions ||
    contributions.length === 0
  ) {

    return [];

  }


  const maxContribution =
    contributions[0]
      .contribution;


  return contributions.filter(
    item =>
      Math.abs(
        item.contribution -
        maxContribution
      ) < 1e-9
  );

}


/**
 * Rounds calculation output without changing
 * the internal calculation precision.
 */
function roundTolerance(
  value,
  decimals = 6
) {

  const factor =
    Math.pow(
      10,
      decimals
    );


  return (
    Math.round(
      value *
      factor
    ) /
    factor
  );

}

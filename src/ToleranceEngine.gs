/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * Common tolerance calculation interface
 * and batch tolerance update functions.
 */


/**
 * Updates calculated tolerance values for all
 * target/component rows in the Assembly sheet.
 *
 * Custom tolerances are preserved because their
 * upper and lower deviations are entered manually.
 */
function updateTolerances() {

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


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow <
    CONFIG.START_ROW
  ) {

    return;

  }


  const numRows =
    lastRow -
    CONFIG.START_ROW +
    1;


  const data =
    sheet
      .getRange(
        CONFIG.START_ROW,
        CONFIG.COLUMNS.NAME,
        numRows,
        CONFIG.COLUMNS.TOLERANCE
      )
      .getValues();


  const upperValues = [];
  const lowerValues = [];
  const toleranceValues = [];


  for (
    const row of data
  ) {

    const nominal =
      row[1];

    const standard =
      String(
        row[2]
      ).trim();

    const toleranceClass =
      String(
        row[3]
      ).trim();


    // ==========================================
    // CUSTOM
    // ==========================================
    //
    // Custom tolerances use manually entered
    // upper/lower deviations and are therefore
    // not recalculated by the ISO engine.
    // ==========================================

    if (
      standard ===
      "Custom"
    ) {

      upperValues.push([
        row[4]
      ]);

      lowerValues.push([
        row[5]
      ]);

      toleranceValues.push([
        row[6]
      ]);

      continue;

    }


    // ==========================================
    // INCOMPLETE INPUT
    // ==========================================

    if (
      nominal === "" ||
      standard === "" ||
      toleranceClass === ""
    ) {

      upperValues.push([""]);
      lowerValues.push([""]);
      toleranceValues.push([""]);

      continue;

    }


    // ==========================================
    // CALCULATE
    // ==========================================

    try {

      const result =
        getTolerance(
          standard,
          Number(nominal),
          toleranceClass
        );


      upperValues.push([
        result.es
      ]);

      lowerValues.push([
        result.ei
      ]);

      toleranceValues.push([
        result.tolerance
      ]);

    } catch (error) {

      upperValues.push([""]);
      lowerValues.push([""]);
      toleranceValues.push([""]);

    }

  }


  // ==========================================
  // WRITE RESULTS
  // ==========================================
  //
  // E = Upper deviation
  // F = Lower deviation
  // G = Total tolerance
  // ==========================================

  sheet
    .getRange(
      CONFIG.START_ROW,
      CONFIG.COLUMNS.UPPER,
      numRows,
      1
    )
    .setValues(
      upperValues
    );


  sheet
    .getRange(
      CONFIG.START_ROW,
      CONFIG.COLUMNS.LOWER,
      numRows,
      1
    )
    .setValues(
      lowerValues
    );


  sheet
    .getRange(
      CONFIG.START_ROW,
      CONFIG.COLUMNS.TOLERANCE,
      numRows,
      1
    )
    .setValues(
      toleranceValues
    );

}


/**
 * Common tolerance interface used by the analyzer.
 *
 * Routes the requested standard to the appropriate
 * tolerance engine.
 *
 * Returned values use millimetres:
 *
 * {
 *   ei: lower deviation,
 *   es: upper deviation,
 *   tolerance: total tolerance width
 * }
 *
 * Custom tolerances are handled directly from user
 * input and do not use this calculation path.
 */
function getTolerance(
  standard,
  size,
  toleranceClass
) {

  switch (
    standard
  ) {

    case "ISO 2768": {

      const tolerance =
        getISO2768Tolerance(
          size,
          toleranceClass
        );


      return {

        ei:
          -tolerance,

        es:
          tolerance,

        tolerance:
          tolerance * 2

      };

    }


    case "ISO 13920": {

      const tolerance =
        getISO13920Tolerance(
          size,
          toleranceClass
        );


      return {

        ei:
          -tolerance,

        es:
          tolerance,

        tolerance:
          tolerance * 2

      };

    }


    case "ISO 286":

      return getISO286Tolerance(
        size,
        toleranceClass
      );


    case "Custom":

      return null;


    default:

      throw new Error(
        "Unsupported tolerance standard: " +
        standard
      );

  }

}

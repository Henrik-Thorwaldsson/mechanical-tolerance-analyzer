/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * Spreadsheet input helpers.
 *
 * Handles:
 *
 * - Default stack direction
 * - Default tolerance classes
 * - Class dropdowns
 * - Custom tolerance validation
 * - Row-level tolerance updates
 */


// ==========================================
// DEFAULT TOLERANCE CLASS CACHE
// ==========================================

let defaultToleranceClassesCache =
  null;


/**
 * Adds the default stack direction "+"
 * to complete component rows.
 *
 * Target row is intentionally ignored.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} row
 * @param {Array} rowData A:H row data
 */
function setDefaultDirection(
  sheet,
  row,
  rowData
) {

  // Only component rows.
  if (
    row < CONFIG.STACK_START_ROW ||
    row >=
      CONFIG.STACK_START_ROW +
      CONFIG.MAX_COMPONENT_ROWS
  ) {

    return;

  }


  const name =
    String(
      rowData[0]
    ).trim();


  const nominal =
    rowData[1];


  const standard =
    String(
      rowData[2]
    ).trim();


  const currentDirection =
    String(
      rowData[7]
    ).trim();


  // ==========================================
  // EMPTY ROW
  // ==========================================

  if (
    name === "" &&
    nominal === "" &&
    standard === ""
  ) {

    if (
      currentDirection !== ""
    ) {

      sheet
        .getRange(
          row,
          CONFIG.COLUMNS.DIRECTION
        )
        .clearContent();


      rowData[7] =
        "";

    }


    return;

  }


  // ==========================================
  // INCOMPLETE ROW
  // ==========================================

  if (
    name === "" ||
    nominal === "" ||
    standard === ""
  ) {

    return;

  }


  // Keep an existing user selection.
  if (
    currentDirection !== ""
  ) {

    return;

  }


  // ==========================================
  // DEFAULT DIRECTION
  // ==========================================

  sheet
    .getRange(
      row,
      CONFIG.COLUMNS.DIRECTION
    )
    .setValue("+");


  // Keep cached row data synchronized.
  rowData[7] =
    "+";

}


/**
 * Adds the configured default tolerance class
 * when a nominal dimension is entered.
 *
 * ISO 286 intentionally has no default class.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} row
 * @param {Array} rowData
 */
function ensureDefaultClass(
  sheet,
  row,
  rowData
) {

  const standard =
    String(
      rowData[2]
    ).trim();


  const currentClass =
    String(
      rowData[3]
    ).trim();


  // Preserve an existing class.
  if (
    currentClass !== ""
  ) {

    return;

  }


  // Only ISO 2768 and ISO 13920
  // have configurable defaults.
  if (
    standard !== "ISO 2768" &&
    standard !== "ISO 13920"
  ) {

    return;

  }


  const defaults =
    getDefaultToleranceClasses();


  const defaultClass =
    standard === "ISO 2768"
      ? defaults.iso2768
      : defaults.iso13920;


  sheet
    .getRange(
      row,
      CONFIG.COLUMNS.CLASS
    )
    .setValue(
      defaultClass
    );


  // updateTolerance() uses this same
  // in-memory row later in the edit cycle.
  rowData[3] =
    defaultClass;

}


/**
 * Returns the configured default classes.
 *
 * Priority:
 *
 * 1. In-memory cache
 * 2. Document Cache
 * 3. Settings sheet
 * 4. Built-in fallback values
 *
 * Fallback:
 *
 * ISO 2768 -> m
 * ISO 13920 -> B
 *
 * @return {{iso2768:string, iso13920:string}}
 */
function getDefaultToleranceClasses() {

  // ==========================================
  // 1. MEMORY CACHE
  // ==========================================

  if (
    defaultToleranceClassesCache !==
    null
  ) {

    return defaultToleranceClassesCache;

  }


  // ==========================================
  // 2. FALLBACK VALUES
  // ==========================================

  let iso2768 =
    "m";


  let iso13920 =
    "B";


  // ==========================================
  // 3. DOCUMENT CACHE
  // ==========================================

  const cache =
    CacheService
      .getDocumentCache();


  const cacheKey =
    "DEFAULT_TOLERANCE_CLASSES_V1";


  if (cache) {

    const cached =
      cache.get(
        cacheKey
      );


    if (cached) {

      try {

        const parsed =
          JSON.parse(
            cached
          );


        defaultToleranceClassesCache = {

          iso2768:
            parsed.iso2768 ||
            "m",

          iso13920:
            parsed.iso13920 ||
            "B"

        };


        return defaultToleranceClassesCache;

      } catch (error) {

        // Invalid cache data:
        // continue to Settings sheet.

      }

    }

  }


  // ==========================================
  // 4. SETTINGS SHEET
  // ==========================================

  const settingsSheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEETS.SETTINGS
      );


  if (settingsSheet) {

    const values =
      settingsSheet
        .getRange(
          "B2:B3"
        )
        .getValues();


    const value2768 =
      String(
        values[0][0]
      )
        .trim()
        .toLowerCase();


    const value13920 =
      String(
        values[1][0]
      )
        .trim()
        .toUpperCase();


    if (
      ["f", "m", "c", "v"]
        .includes(
          value2768
        )
    ) {

      iso2768 =
        value2768;

    }


    if (
      ["A", "B", "C", "D"]
        .includes(
          value13920
        )
    ) {

      iso13920 =
        value13920;

    }

  }


  // ==========================================
  // 5. BUILD RESULT
  // ==========================================

  defaultToleranceClassesCache = {

    iso2768:
      iso2768,

    iso13920:
      iso13920

  };


  // ==========================================
  // 6. SAVE DOCUMENT CACHE
  // ==========================================

  if (cache) {

    cache.put(
      cacheKey,
      JSON.stringify(
        defaultToleranceClassesCache
      ),
      21600
    );

  }


  return defaultToleranceClassesCache;

}


/**
 * Updates the Class dropdown when the selected
 * tolerance standard changes.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} row
 * @param {Array} rowData
 * @param {string=} oldStandard
 */
function updateClassDropdown(
  sheet,
  row,
  rowData,
  oldStandard
) {

  const standard =
    String(
      rowData[2]
    ).trim();


  const previousStandard =
    String(
      oldStandard || ""
    ).trim();


  const classCell =
    sheet.getRange(
      row,
      CONFIG.COLUMNS.CLASS
    );


  const toleranceCell =
    sheet.getRange(
      row,
      CONFIG.COLUMNS.TOLERANCE
    );


  // ==========================================
  // RESET CACHED D:G
  // ==========================================

  rowData[3] = "";
  rowData[4] = "";
  rowData[5] = "";
  rowData[6] = "";


  // ==========================================
  // CUSTOM
  // ==========================================

  if (
    standard === "Custom"
  ) {

    // Custom has no tolerance class.
    // Clear D:G.
    sheet
      .getRange(
        row,
        CONFIG.COLUMNS.CLASS,
        1,
        4
      )
      .clearContent();


    classCell
      .clearDataValidations();


    setupCustomToleranceValidation(
      toleranceCell
    );


    return;

  }


  // ==========================================
  // LEAVING CUSTOM
  // ==========================================

  if (
    previousStandard ===
    "Custom"
  ) {

    toleranceCell
      .clearDataValidations();

  }


  // ==========================================
  // TARGET COMPONENT
  // ==========================================

  if (
    row ===
    CONFIG.TARGET_ROW
  ) {

    updateTargetClassList(
      standard
    );


    // ISO 286 intentionally starts
    // without a selected class.
    if (
      standard ===
      "ISO 286"
    ) {

      sheet
        .getRange(
          row,
          CONFIG.COLUMNS.CLASS,
          1,
          4
        )
        .clearContent();


      rowData[3] = "";
      rowData[4] = "";
      rowData[5] = "";
      rowData[6] = "";


      return;

    }


    // Apply configurable default class.
    if (
      standard === "ISO 2768" ||
      standard === "ISO 13920"
    ) {

      const defaults =
        getDefaultToleranceClasses();


      rowData[3] =
        standard === "ISO 2768"
          ? defaults.iso2768
          : defaults.iso13920;

    }


    return;

  }


  // ==========================================
  // NORMAL COMPONENT ROW
  // ==========================================

  let classes;


  switch (
    standard
  ) {

    case "ISO 2768":

      classes = [
        "f",
        "m",
        "c",
        "v"
      ];

      break;


    case "ISO 13920":

      classes = [
        "A",
        "B",
        "C",
        "D"
      ];

      break;


    case "ISO 286":

      classes =
        getISO286Classes();

      break;


    default:

      classCell
        .clearDataValidations();

      return;

  }


  // ==========================================
  // CLASS VALIDATION
  // ==========================================

  const rule =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        classes,
        true
      )
      .setAllowInvalid(
        true
      )
      .build();


  classCell
    .setDataValidation(
      rule
    );


  // ==========================================
  // ISO 286 - NO DEFAULT CLASS
  // ==========================================

  if (
    standard ===
    "ISO 286"
  ) {

    sheet
      .getRange(
        row,
        CONFIG.COLUMNS.CLASS,
        1,
        4
      )
      .clearContent();


    rowData[3] = "";
    rowData[4] = "";
    rowData[5] = "";
    rowData[6] = "";


    return;

  }


  // ==========================================
  // DEFAULT CLASS
  // ==========================================

  if (
    standard === "ISO 2768" ||
    standard === "ISO 13920"
  ) {

    const defaults =
      getDefaultToleranceClasses();


    rowData[3] =
      standard === "ISO 2768"
        ? defaults.iso2768
        : defaults.iso13920;

  }

}


/**
 * Applies numeric validation to the Custom
 * tolerance column.
 *
 * @param {GoogleAppsScript.Spreadsheet.Range} cell
 */
function setupCustomToleranceValidation(
  cell
) {

  const rule =
    SpreadsheetApp
      .newDataValidation()
      .requireNumberGreaterThan(
        0
      )
      .setAllowInvalid(
        false
      )
      .build();


  cell.setDataValidation(
    rule
  );

}


/**
 * Updates E:G for one Assembly row.
 *
 * For Custom tolerances:
 *
 * E = upper deviation
 * F = lower deviation
 * G = |E - F|
 *
 * For ISO standards the values are calculated
 * through the tolerance engine.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} row
 * @param {Array} rowData
 * @param {boolean=} writeClass
 */
function updateTolerance(
  sheet,
  row,
  rowData,
  writeClass
) {

  const nominal =
    rowData[1];


  const standard =
    String(
      rowData[2]
    ).trim();


  const toleranceClass =
    String(
      rowData[3]
    ).trim();


  // ==========================================
  // CUSTOM
  // ==========================================

  if (
    standard ===
    "Custom"
  ) {

    const rawUpper =
      rowData[4];


    const rawLower =
      rowData[5];


    // Wait until both E and F exist.
    if (
      rawUpper === "" ||
      rawLower === ""
    ) {

      if (
        rowData[6] !== ""
      ) {

        sheet
          .getRange(
            row,
            CONFIG.COLUMNS.TOLERANCE
          )
          .clearContent();


        rowData[6] =
          "";

      }


      return;

    }


    // Accept:
    //
    // 0.10
    // 0,10
    // -0.10
    // −0.10

    const upper =
      typeof rawUpper ===
      "number"

        ? rawUpper

        : Number(
            String(
              rawUpper
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


    const lower =
      typeof rawLower ===
      "number"

        ? rawLower

        : Number(
            String(
              rawLower
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
        upper
      ) ||
      !Number.isFinite(
        lower
      )
    ) {

      return;

    }


    const tolerance =
      Math.abs(
        upper -
        lower
      );


    if (
      rowData[6] === "" ||
      Number(
        rowData[6]
      ) !==
        tolerance
    ) {

      sheet
        .getRange(
          row,
          CONFIG.COLUMNS.TOLERANCE
        )
        .setValue(
          tolerance
        );

    }


    rowData[6] =
      tolerance;


    return;

  }


  // ==========================================
  // NORMAL ISO TOLERANCE
  // ==========================================

  const toleranceRange =
    sheet.getRange(
      row,
      CONFIG.COLUMNS.UPPER,
      1,
      3
    );


  // Wait for B + C + D.
  if (
    nominal === "" ||
    standard === "" ||
    toleranceClass === ""
  ) {

    if (
      rowData[4] !== "" ||
      rowData[5] !== "" ||
      rowData[6] !== ""
    ) {

      toleranceRange
        .clearContent();

    }


    rowData[4] = "";
    rowData[5] = "";
    rowData[6] = "";


    return;

  }


  // ==========================================
  // VALIDATE NOMINAL
  // ==========================================

  const nominalNumber =
    Number(
      nominal
    );


  if (
    !Number.isFinite(
      nominalNumber
    )
  ) {

    toleranceRange
      .clearContent();


    rowData[4] = "";
    rowData[5] = "";
    rowData[6] = "";


    return;

  }


  // ==========================================
  // CALCULATE TOLERANCE
  // ==========================================

  try {

    const result =
      getTolerance(
        standard,
        nominalNumber,
        toleranceClass
      );


    // When the standard changes, D:G can be
    // written in one spreadsheet operation.
    if (
      writeClass ===
      true
    ) {

      sheet
        .getRange(
          row,
          CONFIG.COLUMNS.CLASS,
          1,
          4
        )
        .setValues([[
          toleranceClass,
          result.es,
          result.ei,
          result.tolerance
        ]]);


    } else {

      // Otherwise only E:G need updating.
      toleranceRange
        .setValues([[
          result.es,
          result.ei,
          result.tolerance
        ]]);

    }


    // Keep cached row data synchronized.
    rowData[3] =
      toleranceClass;

    rowData[4] =
      result.es;

    rowData[5] =
      result.ei;

    rowData[6] =
      result.tolerance;


  } catch (error) {

    toleranceRange
      .clearContent();


    rowData[4] = "";
    rowData[5] = "";
    rowData[6] = "";


    SpreadsheetApp
      .getActive()
      .toast(
        error.message,
        "Tolerance Analyzer",
        5
      );

  }

}

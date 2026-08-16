/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * ISO 13920 tolerance lookup engine.
 *
 * IMPORTANT:
 * Copyrighted ISO reference values are intentionally
 * not distributed with this repository.
 *
 * To use ISO 13920 calculations, the spreadsheet must
 * contain an appropriately licensed reference table
 * stored in a named range called:
 *
 *   tblISO13920
 *
 * Expected table structure:
 *
 *   Column A = Maximum nominal size
 *   Column B = Class A
 *   Column C = Class B
 *   Column D = Class C
 *   Column E = Class D
 *
 * The first row must contain headers and is ignored
 * by the calculation engine.
 */


let iso13920Table =
  null;


/**
 * Loads the ISO 13920 reference table.
 *
 * Lookup priority:
 *
 * 1. In-memory cache for the current Apps Script execution.
 * 2. Document Cache shared between executions.
 * 3. Named range "tblISO13920" in the spreadsheet.
 *
 * Reference data itself is not included in this repository.
 */
function loadISO13920Table() {

  // ==========================================
  // 1. MEMORY CACHE
  // ==========================================

  if (
    iso13920Table !== null
  ) {

    return;

  }


  // ==========================================
  // 2. DOCUMENT CACHE
  // ==========================================

  const cache =
    CacheService
      .getDocumentCache();


  const cacheKey =
    "ISO13920_TABLE_V1";


  if (cache) {

    const cached =
      cache.get(
        cacheKey
      );


    if (cached) {

      iso13920Table =
        JSON.parse(
          cached
        );


      return;

    }

  }


  // ==========================================
  // 3. LICENSED USER DATA
  // ==========================================

  const range =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getRangeByName(
        "tblISO13920"
      );


  if (!range) {

    throw new Error(
      "Named range 'tblISO13920' was not found. " +
      "Provide an appropriately licensed ISO 13920 " +
      "reference table and assign this range name."
    );

  }


  // First row contains headers.
  iso13920Table =
    range
      .getValues()
      .slice(1);


  // ==========================================
  // 4. SAVE TO DOCUMENT CACHE
  // ==========================================

  if (cache) {

    cache.put(
      cacheKey,
      JSON.stringify(
        iso13920Table
      ),
      21600
    );

  }

}


/**
 * Returns the symmetric ISO 13920 deviation
 * for a nominal size and tolerance class.
 *
 * Example return value:
 *
 *   1.0
 *
 * The common tolerance engine converts this into:
 *
 *   es = +1.0
 *   ei = -1.0
 *   total tolerance = 2.0
 *
 * @param {number} size Nominal dimension in mm.
 * @param {string} toleranceClass ISO 13920 class: A, B, C or D.
 * @return {number} Symmetric deviation in mm.
 */
function getISO13920Tolerance(
  size,
  toleranceClass
) {

  loadISO13920Table();


  const classes = {

    A: 1,
    B: 2,
    C: 3,
    D: 4

  };


  const className =
    String(
      toleranceClass
    )
      .trim()
      .toUpperCase();


  const column =
    classes[
      className
    ];


  if (
    column ===
    undefined
  ) {

    throw new Error(
      "Invalid ISO 13920 tolerance class: " +
      toleranceClass
    );

  }


  const numericSize =
    Number(
      size
    );


  if (
    !Number.isFinite(
      numericSize
    ) ||
    numericSize <= 0
  ) {

    throw new Error(
      "Nominal dimension must be greater than 0 mm."
    );

  }


  // ==========================================
  // FIND SIZE RANGE
  // ==========================================

  for (
    const row of iso13920Table
  ) {

    const maxSize =
      Number(
        row[0]
      );


    if (
      numericSize <=
      maxSize
    ) {

      const tolerance =
        row[
          column
        ];


      if (
        tolerance === "" ||
        tolerance === null
      ) {

        throw new Error(
          "ISO 13920 class " +
          className +
          " is not defined for " +
          numericSize +
          " mm in the supplied reference data."
        );

      }


      const numericTolerance =
        Number(
          tolerance
        );


      if (
        !Number.isFinite(
          numericTolerance
        )
      ) {

        throw new Error(
          "Invalid tolerance value in tblISO13920."
        );

      }


      return numericTolerance;

    }

  }


  throw new Error(
    "Nominal dimension is outside the supported " +
    "ISO 13920 reference table range."
  );

}

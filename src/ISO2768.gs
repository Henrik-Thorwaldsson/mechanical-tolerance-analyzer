/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * ISO 2768 tolerance lookup engine.
 *
 * IMPORTANT:
 * Copyrighted ISO reference values are intentionally
 * not distributed with this repository.
 *
 * To use ISO 2768 calculations, the spreadsheet must
 * contain an appropriately licensed reference table
 * stored in a named range called:
 *
 *   tblISO2768
 *
 * Expected table structure:
 *
 *   Column A = Maximum nominal size
 *   Column B = Class f
 *   Column C = Class m
 *   Column D = Class c
 *   Column E = Class v
 *
 * The first row must contain headers and is ignored
 * by the calculation engine.
 */


let iso2768Table =
  null;


/**
 * Loads the ISO 2768 reference table.
 *
 * Lookup priority:
 *
 * 1. In-memory cache for the current Apps Script execution.
 * 2. Document Cache shared between executions.
 * 3. Named range "tblISO2768" in the spreadsheet.
 *
 * Reference data itself is not included in this repository.
 */
function loadISO2768Table() {

  // ==========================================
  // 1. MEMORY CACHE
  // ==========================================

  if (
    iso2768Table !== null
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
    "ISO2768_TABLE_V1";


  if (cache) {

    const cached =
      cache.get(
        cacheKey
      );


    if (cached) {

      iso2768Table =
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
        "tblISO2768"
      );


  if (!range) {

    throw new Error(
      "Named range 'tblISO2768' was not found. " +
      "Provide an appropriately licensed ISO 2768 " +
      "reference table and assign this range name."
    );

  }


  // First row contains headers.
  iso2768Table =
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
        iso2768Table
      ),
      21600
    );

  }

}


/**
 * Returns the symmetric ISO 2768 deviation
 * for a nominal size and tolerance class.
 *
 * Example return value:
 *
 *   0.2
 *
 * The common tolerance engine converts this into:
 *
 *   es = +0.2
 *   ei = -0.2
 *   total tolerance = 0.4
 *
 * @param {number} size Nominal dimension in mm.
 * @param {string} toleranceClass ISO 2768 class: f, m, c or v.
 * @return {number} Symmetric deviation in mm.
 */
function getISO2768Tolerance(
  size,
  toleranceClass
) {

  loadISO2768Table();


  const classes = {

    f: 1,
    m: 2,
    c: 3,
    v: 4

  };


  const className =
    String(
      toleranceClass
    )
      .trim()
      .toLowerCase();


  const column =
    classes[
      className
    ];


  if (
    column ===
    undefined
  ) {

    throw new Error(
      "Invalid ISO 2768 tolerance class: " +
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
    )
  ) {

    throw new Error(
      "Invalid nominal dimension."
    );

  }


  if (
    numericSize < 0.5 ||
    numericSize > 4000
  ) {

    throw new Error(
      "Nominal dimension is outside the supported ISO 2768 table range."
    );

  }


  // ==========================================
  // FIND SIZE RANGE
  // ==========================================

  for (
    const row of iso2768Table
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
          "ISO 2768 class " +
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
          "Invalid tolerance value in tblISO2768."
        );

      }


      return numericTolerance;

    }

  }


  throw new Error(
    "No ISO 2768 tolerance was found for " +
    numericSize +
    " mm."
  );

}

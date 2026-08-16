/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * ISO 286 tolerance calculation engine.
 *
 * IMPORTANT:
 * Copyrighted ISO reference values are intentionally
 * not distributed with this repository.
 *
 * To use ISO 286 calculations, the spreadsheet must
 * contain appropriately licensed reference data in
 * the following named ranges:
 *
 *   tblISO286_IT
 *   tblISO286_DEV
 *
 *
 * tblISO286_IT
 * ------------------------------
 *
 * Expected structure:
 *
 *   Column A = Minimum nominal size
 *   Column B = Maximum nominal size
 *   Remaining columns = IT grades
 *
 * Example headers:
 *
 *   Min | Max | IT5 | IT6 | IT7 | ...
 *
 * The first row contains headers.
 *
 *
 * tblISO286_DEV
 * ------------------------------
 *
 * Expected structure:
 *
 *   Column A = Minimum nominal size
 *   Column B = Maximum nominal size
 *   Column C = Tolerance-zone letter
 *   Column D = Optional IT grade
 *   Column E = Fundamental deviation type
 *              ("EI" or "ES")
 *   Column F = Fundamental deviation value
 *
 * The first row contains headers.
 *
 *
 * Internal reference values are expected in µm.
 * Public tolerance results are returned in mm.
 */


let iso286ITTable =
  null;

let iso286DeviationTable =
  null;


/**
 * Loads the two ISO 286 reference tables.
 *
 * Reference data is intentionally supplied externally
 * by the user and is not distributed with this repository.
 */
function loadISO286Tables() {

  if (
    iso286ITTable !== null &&
    iso286DeviationTable !== null
  ) {

    return;

  }


  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const itRange =
    ss.getRangeByName(
      "tblISO286_IT"
    );


  const deviationRange =
    ss.getRangeByName(
      "tblISO286_DEV"
    );


  if (!itRange) {

    throw new Error(
      "Named range 'tblISO286_IT' was not found. " +
      "Provide an appropriately licensed ISO 286 IT " +
      "reference table and assign this range name."
    );

  }


  if (!deviationRange) {

    throw new Error(
      "Named range 'tblISO286_DEV' was not found. " +
      "Provide an appropriately licensed ISO 286 " +
      "fundamental-deviation table and assign this range name."
    );

  }


  // Keep the header row because IT column names
  // such as IT6 / IT7 are read dynamically.
  iso286ITTable =
    itRange.getValues();


  // Deviation-table header is not required
  // by the calculation engine.
  iso286DeviationTable =
    deviationRange
      .getValues()
      .slice(1);

}


/**
 * Returns all tolerance classes available from
 * the supplied ISO 286 reference data.
 *
 * Used to build the class dropdown in the
 * Assembly sheet.
 *
 * @return {string[]} Array such as ["H7", "g6", ...].
 */
function getISO286Classes() {

  loadISO286Tables();


  const letters =
    new Set();


  for (
    const row of
      iso286DeviationTable
  ) {

    const letter =
      String(
        row[2]
      ).trim();


    if (
      letter !== ""
    ) {

      letters.add(
        letter
      );

    }

  }


  // Read available IT grades once.
  const allITGrades =
    getISO286ITGrades();


  const classes = [];


  for (
    const letter of letters
  ) {

    // Some deviation entries may be explicitly
    // restricted to specific IT grades.
    const grades =
      iso286DeviationTable

        .filter(
          row =>
            String(
              row[2]
            ).trim() ===
              letter &&
            row[3] !== ""
        )

        .map(
          row =>
            Number(
              row[3]
            )
        )

        .filter(
          value =>
            Number.isFinite(
              value
            )
        );


    if (
      grades.length > 0
    ) {

      [
        ...new Set(
          grades
        )
      ]

        .sort(
          (a, b) =>
            a - b
        )

        .forEach(
          grade => {

            classes.push(
              letter +
              grade
            );

          }
        );

    } else {

      // If the deviation is not tied to a
      // specific IT grade, expose all IT grades
      // available in tblISO286_IT.
      for (
        const grade of
          allITGrades
      ) {

        classes.push(
          letter +
          grade
        );

      }

    }

  }


  return classes;

}


/**
 * Reads available IT grades from the header row
 * of tblISO286_IT.
 *
 * Expected header format:
 *
 *   IT5, IT6, IT7, ...
 *
 * @return {number[]} Sorted IT grades.
 */
function getISO286ITGrades() {

  loadISO286Tables();


  const headers =
    iso286ITTable[0];


  const grades = [];


  for (
    const headerValue of
      headers
  ) {

    const header =
      String(
        headerValue
      ).trim();


    const match =
      header.match(
        /^IT(\d+)$/i
      );


    if (match) {

      grades.push(
        Number(
          match[1]
        )
      );

    }

  }


  return grades.sort(
    (a, b) =>
      a - b
  );

}


/**
 * Calculates ISO 286 upper and lower deviations
 * for a selected tolerance class.
 *
 * The tolerance width is obtained from the IT table.
 * The tolerance-zone position is obtained from the
 * fundamental-deviation table.
 *
 * Internal ISO reference values are treated as µm.
 * Returned results are converted to mm.
 *
 * @param {number} size Nominal size in mm.
 * @param {string} toleranceClass Class such as H7 or g6.
 *
 * @return {{
 *   ei: number,
 *   es: number,
 *   tolerance: number
 * }}
 */
function getISO286Tolerance(
  size,
  toleranceClass
) {

  if (
    !size ||
    !toleranceClass
  ) {

    throw new Error(
      "Nominal size and tolerance class must be provided."
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
      "Invalid nominal size."
    );

  }


  // Split class into:
  //
  //   H7 -> H + 7
  //   g6 -> g + 6
  //
  const match =
    String(
      toleranceClass
    )
      .trim()
      .match(
        /^([A-Za-z]+)(\d+)$/
      );


  if (!match) {

    throw new Error(
      "Invalid ISO 286 tolerance class: " +
      toleranceClass
    );

  }


  const letter =
    match[1];


  const itGrade =
    Number(
      match[2]
    );


  // ==========================================
  // IT WIDTH
  // ==========================================
  //
  // Returned from reference table in µm.
  // ==========================================

  const itValue =
    Number(
      getISO286IT(
        numericSize,
        itGrade
      )
    );


  if (
    !Number.isFinite(
      itValue
    )
  ) {

    throw new Error(
      "Invalid IT" +
      itGrade +
      " value for " +
      numericSize +
      " mm."
    );

  }


  // ==========================================
  // FUNDAMENTAL DEVIATION
  // ==========================================

  const deviation =
    getISO286Deviation(
      numericSize,
      letter,
      itGrade
    );


  const deviationValue =
    deviation.value;


  const deviationType =
    deviation.type;


  let ei;
  let es;


  // ==========================================
  // EI-BASED ZONE
  // ==========================================
  //
  // EI = fundamental deviation
  // ES = EI + IT width
  // ==========================================

  if (
    deviationType ===
    "EI"
  ) {

    ei =
      deviationValue;

    es =
      deviationValue +
      itValue;

  }


  // ==========================================
  // ES-BASED ZONE
  // ==========================================
  //
  // ES = fundamental deviation
  // EI = ES - IT width
  // ==========================================

  else if (
    deviationType ===
    "ES"
  ) {

    es =
      deviationValue;

    ei =
      deviationValue -
      itValue;

  }


  else {

    throw new Error(
      "Unknown fundamental deviation type: " +
      deviationType
    );

  }


  // Convert µm -> mm.
  return {

    ei:
      ei / 1000,

    es:
      es / 1000,

    tolerance:
      itValue / 1000

  };

}


/**
 * Returns the IT tolerance width for a nominal
 * size and IT grade.
 *
 * The value returned from the supplied reference
 * table is expected to be in µm.
 */
function getISO286IT(
  size,
  itGrade
) {

  loadISO286Tables();


  const headers =
    iso286ITTable[0];


  const columnName =
    "IT" +
    itGrade;


  let column =
    -1;


  // Find IT column dynamically from header.
  for (
    let i = 0;
    i < headers.length;
    i++
  ) {

    if (
      String(
        headers[i]
      )
        .trim()
        .toUpperCase() ===
      columnName
        .toUpperCase()
    ) {

      column =
        i;

      break;

    }

  }


  if (
    column === -1
  ) {

    throw new Error(
      columnName +
      " was not found in tblISO286_IT."
    );

  }


  // Row 0 contains headers.
  for (
    let i = 1;
    i < iso286ITTable.length;
    i++
  ) {

    const row =
      iso286ITTable[i];


    const minSize =
      Number(
        row[0]
      );


    const maxSize =
      Number(
        row[1]
      );


    if (
      size > minSize &&
      size <= maxSize
    ) {

      return row[
        column
      ];

    }

  }


  throw new Error(
    "No IT" +
    itGrade +
    " value was found for " +
    size +
    " mm."
  );

}


/**
 * Returns the fundamental deviation for a
 * tolerance-zone letter and nominal size.
 *
 * Rows may optionally specify an IT grade.
 * Empty IT-grade cells apply to all grades.
 *
 * Returned value is expected to be in µm.
 *
 * @return {{
 *   value: number,
 *   type: string
 * }}
 */
function getISO286Deviation(
  size,
  letter,
  itGrade
) {

  loadISO286Tables();


  for (
    const row of
      iso286DeviationTable
  ) {

    const minSize =
      Number(
        row[0]
      );


    const maxSize =
      Number(
        row[1]
      );


    const tableLetter =
      String(
        row[2]
      ).trim();


    const tableIT =
      row[3];


    const deviationType =
      String(
        row[4]
      )
        .trim()
        .toUpperCase();


    const deviationValue =
      Number(
        row[5]
      );


    // ========================================
    // DIAMETER RANGE
    // ========================================

    if (
      !(
        size > minSize &&
        size <= maxSize
      )
    ) {

      continue;

    }


    // ========================================
    // TOLERANCE-ZONE LETTER
    // ========================================

    if (
      tableLetter !==
      letter
    ) {

      continue;

    }


    // ========================================
    // OPTIONAL IT-SPECIFIC ENTRY
    // ========================================

    if (
      tableIT !== "" &&
      Number(
        tableIT
      ) !==
        itGrade
    ) {

      continue;

    }


    if (
      !Number.isFinite(
        deviationValue
      )
    ) {

      throw new Error(
        "Invalid deviation value in tblISO286_DEV."
      );

    }


    if (
      deviationType !== "EI" &&
      deviationType !== "ES"
    ) {

      throw new Error(
        "Invalid deviation type in tblISO286_DEV."
      );

    }


    return {

      value:
        deviationValue,

      type:
        deviationType

    };

  }


  throw new Error(
    "No fundamental deviation was found for " +
    size +
    " mm " +
    letter +
    itGrade +
    "."
  );

}

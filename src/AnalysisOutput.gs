/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * Spreadsheet output and formatting for:
 *
 * - Worst Case analysis
 * - RSS analysis
 * - Component contribution analysis
 *
 * Calculation logic is handled by Analysis.gs.
 */


/**
 * Writes Worst Case and RSS results to the
 * Assembly sheet.
 *
 * Output area:
 *
 *   M:Q
 *
 * Worst Case:
 *   M:N
 *
 * RSS:
 *   P:Q
 */
function writeWorstCaseResult(
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


  let result;
  let rssResult;


  // ==========================================
  // CALCULATE
  // ==========================================

  try {

    result =
      calculateWorstCase();


    rssResult =
      calculateRSS();

  } catch (error) {

    // ========================================
    // INCOMPLETE COMPONENT INPUT
    // ========================================
    //
    // This specific error is intentionally
    // presented to the user instead of being
    // propagated as a script error.
    // ========================================

    if (
      error.message !==
      "Component name is missing."
    ) {

      throw error;

    }


    const output = [

      [
        "TOLERANCE ANALYSIS",
        "",
        "",
        "RSS ANALYSIS",
        ""
      ],

      [
        "Nominal stack dimension",
        null,
        "",
        "Nominal stack dimension",
        null
      ],

      [
        "Minimum stack dimension",
        null,
        "",
        "RSS ±",
        null
      ],

      [
        "Maximum stack dimension",
        null,
        "",
        "RSS minimum",
        null
      ],

      [
        "Total tolerance",
        null,
        "",
        "RSS maximum",
        null
      ],

      [
        "",
        "",
        "",
        "",
        ""
      ],

      [
        "Lower margin",
        null,
        "",
        "Lower margin",
        null
      ],

      [
        "Upper margin",
        null,
        "",
        "Upper margin",
        null
      ],

      [
        "Critical margin",
        null,
        "",
        "Critical margin",
        null
      ],

      [
        "",
        "",
        "",
        "",
        ""
      ],

      [
        "RESULT",
        "INCOMPLETE INPUT",
        "",
        "RESULT",
        "INCOMPLETE INPUT"
      ]

    ];


    sheet
      .getRange(
        2,
        13, // M
        output.length,
        5
      )
      .setValues(
        output
      );


    sheet
      .getRange("N12")
      .setBackground(
        "#fff2cc"
      )
      .setFontColor(
        "#7f6000"
      )
      .setFontWeight(
        "bold"
      );


    sheet
      .getRange("Q12")
      .setBackground(
        "#fff2cc"
      )
      .setFontColor(
        "#7f6000"
      )
      .setFontWeight(
        "bold"
      );


    // Remove any old margin highlighting.
    sheet
      .getRange("N10")
      .setBackground(null)
      .setFontColor(null);


    sheet
      .getRange("Q10")
      .setBackground(null)
      .setFontColor(null);


    return;

  }


  // ==========================================
  // NO VALID COMPONENTS
  // ==========================================

  if (!result) {

    const emptyOutput = [

      [
        "TOLERANCE ANALYSIS",
        "",
        "",
        "RSS ANALYSIS",
        ""
      ],

      [
        "Nominal stack dimension",
        null,
        "",
        "Nominal stack dimension",
        null
      ],

      [
        "Minimum stack dimension",
        null,
        "",
        "RSS ±",
        null
      ],

      [
        "Maximum stack dimension",
        null,
        "",
        "RSS minimum",
        null
      ],

      [
        "Total tolerance",
        null,
        "",
        "RSS maximum",
        null
      ],

      [
        "",
        "",
        "",
        "",
        ""
      ],

      [
        "Lower margin",
        null,
        "",
        "Lower margin",
        null
      ],

      [
        "Upper margin",
        null,
        "",
        "Upper margin",
        null
      ],

      [
        "Critical margin",
        null,
        "",
        "Critical margin",
        null
      ],

      [
        "",
        "",
        "",
        "",
        ""
      ],

      [
        "RESULT",
        "",
        "",
        "RESULT",
        ""
      ]

    ];


    sheet
      .getRange(
        2,
        13,
        emptyOutput.length,
        5
      )
      .setValues(
        emptyOutput
      );


    return;

  }


  // ==========================================
  // STATUS
  // ==========================================

  const worstCaseStatus =
    result.passed === true

      ? "PASS"

      : result.passed === false

        ? "FAIL"

        : "N/A";


  const rssStatus =
    !rssResult

      ? "N/A"

      : rssResult.passed === true

        ? "PASS"

        : rssResult.passed === false

          ? "FAIL"

          : "N/A";


  // ==========================================
  // OUTPUT M:Q
  // ==========================================

  const output = [

    [
      "TOLERANCE ANALYSIS",
      "",
      "",
      "RSS ANALYSIS",
      ""
    ],

    [
      "Nominal stack dimension",
      result.nominal,
      "",
      "Nominal stack dimension",
      rssResult
        ? rssResult.nominal
        : null
    ],

    [
      "Minimum stack dimension",
      result.min,
      "",
      "RSS ±",
      rssResult
        ? rssResult.rss
        : null
    ],

    [
      "Maximum stack dimension",
      result.max,
      "",
      "RSS minimum",
      rssResult
        ? rssResult.min
        : null
    ],

    [
      "Total tolerance",
      result.tolerance,
      "",
      "RSS maximum",
      rssResult
        ? rssResult.max
        : null
    ],

    [
      "",
      "",
      "",
      "",
      ""
    ],

    [
      "Lower margin",
      result.lowerMargin,
      "",
      "Lower margin",
      rssResult
        ? rssResult.lowerMargin
        : null
    ],

    [
      "Upper margin",
      result.upperMargin,
      "",
      "Upper margin",
      rssResult
        ? rssResult.upperMargin
        : null
    ],

    [
      "Critical margin",
      result.worstMargin,
      "",
      "Critical margin",
      rssResult
        ? rssResult.worstMargin
        : null
    ],

    [
      "",
      "",
      "",
      "",
      ""
    ],

    [
      "RESULT",
      worstCaseStatus,
      "",
      "RESULT",
      rssStatus
    ]

  ];


  // One batch write for both analyses.
  sheet
    .getRange(
      2,
      13, // M
      output.length,
      5
    )
    .setValues(
      output
    );


  // ==========================================
  // RESULT CELLS
  // ==========================================

  const marginCell =
    sheet.getRange(
      "N10"
    );


  const statusCell =
    sheet.getRange(
      "N12"
    );


  const rssMarginCell =
    sheet.getRange(
      "Q10"
    );


  const rssStatusCell =
    sheet.getRange(
      "Q12"
    );


  // ==========================================
  // WORST CASE CRITICAL MARGIN
  // ==========================================

  marginCell
    .setFontWeight(
      "bold"
    );


  if (
    result.worstMargin !== null &&
    result.worstMargin < 0
  ) {

    marginCell
      .setBackground(
        "#f4c7c3"
      )
      .setFontColor(
        "#b31412"
      );

  } else if (
    result.worstMargin !== null
  ) {

    marginCell
      .setBackground(
        "#b7e1cd"
      )
      .setFontColor(
        "#0b8043"
      );

  } else {

    marginCell
      .setBackground(null)
      .setFontColor(null);

  }


  // ==========================================
  // WORST CASE STATUS
  // ==========================================

  statusCell
    .setFontWeight(
      "bold"
    );


  if (
    result.passed === true
  ) {

    statusCell
      .setBackground(
        "#b7e1cd"
      )
      .setFontColor(
        "#0b8043"
      );

  } else if (
    result.passed === false
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


  // ==========================================
  // RSS CRITICAL MARGIN
  // ==========================================

  rssMarginCell
    .setFontWeight(
      "bold"
    );


  if (
    rssResult &&
    rssResult.worstMargin !== null
  ) {

    if (
      rssResult.worstMargin < 0
    ) {

      rssMarginCell
        .setBackground(
          "#f4c7c3"
        )
        .setFontColor(
          "#b31412"
        );

    } else {

      rssMarginCell
        .setBackground(
          "#b7e1cd"
        )
        .setFontColor(
          "#0b8043"
        );

    }

  } else {

    rssMarginCell
      .setBackground(null)
      .setFontColor(null);

  }


  // ==========================================
  // RSS STATUS
  // ==========================================

  rssStatusCell
    .setFontWeight(
      "bold"
    );


  if (
    !rssResult ||
    rssResult.passed === null
  ) {

    rssStatusCell
      .setBackground(
        "#fff2cc"
      )
      .setFontColor(
        "#7f6000"
      );

  } else if (
    rssResult.passed === true
  ) {

    rssStatusCell
      .setBackground(
        "#b7e1cd"
      )
      .setFontColor(
        "#0b8043"
      );

  } else {

    rssStatusCell
      .setBackground(
        "#f4c7c3"
      )
      .setFontColor(
        "#b31412"
      );

  }

}


/**
 * Writes Worst Case and RSS contribution analysis.
 *
 * Output area:
 *
 *   M:O = Worst Case contributions
 *   P:R = RSS contributions
 */
function writeContributionAnalysis(
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


  let wcContributions;
  let rssContributions;


  // ==========================================
  // LOAD CONTRIBUTIONS
  // ==========================================

  try {

    wcContributions =
      calculateToleranceContributions();


    rssContributions =
      calculateRSSContributions();

  } catch (error) {

    // Remove old results when current
    // component input is incomplete.
    sheet
      .getRange(
        14,
        13, // M
        60,
        6   // M:R
      )
      .clearContent();


    return;

  }


  // ==========================================
  // NO CONTRIBUTIONS
  // ==========================================

  if (
    wcContributions.length === 0 &&
    rssContributions.length === 0
  ) {

    sheet
      .getRange(
        14,
        13,
        60,
        6
      )
      .clearContent();


    return;

  }


  const startRow =
    14;


  const startColumn =
    13; // M


  // ==========================================
  // CRITICAL COMPONENTS
  // ==========================================

  const wcCritical =
    getCriticalContributors(
      wcContributions
    );


  const maxVariance =
    rssContributions.length > 0

      ? rssContributions[0]
          .varianceContribution

      : null;


  const rssCritical =
    rssContributions.length > 0

      ? rssContributions.filter(
          item =>
            Math.abs(
              item.varianceContribution -
              maxVariance
            ) < 1e-12
        )

      : [];


  // ==========================================
  // WORST CASE OUTPUT M:O
  // ==========================================

  const wcOutput = [

    [
      "TOLERANCE CONTRIBUTIONS",
      "Contribution mm",
      "Share"
    ]

  ];


  for (
    const item of
      wcContributions
  ) {

    wcOutput.push([

      item.name,

      roundTolerance(
        item.contribution
      ),

      item.percentage /
        100

    ]);

  }


  wcOutput.push([
    "",
    "",
    ""
  ]);


  if (
    wcCritical.length === 1
  ) {

    wcOutput.push([

      "CRITICAL COMPONENT",

      wcCritical[0].name,

      ""

    ]);

  } else if (
    wcCritical.length > 1
  ) {

    wcOutput.push([

      "CRITICAL COMPONENTS",

      wcCritical
        .map(
          item =>
            item.name
        )
        .join(
          ", "
        ),

      ""

    ]);

  }


  if (
    wcCritical.length > 0
  ) {

    wcOutput.push([

      "Largest contribution",

      roundTolerance(
        wcCritical[0]
          .contribution
      ),

      wcCritical[0]
        .percentage /
        100

    ]);

  }


  // ==========================================
  // RSS OUTPUT P:R
  // ==========================================

  const rssOutput = [

    [
      "RSS CONTRIBUTIONS",
      "RSS term mm",
      "Share"
    ]

  ];


  for (
    const item of
      rssContributions
  ) {

    rssOutput.push([

      item.name,

      roundTolerance(
        item.rssTerm
      ),

      item.percentage

    ]);

  }


  rssOutput.push([
    "",
    "",
    ""
  ]);


  if (
    rssCritical.length === 1
  ) {

    rssOutput.push([

      "CRITICAL RSS COMPONENT",

      rssCritical[0].name,

      ""

    ]);

  } else if (
    rssCritical.length > 1
  ) {

    rssOutput.push([

      "CRITICAL RSS COMPONENTS",

      rssCritical
        .map(
          item =>
            item.name
        )
        .join(
          ", "
        ),

      ""

    ]);

  }


  if (
    rssCritical.length > 0
  ) {

    rssOutput.push([

      "Largest RSS contribution",

      roundTolerance(
        rssCritical[0]
          .rssTerm
      ),

      rssCritical[0]
        .percentage

    ]);

  }


  // ==========================================
  // BUILD COMMON M:R MATRIX
  // ==========================================

  const rowCount =
    Math.max(
      wcOutput.length,
      rssOutput.length
    );


  const combinedOutput =
    [];


  for (
    let i = 0;
    i < rowCount;
    i++
  ) {

    const wcRow =
      wcOutput[i] ||
      [
        "",
        "",
        ""
      ];


    const rssRow =
      rssOutput[i] ||
      [
        "",
        "",
        ""
      ];


    combinedOutput.push([

      wcRow[0],
      wcRow[1],
      wcRow[2],

      rssRow[0],
      rssRow[1],
      rssRow[2]

    ]);

  }


  // ==========================================
  // CLEAR PREVIOUS OUTPUT
  // ==========================================

  sheet
    .getRange(
      startRow,
      startColumn,
      60,
      6
    )
    .clearContent();


  // ==========================================
  // SINGLE BATCH WRITE
  // ==========================================

  sheet
    .getRange(
      startRow,
      startColumn,
      combinedOutput.length,
      6
    )
    .setValues(
      combinedOutput
    );


  // ==========================================
  // RESET DYNAMIC HIGHLIGHTING
  // ==========================================

  const maxComponentRows =
    Math.max(
      wcContributions.length,
      rssContributions.length
    );


  if (
    maxComponentRows > 0
  ) {

    sheet
      .getRange(
        startRow + 1,
        startColumn,
        maxComponentRows,
        6
      )
      .setBackground(null)
      .setFontWeight(
        "normal"
      );

  }


  // ==========================================
  // HIGHLIGHT CRITICAL WC COMPONENTS
  // ==========================================

  const wcRanges =
    [];


  if (
    wcContributions.length > 0
  ) {

    const maxContribution =
      wcContributions[0]
        .contribution;


    for (
      let i = 0;
      i < wcContributions.length;
      i++
    ) {

      if (
        Math.abs(
          wcContributions[i]
            .contribution -
          maxContribution
        ) < 1e-9
      ) {

        const rowNumber =
          startRow +
          1 +
          i;


        wcRanges.push(
          `M${rowNumber}:O${rowNumber}`
        );

      }

    }

  }


  if (
    wcRanges.length > 0
  ) {

    const wcRangeList =
      sheet.getRangeList(
        wcRanges
      );


    wcRangeList
      .setBackground(
        "#fff2cc"
      );


    wcRangeList
      .setFontWeight(
        "bold"
      );

  }


  // ==========================================
  // HIGHLIGHT CRITICAL RSS COMPONENTS
  // ==========================================

  const rssRanges =
    [];


  if (
    rssContributions.length > 0
  ) {

    for (
      let i = 0;
      i < rssContributions.length;
      i++
    ) {

      if (
        Math.abs(
          rssContributions[i]
            .varianceContribution -
          maxVariance
        ) < 1e-12
      ) {

        const rowNumber =
          startRow +
          1 +
          i;


        rssRanges.push(
          `P${rowNumber}:R${rowNumber}`
        );

      }

    }

  }


  if (
    rssRanges.length > 0
  ) {

    const rssRangeList =
      sheet.getRangeList(
        rssRanges
      );


    rssRangeList
      .setBackground(
        "#fff2cc"
      );


    rssRangeList
      .setFontWeight(
        "bold"
      );

  }


  // ==========================================
  // EMPHASIZE CRITICAL SUMMARY SECTIONS
  // ==========================================

  if (
    wcCritical.length > 0
  ) {

    const wcCriticalStart =
      startRow +
      1 +
      wcContributions.length +
      1;


    sheet
      .getRange(
        wcCriticalStart,
        13,
        2,
        3
      )
      .setFontWeight(
        "bold"
      );

  }


  if (
    rssCritical.length > 0
  ) {

    const rssCriticalStart =
      startRow +
      1 +
      rssContributions.length +
      1;


    sheet
      .getRange(
        rssCriticalStart,
        16,
        2,
        3
      )
      .setFontWeight(
        "bold"
      );

  }

}

function setupTargetClassDropdown() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const assembly =
    ss.getSheetByName(
      CONFIG.SHEETS.ASSEMBLY
    );

  const settings =
    ss.getSheetByName(
      CONFIG.SHEETS.SETTINGS
    );

  const helperRange =
    settings.getRange("Z2:Z200");

  const classCell =
    assembly.getRange(
      CONFIG.TARGET_ROW,
      CONFIG.COLUMNS.CLASS
    );

  const rule = SpreadsheetApp
    .newDataValidation()
    .requireValueInRange(
      helperRange,
      true
    )
    .setAllowInvalid(false)
    .build();

  classCell.setDataValidation(rule);
}

function updateTargetClassList(standard) {

  const settings = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(
      CONFIG.SHEETS.SETTINGS
    );

  const helperRange =
    settings.getRange("Z2:Z200");

  let classes = [];

  switch (standard) {

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


    case "Custom":

      classes = [];

      break;
  }


  helperRange.clearContent();


  if (classes.length > 0) {

    settings
      .getRange(
        2,
        26, // Z
        classes.length,
        1
      )
      .setValues(
        classes.map(value => [value])
      );

  }
}

function setupAnalysisFormatting() {


// lägger in formatering för texter //

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.ASSEMBLY);

  // Rubriker
  sheet
    .getRange("M2:N2")
    .setFontWeight("bold");

  sheet
    .getRange("P2:Q2")
    .setFontWeight("bold");


  // Worst Case tal
  sheet
    .getRange("N3:N10")
    .setNumberFormat("0.000");


  // RSS tal
  sheet
    .getRange("Q3:Q10")
    .setNumberFormat("0.000");

}

function setupToleranceContributionFormatting() {

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.ASSEMBLY);

  // M:O används för toleransbidrag
  // Vi förbereder upp till rad 73

  // N = Bidrag mm
  sheet
    .getRange("N15:N73")
    .setNumberFormat("0.000");

  // O = Andel
  sheet
    .getRange("O15:O73")
    .setNumberFormat("0.0%");

  // Grundformat
  sheet
    .getRange("M14:O73")
    .setFontWeight("normal");

  // Rubrik
  sheet
    .getRange("M14:O14")
    .setFontWeight("bold");
}

function setupRSSContributionFormatting() {

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.ASSEMBLY);

  // P:R används för RSS-bidrag

  // Q = RSS-term mm
  sheet
    .getRange("Q15:Q73")
    .setNumberFormat("0.000");

  // R = Andel
  sheet
    .getRange("R15:R73")
    .setNumberFormat("0.0%");

  // Grundformat
  sheet
    .getRange("P14:R73")
    .setFontWeight("normal");

  // Rubrik
  sheet
    .getRange("P14:R14")
    .setFontWeight("bold");
}

function setupReadMeSheet() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();


  const sheet =
    ss.getSheetByName(
      CONFIG.SHEETS.README
    );


  if (!sheet) {

    throw new Error(
      "Sheet '" +
      CONFIG.SHEETS.README +
      "' was not found."
    );

  }


  // ==========================================
  // RESET SHEET
  // ==========================================

  sheet
    .getRange(
      1,
      1,
      sheet.getMaxRows(),
      Math.min(
        sheet.getMaxColumns(),
        5
      )
    )
    .breakApart();


  sheet.clear();

  sheet.setHiddenGridlines(true);


  // ==========================================
  // COLUMN WIDTHS
  // ==========================================

  sheet.setColumnWidth(1, 35);   // A
  sheet.setColumnWidth(2, 220);  // B
  sheet.setColumnWidth(3, 280);  // C
  sheet.setColumnWidth(4, 280);  // D
  sheet.setColumnWidth(5, 35);   // E


  // ==========================================
  // HELPER FOR TEXT BLOCKS
  // ==========================================

  function addTextBlock(
    row,
    text,
    height
  ) {

    sheet
      .getRange(
        row,
        2,
        1,
        3
      )
      .merge()
      .setValue(
        text
      )
      .setWrap(true)
      .setVerticalAlignment(
        "middle"
      );


    if (height) {

      sheet.setRowHeight(
        row,
        height
      );

    }

  }


  // Start directly on row 1.
  let row =
    1;


  // ==========================================
  // TITLE
  // ==========================================

  sheet
    .getRange(
      row,
      2,
      1,
      3
    )
    .merge()
    .setValue(
      "MECHANICAL TOLERANCE ANALYZER"
    )
    .setFontSize(18)
    .setFontWeight("bold")
    .setHorizontalAlignment("left");


  sheet.setRowHeight(
    row,
    32
  );


  row++;


  // ==========================================
  // VERSION
  // ==========================================

  sheet
    .getRange(
      row,
      2,
      1,
      3
    )
    .merge()
    .setValue(
      "Version 1.0  •  Developed by Henrik Thorwaldsson"
    )
    .setFontSize(10)
    .setFontColor(
      "#666666"
    );


  row++;


  // ==========================================
  // INTRODUCTION
  // ==========================================

  addTextBlock(
    row,
    "Engineering tool for dimensional tolerance stack-up " +
    "analysis using Worst Case, RSS and optional advanced " +
    "Statistical Analysis.",
    36
  );


  // One spacer row before Quick Start.
  row +=
    2;


  // ==========================================
  // QUICK START
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "QUICK START"
  );


  row++;


  const quickStartRow =
    row;


  const quickStart = [

    [
      "1",
      "Define the target dimension on row 10."
    ],

    [
      "2",
      "Enter the component name in column A."
    ],

    [
      "3",
      "Enter the nominal dimension in column B."
    ],

    [
      "4",
      "Select the tolerance standard in column C."
    ],

    [
      "5",
      "For ISO 2768 and ISO 13920, the analyzer automatically " +
      "selects the configured default class and calculates the tolerance."
    ],

    [
      "6",
      "Check the stack direction in column H. New complete components " +
      "are assigned + automatically; change it to − when required."
    ],

    [
      "7",
      "Repeat for the remaining components. Worst Case, RSS and " +
      "contribution analyses update automatically."
    ],

    [
      "8",
      "Optional: enable Statistical Analysis when process variation " +
      "data is available."
    ]

  ];


  sheet
    .getRange(
      row,
      2,
      quickStart.length,
      2
    )
    .setValues(
      quickStart
    )
    .setWrap(true)
    .setVerticalAlignment(
      "middle"
    );


  sheet
    .getRange(
      row,
      2,
      quickStart.length,
      1
    )
    .setFontWeight("bold")
    .setHorizontalAlignment(
      "center"
    );


  sheet.autoResizeRows(
    quickStartRow,
    quickStart.length
  );


  row +=
    quickStart.length;


  // One empty row after Quick Start.
  row++;


  // ==========================================
  // NORMAL WORKFLOW
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "NORMAL WORKFLOW"
  );


  row++;


  addTextBlock(
    row,
    "For most components you only need to work with columns A–C:\n\n" +

    "A  Component name\n" +
    "B  Nominal dimension\n" +
    "C  Tolerance standard\n\n" +

    "For ISO 2768 and ISO 13920, the analyzer handles the " +
    "tolerance class, deviations, total tolerance and default " +
    "stack direction automatically.\n\n" +

    "Custom and ISO 286 are the main exceptions because they " +
    "require additional user input.\n\n" +

    "Columns K:L are only required when the optional Advanced " +
    "Statistical Analysis is enabled.",
    155
  );


  row +=
    3;


  // ==========================================
  // COMPONENT TABLE
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "COMPONENT TABLE"
  );


  row++;


  const componentTableRow =
    row;


  const componentColumns = [

    [
      "Column",
      "Function",
      "Input"
    ],

    [
      "A",
      "Component name",
      "User"
    ],

    [
      "B",
      "Nominal dimension",
      "User"
    ],

    [
      "C",
      "Tolerance standard",
      "User"
    ],

    [
      "D",
      "Tolerance class",
      "Automatic / User"
    ],

    [
      "E",
      "Upper deviation",
      "Automatic / Custom"
    ],

    [
      "F",
      "Lower deviation",
      "Automatic / Custom"
    ],

    [
      "G",
      "Total tolerance",
      "Automatic"
    ],

    [
      "H",
      "Stack direction",
      "Automatic / User"
    ],

    [
      "I",
      "Comment",
      "User"
    ],

    [
      "K",
      "Statistical model",
      "Advanced / User"
    ],

    [
      "L",
      "Statistical value",
      "Advanced / User"
    ]

  ];


  sheet
    .getRange(
      row,
      2,
      componentColumns.length,
      3
    )
    .setValues(
      componentColumns
    )
    .setWrap(true);


  sheet
    .getRange(
      row,
      2,
      1,
      3
    )
    .setFontWeight("bold")
    .setBackground(
      "#e8eaed"
    );


  // A:C = normal user input.

  sheet
    .getRange(
      componentTableRow + 1,
      4,
      3,
      1
    )
    .setBackground(
      "#fff2cc"
    );


  // D:H = automatic / mixed.

  sheet
    .getRange(
      componentTableRow + 4,
      4,
      5,
      1
    )
    .setBackground(
      "#e8f0fe"
    );


  // I = user comment.

  sheet
    .getRange(
      componentTableRow + 9,
      4
    )
    .setBackground(
      "#fff2cc"
    );


  // K:L = advanced user input.

  sheet
    .getRange(
      componentTableRow + 10,
      4,
      2,
      1
    )
    .setBackground(
      "#fff2cc"
    );


  row +=
    componentColumns.length +
    2;


  // ==========================================
  // TOOLS
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "TOOLS"
  );


  row++;


  const tools = [

    [
      "Clear Assembly",
      "Clears the current target and component data so a new tolerance " +
      "analysis can be started. Confirmation is required before data is removed."
    ],

    [
      "Set Default Classes",
      "Changes the default classes automatically selected for ISO 2768 " +
      "and ISO 13920. Existing component classes are not changed."
    ],

    [
      "ISO 286 Fit Guide",
      "Helps select a functional hole/shaft fit and recommends common " +
      "ISO 286 combinations. The guide can also calculate actual " +
      "dimensional limits and resulting clearance or interference."
    ],

    [
      "On/Off Statistical Analysis",
      "Enables or disables Advanced Statistical Analysis and shows or " +
      "hides columns K:L. Statistical input values are retained when " +
      "the analysis is switched off."
    ]

  ];


  sheet
    .getRange(
      row,
      2,
      tools.length,
      2
    )
    .setValues(
      tools
    )
    .setWrap(true);


  sheet
    .getRange(
      row,
      2,
      tools.length,
      1
    )
    .setFontWeight(
      "bold"
    );


  sheet.autoResizeRows(
    row,
    tools.length
  );


  row +=
    tools.length +
    2;


  // ==========================================
  // CURRENT DEFAULT CLASSES
  // ==========================================

  const settingsSheet =
    ss.getSheetByName(
      CONFIG.SHEETS.SETTINGS
    );


  let default2768 =
    "m";


  let default13920 =
    "B";


  if (settingsSheet) {

    const defaultValues =
      settingsSheet
        .getRange(
          "B2:B3"
        )
        .getValues();


    const value2768 =
      String(
        defaultValues[0][0]
      )
        .trim()
        .toLowerCase();


    const value13920 =
      String(
        defaultValues[1][0]
      )
        .trim()
        .toUpperCase();


    if (
      [
        "f",
        "m",
        "c",
        "v"
      ].includes(
        value2768
      )
    ) {

      default2768 =
        value2768;

    }


    if (
      [
        "A",
        "B",
        "C",
        "D"
      ].includes(
        value13920
      )
    ) {

      default13920 =
        value13920;

    }

  }


  // ==========================================
  // TOLERANCE STANDARDS
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "TOLERANCE STANDARDS"
  );


  row++;


  const standards = [

    [
      "Standard",
      "Current default",
      "Application"
    ],

    [
      "ISO 2768",
      default2768,
      "General dimensional tolerances"
    ],

    [
      "ISO 13920",
      default13920,
      "General tolerances for welded constructions"
    ],

    [
      "ISO 286",
      "Selected manually",
      "Limits and fits for holes and shafts"
    ],

    [
      "Custom",
      "–",
      "User-defined upper and lower deviations"
    ]

  ];


  sheet
    .getRange(
      row,
      2,
      standards.length,
      3
    )
    .setValues(
      standards
    )
    .setWrap(true);


  sheet
    .getRange(
      row,
      2,
      1,
      3
    )
    .setFontWeight("bold")
    .setBackground(
      "#e8eaed"
    );


  sheet.autoResizeRows(
    row,
    standards.length
  );


  row +=
    standards.length +
    2;


  // ==========================================
  // ISO 2768 / ISO 13920
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "ISO 2768 AND ISO 13920"
  );


  row++;


  addTextBlock(
    row,
    "ISO 2768 is used for general dimensional tolerances. " +
    "ISO 13920 is used for general tolerances for welded constructions.\n\n" +

    "When either standard is selected, the configured current default " +
    "class is applied automatically. The class may still be changed " +
    "manually for an individual component when required.\n\n" +

    "Original default values:\n" +
    "ISO 2768 = m\n" +
    "ISO 13920 = B\n\n" +

    "Use Set Default Classes to change the active defaults shown in " +
    "the Tolerance Standards table above.",
    145
  );


  row +=
    3;


  // ==========================================
  // ISO 286
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "ISO 286 – LIMITS AND FITS"
  );


  row++;


  addTextBlock(
    row,
    "ISO 286 is intended for limits and fits, particularly mating " +
    "holes and shafts.\n\n" +

    "There is intentionally no automatic default ISO 286 class. " +
    "The correct class depends on the required function of the joint, " +
    "such as running clearance, sliding movement, accurate location, " +
    "transition fit or interference fit.\n\n" +

    "Use the ISO 286 Fit Guide to select a common functional starting " +
    "fit and calculate the actual fit limits for a nominal diameter.\n\n" +

    "The Assembly sheet can still be used to select less common " +
    "ISO 286 classes manually when required.",
    155
  );


  row +=
    3;


  // ==========================================
  // CUSTOM TOLERANCE
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "CUSTOM TOLERANCE"
  );


  row++;


  addTextBlock(
    row,
    "Select Custom when the component does not use one of the " +
    "built-in tolerance calculations.\n\n" +

    "For Custom:\n" +
    "E = Upper deviation — entered manually\n" +
    "F = Lower deviation — entered manually\n" +
    "G = Total tolerance — calculated automatically\n\n" +

    "Example:\n" +
    "Nominal = 50 mm\n" +
    "Upper deviation = +0.20 mm\n" +
    "Lower deviation = -0.10 mm\n" +
    "Total tolerance = 0.30 mm",
    145
  );


  row +=
    3;


  // ==========================================
  // STACK DIRECTION
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "STACK DIRECTION"
  );


  row++;


  addTextBlock(
    row,
    "+  The dimension is added to the stack.\n" +
    "−  The dimension is subtracted from the stack.\n\n" +

    "New complete components are normally assigned + automatically " +
    "if no direction has already been specified.\n\n" +

    "Change the direction manually to − when the geometry of the " +
    "tolerance chain requires the dimension to act in the opposite direction.",
    110
  );


  row +=
    3;


  // ==========================================
  // TARGET COMPONENT
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "TARGET COMPONENT"
  );


  row++;


  addTextBlock(
    row,
    "The orange Target component row defines the dimensional " +
    "requirement that the assembly must satisfy.\n\n" +

    "The target row is not included as a component in the stack. " +
    "Instead, the calculated assembly range is compared against " +
    "the target limits.\n\n" +

    "PASS = the calculated assembly remains within the target limits.\n" +
    "FAIL = at least one calculated limit exceeds the target requirement.\n\n" +

    "Critical margin is the smallest remaining margin to a target limit. " +
    "A negative critical margin indicates that the requirement has been exceeded.",
    150
  );


  row +=
    3;


  // ==========================================
  // ANALYSIS METHODS
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "ANALYSIS METHODS"
  );


  row++;


  addTextBlock(
    row,
    "WORST CASE\n\n" +

    "Calculates the minimum and maximum possible stack dimensions " +
    "when all component dimensions simultaneously occur at the tolerance " +
    "limits that produce the most unfavorable result.\n\n" +

    "Worst Case is conservative and does not assume a statistical " +
    "distribution of manufactured dimensions.",
    120
  );


  row +=
    2;


  addTextBlock(
    row,
    "RSS – ROOT SUM SQUARE\n\n" +

    "Combines the individual tolerance contributions statistically. " +
    "RSS normally produces a narrower estimated assembly range than " +
    "Worst Case when component contributions are treated as independent.\n\n" +

    "RSS uses the specified component tolerance widths and should only " +
    "be used when statistical tolerance analysis is appropriate for " +
    "the manufacturing process and design requirement.",
    130
  );


  row +=
    2;


  addTextBlock(
    row,
    "STATISTICAL ANALYSIS\n\n" +

    "Uses estimated or known process standard deviations (σ) for " +
    "individual components instead of relying only on their drawing " +
    "tolerance widths.\n\n" +

    "This method is optional and is intended for cases where additional " +
    "information about expected manufacturing variation is available.",
    120
  );


  row +=
    3;


  // ==========================================
  // ADVANCED STATISTICAL ANALYSIS
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "ADVANCED STATISTICAL ANALYSIS"
  );


  row++;


  addTextBlock(
    row,
    "Use the On/Off Statistical Analysis button on the Assembly sheet " +
    "to enable this mode.\n\n" +

    "When enabled, columns K:L become available for statistical input. " +
    "The Statistical Analysis result and Statistical Contributions are " +
    "displayed to the right of the normal Worst Case and RSS results.\n\n" +

    "The normal workflow in columns A:C remains unchanged. Statistical " +
    "Analysis is only required when additional process information is " +
    "available or when a process-based estimate is desired.\n\n" +

    "The Statistical Analysis output uses a ±3σ range.",
    150
  );


  row +=
    3;


  // ==========================================
  // STATISTICAL INPUT
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "STATISTICAL INPUT"
  );


  row++;


  addTextBlock(
    row,
    "TOLERANCE BASIS\n\n" +

    "Uses the component tolerance as the basis for estimating process σ. " +
    "The value in column L defines how many standard deviations correspond " +
    "to half of the total tolerance range.\n\n" +

    "Example:\n" +
    "Total tolerance = 0.60 mm\n" +
    "Tolerance basis = 3σ\n" +
    "Half tolerance = 0.30 mm\n" +
    "σ = 0.30 / 3 = 0.10 mm\n\n" +

    "A value of 3 therefore assumes that the drawing tolerance limits " +
    "correspond to approximately ±3σ.",
    195
  );


  row +=
    2;


  addTextBlock(
    row,
    "KNOWN σ\n\n" +

    "Uses a known process standard deviation directly.\n\n" +

    "Example:\n" +
    "Known process σ = 0.075 mm\n\n" +

    "Enter Known σ as the statistical model and 0.075 in column L.\n\n" +

    "Known σ is preferred when reliable manufacturing, measurement or " +
    "process capability data is available.",
    150
  );


  row +=
    3;


  // ==========================================
  // STATISTICAL STACK CALCULATION
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "STATISTICAL STACK CALCULATION"
  );


  row++;


  addTextBlock(
    row,
    "Individual component standard deviations are combined by variance:\n\n" +

    "σstack = √(σ₁² + σ₂² + σ₃² + ...)\n\n" +

    "The analyzer reports the assembly range as:\n\n" +

    "Statistical minimum = Nominal stack − 3σstack\n" +
    "Statistical maximum = Nominal stack + 3σstack\n\n" +

    "The calculated range is compared with the Target component limits " +
    "to determine PASS or FAIL and the remaining critical margin.",
    165
  );


  row +=
    3;


  // ==========================================
  // CONTRIBUTIONS
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "TOLERANCE AND STATISTICAL CONTRIBUTIONS"
  );


  row++;


  addTextBlock(
    row,
    "The analyzer ranks components according to their contribution " +
    "to the assembly variation.\n\n" +

    "Worst Case contribution shows how much of the total Worst Case " +
    "tolerance is caused by each component.\n\n" +

    "RSS contribution shows how strongly each component contributes " +
    "to the RSS result.\n\n" +

    "Statistical contribution is based on variance (σ²). The component " +
    "with the largest variance contribution is identified as the " +
    "Critical Statistical Component.\n\n" +

    "Contribution analysis helps identify where tolerance or process " +
    "improvements are likely to have the greatest effect.",
    185
  );


  row +=
    3;


  // ==========================================
  // METHOD COMPARISON
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "CHOOSING AN ANALYSIS METHOD"
  );


  row++;


  const methods = [

    [
      "Method",
      "Main question",
      "Basis"
    ],

    [
      "Worst Case",
      "Will the assembly work when all dimensions combine in the worst possible way?",
      "Tolerance limits"
    ],

    [
      "RSS",
      "What variation is estimated when component tolerances combine statistically?",
      "Tolerance widths"
    ],

    [
      "Statistical Analysis",
      "What variation is estimated using assumed or known process variation?",
      "Standard deviation σ"
    ]

  ];


  sheet
    .getRange(
      row,
      2,
      methods.length,
      3
    )
    .setValues(
      methods
    )
    .setWrap(true);


  sheet
    .getRange(
      row,
      2,
      1,
      3
    )
    .setFontWeight("bold")
    .setBackground(
      "#e8eaed"
    );


  sheet.autoResizeRows(
    row,
    methods.length
  );


  row +=
    methods.length +
    2;


  // ==========================================
  // AUTOMATIC INPUT HANDLING
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "AUTOMATIC INPUT HANDLING"
  );


  row++;


  addTextBlock(
    row,
    "The Assembly sheet automatically keeps dependent tolerance " +
    "information synchronized with user input.\n\n" +

    "• Changing tolerance standard removes values that are no longer " +
    "valid and generates the values required by the new standard.\n\n" +

    "• To remove a component from the analysis, clear its Nominal " +
    "dimension and Standard. Remaining calculated values on that row " +
    "are cleared automatically.\n\n" +

    "• Partially completed or unused rows are ignored until sufficient " +
    "information exists to include them in the analysis.\n\n" +

    "• When a valid component becomes complete, the stack direction is " +
    "normally assigned + automatically.\n\n" +

    "• If valid dimensional and tolerance information exists but the " +
    "component name is missing, the analysis reports INCOMPLETE INPUT.\n\n" +

    "Because dependent values are maintained automatically, normal use " +
    "generally requires very little manual cleanup.",
    225
  );


  row +=
    3;


  // ==========================================
  // RECOMMENDED WORKFLOW
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "RECOMMENDED WORKFLOW"
  );


  row++;


  const workflow = [

    [
      "1",
      "Define the Target component."
    ],

    [
      "2",
      "Enter Component, Nominal and Standard."
    ],

    [
      "3",
      "Check the automatically selected tolerance class and values."
    ],

    [
      "4",
      "Change Direction from + to − where required by the tolerance chain."
    ],

    [
      "5",
      "Repeat for the remaining components."
    ],

    [
      "6",
      "Review Worst Case and RSS results."
    ],

    [
      "7",
      "Review the contribution analysis to identify dominant tolerances."
    ],

    [
      "8",
      "For ISO 286 fits, use the Fit Guide before selecting the required class."
    ],

    [
      "9",
      "Optional: enable Statistical Analysis when process variation data is available."
    ]

  ];


  sheet
    .getRange(
      row,
      2,
      workflow.length,
      2
    )
    .setValues(
      workflow
    )
    .setWrap(true);


  sheet
    .getRange(
      row,
      2,
      workflow.length,
      1
    )
    .setFontWeight("bold")
    .setHorizontalAlignment(
      "center"
    );


  sheet.autoResizeRows(
    row,
    workflow.length
  );


  row +=
    workflow.length +
    2;


  // ==========================================
  // DESIGN GUIDANCE
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "DESIGN GUIDANCE"
  );


  row++;


  addTextBlock(
    row,
    "Tolerance selection should be driven by function, not simply " +
    "by choosing the tightest available tolerance.\n\n" +

    "Tighter tolerances generally increase manufacturing and inspection " +
    "effort. When optimizing a design, first identify the components " +
    "with the largest tolerance or statistical contribution and determine " +
    "whether improving those components provides a meaningful functional benefit.\n\n" +

    "Use the widest tolerances that reliably satisfy the functional " +
    "requirements of the assembly.",
    140
  );


  row +=
    3;


  // ==========================================
  // IMPORTANT
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "IMPORTANT"
  );


  row++;


  addTextBlock(
    row,
    "• All dimensions and tolerances are entered in mm.\n\n" +

    "• Row 10 defines the target dimension and is not included as a " +
    "component in the tolerance stack.\n\n" +

    "• Always verify the direction of each component in the stack.\n\n" +

    "• Always verify that the selected standard and tolerance class " +
    "are applicable to the component, manufacturing process and " +
    "functional requirement.\n\n" +

    "• ISO 286 Fit Guide recommendations are engineering starting " +
    "points and should be verified for the actual application.\n\n" +

    "• RSS and Statistical Analysis are statistical estimates and " +
    "should not be interpreted as guaranteed tolerance limits in the " +
    "same way as Worst Case.\n\n" +

    "• Statistical Analysis depends on the validity of the selected " +
    "Tolerance basis or Known σ values. Reliable process data should " +
    "be used whenever available.",
    225
  );


  row +=
    3;


  // ==========================================
  // PERMISSIONS
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "PERMISSIONS"
  );


  row++;


  addTextBlock(
    row,
    "This tool uses Google Apps Script to perform calculations " +
    "and update the spreadsheet. Some functions may require " +
    "authorization the first time they are used.\n\n" +

    "The script only requests access required for the spreadsheet " +
    "functions used by the tool.",
    95
  );


  row +=
    3;


  // ==========================================
  // WORKBOOK SHEETS
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "WORKBOOK SHEETS"
  );


  row++;


  const sheetsInfo = [

    [
      "Assembly",
      "Main workspace for defining and analyzing the tolerance stack."
    ],

    [
      "Read Me",
      "User instructions and information about the tool."
    ],

    [
      "ISO Library",
      "Tolerance data used by the supported standards."
    ],

    [
      "Settings",
      "Internal configuration and helper data used by the tool."
    ]

  ];


  sheet
    .getRange(
      row,
      2,
      sheetsInfo.length,
      2
    )
    .setValues(
      sheetsInfo
    )
    .setWrap(true);


  sheet
    .getRange(
      row,
      2,
      sheetsInfo.length,
      1
    )
    .setFontWeight(
      "bold"
    );


  sheet.autoResizeRows(
    row,
    sheetsInfo.length
  );


  row +=
    sheetsInfo.length +
    2;


  // ==========================================
  // ABOUT THE TOOL
  // ==========================================

  createReadMeHeader(
    sheet,
    row,
    "ABOUT THE TOOL"
  );


  row++;


  addTextBlock(
    row,
    "Mechanical Tolerance Analyzer is an engineering tool " +
    "developed in Google Sheets and Google Apps Script for " +
    "dimensional tolerance stack-up analysis using Worst Case, " +
    "RSS and optional process-based Statistical Analysis.",
    75
  );


  row +=
    2;


  addTextBlock(
    row,
    "Mechanical Tolerance Analyzer\n" +
    "Version 1.0\n" +
    "Developed by Henrik Thorwaldsson\n" +
    "Mechanical Design Engineer",
    80
  );


  sheet
    .getRange(
      row,
      2
    )
    .setFontWeight(
      "bold"
    );


  row +=
    2;


  sheet
    .getRange(
      row,
      2
    )
    .setFontColor(
      "#666666"
    );


  const lastContentRow =
    row;


  // ==========================================
  // GENERAL FORMATTING
  // ==========================================

  sheet
    .getRange(
      1,
      2,
      lastContentRow,
      3
    )
    .setVerticalAlignment(
      "middle"
    )
    .setFontFamily(
      "Arial"
    )
    .setFontSize(
      10
    );


  // Restore title formatting after
  // applying the general font settings.

  sheet
    .getRange(
      "B1:D1"
    )
    .setFontSize(
      18
    )
    .setFontWeight(
      "bold"
    );


  // ==========================================
  // COMPLETE
  // ==========================================

  SpreadsheetApp
    .getActive()
    .toast(
      "Read Me has been created.",
      "Tolerance Analyzer",
      3
    );

}


/**
 * Creates a section header
 * on the Read Me sheet.
 */
function createReadMeHeader(
  sheet,
  row,
  title
) {

  sheet
    .getRange(
      row,
      2,
      1,
      3
    )
    .merge()
    .setValue(
      title
    )
    .setFontWeight(
      "bold"
    )
    .setBackground(
      "#d9e2f3"
    )
    .setVerticalAlignment(
      "middle"
    )
    .setHorizontalAlignment(
      "left"
    );


  // Always keep section headers compact.
  sheet.setRowHeight(
    row,
    26
  );

}

function setupStatisticalColumns() {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEETS.ASSEMBLY
      );


  if (!sheet) {
    return;
  }


  // ==========================================
  // HEADERS
  // ==========================================

  sheet
    .getRange(
      1,
      CONFIG.COLUMNS.STATISTICAL_MODEL
    )
    .setValue(
      "Statistical model"
    );


  sheet
    .getRange(
      1,
      CONFIG.COLUMNS.STATISTICAL_VALUE
    )
    .setValue(
      "Statistical value"
    );


  // ==========================================
  // MODEL DROPDOWN
  // ==========================================

  const modelRule =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        [
          "Tolerance basis",
          "Known σ"
        ],
        true
      )
      .setAllowInvalid(false)
      .build();


  sheet
    .getRange(
      CONFIG.STACK_START_ROW,
      CONFIG.COLUMNS.STATISTICAL_MODEL,
      CONFIG.MAX_COMPONENT_ROWS,
      1
    )
    .setDataValidation(
      modelRule
    );


  // ==========================================
  // NUMBER FORMAT
  // ==========================================

  sheet
    .getRange(
      CONFIG.STACK_START_ROW,
      CONFIG.COLUMNS.STATISTICAL_VALUE,
      CONFIG.MAX_COMPONENT_ROWS,
      1
    )
    .setNumberFormat(
      "0.000"
    );


  // ==========================================
  // COLUMN WIDTH
  // ==========================================

  sheet.setColumnWidth(
    CONFIG.COLUMNS.STATISTICAL_MODEL,
    150
  );


  sheet.setColumnWidth(
    CONFIG.COLUMNS.STATISTICAL_VALUE,
    110
  );


  // ==========================================
  // HIDE BY DEFAULT
  // ==========================================

  sheet.hideColumns(
    CONFIG.COLUMNS.STATISTICAL_MODEL,
    2
  );

}


/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * Central configuration for sheet names,
 * row locations and column mappings.
 */

const CONFIG = {

  SHEETS: {
    ASSEMBLY: "Assembly",
    LIBRARY: "ISO Library",
    SETTINGS: "Settings",
    README: "Read Me"
  },

  // First row used by the tolerance analyzer.
  START_ROW: 10,

  // Row containing the target component.
  TARGET_ROW: 10,

  // Maximum number of components in one tolerance stack.
  MAX_COMPONENT_ROWS: 20,

  // First row containing stack components.
  STACK_START_ROW: 11,

  // Helper range used for target class validation.
  TARGET_CLASS_HELPER_RANGE: "Z2:Z200",

  COLUMNS: {
    NAME: 1,
    NOMINAL: 2,
    STANDARD: 3,
    CLASS: 4,
    UPPER: 5,
    LOWER: 6,
    TOLERANCE: 7,
    DIRECTION: 8,
    COMMENT: 9,
    STATISTICAL_MODEL: 11,
    STATISTICAL_VALUE: 12
  }

};

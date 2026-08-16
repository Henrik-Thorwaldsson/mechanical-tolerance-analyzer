/**
 * @OnlyCurrentDoc
 */

/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * Main application entry points and
 * spreadsheet menu handling.
 */


/**
 * Runs automatically when the spreadsheet is opened.
 */
function onOpen() {

  UI.createMenu();

}


/**
 * User interface helpers.
 */
const UI = {

  /**
   * Creates the Mechanical Tolerance Analyzer
   * menu in Google Sheets.
   */
  createMenu() {

    SpreadsheetApp
      .getUi()
      .createMenu(
        "Mechanical Tolerance Analyzer"
      )
      .addItem(
        "Update tolerances",
        "updateTolerances"
      )
      .addSeparator()
      .addItem(
        "About",
        "showAbout"
      )
      .addToUi();

  }

};


/**
 * Displays basic information about the tool.
 */
function showAbout() {

  SpreadsheetApp
    .getUi()
    .alert(
      "Mechanical Tolerance Analyzer\n\n" +
      "Version 1.0"
    );

}

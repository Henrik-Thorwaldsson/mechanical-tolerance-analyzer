/**
 * Mechanical Tolerance Analyzer
 * Version 1.0
 *
 * Shared analysis cache handling.
 *
 * The spreadsheet input range A:H is cached in
 * Document Cache to reduce repeated Sheet reads
 * during onEdit processing.
 */


const ANALYSIS_DATA_CACHE_KEY =
  "ANALYSIS_AH_V1";


/**
 * Loads the complete A:H analysis input.
 *
 * Data layout:
 *
 *   index 0    = Target row
 *   index 1... = Component rows
 *
 * Document Cache is used first. On a cache miss
 * the complete input range is read from the sheet.
 *
 * When called from onEdit(), the current edit is
 * applied directly to the in-memory copy because
 * cached data represents the state before that edit.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Object=} e onEdit event.
 *
 * @return {Array[]}
 */
function loadCachedAnalysisData(
  sheet,
  e
) {

  const cache =
    CacheService
      .getDocumentCache();


  let allData =
    null;


  // ==========================================
  // TRY DOCUMENT CACHE
  // ==========================================

  if (cache) {

    const cached =
      cache.get(
        ANALYSIS_DATA_CACHE_KEY
      );


    if (cached) {

      try {

        const parsed =
          JSON.parse(
            cached
          );


        if (
          Array.isArray(
            parsed
          ) &&
          parsed.length ===
            1 +
            CONFIG.MAX_COMPONENT_ROWS
        ) {

          allData =
            parsed;

        }

      } catch (error) {

        allData =
          null;

      }

    }

  }


  // ==========================================
  // CACHE MISS -> READ A:H
  // ==========================================

  if (!allData) {

    allData =
      sheet
        .getRange(
          CONFIG.TARGET_ROW,
          CONFIG.COLUMNS.NAME,
          1 +
            CONFIG.MAX_COMPONENT_ROWS,
          CONFIG.COLUMNS.DIRECTION
        )
        .getValues();

  }


  // ==========================================
  // APPLY CURRENT EDIT
  // ==========================================
  //
  // Document Cache contains the state before
  // the current onEdit event. Therefore the
  // edited cell is patched directly into the
  // cached array.
  // ==========================================

  if (
    e &&
    e.range &&
    e.range.getNumRows() === 1 &&
    e.range.getNumColumns() === 1
  ) {

    const rowIndex =
      e.range.getRow() -
      CONFIG.TARGET_ROW;


    const columnIndex =
      e.range.getColumn() -
      CONFIG.COLUMNS.NAME;


    if (
      rowIndex >= 0 &&
      rowIndex < allData.length &&
      columnIndex >= 0 &&
      columnIndex <
        CONFIG.COLUMNS.DIRECTION
    ) {

      allData[
        rowIndex
      ][
        columnIndex
      ] =
        typeof e.value ===
        "undefined"

          ? ""

          : e.value;

    }

  }


  return allData;

}


/**
 * Saves the complete A:H analysis input
 * to Document Cache.
 *
 * Cache lifetime:
 *
 *   21600 seconds = 6 hours
 *
 * @param {Array[]} allData
 */
function saveAnalysisDataCache(
  allData
) {

  if (
    !Array.isArray(
      allData
    )
  ) {

    return;

  }


  const cache =
    CacheService
      .getDocumentCache();


  if (!cache) {

    return;

  }


  cache.put(
    ANALYSIS_DATA_CACHE_KEY,
    JSON.stringify(
      allData
    ),
    21600
  );

}


/**
 * Removes the cached A:H spreadsheet input.
 */
function clearAnalysisDataCache() {

  const cache =
    CacheService
      .getDocumentCache();


  if (!cache) {

    return;

  }


  cache.remove(
    ANALYSIS_DATA_CACHE_KEY
  );

}


/**
 * Primes the internal Analysis.gs caches
 * using already loaded A:H input.
 *
 * This avoids another spreadsheet read when
 * several analyses are executed during the
 * same onEdit event.
 *
 * @param {Array[]} allData
 */
function primeAnalysisCaches(
  allData
) {

  if (
    !Array.isArray(
      allData
    )
  ) {

    return;

  }


  // Use the already loaded A:H data as
  // the analysis input.
  analysisInputCache =
    allData;


  // These values are derived from
  // analysisInputCache and must therefore
  // be recalculated.
  assemblyDataCache =
    null;


  targetDataCache =
    null;


  assemblyAnalysisCache =
    null;

}

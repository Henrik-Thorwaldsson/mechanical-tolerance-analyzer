function showISO286FitGuide() {

  const html =
    HtmlService
      .createHtmlOutputFromFile(
        "ISO286FitGuide"
      )
      .setWidth(620)
      .setHeight(700);

  SpreadsheetApp
    .getUi()
    .showModalDialog(
      html,
      "ISO 286 Fit Guide"
    );

}


function calculateISO286FitPreview(
  nominal,
  fitPair
) {

  const nominalNumber =
    Number(nominal);


  if (
    !Number.isFinite(nominalNumber) ||
    nominalNumber <= 0
  ) {

    throw new Error(
      "Invalid nominal diameter."
    );

  }


  const pair =
    String(fitPair || "")
      .trim()
      .split("/");


  if (
    pair.length !== 2
  ) {

    throw new Error(
      "Invalid ISO 286 fit pair."
    );

  }


  const holeClass =
    pair[0].trim();

  const shaftClass =
    pair[1].trim();


  // ==========================================
  // USE EXISTING ISO 286 ENGINE
  // ==========================================

  const hole =
    getTolerance(
      "ISO 286",
      nominalNumber,
      holeClass
    );


  const shaft =
    getTolerance(
      "ISO 286",
      nominalNumber,
      shaftClass
    );


  // ==========================================
  // ACTUAL LIMITS
  // ==========================================

  const holeMax =
    nominalNumber +
    Number(hole.es);

  const holeMin =
    nominalNumber +
    Number(hole.ei);


  const shaftMax =
    nominalNumber +
    Number(shaft.es);

  const shaftMin =
    nominalNumber +
    Number(shaft.ei);


  // ==========================================
  // FIT RANGE
  // ==========================================
  //
  // Positivt värde = clearance
  // Negativt värde = interference
  // ==========================================

  const minimumClearance =
    holeMin -
    shaftMax;


  const maximumClearance =
    holeMax -
    shaftMin;


  // ==========================================
  // CLASSIFY RESULT
  // ==========================================

  let fitBehaviour;


  if (
    minimumClearance >= 0
  ) {

    fitBehaviour =
      "Clearance fit";

  } else if (
    maximumClearance <= 0
  ) {

    fitBehaviour =
      "Interference fit";

  } else {

    fitBehaviour =
      "Transition fit";

  }


  // ==========================================
  // RETURN
  // ==========================================

  return {

    nominal:
      nominalNumber,


    holeClass:
      holeClass,

    holeUpper:
      Number(hole.es),

    holeLower:
      Number(hole.ei),

    holeMax:
      holeMax,

    holeMin:
      holeMin,


    shaftClass:
      shaftClass,

    shaftUpper:
      Number(shaft.es),

    shaftLower:
      Number(shaft.ei),

    shaftMax:
      shaftMax,

    shaftMin:
      shaftMin,


    minimumClearance:
      minimumClearance,

    maximumClearance:
      maximumClearance,


    fitBehaviour:
      fitBehaviour

  };

}


export const getCharacterReleaseDates = (character, releaseSchedule = [], pending = 'Đang cập nhật') => {
  if (!character) return null;

  const format = (date, month, year) => {
    let newM = month;
    let newY = year;
    while (newM > 12) {
      newM -= 12;
      newY += 1;
    }
    return `${date.toString().padStart(2, '0')}/${newM.toString().padStart(2, '0')}/${newY}`;
  }

  const formatScheduleDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
    return match ? `${match[3]}/${match[2]}/${match[1]}` : null
  }

  const trungStr = character.releaseTrung;
  let tRelease = 'Không xác định';
  let tReturn = 'Không xác định';
  let sRelease = 'Không xác định';
  let sReturn = 'Không xác định';

  if (trungStr) {
    const cleanTrung = trungStr.replace(/\s+/g, '');
    const tParts = cleanTrung.split(/[\/\-]/);

    let tm = 0, ty = 0;
    if (tParts.length === 3) {
      const td = parseInt(tParts[0], 10);
      tm = parseInt(tParts[1], 10);
      ty = parseInt(tParts[2], 10);
      tRelease = format(td, tm, ty);
      tReturn = format(15, tm + 2, ty);
    } else if (tParts.length === 2) {
      tm = parseInt(tParts[0], 10);
      ty = parseInt(tParts[1], 10);
      tRelease = format(1, tm, ty);
      tReturn = format(15, tm + 2, ty);
    } else {
      tRelease = trungStr;
    }
  }

  const explicitSea = character.releaseDate || character.releaseSea;
  if (explicitSea) {
    sRelease = explicitSea;
    const cleanSea = sRelease.replace(/\s+/g, '');
    const sParts = cleanSea.split(/[\/\-]/);

    if (sParts.length === 3) {
      const sm = parseInt(sParts[1], 10);
      const sy = parseInt(sParts[2], 10);
      sReturn = format(15, sm + 2, sy);
    } else if (sParts.length === 2) {
      const sm = parseInt(sParts[0], 10);
      const sy = parseInt(sParts[1], 10);
      sRelease = format(1, sm, sy);
      sReturn = format(15, sm + 2, sy);
    } else {
      sReturn = 'Không xác định';
    }
  }

  const scheduledReturns = releaseSchedule.filter(row => (
    row.characterId === character.id && row.isReturn
  ))
  const scheduledTrungReturn = scheduledReturns.find(row => row.server === 'CN')
  const scheduledSeaReturn = scheduledReturns.find(row => row.server === 'SEA')
  tReturn = formatScheduleDate(scheduledTrungReturn?.date) || tReturn
  sReturn = formatScheduleDate(scheduledSeaReturn?.date) || sReturn

  // Explicit return fields take precedence over inferred dates. Null means unverified.
  if (Object.prototype.hasOwnProperty.call(character, 'returnTrung')) tReturn = character.returnTrung || pending
  if (Object.prototype.hasOwnProperty.call(character, 'returnSea')) sReturn = character.returnSea || pending

  // Explicit owner-approved ISO events override legacy/inferred fields by stable ID.
  // Other characters retain the existing legacy timeline behavior.
  const events = releaseSchedule.filter(row => row.characterId === character.id && row.source === 'owner')
  const eventDate = (server, isReturn) => formatScheduleDate(events.find(row => row.server === server && row.isReturn === isReturn)?.date)
  tRelease = eventDate('CN', false) || tRelease
  tReturn = eventDate('CN', true) || tReturn
  sRelease = eventDate('SEA', false) || sRelease
  sReturn = eventDate('SEA', true) || sReturn

  // If BOTH are completely empty, maybe we shouldn't even show the history block
  if (!trungStr && !explicitSea && events.length === 0) {
    return null; // This will hide the LỊCH SỬ block entirely
  }

  return {
    trungRelease: tRelease,
    trungReturn: tReturn,
    seaRelease: sRelease,
    seaReturn: sReturn
  }
}

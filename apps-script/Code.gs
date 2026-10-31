/**
 * אתר החתונה של רותם ואיתי — קליטת אישורי הגעה וברכות לגיליון.
 * מודבק ב: Google Sheet ← הרחבות ← Apps Script, ומפורסם כ-Web app.
 */
const RSVP_SHEET = 'אישורי הגעה';
const WISH_SHEET = 'ברכות';
const RSVP_HEAD = ['תאריך', 'שם מלא', 'טלפון', 'מצד', 'מגיעים', 'מספר אורחים', 'מנה', 'הסעה הלוך', 'הסעה חזור'];
const WISH_HEAD = ['תאריך', 'שם', 'ברכה'];
const ATTEND = { yes: 'מגיעים', maybe: 'לא בטוחים', no: 'לא מגיעים' };

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (d.website) return out_({ ok: true }); // שדה מלכודת לבוטים
    const now = new Date();
    if (d.type === 'wish') {
      if (!d.text) return out_({ ok: false });
      sheet_(WISH_SHEET, WISH_HEAD, false).appendRow([now, clean_(d.name, 80), clean_(d.text, 1500)]);
    } else {
      if (!d.name) return out_({ ok: false });
      const coming = d.attend !== 'no';
      sheet_(RSVP_SHEET, RSVP_HEAD, true).appendRow([
        now, clean_(d.name, 80), clean_(d.phone, 20), clean_(d.side, 20),
        ATTEND[d.attend] || '', coming ? Number(d.count) || 1 : 0,
        coming ? clean_(d.food, 30) : '', coming && d.busTo ? 'כן' : '', coming && d.busBack ? 'כן' : ''
      ]);
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out_({ ok: true, service: 'rotem-itai-wedding' }); }

function sheet_(name, head, useFirst) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh && useFirst) { sh = ss.getSheets()[0]; sh.setName(name); }
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(head);
  sh.setRightToLeft(true);
  sh.setFrozenRows(1);
  return sh;
}

// טקסט בלבד: מונע נוסחאות ושומר אפס מוביל בטלפון
function clean_(v, max) {
  const s = String(v == null ? '' : v).trim().slice(0, max || 200);
  return /^[=+\-@0]/.test(s) ? "'" + s : s;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

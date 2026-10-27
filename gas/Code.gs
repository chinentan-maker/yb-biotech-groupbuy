/**
 * YB Biotech 團購訂單收集。
 * 綁在 Google 試算表上，部署成網頁應用程式後，把網址填進網站 config.js 的 FORM_ENDPOINT。
 * 試算表就是 v1 後台。不要把 LINE Pay Channel Secret 寫進這個檔案或網頁。
 * 若之後要接 LINE Pay，把 Channel ID／Secret 放在「專案設定 → 指令碼內容」的指令碼屬性。
 */

var SHEET_NAME = "訂單";
var HEADERS = [
  "時間",
  "訂單編號",
  "姓名",
  "手機",
  "Email",
  "取貨方式",
  "地址門市",
  "備註",
  "品項明細",
  "合計",
  "付款方式",
  "匯款後五碼",
  "付款狀態",
  "原始 JSON",
];

function doGet() {
  return json_({ ok: true, service: "yb-groupbuy-orders" });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(15000);
    locked = true;
    var data = parseBody_(e);
    if (data.action === "linepay") {
      return json_({
        ok: false,
        error: "LINE Pay 尚未開通。需要合作商店的 Channel ID 與 Channel Secret，不能放在網頁裡。",
      });
    }
    var sheet = getOrderSheet_();
    var orderId = text_(data.orderId);
    if (orderId && alreadyStored_(sheet, orderId)) {
      return json_({ ok: true, orderId: orderId, duplicate: true });
    }
    appendOrder_(sheet, data);
    return json_({ ok: true, orderId: orderId });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("沒有收到訂單內容");
  }
  var data = JSON.parse(e.postData.contents);
  if (!data || typeof data !== "object") throw new Error("訂單格式不對");
  return data;
}

function getOrderSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else if (String(sheet.getRange(1, 1).getValue()) !== HEADERS[0]) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
  sheet.getRange(1, 4, Math.max(sheet.getMaxRows(), 2), 1).setNumberFormat("@");
  sheet.getRange(1, 12, Math.max(sheet.getMaxRows(), 2), 1).setNumberFormat("@");
  return sheet;
}

function alreadyStored_(sheet, orderId) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var values = sheet.getRange(2, 2, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i += 1) {
    if (String(values[i][0]) === orderId) return true;
  }
  return false;
}

function appendOrder_(sheet, data) {
  var buyer = data.buyer || {};
  var payment = data.payment || {};
  var method = text_(data.paymentMethod || payment.method);
  if (method !== "linepay" && method !== "transfer") method = "transfer";
  var last5 = digits_(data.transferLast5 || payment.last5);
  var status = text_(data.paymentStatus || payment.status) || statusFor_(method, last5);
  var itemsText = text_(data.itemsText);
  if (!itemsText && data.items && data.items.length) {
    itemsText = data.items
      .map(function (item) {
        return text_(item.name) + "｜" + text_(item.spec) + " × " + text_(item.qty);
      })
      .join("；");
  }
  var total = Number(data.total);
  if (!isFinite(total)) total = 0;
  var row = [
    Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss"),
    text_(data.orderId),
    text_(buyer.name),
    text_(buyer.phone),
    text_(buyer.email),
    text_(buyer.pickup),
    text_(buyer.address),
    text_(buyer.note),
    itemsText,
    total,
    method,
    last5,
    status,
    JSON.stringify(data),
  ];
  var rowIndex = sheet.getLastRow() + 1;
  var range = sheet.getRange(rowIndex, 1, 1, HEADERS.length);
  var formats = HEADERS.map(function () {
    return "@";
  });
  formats[9] = "#,##0";
  range.setNumberFormats([formats]);
  range.setValues([row]);
}

function statusFor_(method, last5) {
  if (method === "linepay") return "LINE Pay待開通";
  if (/^\d{5}$/.test(last5)) return "已匯款待確認";
  return "待付款";
}

function text_(value) {
  if (value === null || typeof value === "undefined") return "";
  return String(value);
}

function digits_(value) {
  return text_(value).replace(/\D/g, "");
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

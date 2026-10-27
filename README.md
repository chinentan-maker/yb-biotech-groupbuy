# YB Biotech 網站限定團購

益生菌／保健品的靜態團購登記頁，給 GitHub Pages 用。沒有接上表單後端時，買家可以在頁面上選品項、看合計，再複製訂單內容傳給主辦。

公開網址：<https://chinentan-maker.github.io/yb-biotech-groupbuy/>

官方商品目錄（僅供對照）：<https://www.yb-biotech.com/v2/official/SalePageCategory/394103>

## 開啟 GitHub Pages

1. 打開這個 repo 的 **Settings → Pages**。
2. **Build and deployment** 的 Source 選 **Deploy from a branch**。
3. Branch 選 **main**，資料夾選 **/ (root)**。
4. 按 **Save**。
5. 等幾分鐘，打開 <https://chinentan-maker.github.io/yb-biotech-groupbuy/> 。

頁面檔在 repo 根目錄，入口是 `index.html`。已放 `.nojekyll`，避免 GitHub 用 Jekyll 改寫靜態檔。

## 改價格與品項

只改 [`config.js`](config.js)。

- 單品的 `price` 是團購價，`listPrice` 是建議售價。
- 組合的 `price` 是組合團購價。
- 組合的 `includes` 用來算出「單買團購價」，方便跟組合價對照。單品調價後，這行對照會跟著變；組合價本身仍看該組合的 `price`。
- `badge` 目前只有捷思敏標「即期品」。

改完後 commit，推上 `main`。Pages 會用新的 `main` 重新發布。

開團／結單日期在 [`index.html`](index.html) 的「開團／結單日期待補」。日期還沒公布就不要填。運費與付款方式也先留著「待主辦確認」，不要自己寫規則。

## 接上表單後端

同樣改 [`config.js`](config.js) 最上面兩行：

```js
ORGANIZER_EMAIL: "",
FORM_ENDPOINT: "",
```

兩個都留空時是草稿模式：按「送出訂單」只會在頁面上產生訂單摘要，不會把資料送到別的地方。買家用「複製訂單內容」傳給主辦。

`ORGANIZER_EMAIL` 有填時，成功頁會多一顆「用 Email 開啟」。它只打開郵件軟體，不會自動寄出。

`FORM_ENDPOINT` 有填、而且是 http(s) 網址時，送出後會另外 POST 一份 JSON。無論送出成功或失敗，頁面都會留下完整摘要，可以複製。

這兩個值會出現在公開網頁的原始碼裡。只填本來就公開的表單位址，不要填 API 金鑰。

請不要把內部銷售報表網址放上這個網站，也不要連到其他團購站。

### Formspree

1. 到 [Formspree](https://formspree.io) 建立一個 form。
2. 複製類似 `https://formspree.io/f/xxxxxxxx` 的網址，貼進 `FORM_ENDPOINT`。
3. 推上 `main`。

網站會以 `application/json` 送出，內容包含 `orderText`（純文字訂單）和 `buyer`。Formspree 的通知信可以用 `_subject` 當主旨。

### Google Apps Script

1. 新增試算表，擴充功能 → Apps Script。
2. 貼上下面的 `doPost`，部署為「網頁應用程式」。執行身分選自己，存取權選「任何人」。
3. 把部署後的網址貼進 `FORM_ENDPOINT`，推上 `main`。
4. 之後若改了指令碼，要重新部署，網址才會更新。

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var buyer = data.buyer || {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("訂單");
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("訂單");
  sheet.appendRow([
    new Date(),
    data.orderId,
    data.total,
    buyer.name,
    buyer.phone,
    buyer.email,
    buyer.pickup,
    buyer.address,
    buyer.note,
    data.orderText,
  ]);
  return ContentService.createTextOutput("ok");
}
```

網站對 `script.google.com` 會用 `text/plain` 送出 JSON，並採用 `no-cors`，這樣瀏覽器比較不會被預檢擋住。因此頁面無法確認試算表是否真的寫入，主辦要自己看試算表，或請買家同時複製訂單內容。

## 本機預覽

在這個資料夾執行：

```bash
python3 -m http.server 8080
```

然後打開 <http://localhost:8080> 。請用本機伺服器，不要直接點開檔案，否則相對路徑可能對不到。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 頁面、日期占位、訂購表單 |
| `styles.css` | 樣式 |
| `app.js` | 數量、合計、驗證、訂單摘要、複製、表單送出 |
| `config.js` | 價格、品項、`ORGANIZER_EMAIL`、`FORM_ENDPOINT` |
| `favicon.svg` | 分頁圖示 |
| `.nojekyll` | 讓 Pages 不要跑 Jekyll |

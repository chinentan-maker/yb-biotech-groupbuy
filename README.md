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
- `intro`、`points`、`audience` 是卡片上的短介紹。只改寫官方或公開商品頁已經寫過的內容，不要自己加療效。
- `image` 或組合的 `images` 指向 `images/` 裡的檔案。照片取自勉益康／YB Biotech 官方商品頁，換圖時請一併改頁尾那句出處。

上方「你最近比較在意什麼？」的對應寫在 `app.js` 的 `recommendations`：

| 點選 | 建議 |
| --- | --- |
| 容易累、想顧防護力 | 益遼養 40g |
| 想更專注清楚 | 捷思敏 |
| 用眼過度 | 明舒清 |
| 季節或環境敏感 | 敏舒通 |
| 腸胃敏感 | 常益舒 |
| 用眼＋腸胃 | 明舒清 1盒 + 常益舒小包（2100） |
| 用眼＋敏感 | 明舒清 1盒 + 敏舒通小包（2100） |
| 用眼＋腸胃＋敏感 | 明舒清一盒，再加常益舒、敏舒通各一個小包，避免兩盒明舒清 |

一次最多推兩組。

改完後 commit，推上 `main`。Pages 會用新的 `main` 重新發布。

開團／結單日期在 [`index.html`](index.html) 的「開團／結單日期待補」。日期還沒公布就不要填。運費仍寫「待主辦確認」，不要自己寫運費規則。付款可以選匯款；LINE Pay 先顯示即將開通。

## 訂單後端：Google 表單

現在的正式後端是 Google 表單，不是 Apps Script。手機上的兩步驟驗證沒通過，所以不要把 `FORM_ENDPOINT` 改成 `script.google.com`。

`config.js` 已指向表單的 `formResponse`。買家送出後，回覆進試算表分頁 **表單回覆 1**。那份試算表就是後台。瀏覽器用 `no-cors` 送出，頁面讀不到 Google 的回應，但會在畫面上留下訂單編號。請到「表單回覆 1」對編號。

送出的是表單欄位，不是 JSON 本文：

| 欄位 | entry |
| --- | --- |
| 訂單編號 | entry.32350466 |
| 姓名 | entry.262018061 |
| 手機 | entry.721558691 |
| Email | entry.2034499457 |
| 取貨方式 | entry.710543867 |
| 地址門市 | entry.1337893738 |
| 備註 | entry.208111820 |
| 品項明細 | entry.948746764 |
| 合計 | entry.1721803060 |
| 付款方式 | entry.1755368478 |
| 匯款後五碼 | entry.1832827254 |
| 付款狀態 | entry.154754757 |
| 原始 JSON | entry.970606615 |

付款方式寫 `transfer`（匯款）或 `linepay`。付款狀態：

- 匯款、沒填後五碼：**待付款**
- 匯款、有 5 碼：**已匯款待確認**
- LINE Pay：**LINE Pay待開通**

對過帳之後，在試算表把該列改成 **已付款**。網站不會自動改這格。

### config.js

```js
FORM_ENDPOINT: "https://docs.google.com/forms/d/e/…/formResponse",
FORM_TYPE: "google-form",
LINEPAY_ENABLED: false,
BANK_NAME: "",
BANK_CODE: "",
ACCOUNT_NAME: "",
ACCOUNT_NUMBER: "",
```

- `FORM_TYPE` 為 `google-form` 時，一定用上面的 entry 欄位。網址裡有 `formResponse` 時也會走這條。
- 銀行四格維持空白，頁面顯示「收款帳戶待主辦填入」。不要填假帳號。
- `LINEPAY_ENABLED` 維持 `false`。
- 不要把 Channel Secret 或試算表編輯連結放進這個檔案。

`gas/` 留著當以後改接 Apps Script 的備案，現在不要部署、也不要把它的網址寫進 `FORM_ENDPOINT`。

### LINE Pay 還沒做

LINE Pay Online API 要用 Channel Secret 做 HMAC，密鑰不能放在 GitHub Pages。商家還要先申請 LINE Pay 合作商店；審核大約 5 到 15 個工作天。誰的商家帳號負責收款，目前還在確認。

現在頁面只把 LINE Pay 顯示成「即將開通」。等有 Channel ID／Secret 之後，由伺服器簽名。不要把密鑰寫進這個 repo。

請不要把內部銷售報表網址放上這個網站，也不要連到其他團購站。

## 本機預覽

在這個資料夾執行：

```bash
python3 -m http.server 8080
```

然後打開 <http://localhost:8080> 。請用本機伺服器，不要直接點開檔案，否則相對路徑可能對不到。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 頁面、日期占位、需求小測驗、訂購與匯款表單 |
| `styles.css` | 樣式 |
| `app.js` | 數量、合計、需求建議、驗證、訂單摘要、付款、複製、表單送出 |
| `config.js` | 價格、品項、表單網址、匯款帳戶、`LINEPAY_ENABLED` |
| `gas/Code.gs` | 備用。現在不要部署；正式訂單走 Google 表單 |
| `gas/README.md` | Apps Script 備案說明。線上後端不是這份 |
| `images/` | 官方商品照片與缺圖占位 |
| `favicon.svg` | 分頁圖示 |
| `.nojekyll` | 讓 Pages 不要跑 Jekyll |

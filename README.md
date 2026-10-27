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

## 接上 Google 試算表

訂單後端用 [`gas/Code.gs`](gas/Code.gs)。試算表就是第一版後台，不必另做密碼頁。完整點選步驟也寫在 [`gas/README.md`](gas/README.md)。

1. 新增一個 Google 試算表。**檔案 → 設定**，時區選台北。
2. **擴充功能 → Apps Script**。
3. 把 `gas/Code.gs` 全部貼進指令碼編輯器，儲存。
4. **部署 → 新增部署 → 網頁應用程式**。
5. 執行身分選 **我**，存取權選 **任何人**。
6. 部署並授權。複製以 `/exec` 結尾的網址。
7. 用瀏覽器打開該網址，確認出現 `{"ok":true,"service":"yb-groupbuy-orders"}`。
8. 把網址貼進 `config.js` 的 `FORM_ENDPOINT`，推上 `main`。
9. 下了一筆測試單後，回到試算表的「訂單」工作表看有沒有新列。

改了指令碼要重新部署新版本，已經公開的網址才會更新。

網站對 `script.google.com` 用 `text/plain` 與 `no-cors` 送出，避免瀏覽器預檢被擋。因此頁面不能確認試算表真的寫入，主辦要看試算表。買家頁面上仍有訂單編號，可以複製。

### config.js 要填的值

```js
ORGANIZER_EMAIL: "",
FORM_ENDPOINT: "",
LINEPAY_ENABLED: false,
BANK_NAME: "",
BANK_CODE: "",
ACCOUNT_NAME: "",
ACCOUNT_NUMBER: "",
```

- `FORM_ENDPOINT`：上一步的 Apps Script `/exec` 網址。留空就是草稿，訂單只留在頁面上。
- `ORGANIZER_EMAIL`：有填才出現「用 Email 開啟」。
- `BANK_NAME`、`BANK_CODE`、`ACCOUNT_NAME`、`ACCOUNT_NUMBER`：匯款帳戶。四個都留空時，頁面顯示「收款帳戶待主辦填入」。不要先填假帳號。
- `LINEPAY_ENABLED`：維持 `false`。改成 `true` 只會讓買家選到 LINE Pay，仍然不會扣款，訂單狀態是「LINE Pay待開通」。

這些字會出現在公開網頁。不要把 Channel Secret、API 金鑰或試算表編輯連結放進來。

### 後台怎麼看訂單

打開那份 Google 試算表的「訂單」工作表即可。欄位是：時間、訂單編號、姓名、手機、Email、取貨方式、地址門市、備註、品項明細、合計、付款方式（`transfer` 或 `linepay`）、匯款後五碼、付款狀態、原始 JSON。

付款狀態：

- 匯款、沒填後五碼：**待付款**
- 匯款、有 5 碼：**已匯款待確認**
- LINE Pay：**LINE Pay待開通**

對過帳之後，把該列改成 **已付款**。網站不會自動改這格。

### LINE Pay 還沒做

LINE Pay Online API 要用 Channel Secret 做 HMAC，密鑰不能放在 GitHub Pages。商家還要先申請 LINE Pay 合作商店；網路店面需要真正能下單的網站，審核大約 5 到 15 個工作天。誰的商家帳號負責收款，目前還在確認。

現在頁面只把 LINE Pay 顯示成「即將開通」。等有 Channel ID／Secret 之後，把密鑰放在 Apps Script 的指令碼屬性（或另做 Cloudflare Worker），由伺服器簽名。不要把密鑰寫進這個 repo。

### Formspree

若暫不用試算表，也可以把 Formspree 網址貼進 `FORM_ENDPOINT`。網站會以 JSON 送出 `orderText`、`buyer`、`paymentMethod`、`transferLast5`、`paymentStatus`。Formspree 不會長出上面那份欄位，對帳還是試算表比較清楚。

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
| `gas/Code.gs` | 把訂單寫進 Google 試算表的 Apps Script |
| `gas/README.md` | 部署試算表後端的步驟 |
| `images/` | 官方商品照片與缺圖占位 |
| `favicon.svg` | 分頁圖示 |
| `.nojekyll` | 讓 Pages 不要跑 Jekyll |

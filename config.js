// 改團購價、建議售價、組合價、短介紹，以及之後的表單後端，都在這個檔案。
// 商品照片在 images/，取自勉益康／YB Biotech 官方商品頁。介紹只改寫公開頁已寫的內容。
// 改完推上 main，GitHub Pages 會更新。
//
// ORGANIZER_EMAIL：主辦信箱。留空則成功頁不顯示 Email 按鈕。
// FORM_ENDPOINT：現在接 Google 表單的 formResponse。留空才是草稿模式。
// FORM_TYPE："google-form" 時用 entry.* 欄位送出，不是 JSON，也不是 Apps Script。
// 這些值會出現在公開網頁裡。只填公開的表單位址與收款帳戶，不要填金鑰。
// LINE Pay 的 Channel Secret 不能寫在這個檔案。LINEPAY_ENABLED 維持 false，
// 直到商家審核通過，並且另有伺服器能簽名，再改成 true。

window.YB_CONFIG = {
  ORGANIZER_EMAIL: "",
  FORM_ENDPOINT: "https://docs.google.com/forms/d/e/1FAIpQLScmhnOKz_y5oWBbyFpJ450v1ApWNZzHjwoUEB9sDPnJEbzc-A/formResponse",
  FORM_TYPE: "google-form",
  LINEPAY_ENABLED: false,
  BANK_NAME: "",
  BANK_CODE: "",
  ACCOUNT_NAME: "",
  ACCOUNT_NUMBER: "",

  products: [
    {
      id: "yiliaoyang-40",
      name: "益遼養",
      spec: "一盒 40g",
      listPrice: 5120,
      price: 4000,
      image: "images/yiliaoyang-40.jpg",
      intro: "鹿角靈芝萃取的 LZDCH 活醣肽，官方定位是病後補養、提升防護力。",
      points: "公開頁強調胜肽與多醣、分子小，用來調節生理機能、調整體質。",
      audience: "病後或日常想補養、在意防護力的人。",
    },
    {
      id: "yiliaoyang-sachets",
      name: "益遼養",
      spec: "一盒 2g×10包",
      listPrice: 2600,
      price: 2000,
      image: "images/yiliaoyang-sachets.jpg",
      intro: "和 40g 瓶裝同一條益遼養，改成 2g 小包，方便先從較小份量開始。",
      points: "同樣是 LZDCH 活醣肽靈芝萃取，官方定位病後補養、提升防護力。",
      audience: "想先試小包，或在意防護力的人。",
    },
    {
      id: "jiesimin-60",
      name: "捷思敏",
      spec: "一盒 60粒",
      listPrice: 3180,
      price: 1600,
      badge: "即期品",
      image: "images/jiesimin-60.jpg",
      intro: "磷脂醯絲胺酸、鎂與 LZDCH 活醣肽，官方用來維持思緒清晰。",
      points: "公開頁寫的是支持專注與記憶力，並舒緩精神疲勞、大腦「當機」感。",
      audience: "在意學習吸收、工作時的判斷，或熟齡記憶力的人。",
    },
    {
      id: "mingshuqing-30",
      name: "明舒清",
      spec: "一盒 30粒",
      listPrice: 1980,
      price: 1600,
      image: "images/mingshuqing-30.jpg",
      intro: "游離型葉黃素、玉米黃素與 LZDCH 活醣肽，官方訴求晶亮、清晰。",
      points: "公開頁寫葉黃素與玉米黃素比例 10:2，來源包含金盞花等萃取，方向是明亮、舒適。",
      audience: "上班族、3C 使用者、銀髮族、學生。",
    },
    {
      id: "minshutong-30",
      name: "敏舒通",
      spec: "一盒 30粒",
      listPrice: 1980,
      price: 1600,
      image: "images/minshutong-30.jpg",
      intro: "以 LZDCH 活醣肽為主，官方訴求對抗敏感、驅源復適。",
      points: "公開商品頁寫給在意體質，或因環境、溫差變化感到敏感的人。",
      audience: "對環境或溫差變化較敏感的人。",
    },
    {
      id: "minshutong-10",
      name: "敏舒通",
      spec: "一包 10粒",
      listPrice: 880,
      price: 700,
      image: "images/minshutong-10.jpg",
      intro: "和盒裝同一條敏舒通，10 粒隨手包。",
      points: "同樣以 LZDCH 活醣肽為主，官方訴求對抗敏感、驅源復適。",
      audience: "想先帶小包裝、對環境或溫差變化較敏感的人。",
    },
    {
      id: "changyishu-30",
      name: "常益舒",
      spec: "一盒 30粒",
      listPrice: 1880,
      price: 1600,
      image: "images/changyishu-30.jpg",
      intro: "Lynside® Pro SCB 專利布拉迪酵母益生菌，官方用來舒緩腸道敏感。",
      points: "官方說明這類布拉迪酵母不受抗生素破壞，並搭配 LZDCH，幫助維持消化道機能。",
      audience: "腸道較敏感、在意消化道機能的人。",
    },
    {
      id: "changyishu-10",
      name: "常益舒",
      spec: "一包 10粒",
      listPrice: 850,
      price: 680,
      image: "images/changyishu-10.jpg",
      intro: "和盒裝同一條常益舒，10 粒隨手包。",
      points: "同樣是 Lynside® Pro SCB 布拉迪酵母，官方寫不受抗生素破壞，幫助維持消化道機能。",
      audience: "腸道較敏感、想先帶小包的人。",
    },
  ],

  bundles: [
    {
      id: "bundle-ming-chang",
      name: "明舒清 1盒 + 常益舒小包",
      spec: "明舒清 1 盒 ＋ 常益舒 10 粒",
      price: 2100,
      images: ["images/mingshuqing-30.jpg", "images/changyishu-10.jpg"],
      intro: "明舒清一盒，配常益舒 10 粒小包。",
      points: "明舒清走晶亮、舒適；常益舒走腸道敏感與消化道機能。",
      audience: "同時在意用眼和腸胃的人。",
      includes: [
        { productId: "mingshuqing-30", qty: 1 },
        { productId: "changyishu-10", qty: 1 },
      ],
    },
    {
      id: "bundle-ming-min",
      name: "明舒清 1盒 + 敏舒通小包",
      spec: "明舒清 1 盒 ＋ 敏舒通 10 粒",
      price: 2100,
      images: ["images/mingshuqing-30.jpg", "images/minshutong-10.jpg"],
      intro: "明舒清一盒，配敏舒通 10 粒小包。",
      points: "明舒清走晶亮、舒適；敏舒通走環境或溫差帶來的敏感。",
      audience: "同時在意用眼和敏感的人。",
      includes: [
        { productId: "mingshuqing-30", qty: 1 },
        { productId: "minshutong-10", qty: 1 },
      ],
    },
  ],
};

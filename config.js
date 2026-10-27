// 改團購價、建議售價、組合價，以及之後的表單後端，都在這個檔案。
// 改完推上 main，GitHub Pages 會更新。
//
// ORGANIZER_EMAIL：主辦信箱。留空則成功頁不顯示 Email 按鈕。
// FORM_ENDPOINT：留空代表草稿模式，訂單只在頁面上產生，不會自動送出。
//   Formspree 例：https://formspree.io/f/xxxxxxxx
//   Google Apps Script 網頁應用程式網址也可以。
// 這兩個值會出現在公開網頁裡，請只填本來就打算公開的表單位址，不要填金鑰。

window.YB_CONFIG = {
  ORGANIZER_EMAIL: "",
  FORM_ENDPOINT: "",

  products: [
    {
      id: "yiliaoyang-40",
      name: "益遼養",
      spec: "一盒 40g",
      listPrice: 5120,
      price: 4000,
    },
    {
      id: "yiliaoyang-sachets",
      name: "益遼養",
      spec: "一盒 2g×10包",
      listPrice: 2600,
      price: 2000,
    },
    {
      id: "jiesimin-60",
      name: "捷思敏",
      spec: "一盒 60粒",
      listPrice: 3180,
      price: 1600,
      badge: "即期品",
    },
    {
      id: "mingshuqing-30",
      name: "明舒清",
      spec: "一盒 30粒",
      listPrice: 1980,
      price: 1600,
    },
    {
      id: "minshutong-30",
      name: "敏舒通",
      spec: "一盒 30粒",
      listPrice: 1980,
      price: 1600,
    },
    {
      id: "minshutong-10",
      name: "敏舒通",
      spec: "一包 10粒",
      listPrice: 880,
      price: 700,
    },
    {
      id: "changyishu-30",
      name: "常益舒",
      spec: "一盒 30粒",
      listPrice: 1880,
      price: 1600,
    },
    {
      id: "changyishu-10",
      name: "常益舒",
      spec: "一包 10粒",
      listPrice: 850,
      price: 680,
    },
  ],

  bundles: [
    {
      id: "bundle-ming-chang",
      name: "明舒清 1盒 + 常益舒小包",
      spec: "明舒清 1 盒 ＋ 常益舒 10 粒",
      price: 2100,
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
      includes: [
        { productId: "mingshuqing-30", qty: 1 },
        { productId: "minshutong-10", qty: 1 },
      ],
    },
  ],
};

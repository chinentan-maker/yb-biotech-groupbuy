(function () {
  var config = window.YB_CONFIG;
  var productList = document.getElementById("product-list");
  var bundleList = document.getElementById("bundle-list");

  if (!config || !Array.isArray(config.products) || !Array.isArray(config.bundles)) {
    if (productList) {
      productList.textContent = "商品資料沒有載入。請確認 config.js 有跟頁面放在一起。";
    }
    return;
  }

  var STORAGE_KEY = "yb-groupbuy-draft-v1";
  var MAX_QTY = 99;
  var products = config.products;
  var bundles = config.bundles;
  var catalog = products.concat(bundles);
  var productById = {};
  products.forEach(function (product) {
    productById[product.id] = product;
  });

  var state = { qty: {} };
  catalog.forEach(function (item) {
    state.qty[item.id] = 0;
  });

  var editor = document.getElementById("order-editor");
  var form = document.getElementById("order-form");
  var success = document.getElementById("success");
  var formError = document.getElementById("form-error");
  var cartLines = document.getElementById("cart-lines");
  var cartTotal = document.getElementById("cart-total");
  var cartCount = document.getElementById("cart-count");
  var dockCount = document.getElementById("dock-count");
  var dockTotal = document.getElementById("dock-total");
  var dockJump = document.getElementById("dock-jump");
  var submitButton = document.getElementById("submit-order");
  var copyStatus = document.getElementById("copy-status");
  var plainDetails = document.getElementById("plain-text-details");
  var addressInput = document.getElementById("buyer-address");
  var addressHint = document.getElementById("address-hint");
  var latestOrder = null;

  function formatNT(amount) {
    var n = Math.round(Number(amount) || 0);
    var body = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return "NT$ " + (n < 0 ? "-" : "") + body;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseQty(value) {
    if (value === "" || value === null || typeof value === "undefined") return 0;
    var n = Number(value);
    if (!isFinite(n)) return 0;
    n = Math.floor(n);
    if (n < 0) return 0;
    if (n > MAX_QTY) return MAX_QTY;
    return n;
  }

  function separateTotal(bundle) {
    if (!bundle.includes || !bundle.includes.length) return null;
    var sum = 0;
    for (var i = 0; i < bundle.includes.length; i += 1) {
      var part = bundle.includes[i];
      var product = productById[part.productId];
      if (!product) return null;
      sum += product.price * part.qty;
    }
    return sum;
  }

  function cardHtml(item, kind) {
    var compare = "";
    var save = "";
    if (kind === "bundle") {
      var alone = separateTotal(item);
      if (alone && alone > item.price) {
        compare =
          '<p class="list-price"><s>單買團購價 ' + formatNT(alone) + "</s></p>";
        save = '<p class="save">組合少 ' + formatNT(alone - item.price) + "</p>";
      }
    } else if (item.listPrice && item.listPrice > item.price) {
      compare =
        '<p class="list-price"><s>建議售價 ' + formatNT(item.listPrice) + "</s></p>";
    }

    var badge = item.badge
      ? '<span class="badge">' + escapeHtml(item.badge) + "</span>"
      : "";
    var label = item.name + "，" + item.spec;
    var sources = item.images || (item.image ? [item.image] : ["images/placeholder.svg"]);
    var photos = sources
      .map(function (src) {
        return (
          '<img src="' +
          escapeHtml(src) +
          '" alt="' +
          escapeHtml(label) +
          '" onerror="this.onerror=null;this.src=\'images/placeholder.svg\';this.parentElement.classList.add(\'is-fallback\');" />'
        );
      })
      .join("");
    var copy = "";
    if (item.intro) copy += '<p class="intro">' + escapeHtml(item.intro) + "</p>";
    if (item.points) copy += '<p class="points">' + escapeHtml(item.points) + "</p>";
    if (item.audience) {
      copy +=
        '<details class="who"><summary>適合誰</summary><p>適合：' +
        escapeHtml(item.audience) +
        "</p></details>";
    }

    return (
      '<article class="card" data-id="' +
      escapeHtml(item.id) +
      '" data-on="false" data-price="' +
      item.price +
      '"' +
      (item.listPrice ? ' data-list-price="' + item.listPrice + '"' : "") +
      ">" +
      '<div class="photo-frame' +
      (sources.length > 1 ? " duo" : "") +
      '">' +
      photos +
      badge +
      '<p class="photo-note">官方商品圖沒載入，先顯示占位。</p></div>' +
      '<div class="card-copy"><div class="title-row"><h3>' +
      escapeHtml(item.name) +
      "</h3></div><p class=\"spec\">" +
      escapeHtml(item.spec) +
      "</p>" +
      copy +
      "</div>" +
      '<div class="buy"><div class="prices">' +
      compare +
      '<p class="sale"><span class="sale-label">團購價</span> <strong>' +
      formatNT(item.price) +
      "</strong></p>" +
      save +
      '</div><div class="stepper">' +
      '<button type="button" data-id="' +
      escapeHtml(item.id) +
      '" data-step="-1" aria-label="減少「' +
      escapeHtml(label) +
      '」的數量" disabled>−</button>' +
      '<input data-qty="' +
      escapeHtml(item.id) +
      '" type="number" inputmode="numeric" min="0" max="' +
      MAX_QTY +
      '" value="0" aria-label="' +
      escapeHtml(label) +
      '數量" />' +
      '<button type="button" data-id="' +
      escapeHtml(item.id) +
      '" data-step="1" aria-label="增加「' +
      escapeHtml(label) +
      '」的數量">+</button>' +
      "</div></div></article>"
    );
  }

  productList.innerHTML = products
    .map(function (item) {
      return cardHtml(item, "product");
    })
    .join("");
  bundleList.innerHTML = bundles
    .map(function (item) {
      return cardHtml(item, "bundle");
    })
    .join("");

  function itemById(id) {
    for (var i = 0; i < catalog.length; i += 1) {
      if (catalog[i].id === id) return catalog[i];
    }
    return null;
  }

  function getItems() {
    return catalog
      .filter(function (item) {
        return state.qty[item.id] > 0;
      })
      .map(function (item) {
        var qty = state.qty[item.id];
        return {
          id: item.id,
          name: item.name,
          spec: item.spec,
          qty: qty,
          unitPrice: item.price,
          lineTotal: item.price * qty,
        };
      });
  }

  function piecesOf(items) {
    return items.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function totalOf(items) {
    return items.reduce(function (sum, item) {
      return sum + item.lineTotal;
    }, 0);
  }

  function qtyInputs(id) {
    return Array.prototype.filter.call(document.querySelectorAll("[data-qty]"), function (input) {
      return input.getAttribute("data-qty") === id;
    });
  }

  function setQty(id, value, options) {
    var opts = options || {};
    if (!itemById(id)) return;
    var qty = parseQty(value);
    state.qty[id] = qty;
    qtyInputs(id).forEach(function (input) {
      if (opts.keepFocusValue && document.activeElement === input) return;
      input.value = String(qty);
    });
    var card = document.querySelector('.card[data-id="' + id + '"]');
    if (card) {
      card.setAttribute("data-on", qty > 0 ? "true" : "false");
      var minus = card.querySelector('[data-step="-1"]');
      var plus = card.querySelector('[data-step="1"]');
      if (minus) minus.disabled = qty <= 0;
      if (plus) plus.disabled = qty >= MAX_QTY;
    }
    renderCart();
    if (!opts.skipSave) saveDraft();
  }

  function renderCart() {
    var items = getItems();
    var total = totalOf(items);
    var pieces = piecesOf(items);
    cartCount.textContent = "共 " + pieces + " 件";
    dockCount.textContent = "共 " + pieces + " 件";
    cartTotal.textContent = formatNT(total);
    dockTotal.textContent = formatNT(total);
    if (!success.hidden) dockJump.textContent = "查看訂單";
    else if (pieces > 0) dockJump.textContent = "去下單";
    else dockJump.textContent = "去填資料";

    if (!items.length) {
      cartLines.innerHTML = '<p class="empty">還沒有選商品。</p>';
      return;
    }

    cartLines.innerHTML = items
      .map(function (item) {
        return (
          '<div class="line"><div><p class="line-name">' +
          escapeHtml(item.name) +
          '</p><p class="line-spec">' +
          escapeHtml(item.spec) +
          " × " +
          item.qty +
          '</p></div><p class="line-price">' +
          formatNT(item.lineTotal) +
          "</p></div>"
        );
      })
      .join("");
  }

  function fieldValue(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function normalizePhone(value) {
    var digits = String(value).trim();
    digits = digits.replace(/[０-９]/g, function (ch) {
      return String(ch.charCodeAt(0) - 65296);
    });
    digits = digits.replace(/[\s\-]/g, "");
    if (digits.indexOf("+886") === 0) digits = "0" + digits.slice(4);
    else if (digits.indexOf("886") === 0) digits = "0" + digits.slice(3);
    return digits;
  }

  function readFields() {
    var pickup = "";
    var selected = form.querySelector('input[name="pickup"]:checked');
    if (selected) pickup = selected.value;
    return {
      name: fieldValue("buyer-name"),
      phone: normalizePhone(fieldValue("buyer-phone")),
      email: fieldValue("buyer-email"),
      pickup: pickup,
      address: fieldValue("buyer-address"),
      note: fieldValue("buyer-note"),
    };
  }

  function validate(fields, items) {
    var errors = [];
    if (!items.length) errors.push({ id: "items", message: "請至少選擇一項商品。" });
    if (!fields.name) errors.push({ id: "buyer-name", message: "請填姓名。" });
    if (!fields.phone) errors.push({ id: "buyer-phone", message: "請填手機。" });
    else if (!/^09\d{8}$/.test(fields.phone)) {
      errors.push({ id: "buyer-phone", message: "請填台灣手機，例如 0912345678。" });
    }
    if (!fields.email) errors.push({ id: "buyer-email", message: "請填 Email。" });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors.push({ id: "buyer-email", message: "Email 格式看起來不完整。" });
    }
    if (fields.pickup !== "宅配" && fields.pickup !== "超商") {
      errors.push({ id: "pickup", message: "請選擇宅配或超商。" });
    }
    if (!fields.address) errors.push({ id: "buyer-address", message: "請填地址或門市。" });
    return errors;
  }

  function clearFieldErrors() {
    formError.hidden = true;
    formError.innerHTML = "";
    ["buyer-name", "buyer-phone", "buyer-email", "buyer-address", "buyer-note"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.removeAttribute("aria-invalid");
    });
  }

  function showErrors(errors) {
    formError.hidden = false;
    formError.innerHTML =
      "<ul>" +
      errors
        .map(function (error) {
          return "<li>" + escapeHtml(error.message) + "</li>";
        })
        .join("") +
      "</ul>";
    errors.forEach(function (error) {
      var el = document.getElementById(error.id);
      if (el) el.setAttribute("aria-invalid", "true");
    });
    formError.scrollIntoView({ block: "center", behavior: motion() });
  }

  function twoDigits(value) {
    var text = String(value || "0");
    return text.length >= 2 ? text : "0" + text;
  }

  function taipeiParts(date) {
    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    var map = {};
    parts.forEach(function (part) {
      if (part.type !== "literal") map[part.type] = part.value;
    });
    if (map.hour === "24") map.hour = "00";
    map.month = twoDigits(map.month);
    map.day = twoDigits(map.day);
    map.hour = twoDigits(map.hour);
    map.minute = twoDigits(map.minute);
    return map;
  }

  function makeOrderId(date) {
    var map = taipeiParts(date);
    var rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "YG-" + map.year + map.month + map.day + "-" + rand;
  }

  function formatOrderText(order) {
    var lines = [
      "YB Biotech 網站限定團購",
      "訂單編號：" + order.id,
      "時間：" + order.stamp,
      "",
      "【品項】",
    ];
    order.items.forEach(function (item, index) {
      lines.push(
        index +
          1 +
          ". " +
          item.name +
          "｜" +
          item.spec +
          " × " +
          item.qty +
          " = " +
          formatNT(item.lineTotal)
      );
    });
    lines.push(
      "",
      "商品合計：" + formatNT(order.total),
      "運費與付款方式：待主辦確認",
      "",
      "【訂購人】",
      "姓名：" + order.buyer.name,
      "手機：" + order.buyer.phone,
      "Email：" + order.buyer.email,
      "取貨方式：" + order.buyer.pickup,
      "地址或門市：" + order.buyer.address,
      "備註：" + (order.buyer.note || "無")
    );
    return lines.join("\n");
  }

  function endpointUrl() {
    return String(config.FORM_ENDPOINT || "").trim();
  }

  function organizerEmail() {
    return String(config.ORGANIZER_EMAIL || "").trim();
  }

  function isHttpUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (error) {
      return false;
    }
  }

  function isGoogleScript(value) {
    return /script\.google\.com|script\.googleusercontent\.com/.test(value);
  }

  function buildOrder() {
    var items = getItems();
    var now = new Date();
    var map = taipeiParts(now);
    var order = {
      id: makeOrderId(now),
      stamp: map.year + "/" + map.month + "/" + map.day + " " + map.hour + ":" + map.minute + "（台北時間）",
      items: items,
      total: totalOf(items),
      buyer: readFields(),
    };
    order.text = formatOrderText(order);
    return order;
  }

  function addBuyerRow(dl, label, value) {
    var wrap = document.createElement("div");
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    wrap.appendChild(dt);
    wrap.appendChild(dd);
    dl.appendChild(wrap);
  }

  function fillSummary(order) {
    document.getElementById("summary-id").textContent = "訂單編號 " + order.id;
    document.getElementById("summary-time").textContent = order.stamp;
    document.getElementById("summary-total").textContent = formatNT(order.total);
    document.getElementById("summary-text").textContent = order.text;

    var list = document.getElementById("summary-items");
    list.textContent = "";
    order.items.forEach(function (item) {
      var li = document.createElement("li");
      var main = document.createElement("div");
      var name = document.createElement("p");
      var spec = document.createElement("p");
      var price = document.createElement("p");
      name.className = "line-name";
      name.textContent = item.name;
      spec.className = "line-spec";
      spec.textContent = item.spec + " × " + item.qty;
      price.className = "line-price";
      price.textContent = formatNT(item.lineTotal);
      main.appendChild(name);
      main.appendChild(spec);
      li.appendChild(main);
      li.appendChild(price);
      list.appendChild(li);
    });

    var buyer = document.getElementById("summary-buyer");
    buyer.textContent = "";
    addBuyerRow(buyer, "姓名", order.buyer.name);
    addBuyerRow(buyer, "手機", order.buyer.phone);
    addBuyerRow(buyer, "Email", order.buyer.email);
    addBuyerRow(buyer, "取貨方式", order.buyer.pickup);
    addBuyerRow(buyer, "地址或門市", order.buyer.address);
    addBuyerRow(buyer, "備註", order.buyer.note || "無");

    var mail = document.getElementById("mailto-link");
    var email = organizerEmail();
    if (email) {
      mail.hidden = false;
      mail.href =
        "mailto:" +
        encodeURIComponent(email) +
        "?subject=" +
        encodeURIComponent("YB Biotech 團購訂單 " + order.id) +
        "&body=" +
        encodeURIComponent(order.text);
    } else {
      mail.hidden = true;
      mail.removeAttribute("href");
    }
  }

  function motion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  function showSuccess(message) {
    document.getElementById("send-status").textContent = message;
    copyStatus.textContent = "";
    plainDetails.open = false;
    editor.hidden = true;
    success.hidden = false;
    renderCart();
    var heading = document.getElementById("success-heading");
    success.scrollIntoView({ block: "start", behavior: motion() });
    heading.focus();
  }

  function showEditor() {
    success.hidden = true;
    editor.hidden = false;
    renderCart();
    document.getElementById("order-heading").scrollIntoView({ block: "start", behavior: motion() });
  }

  async function sendOrder(order) {
    var endpoint = endpointUrl();
    if (!endpoint) {
      return "這是網站草稿，訂單沒有自動送出。請複製內容傳給主辦。";
    }
    if (!isHttpUrl(endpoint)) {
      return "表單網址還沒設好，訂單沒有送出。請複製內容傳給主辦。";
    }

    var payload = {
      orderId: order.id,
      createdAt: order.stamp,
      items: order.items,
      total: order.total,
      buyer: order.buyer,
      orderText: order.text,
      organizerEmail: organizerEmail(),
      _subject: "YB Biotech 團購訂單 " + order.id,
    };

    var signal =
      typeof AbortSignal !== "undefined" && AbortSignal.timeout
        ? AbortSignal.timeout(12000)
        : undefined;
    try {
      if (isGoogleScript(endpoint)) {
        await fetch(endpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
          signal: signal,
        });
        return "已送出到表單網址。這個網址不會回傳結果，請主辦確認有收到，或先複製內容。";
      }

      var response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: signal,
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      return "訂單已送到表單後端。建議仍複製一份內容留存。";
    } catch (error) {
      return "自動送出沒有成功。訂單還在這頁，請複製內容傳給主辦。";
    }
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      /* 改用選取複製 */
    }
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  function saveDraft() {
    try {
      var pickup = "";
      var selected = form.querySelector('input[name="pickup"]:checked');
      if (selected) pickup = selected.value;
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          qty: state.qty,
          fields: {
            name: document.getElementById("buyer-name").value,
            phone: document.getElementById("buyer-phone").value,
            email: document.getElementById("buyer-email").value,
            pickup: pickup,
            address: document.getElementById("buyer-address").value,
            note: document.getElementById("buyer-note").value,
          },
        })
      );
    } catch (error) {
      /* 無痕模式可能不能寫 sessionStorage */
    }
  }

  function loadDraft() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data.qty) {
        catalog.forEach(function (item) {
          if (Object.prototype.hasOwnProperty.call(data.qty, item.id)) {
            setQty(item.id, data.qty[item.id], { skipSave: true });
          }
        });
      }
      if (!data.fields) return;
      document.getElementById("buyer-name").value = data.fields.name || "";
      document.getElementById("buyer-phone").value = data.fields.phone || "";
      document.getElementById("buyer-email").value = data.fields.email || "";
      document.getElementById("buyer-address").value = data.fields.address || "";
      document.getElementById("buyer-note").value = data.fields.note || "";
      if (data.fields.pickup === "宅配" || data.fields.pickup === "超商") {
        var radio = form.querySelector('input[name="pickup"][value="' + data.fields.pickup + '"]');
        if (radio) radio.checked = true;
      }
      updateAddressHint();
    } catch (error) {
      /* 草稿壞了就從空白開始 */
    }
  }

  function updateAddressHint() {
    var selected = form.querySelector('input[name="pickup"]:checked');
    var mode = selected ? selected.value : "";
    if (mode === "宅配") {
      addressInput.placeholder = "請填收件地址";
      addressInput.autocomplete = "street-address";
      addressHint.textContent = "請填可以收到貨的地址。";
    } else if (mode === "超商") {
      addressInput.placeholder = "請填門市名稱";
      addressInput.autocomplete = "off";
      addressHint.textContent = "請填超商門市名稱，有店號更好。";
    } else {
      addressInput.placeholder = "選擇取貨方式後填寫";
      addressHint.textContent = "宅配填地址，超商填門市名稱。";
    }
  }

  function clearDraft() {
    catalog.forEach(function (item) {
      setQty(item.id, 0);
    });
    form.reset();
    clearFieldErrors();
    updateAddressHint();
    showEditor();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      /* ignore */
    }
    latestOrder = null;
  }

  var needState = {};
  var NEED_CHIPS = [
    { id: "guard", label: "容易累、想顧防護力" },
    { id: "gut", label: "腸胃敏感" },
    { id: "allergy", label: "季節或環境敏感" },
    { id: "eyes", label: "用眼過度" },
    { id: "focus", label: "想更專注清楚" },
  ];
  var NEED_SHORTCUTS = [
    { id: "eyes-gut", label: "眼睛＋腸胃", needs: ["eyes", "gut"] },
    { id: "eyes-allergy", label: "眼睛＋敏感", needs: ["eyes", "allergy"] },
  ];

  function hasNeed(id) {
    return !!needState[id];
  }

  function singlePick(id, why) {
    var item = itemById(id);
    return {
      key: id,
      title: item.name + "｜" + item.spec,
      why: why,
      price: item.price,
      items: [{ id: id, qty: 1 }],
    };
  }

  function recommendations() {
    var cards = [];
    var eyes = hasNeed("eyes");
    var gut = hasNeed("gut");
    var allergy = hasNeed("allergy");
    if (eyes && gut && allergy) {
      cards.push({
        key: "eyes-gut-allergy",
        title: "明舒清一盒＋常益舒小包＋敏舒通小包",
        why: "用眼、腸胃、敏感都有點到。明舒清只放一盒，再配兩個小包，就不會變成兩盒明舒清。",
        price:
          itemById("mingshuqing-30").price +
          itemById("changyishu-10").price +
          itemById("minshutong-10").price,
        items: [
          { id: "mingshuqing-30", qty: 1 },
          { id: "changyishu-10", qty: 1 },
          { id: "minshutong-10", qty: 1 },
        ],
      });
    } else if (eyes && gut) {
      var bundleGut = itemById("bundle-ming-chang");
      cards.push({
        key: bundleGut.id,
        title: bundleGut.name,
        why: "用眼和腸胃都有點到。這組就是明舒清一盒配常益舒小包，組合價一起算。",
        price: bundleGut.price,
        items: [{ id: bundleGut.id, qty: 1 }],
      });
    } else if (eyes && allergy) {
      var bundleAllergy = itemById("bundle-ming-min");
      cards.push({
        key: bundleAllergy.id,
        title: bundleAllergy.name,
        why: "用眼和敏感都有點到。這組就是明舒清一盒配敏舒通小包，組合價一起算。",
        price: bundleAllergy.price,
        items: [{ id: bundleAllergy.id, qty: 1 }],
      });
    } else {
      if (eyes) {
        cards.push(singlePick("mingshuqing-30", "你點了用眼。明舒清是葉黃素、玉米黃素與 LZDCH 的晶亮配方。"));
      }
      if (gut) {
        cards.push(
          singlePick("changyishu-30", "你點了腸胃。常益舒是布拉迪酵母益生菌，官方用來舒緩腸道敏感、維持消化道機能。")
        );
      }
      if (allergy) {
        cards.push(
          singlePick("minshutong-30", "你點了敏感。敏舒通以 LZDCH 為主，官方訴求是環境或溫差變化帶來的不適。")
        );
      }
    }
    if (hasNeed("guard")) {
      cards.push(
        singlePick("yiliaoyang-40", "你點了容易累、想顧防護力。益遼養是靈芝萃取 LZDCH，官方定位病後補養、提升防護力。")
      );
    }
    if (hasNeed("focus")) {
      cards.push(
        singlePick("jiesimin-60", "你點了專注。捷思敏含磷脂醯絲胺酸、鎂與 LZDCH，官方用來支持專注與記憶、維持思緒清晰。")
      );
    }
    return { shown: cards.slice(0, 2), extra: cards.length > 2 };
  }

  function renderPicker() {
    var chips = document.getElementById("need-chips");
    var results = document.getElementById("need-results");
    if (!chips || !results) return;
    chips.innerHTML = NEED_CHIPS.map(function (chip) {
      return (
        '<button type="button" class="chip" data-need="' +
        chip.id +
        '" aria-pressed="' +
        (needState[chip.id] ? "true" : "false") +
        '">' +
        escapeHtml(chip.label) +
        "</button>"
      );
    }).join("") + NEED_SHORTCUTS.map(function (chip) {
      var on = chip.needs.every(function (id) {
        return needState[id];
      });
      return (
        '<button type="button" class="chip chip-pair" data-shortcut="' +
        chip.id +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '">' +
        escapeHtml(chip.label) +
        "</button>"
      );
    }).join("");

    if (!NEED_CHIPS.some(function (chip) { return needState[chip.id]; })) {
      results.innerHTML = '<p class="picker-empty">點一個情況，下面會出現為你配的組合。</p>';
      delete results.dataset.picks;
      return;
    }

    var rec = recommendations();
    results.dataset.picks = JSON.stringify(rec.shown);
    results.innerHTML = rec.shown
      .map(function (card) {
        return (
          '<article class="rec" data-rec="' +
          escapeHtml(card.key) +
          '"><p class="rec-kicker">為你配的一組</p><h3>' +
          escapeHtml(card.title) +
          '</h3><p class="rec-why">' +
          escapeHtml(card.why) +
          '</p><p class="sale"><span class="sale-label">這組團購價</span> <strong>' +
          formatNT(card.price) +
          '</strong></p><button type="button" class="button-primary" data-add-rec="' +
          escapeHtml(card.key) +
          '">加入推薦組合</button></article>'
        );
      })
      .join("") + (rec.extra ? '<p class="hint">一次先推兩組。其他方向可以往下的商品自己加。</p>' : "");
  }

  function addRecommendation(key) {
    var results = document.getElementById("need-results");
    var cards = [];
    try {
      cards = JSON.parse(results.dataset.picks || "[]");
    } catch (error) {
      cards = [];
    }
    var card = null;
    cards.forEach(function (item) {
      if (item.key === key) card = item;
    });
    if (!card) return;
    var added = false;
    card.items.forEach(function (item) {
      var current = state.qty[item.id] || 0;
      if (current < item.qty) {
        setQty(item.id, item.qty);
        added = true;
      }
    });
    var status = document.getElementById("picker-status");
    if (!status) {
      status = document.createElement("p");
      status.id = "picker-status";
      status.className = "hint";
      status.setAttribute("role", "status");
      results.appendChild(status);
    }
    status.textContent = added ? "已放入下面的訂購清單，數量還可以再改。" : "這些品項已經在清單裡。";
  }

  document.getElementById("picker").addEventListener("click", function (event) {
    var need = event.target.closest("[data-need]");
    if (need) {
      var id = need.getAttribute("data-need");
      needState[id] = !needState[id];
      renderPicker();
      return;
    }
    var shortcut = event.target.closest("[data-shortcut]");
    if (shortcut) {
      var found = null;
      NEED_SHORTCUTS.forEach(function (chip) {
        if (chip.id === shortcut.getAttribute("data-shortcut")) found = chip;
      });
      if (!found) return;
      var turnOn = !found.needs.every(function (needId) {
        return needState[needId];
      });
      found.needs.forEach(function (needId) {
        needState[needId] = turnOn;
      });
      renderPicker();
      return;
    }
    var add = event.target.closest("[data-add-rec]");
    if (add) addRecommendation(add.getAttribute("data-add-rec"));
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-step]");
    if (!button) return;
    var id = button.getAttribute("data-id");
    var next = (state.qty[id] || 0) + Number(button.getAttribute("data-step"));
    setQty(id, next);
  });

  document.addEventListener("input", function (event) {
    var input = event.target.closest("[data-qty]");
    if (!input) return;
    setQty(input.getAttribute("data-qty"), input.value, { keepFocusValue: true });
  });

  document.addEventListener("focusout", function (event) {
    var input = event.target.closest ? event.target.closest("[data-qty]") : null;
    if (!input) return;
    setQty(input.getAttribute("data-qty"), input.value);
  });

  form.addEventListener("input", saveDraft);
  form.addEventListener("change", function () {
    updateAddressHint();
    saveDraft();
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearFieldErrors();
    var items = getItems();
    var fields = readFields();
    var errors = validate(fields, items);
    if (errors.length) {
      showErrors(errors);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "送出中…";
    try {
      var order = buildOrder();
      latestOrder = order;
      fillSummary(order);
      var message = await sendOrder(order);
      showSuccess(message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "送出訂單";
    }
  });

  document.getElementById("copy-order").addEventListener("click", async function () {
    if (!latestOrder) return;
    var ok = await copyText(latestOrder.text);
    if (ok) {
      copyStatus.textContent = "已複製，可以直接貼到訊息給主辦。";
      return;
    }
    plainDetails.open = true;
    copyStatus.textContent = "沒能自動複製。請在下方文字按住選取後複製。";
    var pre = document.getElementById("summary-text");
    var range = document.createRange();
    range.selectNodeContents(pre);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });

  document.getElementById("edit-order").addEventListener("click", showEditor);
  document.getElementById("clear-draft").addEventListener("click", clearDraft);

  dockJump.addEventListener("click", function () {
    if (!success.hidden) {
      success.scrollIntoView({ block: "start", behavior: motion() });
      return;
    }
    var items = getItems();
    var target = items.length ? document.getElementById("order") : document.getElementById("picker");
    target.scrollIntoView({ block: "start", behavior: motion() });
    if (items.length) document.getElementById("buyer-name").focus();
  });

  renderPicker();
  renderCart();
  loadDraft();
})();

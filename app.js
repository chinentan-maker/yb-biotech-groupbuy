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

    return (
      '<article class="card" data-id="' +
      escapeHtml(item.id) +
      '" data-on="false" data-price="' +
      item.price +
      '"' +
      (item.listPrice ? ' data-list-price="' + item.listPrice + '"' : "") +
      ">" +
      '<div><div class="title-row"><h3>' +
      escapeHtml(item.name) +
      "</h3>" +
      badge +
      '</div><p class="spec">' +
      escapeHtml(item.spec) +
      "</p></div>" +
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
    dockJump.textContent = success.hidden ? "填寫資料" : "查看訂單";

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
    var target = items.length ? document.getElementById("order") : document.getElementById("catalog");
    target.scrollIntoView({ block: "start", behavior: motion() });
    if (items.length) document.getElementById("buyer-name").focus();
  });

  renderCart();
  loadDraft();
})();

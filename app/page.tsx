"use client";

import { FormEvent, useEffect, useState } from "react";
import { GOOGLE_SHEETS_ENDPOINT, OFFICIAL_LINE_URL } from "./order-config";

type Product = {
  id: string;
  name: string;
  eyebrow: string;
  desc: string;
  price: number;
  tag: string;
  imageUrl: string;
};

type SiteSettings = {
  announcement: string;
  shippingFee: number;
  freeShippingThreshold: number;
  shipping60: number;
  shipping90: number;
  shipping120: number;
  heroKicker: string;
  heroTitle1: string;
  heroTitle2: string;
  heroIntro: string;
  heroImageUrl: string;
  menuKicker: string;
  menuTitle: string;
  menuIntro: string;
  storyTitle: string;
  storyText: string;
  brandPromise: string;
  brandSubtitle: string;
  serviceTitle: string;
  serviceIntro: string;
  lineUrl: string;
  pickupLabel: string;
  deliveryLabel: string;
  bankName: string;
  bankCode: string;
  bankAccount: string;
  bankAccountName: string;
  footerText: string;
};

const defaultProducts: Product[] = [
  {
    id: "classic",
    name: "椒香紅燒牛肉麵",
    eyebrow: "人氣 No.1",
    desc: "厚切牛腱 · 秘製椒香 · 手工湯底",
    price: 260,
    tag: "招牌",
    imageUrl: "",
  },
  {
    id: "double",
    name: "雙倍牛肉豪華組",
    eyebrow: "肉控首選",
    desc: "雙倍厚切牛腱，今天就吃得過癮",
    price: 360,
    tag: "澎湃",
    imageUrl: "",
  },
  {
    id: "family",
    name: "私廚分享四人組",
    eyebrow: "宅配最划算",
    desc: "四份湯肉包＋四份冷凍生拉麵",
    price: 980,
    tag: "免運",
    imageUrl: "",
  },
  {
    id: "noodles",
    name: "冷凍生拉麵（4入）",
    eyebrow: "私廚指定麵體",
    desc: "久煮不爛、滑順帶勁，湯麵拌麵都合適",
    price: 120,
    tag: "加購",
    imageUrl: "",
  },
];

const defaultSettings: SiteSettings = {
  announcement: "",
  shippingFee: 120,
  freeShippingThreshold: 999,
  shipping60: 180,
  shipping90: 245,
  shipping120: 310,
  heroKicker: "餐廳級熟製 · 冷凍宅配",
  heroTitle1: "KUANS LAB 寬私廚",
  heroTitle2: "餐廳等級料理，在家也能輕鬆享用",
  heroIntro: "72 小時慢熬牛骨湯，厚切牛腱與現磨椒香。只要 12 分鐘，讓忙碌的今晚也值得好好吃飯。",
  heroImageUrl: "",
  menuKicker: "THIS MONTH'S MENU",
  menuTitle: "今晚，你想吃哪一碗？",
  menuIntro: "湯肉包與生拉麵分裝，簡單覆熱，也能吃到剛起鍋的口感。",
  storyTitle: "我們不賣匆忙的味道。",
  storyText: "從炒糖色、煸香辛料到牛骨慢熬，每一鍋都按照餐廳的節奏來。你負責把水煮滾，剩下的交給寬私廚。",
  brandPromise: "把餐廳等級的料理，帶進每一天的餐桌。",
  brandSubtitle: "私廚｜冷凍料理｜外燴服務",
  serviceTitle: "不只一碗麵，也為你的餐桌掌廚。",
  serviceIntro: "想預約私廚、規劃外燴，或詢問冷凍宅配？透過官方 LINE 告訴我們日期、人數與需求，由專人為你安排。",
  lineUrl: OFFICIAL_LINE_URL,
  pickupLabel: "工作室自取",
  deliveryLabel: "冷凍宅配",
  bankName: "台新銀行",
  bankCode: "812",
  bankAccount: "2076 01 0001111666",
  bankAccountName: "餐飲企業社",
  footerText: "把餐廳等級的料理，帶進每一天的餐桌。",
};

function calculateBoxShipping(quantity: number, settings: SiteSettings) {
  if (quantity <= 0) return 0;
  const fullBoxes = Math.floor(quantity / 20);
  const remainder = quantity % 20;
  let total = fullBoxes * settings.shipping120;
  if (remainder === 0) return total;
  if (remainder <= 6) total += settings.shipping60;
  else if (remainder <= 10) total += settings.shipping90;
  else total += settings.shipping120;
  return total;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings);
  const [counts, setCounts] = useState<Record<string, number>>({ classic: 0, double: 0, family: 0, noodles: 0 });
  const [cartOpen, setCartOpen] = useState(false);
  const [delivery, setDelivery] = useState<"宅配" | "自取">("宅配");
  const [notice, setNotice] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    postalCode: "",
    address: "",
    transferLastFive: "",
    invoiceType: "二聯式發票",
    companyName: "",
    taxId: "",
    note: "",
    website: "",
  });

  const items = products.filter((item) => counts[item.id] > 0);
  const quantity = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * counts[item.id], 0);
  const shipping = delivery === "宅配" && subtotal > 0
    ? calculateBoxShipping(quantity, siteSettings)
    : 0;

  useEffect(() => {
    if (!GOOGLE_SHEETS_ENDPOINT) {
      setCatalogLoaded(true);
      return;
    }

    const callbackName = `kuansCatalog_${Date.now()}`;
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      setCatalogLoaded(true);
      cleanup();
    }, 8000);
    const callbackWindow = window as typeof window & Record<string, unknown>;

    function cleanup() {
      window.clearTimeout(timer);
      script.remove();
      delete callbackWindow[callbackName];
    }

    callbackWindow[callbackName] = (response: {
      ok?: boolean;
      products?: Product[];
      settings?: Partial<SiteSettings>;
    }) => {
      if (response?.ok) {
        setProducts(Array.isArray(response.products) ? response.products : []);
      }
      if (response?.ok && response.settings) {
        setSiteSettings((current) => ({ ...current, ...response.settings }));
      }
      setCatalogLoaded(true);
      cleanup();
    };

    script.src = `${GOOGLE_SHEETS_ENDPOINT}?action=catalog&callback=${encodeURIComponent(callbackName)}`;
    script.async = true;
    script.onerror = () => {
      setCatalogLoaded(true);
      cleanup();
    };
    document.body.appendChild(script);

    return cleanup;
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProduct(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedProduct]);

  const add = (id: string) => {
    setCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setNotice("已加入購物袋");
    window.setTimeout(() => setNotice(""), 1800);
  };

  const update = (id: string, delta: number) =>
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));

  const copyBankValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label}已複製`);
    } catch {
      setNotice(`請長按選取${label}`);
    }
    window.setTimeout(() => setNotice(""), 1800);
  };

  const submitOrder = async () => {
    if (!quantity || submitting || customer.website) return;
    if (delivery === "宅配" && (!customer.postalCode.trim() || !customer.address.trim())) {
      setNotice("請填寫郵遞區號與收件地址");
      return;
    }
    if (!GOOGLE_SHEETS_ENDPOINT) {
      setNotice("訂單系統尚未完成連接，請稍後再試");
      return;
    }

    setSubmitting(true);
    const orderId = `KL${new Date().toISOString().replace(/\D/g, "").slice(2, 14)}`;
    const details = items.map((item) => `${item.name} × ${counts[item.id]}（NT$ ${item.price * counts[item.id]}）`).join("、");
    const payload = {
      orderId,
      orderedAt: new Date().toISOString(),
      customerName: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email.trim(),
      delivery,
      postalCode: delivery === "宅配" ? customer.postalCode.trim() : "",
      address: delivery === "宅配" ? customer.address.trim() : "工作室自取",
      items: details,
      subtotal,
      shipping,
      total: subtotal + shipping,
      paymentMethod: "銀行轉帳（台新銀行）",
      note: customer.note.trim(),
      paymentStatus: "待確認",
      orderStatus: "新訂單",
      transferLastFive: customer.transferLastFive.trim(),
      invoiceType: customer.invoiceType,
      companyName: customer.invoiceType === "三聯式發票" ? customer.companyName.trim() : "",
      taxId: customer.invoiceType === "三聯式發票" ? customer.taxId.trim() : "",
    };

    try {
      await fetch(GOOGLE_SHEETS_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      setNotice(`訂單 ${orderId} 已完成，我們會儘快為您確認`);
      setCheckoutOpen(false);
      setPaymentOpen(true);
      setCounts({});
    } catch {
      setNotice("訂單暫時無法送出，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  if (!catalogLoaded) {
    return (
      <main className="site-loading" aria-live="polite" aria-label="網站資料載入中">
        <div className="site-loading-brand">
          <img src="./kuans-lab-logo.png" alt="" />
          <div><b>KUANS LAB</b><span>寬 私 廚</span></div>
        </div>
        <div className="site-loading-line"><i /></div>
        <p>正在準備最新菜單…</p>
      </main>
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="KUANS LAB 寬私廚首頁">
          <span className="brand-mark">KL</span>
          <span>KUANS LAB <b>寬私廚</b></span>
        </a>
        <nav aria-label="主要導覽">
          <a href="#menu">本月菜單</a>
          <a href="#services">私廚與外燴</a>
          <button className="cart-button" onClick={() => setCartOpen(true)}>
            購物袋 <span>{quantity}</span>
          </button>
        </nav>
      </header>
      {siteSettings.announcement && (
        <div className="site-announcement" role="status">{siteSettings.announcement}</div>
      )}

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="kicker">{siteSettings.heroKicker}</p>
          <h1>{siteSettings.heroTitle1}<br /><em>{siteSettings.heroTitle2}</em></h1>
          <p className="hero-lead">{siteSettings.heroIntro}</p>
          <div className="hero-actions">
            <a className="primary-cta" href="#menu">立即選購 <span>→</span></a>
            <span className="shipping-note">
              冷凍宅配全台｜依件數分箱計費・含包材費
            </span>
          </div>
        </div>
        <div
          className="hero-image"
          role="img"
          aria-label="KUANS LAB 首頁主圖"
          style={siteSettings.heroImageUrl ? { backgroundImage: `url("${siteSettings.heroImageUrl}")` } : undefined}
        >
          <span className="stamp">人氣<br />No.1</span>
        </div>
      </section>

      <section className="trust-strip" aria-label="產品特色">
        <div><b>72h</b><span>慢火熬湯</span></div>
        <div><b>100%</b><span>原型食材</span></div>
        <div><b>12min</b><span>快速上桌</span></div>
        <div><b>－18°C</b><span>新鮮鎖味</span></div>
      </section>

      <section id="menu" className="menu-section">
        <div className="section-heading">
          <div>
            <p className="kicker">{siteSettings.menuKicker}</p>
            <h2>{siteSettings.menuTitle}</h2>
          </div>
          <p>{siteSettings.menuIntro}</p>
        </div>

        <div className="product-grid">
          {!catalogLoaded ? (
            <p className="catalog-message">商品載入中…</p>
          ) : products.length ? products.map((product, index) => (
            <article className={`product-card card-${index + 1} ${product.id === "noodles" && !product.imageUrl ? "noodle-card" : ""}`} key={product.id}>
              <button className="product-preview" type="button" onClick={() => setSelectedProduct(product)} aria-label={`查看 ${product.name} 詳情`}>
                <div
                  className={`product-photo ${product.imageUrl ? "custom-product-image" : ""}`}
                  style={product.imageUrl ? { backgroundImage: `url("${product.imageUrl}")` } : undefined}
                >
                  <span className="tag">{product.tag}</span>
                  <span className="photo-index">0{index + 1}</span>
                  {product.id === "noodles" && !product.imageUrl && <span className="noodle-art" aria-hidden="true"><i /><i /><i /><i /><i /></span>}
                </div>
                <div className="product-info product-summary">
                  <h3>{product.name}</h3>
                  <span>查看商品詳情 →</span>
                </div>
              </button>
            </article>
          )) : (
            <p className="catalog-message">目前商品準備中，歡迎稍後再來看看。</p>
          )}
        </div>
      </section>

      {selectedProduct && (
        <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <button className="product-modal-backdrop" type="button" onClick={() => setSelectedProduct(null)} aria-label="關閉商品詳情" />
          <div className="product-dialog">
            <button className="product-modal-close" type="button" onClick={() => setSelectedProduct(null)} aria-label="關閉">×</button>
            <div
              className={`product-modal-photo ${selectedProduct.id === "noodles" && !selectedProduct.imageUrl ? "noodle-modal-photo" : ""} ${selectedProduct.imageUrl ? "custom-product-image" : ""}`}
              style={selectedProduct.imageUrl ? { backgroundImage: `url("${selectedProduct.imageUrl}")` } : undefined}
            >
              <span className="tag">{selectedProduct.tag}</span>
              {selectedProduct.id === "noodles" && !selectedProduct.imageUrl && <span className="noodle-art" aria-hidden="true"><i /><i /><i /><i /><i /></span>}
            </div>
            <div className="product-modal-info">
              <p>{selectedProduct.eyebrow}</p>
              <h2 id="product-modal-title">{selectedProduct.name}</h2>
              <div className="product-description">{selectedProduct.desc}</div>
              <div className="product-modal-buy">
                <strong>NT$ {selectedProduct.price.toLocaleString("zh-TW")}</strong>
                <button type="button" onClick={() => { add(selectedProduct.id); setSelectedProduct(null); }}>
                  加入購物袋 <b>＋</b>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section id="services" className="services-section">
        <div className="services-intro">
          <p className="kicker">KUANS LAB SERVICE</p>
          <h2>{siteSettings.serviceTitle}</h2>
          <p>{siteSettings.serviceIntro}</p>
        </div>
        <div className="service-links">
          <a href={siteSettings.lineUrl} target="_blank" rel="noreferrer">
            <span>01</span><div><b>私廚預約</b><small>到府料理與專屬菜單規劃</small></div><i>↗</i>
          </a>
          <a href={siteSettings.lineUrl} target="_blank" rel="noreferrer">
            <span>02</span><div><b>外燴服務</b><small>聚會、品牌活動與餐會服務</small></div><i>↗</i>
          </a>
          <a className="line-service" href={siteSettings.lineUrl} target="_blank" rel="noreferrer">
            <span>LINE</span><div><b>官方 LINE 客服</b><small>商品問題與訂單諮詢</small></div><i>↗</i>
          </a>
        </div>
      </section>


      {notice && <div className="toast" role="status">{notice} ✓</div>}

      <div className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen}>
        <button className="drawer-backdrop" aria-label="關閉購物袋" onClick={() => setCartOpen(false)} />
        <aside aria-label="購物袋">
          <div className="drawer-head">
            <div><p>YOUR ORDER</p><h2>購物袋</h2></div>
            <button onClick={() => setCartOpen(false)} aria-label="關閉">×</button>
          </div>
          <div className="drawer-content">
            {!items.length ? (
              <div className="empty-cart"><span>碗</span><h3>購物袋還是空的</h3><p>今晚，來一碗椒香紅燒牛肉麵吧。</p><button onClick={() => setCartOpen(false)}>去選購</button></div>
            ) : !checkoutOpen ? items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div
                  className={`cart-thumb ${item.id === "noodles" && !item.imageUrl ? "noodle-thumb" : ""} ${item.imageUrl ? "custom-cart-image" : ""}`}
                  style={item.imageUrl ? { backgroundImage: `url("${item.imageUrl}")` } : undefined}
                >
                  {item.id === "noodles" && !item.imageUrl && <span>麵</span>}
                </div>
                <div><h3>{item.name}</h3><p>NT$ {item.price}</p>
                  <div className="quantity"><button onClick={() => update(item.id, -1)}>−</button><span>{counts[item.id]}</span><button onClick={() => update(item.id, 1)}>＋</button></div>
                </div>
              </div>
            )) : !paymentOpen ? (
              <form id="order-form" className="order-form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); submitOrder(); }}>
                <div className="form-heading"><b>填寫訂購資料</b><button type="button" onClick={() => setPaymentOpen(true)}>返回匯款資料</button></div>
                <label>姓名<input required autoComplete="name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></label>
                <label>手機號碼<input required inputMode="tel" autoComplete="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></label>
                <label>Email（選填）<input type="email" autoComplete="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></label>
                {delivery === "宅配" && <>
                  <label>郵遞區號<input required inputMode="numeric" autoComplete="postal-code" value={customer.postalCode} onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })} /></label>
                  <label>收件地址<textarea required autoComplete="street-address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} /></label>
                </>}
                <label>轉帳後五碼<input required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="請輸入匯款帳號後五碼" value={customer.transferLastFive} onChange={(e) => setCustomer({ ...customer, transferLastFive: e.target.value.replace(/\D/g, "").slice(0, 5) })} /></label>
                <label>發票資訊
                  <select value={customer.invoiceType} onChange={(e) => setCustomer({ ...customer, invoiceType: e.target.value })}>
                    <option value="二聯式發票">二聯式發票</option>
                    <option value="三聯式發票">三聯式發票（公司行號＋統一編號）</option>
                  </select>
                </label>
                {customer.invoiceType === "三聯式發票" && <>
                  <label>公司行號<input required value={customer.companyName} onChange={(e) => setCustomer({ ...customer, companyName: e.target.value })} /></label>
                  <label>統一編號<input required inputMode="numeric" pattern="[0-9]{8}" maxLength={8} placeholder="請輸入 8 位統一編號" value={customer.taxId} onChange={(e) => setCustomer({ ...customer, taxId: e.target.value.replace(/\D/g, "").slice(0, 8) })} /></label>
                </>}
                <label>訂單備註（選填）<textarea value={customer.note} onChange={(e) => setCustomer({ ...customer, note: e.target.value })} /></label>
                <label className="order-honeypot" aria-hidden="true">網站<input tabIndex={-1} autoComplete="off" value={customer.website} onChange={(e) => setCustomer({ ...customer, website: e.target.value })} /></label>
                <p className="privacy-note">送出即同意 KUANS LAB 僅將資料用於本次訂單、配送與聯絡。</p>
              </form>
            ) : (
              <section className="payment-panel" aria-labelledby="payment-title">
                <div className="form-heading"><b id="payment-title">匯款資料</b><button type="button" onClick={() => setCheckoutOpen(false)}>返回購物袋</button></div>
                <div className="bank-card">
                  <span className="bank-icon" aria-hidden="true">🧾</span>
                  <dl>
                    <div><dt>銀行</dt><dd>{siteSettings.bankName}</dd></div>
                    <div><dt>銀行代碼</dt><dd className="copy-value"><span>{siteSettings.bankCode}</span><button type="button" aria-label="複製銀行代碼" onClick={() => copyBankValue("銀行代碼", siteSettings.bankCode)}>複製</button></dd></div>
                    <div><dt>帳號</dt><dd className="copy-value account-number"><span>{siteSettings.bankAccount}</span><button type="button" aria-label="複製匯款帳號" onClick={() => copyBankValue("帳號", siteSettings.bankAccount.replace(/\s/g, ""))}>複製</button></dd></div>
                    <div><dt>戶名</dt><dd>{siteSettings.bankAccountName}</dd></div>
                    <div><dt>匯款金額</dt><dd className="copy-value transfer-amount"><span>NT$ {(subtotal + shipping).toLocaleString("zh-TW")}</span><button type="button" aria-label="複製匯款金額" onClick={() => copyBankValue("匯款金額", String(subtotal + shipping))}>複製</button></dd></div>
                  </dl>
                </div>
                <p className="payment-alert">‼️ 匯款完成後，請於下一步填寫帳號後五碼 ‼️</p>
                <p className="privacy-note">確認後，訂單會直接寫入 KUANS LAB 訂單系統。</p>
                <div className="checkout-box-guide" aria-label="黑貓宅急便分箱運費">
                  <div className="checkout-box-guide-head">
                    <b>黑貓宅急便・分箱運費</b>
                    <span>含包材費</span>
                  </div>
                  <div className="checkout-box-grid">
                    <div>
                      <div className="box-drawing box-small" aria-hidden="true"><span /><i /><b>60</b></div>
                      <strong>1–6 件</strong><small>NT$ {siteSettings.shipping60.toLocaleString("zh-TW")}</small>
                    </div>
                    <div>
                      <div className="box-drawing box-medium" aria-hidden="true"><span /><i /><b>90</b></div>
                      <strong>7–10 件</strong><small>NT$ {siteSettings.shipping90.toLocaleString("zh-TW")}</small>
                    </div>
                    <div>
                      <div className="box-drawing box-large" aria-hidden="true"><span /><i /><b>120</b></div>
                      <strong>11–20 件</strong><small>NT$ {siteSettings.shipping120.toLocaleString("zh-TW")}</small>
                    </div>
                  </div>
                  <p>超過 20 件會自動分箱並累加計算。</p>
                </div>
              </section>
            )}
          </div>
          <div className={`delivery-toggle ${checkoutOpen ? "locked" : ""}`}>
            <button className={delivery === "宅配" ? "active" : ""} onClick={() => setDelivery("宅配")}>{siteSettings.deliveryLabel}</button>
            <button className={delivery === "自取" ? "active" : ""} onClick={() => setDelivery("自取")}>{siteSettings.pickupLabel}</button>
          </div>
          <div className="totals">
            <div className="checkout-breakdown">
              <div><span>商品總額</span><b>NT$ {subtotal.toLocaleString("zh-TW")}</b></div>
              <div><span>運費</span><b>{delivery === "自取" ? "NT$ 0" : `NT$ ${shipping.toLocaleString("zh-TW")}`}</b></div>
              <div className="grand-total"><span>應付總額</span><b>NT$ {(subtotal + shipping).toLocaleString("zh-TW")}</b></div>
            </div>
            {!checkoutOpen ? (
              <button className="checkout" disabled={!quantity} onClick={() => { setCheckoutOpen(true); setPaymentOpen(true); }}>查看匯款資料及結帳 <b>→</b></button>
            ) : paymentOpen ? (
              <button className="checkout" type="button" disabled={!quantity} onClick={() => setPaymentOpen(false)}>我已匯款完成，填寫訂購資料 <b>→</b></button>
            ) : (
              <button className="checkout" type="submit" form="order-form" disabled={!quantity || submitting}>{submitting ? "正在建立訂單…" : "完成訂單"} <b>→</b></button>
            )}
          </div>
        </aside>
      </div>
      <a className="floating-line" href={siteSettings.lineUrl} target="_blank" rel="noreferrer" aria-label="開啟 KUANS LAB 官方 LINE 客服">
        <b>LINE</b><span>客服</span>
      </a>
    </main>
  );
}

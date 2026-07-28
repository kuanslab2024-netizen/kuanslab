"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
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
  const shipping = delivery === "宅配" && subtotal > 0 && subtotal < siteSettings.freeShippingThreshold
    ? siteSettings.shippingFee
    : 0;

  useEffect(() => {
    if (!GOOGLE_SHEETS_ENDPOINT) return;

    const callbackName = `kuansCatalog_${Date.now()}`;
    const script = document.createElement("script");
    const timer = window.setTimeout(cleanup, 8000);
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
      if (response?.ok && Array.isArray(response.products) && response.products.length) {
        setProducts(response.products);
      }
      if (response?.ok && response.settings) {
        setSiteSettings((current) => ({ ...current, ...response.settings }));
      }
      cleanup();
    };

    script.src = `${GOOGLE_SHEETS_ENDPOINT}?action=catalog&callback=${encodeURIComponent(callbackName)}`;
    script.async = true;
    script.onerror = cleanup;
    document.body.appendChild(script);

    return cleanup;
  }, []);

  const add = (id: string) => {
    setCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setNotice("已加入購物袋");
    window.setTimeout(() => setNotice(""), 1800);
  };

  const update = (id: string, delta: number) =>
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));

  const orderSummary = useMemo(() => {
    if (!quantity) return "挑一碗今晚想吃的牛肉麵吧";
    return `${quantity} 件商品 · NT$ ${(subtotal + shipping).toLocaleString("zh-TW")}`;
  }, [quantity, subtotal, shipping]);

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
      setNotice("訂單表尚未完成連接，請先透過 LINE 聯絡我們");
      window.open(OFFICIAL_LINE_URL, "_blank", "noopener,noreferrer");
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
      orderStatus: "待 LINE 確認",
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
      const lineMessage = [
        `KUANS LAB 訂單 ${orderId}`,
        `姓名：${payload.customerName}`,
        `電話：${payload.phone}`,
        `取貨：${delivery}`,
        `商品：${details}`,
        `合計：NT$ ${payload.total}`,
        "付款：台新銀行轉帳（銀行代碼 812）",
        `轉帳後五碼：${payload.transferLastFive}`,
        `發票：${payload.invoiceType}${payload.companyName ? `／${payload.companyName}／統編 ${payload.taxId}` : ""}`,
        customer.note.trim() ? `備註：${customer.note.trim()}` : "",
        "訂單已送出至系統，如已匯款請提供帳號後五碼。",
      ].filter(Boolean).join("\n");
      await navigator.clipboard?.writeText(lineMessage).catch(() => undefined);
      setNotice(`訂單 ${orderId} 已建立，請到 LINE 貼上並送出確認`);
      setCheckoutOpen(false);
      window.open(OFFICIAL_LINE_URL, "_blank", "noopener,noreferrer");
    } catch {
      setNotice("訂單暫時無法送出，請改用 LINE 聯絡我們");
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="kicker">餐廳級熟製 · 冷凍宅配</p>
          <h1>KUANS LAB 寬私廚<br /><em>餐廳等級料理，在家也能輕鬆享用</em></h1>
          <p className="hero-lead">
            72 小時慢熬牛骨湯，厚切牛腱與現磨椒香。只要 12 分鐘，
            讓忙碌的今晚也值得好好吃飯。
          </p>
          <div className="hero-actions">
            <a className="primary-cta" href="#menu">立即選購 <span>→</span></a>
            <span className="shipping-note">
              冷凍宅配全台｜滿 NT${siteSettings.freeShippingThreshold.toLocaleString("zh-TW")} 免運
            </span>
          </div>
        </div>
        <div className="hero-image" role="img" aria-label="椒香紅燒牛肉麵">
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
            <p className="kicker">THIS MONTH&apos;S MENU</p>
            <h2>今晚，你想吃哪一碗？</h2>
          </div>
          <p>湯肉包與生拉麵分裝，簡單覆熱，<br />也能吃到剛起鍋的口感。</p>
        </div>

        <div className="product-grid">
          {products.map((product, index) => (
            <article className={`product-card card-${index + 1} ${product.id === "noodles" ? "noodle-card" : ""}`} key={product.id}>
              <div
                className="product-photo"
                style={product.imageUrl ? { backgroundImage: `url("${product.imageUrl}")` } : undefined}
              >
                <span className="tag">{product.tag}</span>
                <span className="photo-index">0{index + 1}</span>
                {product.id === "noodles" && <span className="noodle-art" aria-hidden="true"><i /><i /><i /><i /><i /></span>}
              </div>
              <div className="product-info">
                <p>{product.eyebrow}</p>
                <h3>{product.name}</h3>
                <span>{product.desc}</span>
                <div className="price-row">
                  <strong>NT$ {product.price.toLocaleString("zh-TW")}</strong>
                  <button onClick={() => add(product.id)} aria-label={`加入 ${product.name}`}>
                    加入購物袋 <b>＋</b>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="story" className="story-section">
        <div className="story-quote">
          <span>“</span>
          <h2>我們不賣匆忙的味道。</h2>
          <p>從炒糖色、煸香辛料到牛骨慢熬，每一鍋都按照餐廳的節奏來。你負責把水煮滾，剩下的交給寬私廚。</p>
          <a href="#menu">認識這碗麵的誕生 →</a>
        </div>
        <div className="story-detail">
          <p className="vertical-label">KUANS LAB · PRIVATE KITCHEN</p>
          <div>
            <span className="mini-mark">寬</span>
            <h3>把餐廳等級的料理，<br />帶進每一天的餐桌。</h3>
            <p>私廚｜冷凍料理｜外燴服務</p>
          </div>
        </div>
      </section>

      <section id="services" className="services-section">
        <div className="services-intro">
          <p className="kicker">KUANS LAB SERVICE</p>
          <h2>不只一碗麵，<br />也為你的餐桌掌廚。</h2>
          <p>想預約私廚、規劃外燴，或詢問冷凍宅配？透過官方 LINE 告訴我們日期、人數與需求，由專人為你安排。</p>
        </div>
        <div className="service-links">
          <a href="https://lin.ee/YO7Q3mL" target="_blank" rel="noreferrer">
            <span>01</span><div><b>私廚預約</b><small>到府料理與專屬菜單規劃</small></div><i>↗</i>
          </a>
          <a href="https://lin.ee/YO7Q3mL" target="_blank" rel="noreferrer">
            <span>02</span><div><b>外燴服務</b><small>聚會、品牌活動與餐會服務</small></div><i>↗</i>
          </a>
          <a className="line-service" href="https://lin.ee/YO7Q3mL" target="_blank" rel="noreferrer">
            <span>LINE</span><div><b>官方 LINE 客服</b><small>商品問題與訂單諮詢</small></div><i>↗</i>
          </a>
        </div>
      </section>

      <section className="how-section">
        <p className="kicker">HOW TO SERVE</p>
        <h2>三步驟，熱騰騰上桌</h2>
        <div className="steps">
          <div><b>01</b><span>湯包隔水加熱<br />約 10 分鐘</span></div>
          <i>→</i>
          <div><b>02</b><span>生麵滾水煮熟<br />約 2 分鐘</span></div>
          <i>→</i>
          <div><b>03</b><span>盛碗加上喜歡的<br />青菜與蔥花</span></div>
        </div>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">KL</span><span>KUANS LAB <b>寬私廚</b></span></div>
        <p>把餐廳等級的料理，帶進每一天的餐桌。</p>
        <div className="footer-links"><a href="#menu">冷凍宅配</a><a href="#services">外燴服務</a><a href="https://lin.ee/YO7Q3mL" target="_blank" rel="noreferrer">LINE 客服</a></div>
        <small>© 2026 KUANS LAB. All rights reserved.</small>
      </footer>

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
                <div className={`cart-thumb ${item.id === "noodles" ? "noodle-thumb" : ""}`}>{item.id === "noodles" && <span>麵</span>}</div>
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
                    <div><dt>銀行</dt><dd>台新銀行</dd></div>
                    <div><dt>銀行代碼</dt><dd className="copy-value"><span>812</span><button type="button" aria-label="複製銀行代碼" onClick={() => copyBankValue("銀行代碼", "812")}>複製</button></dd></div>
                    <div><dt>帳號</dt><dd className="copy-value account-number"><span>2076 01 0001111666</span><button type="button" aria-label="複製匯款帳號" onClick={() => copyBankValue("帳號", "2076010001111666")}>複製</button></dd></div>
                    <div><dt>戶名</dt><dd>餐飲企業社</dd></div>
                    <div><dt>匯款金額</dt><dd className="copy-value transfer-amount"><span>NT$ {(subtotal + shipping).toLocaleString("zh-TW")}</span><button type="button" aria-label="複製匯款金額" onClick={() => copyBankValue("匯款金額", String(subtotal + shipping))}>複製</button></dd></div>
                  </dl>
                </div>
                <p className="payment-alert">‼️ 如已匯款，請至 LINE 訊息告知帳號後五碼 ‼️</p>
                <p className="privacy-note">確認後，訂單會寫入 KUANS LAB 訂單系統並開啟官方 LINE。</p>
              </section>
            )}
          </div>
          <div className={`delivery-toggle ${checkoutOpen ? "locked" : ""}`}>
            <button className={delivery === "宅配" ? "active" : ""} onClick={() => setDelivery("宅配")}>冷凍宅配</button>
            <button className={delivery === "自取" ? "active" : ""} onClick={() => setDelivery("自取")}>工作室自取</button>
          </div>
          <div className="totals">
            <span>{orderSummary}</span>
            {quantity > 0 && shipping > 0 && (
              <small>再買 NT$ {siteSettings.freeShippingThreshold - subtotal} 即享免運</small>
            )}
            {!checkoutOpen ? (
              <button className="checkout" disabled={!quantity} onClick={() => { setCheckoutOpen(true); setPaymentOpen(true); }}>查看匯款資料 <b>→</b></button>
            ) : paymentOpen ? (
              <button className="checkout" type="button" disabled={!quantity} onClick={() => setPaymentOpen(false)}>我已了解，填寫訂購資料 <b>→</b></button>
            ) : (
              <button className="checkout" type="submit" form="order-form" disabled={!quantity || submitting}>{submitting ? "正在建立訂單…" : "完成訂單並前往 LINE"} <b>→</b></button>
            )}
          </div>
        </aside>
      </div>
      <a className="floating-line" href="https://lin.ee/YO7Q3mL" target="_blank" rel="noreferrer" aria-label="開啟 KUANS LAB 官方 LINE 客服">
        <b>LINE</b><span>客服</span>
      </a>
    </main>
  );
}

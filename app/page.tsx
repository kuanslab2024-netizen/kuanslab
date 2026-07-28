"use client";

import { useMemo, useState } from "react";

const products = [
  {
    id: "classic",
    name: "椒香紅燒牛肉麵",
    eyebrow: "人氣 No.1",
    desc: "厚切牛腱 · 秘製椒香 · 手工湯底",
    price: 260,
    tag: "招牌",
  },
  {
    id: "double",
    name: "雙倍牛肉豪華組",
    eyebrow: "肉控首選",
    desc: "雙倍厚切牛腱，今天就吃得過癮",
    price: 360,
    tag: "澎湃",
  },
  {
    id: "family",
    name: "私廚分享四人組",
    eyebrow: "宅配最划算",
    desc: "四份湯肉包＋四份冷凍生拉麵",
    price: 980,
    tag: "免運",
  },
  {
    id: "noodles",
    name: "冷凍生拉麵（4入）",
    eyebrow: "私廚指定麵體",
    desc: "久煮不爛、滑順帶勁，湯麵拌麵都合適",
    price: 120,
    tag: "加購",
  },
];

export default function Home() {
  const [counts, setCounts] = useState<Record<string, number>>({ classic: 0, double: 0, family: 0, noodles: 0 });
  const [cartOpen, setCartOpen] = useState(false);
  const [delivery, setDelivery] = useState<"宅配" | "自取">("宅配");
  const [notice, setNotice] = useState("");

  const items = products.filter((item) => counts[item.id] > 0);
  const quantity = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * counts[item.id], 0);
  const shipping = delivery === "宅配" && subtotal > 0 && subtotal < 999 ? 120 : 0;

  const add = (id: string) => {
    setCounts((prev) => ({ ...prev, [id]: prev[id] + 1 }));
    setNotice("已加入購物袋");
    window.setTimeout(() => setNotice(""), 1800);
  };

  const update = (id: string, delta: number) =>
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, prev[id] + delta) }));

  const orderSummary = useMemo(() => {
    if (!quantity) return "挑一碗今晚想吃的牛肉麵吧";
    return `${quantity} 件商品 · NT$ ${(subtotal + shipping).toLocaleString("zh-TW")}`;
  }, [quantity, subtotal, shipping]);

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

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="kicker">餐廳級熟製 · 冷凍宅配</p>
          <h1>一碗好麵，<br /><em>把私廚帶回家。</em></h1>
          <p className="hero-lead">
            72 小時慢熬牛骨湯，厚切牛腱與現磨椒香。只要 12 分鐘，
            讓忙碌的今晚也值得好好吃飯。
          </p>
          <div className="hero-actions">
            <a className="primary-cta" href="#menu">立即選購 <span>→</span></a>
            <span className="shipping-note">冷凍宅配全台｜滿 NT$999 免運</span>
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
              <div className="product-photo">
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
            ) : items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className={`cart-thumb ${item.id === "noodles" ? "noodle-thumb" : ""}`}>{item.id === "noodles" && <span>麵</span>}</div>
                <div><h3>{item.name}</h3><p>NT$ {item.price}</p>
                  <div className="quantity"><button onClick={() => update(item.id, -1)}>−</button><span>{counts[item.id]}</span><button onClick={() => update(item.id, 1)}>＋</button></div>
                </div>
              </div>
            ))}
          </div>
          <div className="delivery-toggle">
            <button className={delivery === "宅配" ? "active" : ""} onClick={() => setDelivery("宅配")}>冷凍宅配</button>
            <button className={delivery === "自取" ? "active" : ""} onClick={() => setDelivery("自取")}>工作室自取</button>
          </div>
          <div className="totals">
            <span>{orderSummary}</span>
            {quantity > 0 && shipping > 0 && <small>再買 NT$ {999 - subtotal} 即享免運</small>}
            <button className="checkout" disabled={!quantity} onClick={() => setNotice("示範訂單已準備完成")}>前往結帳 <b>→</b></button>
          </div>
        </aside>
      </div>
      <a className="floating-line" href="https://lin.ee/YO7Q3mL" target="_blank" rel="noreferrer" aria-label="開啟 KUANS LAB 官方 LINE 客服">
        <b>LINE</b><span>客服</span>
      </a>
    </main>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { request } from "../api";
import { useCart } from "../features/cart/CartContext";
import { PageHero } from "./ContentPages";
import { useMetadata } from "../useMetadata";
export const pickupUrl = "https://www.google.com/maps/dir/?api=1&destination=Oro+Restaurant+%26+Lounge,+Nairobi&hl=en";
const money = (n) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);
export function Products() {
  useMetadata("Products | Mercada Impex", "Discover Johari Gin, a premium Tanzanian spirit distributed by Mercada Impex.");
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    request("/products")
      .then((products) => setState({ products }))
      .catch((error) => setState({ error: error.message }));
  }, []);
  return (
    <>
      <PageHero
        eyebrow="Our products"
        title="Distinctly African. Exceptionally crafted."
      />
      <section className="section">
        {state.loading && <p role="status">Loading the collection…</p>}
        {state.error && (
          <div className="notice" role="alert">
            <p>{state.error}</p>
            <button onClick={() => location.reload()}>Retry</button>
          </div>
        )}
        {state.products?.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
        {state.products?.length === 0 && <div className="notice"><p>No products are available right now.</p><button onClick={() => location.reload()}>Retry catalog</button></div>}
      </section>
    </>
  );
}
function ProductCard({ product }) {
  const { add } = useCart();
  return (
    <article className="product">
      <img src={product.images?.[0]} alt={`${product.name} bottle`} />
      <div>
        <p className="eyebrow">Tanzanian spirit</p>
        <h2>{product.name}</h2>
        <p>{product.shortDescription}</p>
        <strong>{money(product.price)}</strong>
        <div className="actions">
          <Link className="button secondary" to={`/products/${product.slug}`}>
            Discover
          </Link>
          <button onClick={() => add(product)}>Add to cart</button>
        </div>
      </div>
    </article>
  );
}
export function ProductDetail() {
  const { slug } = useParams(),
    { add } = useCart();
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    request(`/products/${slug}`)
      .then((product) => setState({ product }))
      .catch((error) => setState({ error: error.message }));
  }, [slug]);
  const p = state.product;
  useMetadata(p ? `${p.name} | Mercada Impex` : "Product | Mercada Impex", p?.shortDescription || "Premium beverages from Mercada Impex.");
  if (state.loading) return <section className="section"><p role="status">Loading product…</p></section>;
  if (state.error)
    return (
      <section className="section">
        <p role="alert">{state.error}</p><Link to="/products">Return to products</Link>
      </section>
    );
  return (
    <section className="section product">
      <div className="gallery">
        {p.images.map((x, i) => (
          <img key={x} src={x} alt={`${p.name} view ${i + 1}`} />
        ))}
      </div>
      <div>
        <p className="eyebrow">Johari means “jewel”</p>
        <h1>{p.name}</h1>
        <p>{p.description}</p>
        {p.storySections?.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
        <h2>{money(p.price)}</h2>
        <p>
          Pickup at <strong>Oro Restaurant & Lounge, Kilimani</strong>. <a href={pickupUrl} target="_blank" rel="noreferrer">Get directions</a>.
        </p>
        <button onClick={() => add(p)}>Add to cart</button>
      </div>
    </section>
  );
}
export function Cart() {
  const cart = useCart();
  useMetadata("Cart | Mercada Impex", "Review your Mercada Impex order before guest checkout.");
  if (!cart.items.length)
    return (
      <section className="section empty">
        <h1>Your cart is ready for something exceptional.</h1>
        <Link className="button" to="/products">
          Explore products
        </Link>
      </section>
    );
  return (
    <section className="section">
      <h1>Your cart</h1>
      {cart.items.map((x) => (
        <article className="cart-row" key={x.productId}>
          <img src={x.image} alt="" />
          <div>
            <h2>{x.name}</h2>
            <p>{money(x.price)}</p>
          </div>
          <label>
            Quantity
            <input
              aria-label={`Quantity for ${x.name}`}
              type="number"
              min="1"
              max="12"
              value={x.quantity}
              onChange={(e) =>
                cart.quantity(x.productId, Number(e.target.value))
              }
            />
          </label>
          <button
            className="text-button"
            onClick={() => cart.remove(x.productId)}
          >
            Remove
          </button>
        </article>
      ))}
      <div className="cart-total">
        <span>Total</span>
        <strong>{money(cart.total)}</strong>
      </div>
      <Link className="button" to="/checkout">
        Continue to checkout
      </Link>
    </section>
  );
}
export function Checkout() {
  const cart = useCart(),
    navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useMetadata("Checkout | Mercada Impex", "Complete secure M-Pesa guest checkout for pickup in Kilimani.");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const customer = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
    };
    try {
      const result = await request("/orders", {
        method: "POST",
        body: JSON.stringify({
          customer,
          items: cart.items.map((x) => ({
            productId: x.productId,
            quantity: x.quantity,
          })),
          pickupLocation: form.get("pickupLocation"),
        }),
      });
      navigate(`/orders/${result.reference}`, {
        state: { payment: result.payment },
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  if (!cart.items.length)
    return (
      <section className="section">
        <h1>Your cart is empty.</h1>
        <Link to="/products">Browse products</Link>
      </section>
    );
  return (
    <section className="section checkout">
      <div>
        <p className="eyebrow">Secure guest checkout</p>
        <h1>Complete your order</h1>
        <p>
          Pickup: <strong>Oro Restaurant & Lounge, Kilimani</strong>
          {" "}<a href={pickupUrl} target="_blank" rel="noreferrer">Get directions</a>
        </p>
        <h2>Order summary</h2>
        {cart.items.map((item) => <p key={item.productId}>{item.name} × {item.quantity} <strong>{money(item.price * item.quantity)}</strong></p>)}
        <p>Total <strong>{money(cart.total)}</strong></p>
        <p>Authoritative total is confirmed by our server.</p>
      </div>
      <form onSubmit={submit}>
        <Field name="name" label="Full name" />
        <Field name="email" label="Email" type="email" />
        <Field
          name="phone"
          label="M-Pesa phone"
          type="tel"
          placeholder="2547XXXXXXXX"
          pattern="^(?:254|0)7\d{8}$"
        />
        <label>
          Pickup location
          <select name="pickupLocation" defaultValue="oro-kilimani">
            <option value="oro-kilimani">
              Oro Restaurant & Lounge, Kilimani
            </option>
          </select>
        </label>
        {error && (
          <p className="error" role="alert">
            {error} Your cart has been preserved.
          </p>
        )}
        <button disabled={busy}>
          {busy ? "Starting M-Pesa…" : `Pay ${money(cart.total)} with M-Pesa`}
        </button>
      </form>
    </section>
  );
}
const Field = ({ label, ...props }) => (
  <label>
    {label}
    <input required {...props} />
  </label>
);
export function OrderStatus() {
  const { reference } = useParams();
  const [order, setOrder] = useState();
  useMetadata("Order status | Mercada Impex", "Track your M-Pesa payment and Mercada Impex pickup order.");
  useEffect(() => {
    let active = true;
    const poll = () =>
      request(`/orders/${reference}`)
        .then((x) => {
          if (active) setOrder(x);
          if (active && x.paymentStatus === "pending") setTimeout(poll, 2500);
        })
        .catch((e) => active && setOrder({ error: e.message }));
    poll();
    return () => {
      active = false;
    };
  }, [reference]);
  if (!order)
    return (
      <section className="section">
        <p role="status">Checking payment…</p>
      </section>
    );
  return (
    <section className="section confirmation">
      <p className="eyebrow">Order {reference}</p>
      <h1>
        {order.paymentStatus === "paid"
          ? "Payment received"
          : order.paymentStatus === "failed"
            ? "Payment was not completed"
            : "Check your phone for the M-Pesa prompt"}
      </h1>
      {order.error ? (
        <p role="alert">{order.error}</p>
      ) : (
        <>
          <p>
            Status: <strong>{order.paymentStatus}</strong>
          </p>
          <p>Authoritative total: <strong>{money(order.total)}</strong></p>
          {order.receipt && (
            <p>
              M-Pesa receipt: <strong>{order.receipt}</strong>
            </p>
          )}
          <p>
            Keep your receipt and collect at Oro Restaurant & Lounge, Kilimani. <a href={pickupUrl} target="_blank" rel="noreferrer">Get directions</a>.
          </p>
          {order.paymentStatus === "failed" && <Link className="button" to="/checkout">Retry payment</Link>}
        </>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../../api";
import { useMetadata } from "../../useMetadata";

const money = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

export default function OrderHistory() {
  const [state, setState] = useState({ loading: true });
  useMetadata(
    "My orders | Mercada Impex",
    "Review your private Mercada Impex order history.",
  );

  useEffect(() => {
    request("/orders")
      .then((orders) => setState({ orders }))
      .catch((error) => setState({ error: error.message }));
  }, []);

  return (
    <section className="section">
      <p className="eyebrow">Customer account</p>
      <h1>My orders</h1>
      {state.loading && <p role="status">Loading your orders...</p>}
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.orders?.length === 0 && (
        <div className="empty">
          <p>You have not placed an order yet.</p>
          <Link className="button" to="/products">
            Explore Johari Gin
          </Link>
        </div>
      )}
      <div className="grid two">
        {state.orders?.map((order) => (
          <article className="card" key={order.reference}>
            <p className="eyebrow">{order.reference}</p>
            <h2>{money(order.total)}</h2>
            <p>
              Status: <strong>{order.paymentStatus}</strong>
            </p>
            <p>{new Date(order.createdAt).toLocaleDateString("en-KE")}</p>
            <Link to={`/account/orders/${order.reference}`}>View order</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../features/cart/CartContext";
import { useAuth } from "../features/auth/AuthContext";
const links = [
  ["/about", "About"],
  ["/services", "Services"],
  ["/products", "Products"],
  ["/insights", "Insights"],
  ["/contact", "Contact"],
];
export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const button = useRef();
  const { items } = useCart();
  const { customer, logout } = useAuth();
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [open]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header>
        <nav aria-label="Primary">
          <Link className="brand" to="/">
            <img src="/assets/logo.jpg" alt="" />
            Mercada Impex
          </Link>
          <button
            ref={button}
            className={`menu ${open ? "active" : ""}`}
            aria-expanded={open}
            aria-controls="nav-links"
            aria-label="Toggle navigation"
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
          <div id="nav-links" className={`nav-links ${open ? "open" : ""}`}>
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}>
                {label}
              </NavLink>
            ))}
            <NavLink to="/cart" onClick={() => setOpen(false)}>
              Cart{" "}
              <span aria-label={`${items.length} cart items`}>
                ({items.reduce((s, x) => s + x.quantity, 0)})
              </span>
            </NavLink>
            {customer ? (
              <>
                <NavLink to="/account/orders" onClick={() => setOpen(false)}>
                  My orders
                </NavLink>
                <button
                  className="text-button"
                  onClick={async () => {
                    await logout();
                    setOpen(false);
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <NavLink to="/login" onClick={() => setOpen(false)}>
                Sign in
              </NavLink>
            )}
          </div>
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer>
        <div>
          <strong>Mercada Impex Limited</strong>
          <p>
            Logistics, global commodity advisory and premium beverage
            distribution.
          </p>
        </div>
        <div>
          <a href="tel:+254714109708">+254 714 109 708</a>
          <a href="mailto:info@mercadaimpex.com">info@mercadaimpex.com</a>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Lower+Duplex+Apartments+Upperhill&hl=en"
            target="_blank"
            rel="noreferrer"
          >
            Lower Duplex Apartments, Upperhill
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61580816012074&sfnsn=wa"
            target="_blank"
            rel="noreferrer"
          >
            Facebook
          </a>
          <a
            href="https://www.instagram.com/johariginkenya"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
          <a
            href="https://x.com/johariginkenya"
            target="_blank"
            rel="noreferrer"
          >
            X
          </a>
        </div>
        <p>© {new Date().getFullYear()} Mercada Impex Limited</p>
      </footer>
    </>
  );
}

import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { Home, About, Services, Insights } from "./pages/ContentPages";
import { Cart } from "./pages/CommercePages";
import { ProductDetail, Products } from "./features/catalog";
import { Checkout, OrderStatus } from "./features/checkout";
import Contact from "./pages/Contact";
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders/:reference" element={<OrderStatus />} />
        <Route
          path="*"
          element={
            <section className="section">
              <h1>Page not found</h1>
            </section>
          }
        />
      </Routes>
    </Layout>
  );
}

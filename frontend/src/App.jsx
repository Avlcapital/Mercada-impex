import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { Home, About, Services, Insights } from "./pages/ContentPages";
import { Cart } from "./pages/CommercePages";
import { ProductDetail, Products } from "./features/catalog";
import { Checkout, OrderStatus } from "./features/checkout";
import Contact from "./pages/Contact";
import { Login, Register } from "./features/auth/AuthPages";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import OrderHistory from "./features/orders/OrderHistory";
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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/orders"
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/orders/:reference"
          element={
            <ProtectedRoute>
              <OrderStatus />
            </ProtectedRoute>
          }
        />
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

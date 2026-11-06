import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { Checkout, OrderStatus } from "./CommercePages";
import { request } from "../api";
import { useCart } from "../features/cart/CartContext";
import { useAuth } from "../features/auth/AuthContext";
vi.mock("../api", () => ({ request: vi.fn() }));
vi.mock("../features/cart/CartContext", () => ({ useCart: vi.fn() }));
vi.mock("../features/auth/AuthContext", () => ({ useAuth: vi.fn() }));
const cart = {
  items: [
    {
      productId: "507f1f77bcf86cd799439011",
      name: "Johari Gin",
      price: 5390,
      quantity: 2,
    },
  ],
  total: 10780,
};
function Location() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}
function checkout() {
  useAuth.mockReturnValue({
    customer: { id: "customer-1", name: "Amina", email: "a@example.com" },
  });
  return render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <Routes>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/account/orders/:reference" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}
async function fill() {
  await userEvent.type(screen.getByLabelText("M-Pesa phone"), "0712345678");
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test("checkout submits server-safe items and navigates after success", async () => {
  useCart.mockReturnValue(cart);
  request.mockResolvedValue({
    reference: "MI-123",
    payment: { status: "pending" },
  });
  checkout();
  await fill();
  await userEvent.click(screen.getByRole("button", { name: /Pay Ksh/ }));
  expect(request).toHaveBeenCalledWith(
    "/orders",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        phone: "0712345678",
        items: [{ productId: cart.items[0].productId, quantity: 2 }],
        pickupLocation: "oro-kilimani",
      }),
    }),
  );
  expect(await screen.findByTestId("location")).toHaveTextContent(
    "/account/orders/MI-123",
  );
});
test("checkout rejection preserves cart and offers feedback", async () => {
  useCart.mockReturnValue(cart);
  request.mockRejectedValue(new Error("Provider unavailable"));
  checkout();
  await fill();
  await userEvent.click(screen.getByRole("button", { name: /Pay Ksh/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "cart has been preserved",
  );
  expect(cart.items).toHaveLength(1);
});
test("order polling moves pending to paid and renders receipt", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  request
    .mockResolvedValueOnce({
      reference: "MI-1",
      total: 5390,
      paymentStatus: "pending",
    })
    .mockResolvedValueOnce({
      reference: "MI-1",
      total: 5390,
      paymentStatus: "paid",
      receipt: "RCP123",
    });
  render(
    <MemoryRouter initialEntries={["/orders/MI-1"]}>
      <Routes>
        <Route path="/orders/:reference" element={<OrderStatus />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText(/Check your phone/)).toBeInTheDocument();
  await vi.advanceTimersByTimeAsync(2500);
  expect(await screen.findByText("RCP123")).toBeInTheDocument();
  expect(screen.getByText(/Ksh/)).toBeInTheDocument();
  vi.useRealTimers();
});
test("failed payment offers a retry path", async () => {
  request.mockResolvedValue({
    reference: "MI-1",
    total: 5390,
    paymentStatus: "failed",
  });
  render(
    <MemoryRouter initialEntries={["/orders/MI-1"]}>
      <Routes>
        <Route path="/orders/:reference" element={<OrderStatus />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    await screen.findByText("Payment was not completed"),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Retry payment" })).toHaveAttribute(
    "href",
    "/checkout",
  );
});

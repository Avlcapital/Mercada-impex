import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { CartProvider, useCart } from "./CartContext";
function Probe() {
  const c = useCart();
  return (
    <>
      <span>
        {c.items.length}:{c.total}
      </span>
      <button
        onClick={() =>
          c.add({ _id: "1", name: "Johari Gin", price: 5390, images: [] })
        }
      >
        Add
      </button>
    </>
  );
}
test("persists cart and calculates totals", async () => {
  localStorage.clear();
  render(
    <CartProvider>
      <Probe />
    </CartProvider>,
  );
  await userEvent.click(screen.getByText("Add"));
  expect(screen.getByText("1:5390")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("mercada-cart"))).toHaveLength(1);
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { AuthProvider } from "../features/auth/AuthContext";
import { CartProvider } from "../features/cart/CartContext";
import Layout from "./Layout";
test("mobile navigation reports and changes expanded state", async () => {
  render(
    <MemoryRouter>
      <CartProvider>
        <AuthProvider>
          <Layout>content</Layout>
        </AuthProvider>
      </CartProvider>
    </MemoryRouter>,
  );
  const button = screen.getByRole("button", { name: "Toggle navigation" });
  expect(button).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(button);
  expect(button).toHaveAttribute("aria-expanded", "true");
});

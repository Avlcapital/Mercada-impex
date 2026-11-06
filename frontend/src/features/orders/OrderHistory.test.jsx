import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { request } from "../../api";
import OrderHistory from "./OrderHistory";

vi.mock("../../api", () => ({ request: vi.fn() }));

test("renders only orders returned for the authenticated customer", async () => {
  request.mockResolvedValueOnce([
    {
      reference: "MI-AMINA-1",
      total: 5390,
      paymentStatus: "paid",
      createdAt: "2026-11-06T00:00:00.000Z",
    },
  ]);

  render(
    <MemoryRouter>
      <OrderHistory />
    </MemoryRouter>,
  );

  expect(await screen.findByText("MI-AMINA-1")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View order" })).toHaveAttribute(
    "href",
    "/account/orders/MI-AMINA-1",
  );
  expect(request).toHaveBeenCalledWith("/orders");
});

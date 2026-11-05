import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import Contact from "./Contact";
vi.mock("../api", () => ({ request: vi.fn().mockResolvedValue({}) }));
test("submits a valid contact message", async () => {
  render(<Contact />);
  await userEvent.type(screen.getByLabelText("Name"), "Amina");
  await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
  await userEvent.type(screen.getByLabelText("Subject"), "Trade");
  await userEvent.type(
    screen.getByLabelText("Message"),
    "Please contact me about trade.",
  );
  await userEvent.click(screen.getByRole("button", { name: "Send message" }));
  expect(
    await screen.findByText(/message has been received/i),
  ).toBeInTheDocument();
});

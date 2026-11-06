import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { request } from "../../api";
import { AuthProvider, useAuth } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import { Login } from "./AuthPages";

vi.mock("../../api", () => ({ request: vi.fn() }));

function Probe() {
  const { customer, logout } = useAuth();
  return (
    <>
      <span>{customer?.email || "anonymous"}</span>
      <button onClick={logout}>Sign out</button>
    </>
  );
}

function LocationProbe() {
  const location = useLocation();
  return <span>{`${location.pathname}${location.search}`}</span>;
}

beforeEach(() => {
  request.mockReset();
});

test("restores and revokes an HTTP-only cookie session without losing UI state", async () => {
  request
    .mockResolvedValueOnce({ customer: { email: "amina@example.com" } })
    .mockResolvedValueOnce({});
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

  expect(await screen.findByText("amina@example.com")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByText("anonymous")).toBeInTheDocument();
  expect(request).toHaveBeenLastCalledWith("/auth/logout", { method: "POST" });
});

test("redirects anonymous customers to login with their intended route", async () => {
  request.mockRejectedValueOnce(
    Object.assign(new Error("Unauthorized"), { status: 401 }),
  );
  render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <span>Checkout</span>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<span>Login page</span>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

  await waitFor(() =>
    expect(screen.getByText("Login page")).toBeInTheDocument(),
  );
  expect(screen.queryByText("Checkout")).not.toBeInTheDocument();
});

test("real login restores an explicit return path including its query", async () => {
  request
    .mockRejectedValueOnce(
      Object.assign(new Error("Unauthorized"), { status: 401 }),
    )
    .mockResolvedValueOnce({ customer: { email: "amina@example.com" } });
  render(
    <MemoryRouter
      initialEntries={[
        { pathname: "/login", state: { from: "/checkout?gift=yes" } },
      ]}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/checkout" element={<LocationProbe />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
  await userEvent.type(
    await screen.findByLabelText("Email"),
    "amina@example.com",
  );
  await userEvent.type(screen.getByLabelText("Password"), "correct-password");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByText("/checkout?gift=yes")).toBeInTheDocument();
  expect(request).toHaveBeenLastCalledWith(
    "/auth/login",
    expect.objectContaining({ method: "POST" }),
  );
});

/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
const CartContext = createContext(null);
const clamp = (value) => Math.min(12, Math.max(1, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 1));
const read = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("mercada-cart"));
    if (!Array.isArray(stored)) return [];
    return stored.filter((x) => x && typeof x.productId === "string" && typeof x.name === "string" && Number.isFinite(Number(x.price))).map((x) => ({...x, price: Number(x.price), quantity: clamp(x.quantity)}));
  } catch {
    return [];
  }
};
export function CartProvider({ children }) {
  const [items, setItems] = useState(read);
  const save = useCallback((next) => {
    setItems(next);
    localStorage.setItem("mercada-cart", JSON.stringify(next));
  }, []);
  const add = useCallback((product) =>
    save(
      items.some((x) => x.productId === product._id)
        ? items.map((x) =>
            x.productId === product._id
              ? { ...x, quantity: clamp(x.quantity + 1) }
              : x,
          )
        : [
            ...items,
            {
              productId: product._id,
              name: product.name,
              price: product.price,
              image: product.images?.[0],
              quantity: 1,
            },
          ],
    ), [items, save]);
  const quantity = useCallback((id, value) =>
    save(
      items.map((x) =>
        x.productId === id ? { ...x, quantity: clamp(value) } : x,
      ),
    ), [items, save]);
  const remove = useCallback(
    (id) => save(items.filter((x) => x.productId !== id)),
    [items, save],
  );
  const clear = useCallback(() => save([]), [save]);
  const value = useMemo(
    () => ({
      items,
      add,
      quantity,
      remove,
      clear,
      total: items.reduce((s, x) => s + x.price * x.quantity, 0),
    }),
    [add, clear, items, quantity, remove],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);

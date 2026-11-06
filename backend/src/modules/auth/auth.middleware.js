import { Session } from "./session.model.js";
import { tokenHash } from "./auth.service.js";
import { ApiError } from "../../middleware/errors.js";
const cookies = (header = "") => {
  try {
    return Object.fromEntries(
      header
        .split(";")
        .filter(Boolean)
        .map((part) => {
          const index = part.indexOf("=");
          if (index < 1) return ["", ""];
          return [
            decodeURIComponent(part.slice(0, index).trim()),
            decodeURIComponent(part.slice(index + 1)),
          ];
        }),
    );
  } catch {
    return {};
  }
};
export async function authenticate(req, _res, next) {
  try {
    const token = cookies(req.headers.cookie).mercada_session;
    if (!token) throw new ApiError(401, "Authentication required.");
    const session = await Session.findOne({
      tokenHash: tokenHash(token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).populate("customerId");
    if (!session?.customerId || session.customerId.disabled)
      throw new ApiError(401, "Authentication required.");
    req.customer = session.customerId;
    req.sessionRecord = session;
    next();
  } catch (error) {
    next(error);
  }
}

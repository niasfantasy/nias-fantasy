import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_COOKIE_NAME = "nias_admin_session";

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET fehlt in der .env.local."
    );
  }

  return secret;
}

function createSessionToken() {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update("nias-fantasy-admin-session")
    .digest("hex");
}

export async function setAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: createSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();

  const cookieValue =
    cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return false;
  }

  const expectedToken = createSessionToken();

  const receivedBuffer = Buffer.from(cookieValue);
  const expectedBuffer = Buffer.from(expectedToken);

  if (
    receivedBuffer.length !== expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "dt_session";
const secret = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null;

/**
 * Optimistic gate: keeps signed-out visitors off app pages before anything renders.
 * The API re-checks every request (including revocation), so this is UX, not the security boundary.
 */
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const isLogin = req.nextUrl.pathname === "/login";

  let valid = false;
  if (token) {
    if (!secret) valid = true;
    else {
      try {
        await jwtVerify(token, secret, { algorithms: ["HS256"] });
        valid = true;
      } catch {
        valid = false;
      }
    }
  }

  if (isLogin) {
    if (valid && !req.nextUrl.searchParams.has("reason")) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!valid) {
    const url = new URL("/login", req.url);
    const next = req.nextUrl.pathname + req.nextUrl.search;
    if (next !== "/") url.searchParams.set("next", next);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(COOKIE);
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};

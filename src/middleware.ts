import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/auth/signin" },
  callbacks: { authorized: ({ token }) => !!token },
});

export const config = {
  matcher: [
    "/((?!auth|unwavr|api|_next/static|_next/image|favicon.ico).*)",
  ],
};



import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

  const isProtectedRoute =
    nextUrl.pathname.startsWith("/meetings/new") ||
    nextUrl.pathname.match(/\/meetings\/[^/]+\/edit/)

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/meetings/new", "/meetings/:id/edit"],
}

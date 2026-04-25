import Link from "next/link"
import { auth } from "@/lib/auth"
import { Button } from "./Button"
import { SignOutButton } from "./SignOutButton"

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold sm:inline-block text-primary-600">
              Moim
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              모임 목록
            </Link>
            {session && (
              <>
                <Link
                  href="/me"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  내 활동
                </Link>
                <Link
                  href="/meetings/new"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  모임 만들기
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.user?.name}님
              </span>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">회원가입</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

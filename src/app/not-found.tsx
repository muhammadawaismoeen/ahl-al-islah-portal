import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 min-h-[60vh] flex items-center">
        <div className="container-prose text-center">
          <div className="arabic-text text-2xl text-gold-antique">
            الصفحة غير موجودة
          </div>
          <h1 className="mt-3 heading-serif text-5xl sm:text-7xl font-semibold text-emerald-deep">
            404
          </h1>
          <div className="gold-divider" />
          <p className="mt-4 text-lg text-ink/70 max-w-md mx-auto">
            The page you are looking for does not exist — or it has moved.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/" className="btn-primary">
              Return home
            </Link>
            <Link href="/positions" className="btn-ghost">
              View positions
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

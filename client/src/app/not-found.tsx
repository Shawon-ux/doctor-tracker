import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-xl font-semibold">Page Not Found</p>
      <p className="mt-1 text-muted">The address may be mistyped, or the record was removed.</p>
      <Link href="/" className="mt-4 font-medium underline-offset-2 hover:underline">
        Go to Overview
      </Link>
    </div>
  );
}

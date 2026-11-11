/** Remounts on every navigation, so each page arrives with the same short fade. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-[page-in_220ms_cubic-bezier(.2,.8,.2,1)_both]">{children}</div>;
}

import { Mountain } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 p-2 font-headline text-lg font-semibold tracking-tighter">
      <Mountain className="size-6 text-primary" />
      <span className="group-data-[collapsible=icon]:hidden">PathFinder AI</span>
    </Link>
  );
}

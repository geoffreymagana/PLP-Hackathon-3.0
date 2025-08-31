import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 p-2 font-headline text-lg font-semibold tracking-tighter">
      <Image src="/icons/icon-72x72.png" alt="PathFinder AI Logo" width={36} height={36} />
      <span className="group-data-[collapsible=icon]:hidden">PathFinder AI</span>
    </Link>
  );
}

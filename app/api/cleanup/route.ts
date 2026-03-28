import { NextResponse } from 'next/server';
import { runCleanup } from '@/app/api/fetch-tweets/route';

export async function POST() {
  const { deleted, error } = await runCleanup();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted,
    message: deleted > 0
      ? `Removed ${deleted} project${deleted === 1 ? '' : 's'} older than 7 days.`
      : 'No stale projects found. Feed is clean.',
  });
}

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const cwd = process.cwd();
    // Run sync-symbols first, then seed
    await execAsync('npm run sync-symbols', { cwd });
    await execAsync('npm run seed', { cwd });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

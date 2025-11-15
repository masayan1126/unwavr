import { NextResponse } from 'next/server';

/**
 * Speed test endpoint - returns random data for download speed measurement
 * Default size: 1MB
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sizeParam = searchParams.get('size');
  const sizeInBytes = sizeParam ? parseInt(sizeParam, 10) : 1024 * 1024; // Default 1MB

  // Generate random data
  // Using a simple pattern to avoid memory issues with large buffers
  const chunk = 'x'.repeat(1024); // 1KB chunk
  const chunks = Math.floor(sizeInBytes / 1024);
  const remainder = sizeInBytes % 1024;

  let data = chunk.repeat(chunks);
  if (remainder > 0) {
    data += 'x'.repeat(remainder);
  }

  return new NextResponse(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': sizeInBytes.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

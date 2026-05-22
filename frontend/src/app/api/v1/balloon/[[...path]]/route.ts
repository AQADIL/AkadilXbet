import { NextRequest } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const pathStr = path?.join('/') || '';
  const url = `${API_BASE}/api/v1/balloon/${pathStr}`;
  const userId = req.headers.get('X-User-ID') || 'demo-user';

  const response = await fetch(url, {
    headers: {
      'X-User-ID': userId,
    },
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const pathStr = path?.join('/') || '';
  const url = `${API_BASE}/api/v1/balloon/${pathStr}`;
  const userId = req.headers.get('X-User-ID') || 'demo-user';
  const body = await req.json();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}

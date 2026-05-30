import { NextResponse } from 'next/server';

// POST request handler to create a new transaction ID
export const POST = async (request: Request) => {
  try {
    const customId = `TRS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return NextResponse.json({ id: customId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

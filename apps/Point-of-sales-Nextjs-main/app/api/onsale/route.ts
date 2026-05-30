import { NextResponse } from 'next/server';

// Handler function for POST request
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Mock return values matching client-side expectations
    const mockOnSaleProduct = {
      id: `onsale-${Math.random().toString(36).substring(2, 10)}`,
      transactionId: body.transactionId,
      productId: body.productId,
      quantity: body.qTy,
    };

    return NextResponse.json(mockOnSaleProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

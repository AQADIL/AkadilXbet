import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    const response = await fetch(`${API_BASE_URL}/auth/wallet/transactions`, {
      method: "GET",
      headers: {
        "Authorization": authHeader || "",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Wallet transactions API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

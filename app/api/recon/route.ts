import { NextResponse } from "next/server"

// Proxy endpoint to the Python backend
// In production, set RECON_API_URL to your recon-ng Flask API address
const RECON_API_URL = process.env.RECON_API_URL || "http://localhost:5000"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint") || "dashboard"

  try {
    const response = await fetch(`${RECON_API_URL}/api/${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    // Return mock data if backend is not available
    return NextResponse.json({
      error: "Backend not available",
      mock: true,
      message: "Start the Python backend with: python recon-web --host 0.0.0.0 --port 5000",
    })
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint") || "tasks"

  try {
    const body = await request.json()
    const response = await fetch(`${RECON_API_URL}/api/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      error: "Backend not available",
      mock: true,
    })
  }
}

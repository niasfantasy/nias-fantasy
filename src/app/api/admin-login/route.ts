import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "ADMIN_PASSWORD fehlt in der .env.local.",
        },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Falsches Passwort.",
        },
        { status: 401 }
      );
    }

    await setAdminSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Login fehlgeschlagen.",
      },
      { status: 500 }
    );
  }
}
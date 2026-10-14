import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/adminAuth";

export async function POST() {
  try {
    await clearAdminSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("ADMIN LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Logout fehlgeschlagen.",
      },
      { status: 500 }
    );
  }
}
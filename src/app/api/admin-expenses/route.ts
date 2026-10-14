import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/adminAuth";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(
    supabaseUrl,
    supabaseSecretKey
  );
}

export async function GET() {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Nicht autorisiert.",
        },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase-Zugangsdaten fehlen.",
        },
        { status: 500 }
      );
    }

    const { data: expenses, error } =
      await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Ausgaben laden Fehler:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Ausgaben konnten nicht geladen werden.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expenses: expenses || [],
    });
  } catch (error) {
    console.error(
      "ADMIN EXPENSES GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Ausgaben konnten nicht geladen werden.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Nicht autorisiert.",
        },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase-Zugangsdaten fehlen.",
        },
        { status: 500 }
      );
    }

    const {
      expenseDate,
      category,
      description,
      amount,
      notes,
    } = await request.json();

    const numericAmount = Number(amount);

    if (
      !expenseDate ||
      !description ||
      !numericAmount ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Datum, Beschreibung und Betrag sind erforderlich.",
        },
        { status: 400 }
      );
    }

    const { data: expense, error } =
      await supabase
        .from("expenses")
        .insert({
          expense_date: expenseDate,
          category: category || null,
          description,
          amount: numericAmount,
          notes: notes || null,
        })
        .select("*")
        .single();

    if (error) {
      console.error(
        "Ausgabe speichern Fehler:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Ausgabe konnte nicht gespeichert werden.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error(
      "ADMIN EXPENSES POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Ausgabe konnte nicht gespeichert werden.",
      },
      { status: 500 }
    );
  }
}
export async function DELETE(request: Request) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Nicht autorisiert.",
        },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase-Zugangsdaten fehlen.",
        },
        { status: 500 }
      );
    }

    const { expenseId } = await request.json();

    if (!expenseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ausgaben-ID fehlt.",
        },
        { status: 400 }
      );
    }

    const { error, count } = await supabase
      .from("expenses")
      .delete({ count: "exact" })
      .eq("id", expenseId);

    if (error) {
      console.error(
        "Ausgabe löschen Fehler:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Ausgabe konnte nicht gelöscht werden.",
        },
        { status: 500 }
      );
    }

    if (!count) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ausgabe wurde nicht gefunden oder nicht gelöscht.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedId: expenseId,
    });
  } catch (error) {
    console.error(
      "ADMIN EXPENSES DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Ausgabe konnte nicht gelöscht werden.",
      },
      { status: 500 }
    );
  }
}
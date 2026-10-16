"use client";

import { useEffect, useState } from "react";
export default function AdminPage() {
    const [password, setPassword] = useState("");
const [message, setMessage] = useState("");
const [loggedIn, setLoggedIn] = useState(false);
const [orders, setOrders] = useState<any[]>([]);
const [statusFilter, setStatusFilter] = useState("alle");
const [sortOrder, setSortOrder] = useState("neueste");
const [searchTerm, setSearchTerm] = useState("");
const [expenses, setExpenses] = useState<any[]>([]);
const [siteViews, setSiteViews] = useState(0);
const [expenseDate, setExpenseDate] = useState("");
const [expenseCategory, setExpenseCategory] = useState("");
const [expenseDescription, setExpenseDescription] = useState("");
const [expenseAmount, setExpenseAmount] = useState("");
const [expenseNotes, setExpenseNotes] = useState("");
const [showAllExpenses, setShowAllExpenses] = useState(false);
const productNames: Record<string, string> = {
  dose05: "Dose 0,5 l",
  dose025: "Dose 0,25 l",
  kugelschreiber: "Kugelschreiber",
  pet05: "PET-Flasche 0,5 l",
  pet1: "PET-Flasche 1 l",
  pet15: "PET-Flasche 1,5 l",
};

const countryNames: Record<string, string> = {
  AT: "Österreich",
  DE: "Deutschland",
  CH: "Schweiz",
};
useEffect(() => {
  if (!loggedIn) return;

  const loadOrders = async () => {
    const response = await fetch("/api/admin-orders", {
  method: "POST",
});
    const result = await response.json();

    if (response.ok) {
      setOrders(result.orders || []);
    } else {
      setMessage(result.error || "Bestellungen konnten nicht geladen werden.");
    }
  };
  const loadExpenses = async () => {
  const response = await fetch("/api/admin-expenses", {
    method: "GET",
  });


  const result = await response.json();

  if (response.ok) {
    setExpenses(result.expenses || []);
  } else {
    setMessage(
      result.error ||
        "Ausgaben konnten nicht geladen werden."
    );
  }
};

const loadSiteViews = async () => {
  const response = await fetch("/api/admin-site-stats", {
    method: "GET",
  });

  const result = await response.json();

  if (response.ok) {
    setSiteViews(Number(result.views || 0));
  } else {
    setMessage(
      result.error ||
        "Seitenaufrufe konnten nicht geladen werden."
    );
  }
};
 loadOrders();
loadExpenses();
}, [loggedIn]);
const updateOrderStatus = async (orderId: number, newStatus: string) => {
  const response = await fetch("/api/admin-order-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      status: newStatus,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    setMessage(result.error || "Status konnte nicht geändert werden.");
    return;
  }

  setOrders((prev) =>
    prev.map((order) =>
      order.id === orderId
        ? { ...order, status: newStatus }
        : order
    )
  );
};

const updateTrackingCode = async (
  orderId: number,
  trackingCode: string
) => {
  const response = await fetch("/api/admin-order-tracking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      trackingCode,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    setMessage(
      result.error ||
        "Tracking-Code konnte nicht gespeichert werden."
    );
    return;
  }

  setOrders((prev) =>
    prev.map((order) =>
      order.id === orderId
        ? {
            ...order,
            tracking_code: trackingCode,
            tracking_saved: true,
            status: "versendet",
          }
        : order
    )
  );
};

const updateActualShippingCost = async (
  orderId: number,
  shippingCost: string
) => {
  setMessage("");

  const response = await fetch(
    "/api/admin-order-shipping-cost",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        shippingCost,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    setMessage(
      result.error ||
        "Versandkosten konnten nicht gespeichert werden."
    );
    return;
  }

  setOrders((prev) =>
    prev.map((order) =>
      order.id === orderId
    ? {
    ...order,
    actual_shipping_cost:
      shippingCost === ""
        ? null
        : Number(shippingCost),
    actual_shipping_cost_date:
      shippingCost === ""
        ? null
        : new Date().toISOString().slice(0, 10),
    shipping_cost_saved: true,
  }
        : order
    )
  );
};
const addExpense = async () => {
  setMessage("");

  const response = await fetch("/api/admin-expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expenseDate,
      category: expenseCategory,
      description: expenseDescription,
      amount: expenseAmount,
      notes: expenseNotes,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    setMessage(
      result.error ||
        "Ausgabe konnte nicht gespeichert werden."
    );
    return;
  }

  setExpenses((prev) =>
  [result.expense, ...prev].sort(
    (a, b) =>
      new Date(b.expense_date).getTime() -
      new Date(a.expense_date).getTime()
  )
);

  setExpenseDate("");
  setExpenseCategory("");
  setExpenseDescription("");
  setExpenseAmount("");
  setExpenseNotes("");

  setMessage("Ausgabe gespeichert.");
};

const deleteExpense = async (expenseId: number) => {
  const confirmed = window.confirm(
    "Ausgabe wirklich löschen?"
  );

  if (!confirmed) {
    return;
  }

  setMessage("");

  const response = await fetch("/api/admin-expenses", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expenseId,
    }),
  });

 let result: any = null;

try {
  result = await response.json();
} catch {
  result = null;
}

if (!response.ok) {
  setMessage(
    result?.error ||
      `Ausgabe konnte nicht gelöscht werden. Fehler ${response.status}`
  );
  return;
}

  setExpenses((prev) =>
    prev.filter(
      (expense) => expense.id !== expenseId
    )
  );
};
const deleteOrder = async (orderId: number) => {
  const order = orders.find(
    (order) => order.id === orderId
  );

  if (order?.invoice_number) {
    setMessage(
      `Bestellung kann nicht gelöscht werden, da bereits die Rechnung ${order.invoice_number} erstellt wurde.`
    );
    return;
  }

  const confirmed = window.confirm(
    "Bestellung wirklich endgültig löschen?"
  );

  if (!confirmed) {
    return;
  }

  const response = await fetch(
    "/api/admin-order-delete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    setMessage(
      result.error ||
        "Bestellung konnte nicht gelöscht werden."
    );
    return;
  }

  setOrders((prev) =>
    prev.filter(
      (order) => order.id !== orderId
    )
  );
};
const openInvoice = async (orderId: number) => {
  const response = await fetch("/api/admin-invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
    }),
  });

  if (!response.ok) {
    const result = await response.json();

    setMessage(
      result.error ||
        "Rechnung konnte nicht geöffnet werden."
    );

    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank");

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
};

const openCancellationInvoice = async (
  orderId: number
) => {
  const response = await fetch(
    "/api/admin-cancellation-invoice",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
      }),
    }
  );

  if (!response.ok) {
    const result = await response.json();

    setMessage(
      result.error ||
        "Stornorechnung konnte nicht geöffnet werden."
    );

    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank");

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
};

if (loggedIn) {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#C8A96B]">
          Nia&apos;s Fantasy
        </p>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <h1 className="text-4xl font-semibold">
    Bestellungen
  </h1>

  <button
    type="button"
    onClick={async () => {
  await fetch("/api/admin-logout", {
    method: "POST",
  });

  setLoggedIn(false);
  setPassword("");
  setMessage("");
}}
    className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
  >
    Abmelden
  </button>
</div>

<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
    Homepage-Aufrufe
  </p>

  <p className="mt-2 text-2xl font-semibold text-white">
    {siteViews.toLocaleString("de-AT")}
  </p>
</div>
  <div className="rounded-2xl border border-[#C8A96B]/20 bg-[#C8A96B]/5 p-5">
    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
      Einnahmen gesamt
    </p>

    <p className="mt-2 text-2xl font-semibold text-[#C8A96B]">
      {orders
        .filter(
          (order) =>
            order.status === "bezahlt" ||
            order.status === "versendet"
        )
        .reduce(
          (sum, order) =>
            sum + Number(order.total_price || 0),
          0
        )
        .toLocaleString("de-AT", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
      €
    </p>
  </div>
<div className="rounded-2xl border border-[#C8A96B]/20 bg-[#C8A96B]/5 p-5">
  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
    Einnahmen diesen Monat
  </p>

  <p className="mt-2 text-2xl font-semibold text-[#C8A96B]">
    {orders
      .filter((order) => {
  if (
    !order.paid_at ||
    order.status === "storniert"
  ) {
    return false;
  }

  const paidDate = new Date(order.paid_at);
  const now = new Date();

  return (
    paidDate.getMonth() === now.getMonth() &&
    paidDate.getFullYear() === now.getFullYear()
  );
})
      .reduce(
        (sum, order) =>
          sum + Number(order.total_price || 0),
        0
      )
      .toLocaleString("de-AT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}{" "}
    €
  </p>
</div>
<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
    Tatsächliche Versandkosten
  </p>

  <p className="mt-2 text-2xl font-semibold text-white">
    {orders
      .reduce(
        (sum, order) =>
          sum + Number(order.actual_shipping_cost || 0),
        0
      )
      .toLocaleString("de-AT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}{" "}
    €
  </p>
</div>
<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
    Sonstige Ausgaben diesen Monat
  </p>
  

  <p className="mt-2 text-2xl font-semibold text-white">
    {expenses
      .filter((expense) => {
        if (!expense.expense_date) {
          return false;
        }

        const expenseDate = new Date(expense.expense_date);
        const now = new Date();

        return (
          expenseDate.getMonth() === now.getMonth() &&
          expenseDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce(
        (sum, expense) =>
          sum + Number(expense.amount || 0),
        0
      )
      .toLocaleString("de-AT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}{" "}
    €
  </p>
</div>

<div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
    Überschuss diesen Monat
  </p>

  <p className="mt-2 text-2xl font-semibold text-green-300">
    {(
      orders
        .filter((order) => {
  if (
    !order.paid_at ||
    order.status === "storniert"
  ) {
    return false;
  }

  const paidDate = new Date(order.paid_at);
  const now = new Date();

  return (
    paidDate.getMonth() === now.getMonth() &&
    paidDate.getFullYear() === now.getFullYear()
  );
})
        .reduce(
          (sum, order) =>
            sum + Number(order.total_price || 0),
          0
        ) -

      orders
        .filter((order) => {
          if (!order.actual_shipping_cost_date) {
            return false;
          }

          const shippingDate = new Date(
            order.actual_shipping_cost_date
          );
          const now = new Date();

          return (
            shippingDate.getMonth() === now.getMonth() &&
            shippingDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce(
          (sum, order) =>
            sum + Number(order.actual_shipping_cost || 0),
          0
        ) -

      expenses
        .filter((expense) => {
          if (!expense.expense_date) {
            return false;
          }

          const expenseDate = new Date(
            expense.expense_date
          );
          const now = new Date();

          return (
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce(
          (sum, expense) =>
            sum + Number(expense.amount || 0),
          0
        )
    ).toLocaleString("de-AT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}{" "}
    €
  </p>
</div>
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
      Offen
    </p>

    <p className="mt-2 text-2xl font-semibold">
      {
        orders.filter(
          (order) => order.status === "neu"
        ).length
      }
    </p>
  </div>

  <div className="rounded-2xl border border-[#C8A96B]/20 bg-[#C8A96B]/5 p-5">
    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
      Bezahlt
    </p>

    <p className="mt-2 text-2xl font-semibold text-[#E2D1A2]">
      {
        orders.filter(
          (order) => order.status === "bezahlt"
        ).length
      }
    </p>
  </div>

  <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
      Versendet
    </p>

    <p className="mt-2 text-2xl font-semibold text-green-300">
      {
        orders.filter(
          (order) => order.status === "versendet"
        ).length
      }
    </p>
  </div>
  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
  <p className="text-xs uppercase tracking-[0.2em] text-white/40">
    Storniert
  </p>

  <p className="mt-2 text-2xl font-semibold text-red-300">
    {
      orders.filter(
        (order) => order.status === "storniert"
      ).length
    }
  </p>
</div>
</div>
<div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
  <p className="mb-4 text-xs uppercase tracking-[0.25em] text-[#C8A96B]">
    Neue Ausgabe erfassen
  </p>

  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <input
      type="date"
      value={expenseDate}
      onChange={(e) => setExpenseDate(e.target.value)}
      className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
    />

    <input
      type="text"
      value={expenseCategory}
      onChange={(e) => setExpenseCategory(e.target.value)}
      placeholder="Kategorie"
      className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
    />

    <input
      type="text"
      value={expenseDescription}
      onChange={(e) => setExpenseDescription(e.target.value)}
      placeholder="Beschreibung"
      className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
    />

    <input
      type="number"
      min="0"
      step="0.01"
      value={expenseAmount}
      onChange={(e) => setExpenseAmount(e.target.value)}
      placeholder="Betrag in €"
      className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
    />
  </div>

  <div className="mt-4">
    <input
      type="text"
      value={expenseNotes}
      onChange={(e) => setExpenseNotes(e.target.value)}
      placeholder="Notiz optional"
      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
    />
  </div>

  <div className="mt-4 text-right">
    <button
      type="button"
      onClick={addExpense}
      className="rounded-full bg-[#C8A96B] px-6 py-3 font-semibold text-black transition hover:bg-[#E2D1A2]"
    >
      Ausgabe speichern
    </button>
  </div>
</div>
<div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
  <p className="mb-4 text-xs uppercase tracking-[0.25em] text-[#C8A96B]">
    Eingetragene Ausgaben
  </p>

  {expenses.length === 0 ? (
    <p className="text-sm text-white/50">
      Noch keine Ausgaben eingetragen.
    </p>
  ) : (
    <>
      <div className="space-y-3">
        {(showAllExpenses
          ? expenses
          : expenses.slice(0, 5)
        ).map((expense) => (
          <div
            key={expense.id}
            className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-white">
                {expense.description}
              </p>

              <p className="mt-1 text-sm text-white/50">
                {expense.expense_date}
                {expense.category
                  ? ` · ${expense.category}`
                  : ""}
              </p>

              {expense.notes && (
                <p className="mt-1 text-sm text-white/40">
                  {expense.notes}
                </p>
              )}
            </div>

           <div className="flex items-center gap-3">
  <p className="font-semibold text-[#C8A96B]">
    {Number(
      expense.amount || 0
    ).toLocaleString("de-AT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}{" "}
    €
  </p>

  <button
    type="button"
    onClick={() => deleteExpense(expense.id)}
    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
  >
    Löschen
  </button>
</div>
          </div>
        ))}
      </div>

      {expenses.length > 5 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() =>
              setShowAllExpenses((prev) => !prev)
            }
            className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {showAllExpenses
              ? "Weniger anzeigen"
              : "Alle Ausgaben anzeigen"}
          </button>
        </div>
      )}
    </>
  )}
</div>
<div className="mb-6 flex flex-wrap gap-3">
  {["alle", "neu", "bezahlt", "versendet", "storniert"].map((status) => (
    <button
      key={status}
      type="button"
      onClick={() => setStatusFilter(status)}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        statusFilter === status
          ? "bg-[#C8A96B] text-black"
          : "border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/10"
      }`}
    >
      {status === "alle"
        ? "Alle"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </button>
  ))}
</div>
<div className="mb-6">
  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value)}
    className="rounded-xl border border-white/10 bg-black px-4 py-2 text-sm text-white outline-none"
  >
    <option value="neueste" className="bg-black text-white">
      Neueste zuerst
    </option>
    <option value="aelteste" className="bg-black text-white">
      Älteste zuerst
    </option>
  </select>
</div>
<div className="mb-6">
  <input
    type="text"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Nach Name, E-Mail oder Bestellnummer suchen..."
    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
  />
</div>

        <div className="space-y-4">
  {orders.length === 0 ? (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
      <p className="text-white/70">
        Noch keine Bestellungen vorhanden.
      </p>
    </div>
  ) : (
   orders
  .filter((order) => {
    const matchesStatus =
      statusFilter === "alle"
        ? true
        : order.status === statusFilter;

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      String(order.name || "").toLowerCase().includes(search) ||
      String(order.email || "").toLowerCase().includes(search) ||
      String(order.order_number || "").toLowerCase().includes(search);

    return matchesStatus && matchesSearch;
  })
  .sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();

    return sortOrder === "neueste"
      ? dateB - dateA
      : dateA - dateB;
  })
  .map((order) => (
      <div
        key={order.id}
        className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
  <div>
    <div className="mt-6 grid gap-6 border-t border-white/10 pt-6 md:grid-cols-2">
  <div>
    <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#C8A96B]">
      Lieferadresse
    </p>

    <p className="text-sm leading-relaxed text-white/70">
      {order.adresse}
      <br />
      {order.plz} {order.ort}
      <br />
      {countryNames[order.land] || order.land}
    </p>
  </div>

  <div>
    <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#C8A96B]">
      Produkte
    </p>

    <div className="space-y-1 text-sm text-white/70">
      {Object.entries(order.quantities || {}).map(
        ([product, quantity]) =>
          Number(quantity) > 0 && (
            <p key={product}>
            {productNames[product] || product}: {String(quantity)}×
            </p>
          )
      )}
    </div>
    {order.personalisierung && (
  <div className="mt-4 rounded-xl border border-[#C8A96B]/20 bg-[#C8A96B]/5 p-3">
    <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#C8A96B]">
      Personalisierung
    </p>

    <p className="text-sm font-medium text-white">
      {order.personalisierung}
    </p>
  </div>
)}
  </div>
</div>
    <div className="flex flex-wrap items-center gap-3">
  <p className="font-semibold">
    {order.name}
  </p>

  {order.status === "storniert" && (
    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300">
      Storniert
    </span>
  )}
</div>

    <p className="text-sm text-white/60">
      {order.email}
    </p>
    <p className="mt-2 text-sm text-white/50">
  Zahlungsart:{" "}
  {order.payment_method === "bank_transfer"
    ? "Vorkasse per Banküberweisung"
    : order.payment_method || "—"}
</p>

    <p className="mt-2 text-xs text-white/40">
      {new Date(order.created_at).toLocaleString("de-AT")}
    </p>
  </div>

  <div className="md:text-right">
  <p className="text-sm text-white/50">
    Bestellnummer
  </p>

  <p className="font-medium text-[#C8A96B]">
    {order.order_number || "—"}
  </p>
  {order.invoice_number && (
  <div className="mt-3">
    <p className="text-sm text-white/50">
      Rechnungsnummer
    </p>

    <p className="font-medium text-[#C8A96B]">
      {order.invoice_number}
    </p>

    <p
      className={`mt-1 text-xs ${
        order.invoice_sent
          ? "text-green-300"
          : "text-white/40"
      }`}
    >
      {order.invoice_sent
        ? "Rechnung gesendet"
        : "Rechnung noch nicht gesendet"}
    </p>
  </div>
)}
{order.cancellation_invoice_number && (
  <div className="mt-3">
    <p className="text-sm text-white/50">
      Stornorechnung
    </p>

    <p className="font-medium text-red-300">
      {order.cancellation_invoice_number}
    </p>

    <p
      className={`mt-1 text-xs ${
        order.cancellation_invoice_sent
          ? "text-green-300"
          : "text-white/40"
      }`}
    >
      {order.cancellation_invoice_sent
        ? "Stornorechnung gesendet"
        : "Stornorechnung noch nicht gesendet"}
    </p>
  </div>
)}

  <div className="mt-4">
    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
      Status
    </p>

    <select
      value={order.status || "neu"}
      onChange={(e) =>
        updateOrderStatus(order.id, e.target.value)
      }
     className={`rounded-xl border px-3 py-2 text-sm font-medium outline-none ${
  order.status === "versendet"
    ? "border-green-500/30 bg-green-500/10 text-green-300"
    : order.status === "bezahlt"
    ? "border-[#C8A96B]/40 bg-[#C8A96B]/10 text-[#E2D1A2]"
    : "border-white/10 bg-black text-white"
}`}
    >
      <option value="neu" className="bg-black text-white">
  Neu
</option>
<option value="bezahlt" className="bg-black text-white">
  Bezahlt
</option>
<option value="versendet" className="bg-black text-white">
  Versendet
</option>
    </select>
    <div className="mt-4">
  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
    Tracking-Code
  </p>

  <div className="flex flex-col gap-2 sm:flex-row">
  <input
    type="text"
    value={order.tracking_code || ""}
    onChange={(e) =>
  setOrders((prev) =>
    prev.map((item) =>
      item.id === order.id
        ? {
            ...item,
            tracking_code: e.target.value,
            tracking_saved: false,
          }
        : item
    )
  )
}
    placeholder="Tracking-Code"
    className={`w-full rounded-xl border px-3 py-2 text-sm text-white outline-none transition ${
  order.tracking_saved
    ? "border-white/10 bg-white/10"
    : "border-white/10 bg-black"
}`}
  />

  <button
    type="button"
    onClick={() =>
      updateTrackingCode(
        order.id,
        order.tracking_code || ""
      )
    }
    className="rounded-xl border border-[#C8A96B]/30 bg-[#C8A96B]/10 px-4 py-2 text-sm font-medium text-[#E2D1A2] transition hover:bg-[#C8A96B]/20"
  >
    {order.tracking_saved ? "Gespeichert" : "Speichern"}
  </button>
</div>
</div>
  </div>
</div>
</div>
<div className="mt-4 flex flex-col items-end">
  <p className="mb-2 text-right text-xs uppercase tracking-[0.2em] text-white/40">
    Tatsächliche Versandkosten
  </p>

  <div className="flex items-center justify-end gap-2">
    <input
      type="number"
      min="0"
      step="0.01"
      value={order.actual_shipping_cost ?? ""}
      onChange={(e) =>
        setOrders((prev) =>
          prev.map((item) =>
            item.id === order.id
              ? {
                  ...item,
                  actual_shipping_cost: e.target.value,
                  shipping_cost_saved: false,
                }
              : item
          )
        )
      }
      placeholder="z. B. 8,90"
      className={`w-32 rounded-xl border px-3 py-2 text-sm text-white outline-none transition ${
  order.shipping_cost_saved
    ? "border-white/10 bg-white/10"
    : "border-white/10 bg-black"
}`}
    />

    <button
      type="button"
      onClick={() =>
        updateActualShippingCost(
          order.id,
          String(order.actual_shipping_cost ?? "")
        )
      }
      className="rounded-xl border border-[#C8A96B]/30 bg-[#C8A96B]/10 px-4 py-2 text-sm font-medium text-[#E2D1A2] transition hover:bg-[#C8A96B]/20"
    >
      {order.shipping_cost_saved ? "Gespeichert" : "Speichern"}
    </button>
  </div>
</div>


       <div className="mt-4 flex flex-col gap-4">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-[#C8A96B]">
      {order.total_price} €
    </p>

    {order.invoice_number && (
      <button
        type="button"
        onClick={() => openInvoice(order.id)}
        className="rounded-xl border border-[#C8A96B]/30 bg-[#C8A96B]/10 px-4 py-2 text-sm font-medium text-[#E2D1A2] transition hover:bg-[#C8A96B]/20"
      >
        Rechnung öffnen
      </button>
    )}
    {order.cancellation_invoice_number && (
  <button
    type="button"
    onClick={() =>
      openCancellationInvoice(order.id)
    }
    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
  >
    Stornorechnung öffnen
  </button>
)}
  </div>

<div className="border-t border-white/10 pt-4">
  {order.status === "storniert" ? (
    <p className="text-right text-sm font-medium text-red-300">
      Bestellung storniert
    </p>
  ) : (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={async () => {
          const confirmed = window.confirm(
            order.invoice_number
              ? `Die Bestellung hat bereits die Rechnung ${order.invoice_number}. Wirklich stornieren?`
              : "Bestellung wirklich stornieren?"
          );

          if (!confirmed) {
            return;
          }

          await updateOrderStatus(
            order.id,
            "storniert"
          );
        }}
        className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:bg-orange-500/20"
      >
        Stornieren
      </button>

      {!order.invoice_number && (
        <button
          type="button"
          onClick={() => deleteOrder(order.id)}
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
        >
          Bestellung löschen
        </button>
      )}
    </div>
  )}
</div>
</div>
      </div>
    ))
  )}
</div>
      </div>
    </main>
  );
}
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-md">
        <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#C8A96B]">
          Nia&apos;s Fantasy
        </p>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <h1 className="text-4xl font-semibold">
    Bestellungen
  </h1>

  <button
    type="button"
    onClick={async () => {
  await fetch("/api/admin-logout", {
    method: "POST",
  });

  setLoggedIn(false);
  setPassword("");
  setMessage("");
}}
    className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
  >
    Abmelden
  </button>
</div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
          <label className="mb-2 block text-sm text-white/70">
            Passwort
          </label>

         <input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Admin-Passwort"
          />

          <button
  type="button"
  onClick={async () => {
    setMessage("");

    const response = await fetch("/api/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Login fehlgeschlagen.");
      return;
    }

    setLoggedIn(true);
  }}
  className="w-full rounded-full bg-[#C8A96B] px-6 py-3 font-semibold text-black transition hover:bg-[#E2D1A2]"
>
  Anmelden
</button>
{message && (
  <p className="mt-4 text-center text-sm text-white/70">
    {message}
  </p>
)}
        </div>
      </div>
    </main>
  );
}
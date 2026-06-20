import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileImage,
  LoaderCircle,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { api } from "@/services/dataClient";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;

function formatRm(value) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatExpenseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

// Coerce any stored date into the yyyy-MM-dd value a native <input type="date"> needs.
function toDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quota, setQuota] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingExpense, setEditingExpense] = useState(null); // null, "new", or expense object
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    let alive = true;
    async function loadExpenses() {
      try {
        const [expenseRows, customerRows, totalQuota] = await Promise.all([
          api.getAdvisorExpenses(),
          api.getCustomers(),
          api.getAdvisorExpenseQuota(),
        ]);
        if (!alive) return;
        setExpenses(expenseRows ?? []);
        setCustomers(customerRows ?? []);
        setQuota(totalQuota);
      } catch {
        if (alive) setLoadError("Expense data could not be loaded.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadExpenses();
    return () => {
      alive = false;
    };
  }, []);

  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [String(customer.id), customer.name])),
    [customers]
  );

  const monthExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const date = new Date(expense.expenseDate || expense.createdAt);
        if (Number.isNaN(date.getTime())) return false;
        return (
          date.getFullYear() === selectedMonth.getFullYear() &&
          date.getMonth() === selectedMonth.getMonth()
        );
      }),
    [expenses, selectedMonth]
  );

  const now = new Date();
  const isCurrentMonth =
    selectedMonth.getFullYear() === now.getFullYear() && selectedMonth.getMonth() === now.getMonth();
  const monthLabel = new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(selectedMonth);

  function shiftMonth(delta) {
    setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  const totalExpenses = monthExpenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);
  const remainingQuota = Math.max(0, quota - totalExpenses);
  const usedPercentage = quota > 0 ? Math.min(100, (totalExpenses / quota) * 100) : 0;

  function addSavedExpense(expense) {
    setExpenses((current) => [expense, ...current.filter((item) => item.id !== expense.id)]);
    // Jump to the saved expense's month so it's visible even if its date falls
    // outside the month currently being viewed.
    const date = new Date(expense.expenseDate || expense.createdAt);
    if (!Number.isNaN(date.getTime())) {
      setSelectedMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
    setEditingExpense(null);
  }

  async function deleteExpense(expense) {
    if (!window.confirm(`Delete "${expense.title}"? This can't be undone.`)) return;
    setExpenses((current) => current.filter((item) => item.id !== expense.id));
    try {
      await api.deleteAdvisorExpense(expense.id);
    } catch {
      // Restore the row if the delete failed so the list stays accurate.
      setExpenses((current) => [expense, ...current.filter((item) => item.id !== expense.id)]);
      setLoadError("The expense could not be deleted. Please try again.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-[#101112]">
      <header className="flex h-[49px] shrink-0 items-center justify-between border-b border-[#e6e7ea] px-4">
        <div className="flex min-w-0 items-center gap-2">
          <WalletCards className="size-4 shrink-0" strokeWidth={1.9} />
          <h1 className="truncate text-[14px] font-semibold tracking-[-0.01em]">My Expenses</h1>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[#e6e7ea] bg-white p-0.5">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="flex size-7 items-center justify-center rounded-md text-black/55 transition-colors hover:bg-black/5"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-32 text-center text-[13px] font-semibold tabular-nums">{monthLabel}</span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="flex size-7 items-center justify-center rounded-md text-black/55 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto bg-[#fafafa]">
        <div className="mx-auto w-full max-w-[1180px] space-y-5 p-6">
          <section className="rounded-2xl border border-[#e7e7ea] bg-white p-5 shadow-[0_1px_2px_rgba(16,17,18,0.03)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-black/45">Expense quota</p>
                <p className="mt-1 text-[14px] text-black/55">Track client-related spending against your available allowance.</p>
              </div>
              <span className="text-[13px] font-semibold text-[#317cff]">{Math.round(usedPercentage)}% used</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#eef0f4]" aria-label={`${Math.round(usedPercentage)}% of quota used`}>
              <div
                className="h-full rounded-full bg-[#317cff] transition-[width] duration-300"
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ExpenseMetric label="Total Quota" value={formatRm(quota)} />
              <ExpenseMetric label="Total Expenses" value={formatRm(totalExpenses)} tone="spent" />
              <ExpenseMetric label="Remaining Quota" value={formatRm(remainingQuota)} tone="remaining" />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e7e7ea] bg-white shadow-[0_1px_2px_rgba(16,17,18,0.03)]">
            <div className="flex items-center justify-between border-b border-[#ededf0] px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold">Expense history</h2>
                <p className="mt-0.5 text-[12px] text-black/45">Receipts analyzed and labeled by AI.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingExpense("new")}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#317cff] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#286de5]"
              >
                <Plus className="size-4" strokeWidth={2.2} />
                Add New Expenses
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-52 items-center justify-center text-[13px] text-black/45">
                <LoaderCircle className="mr-2 size-4 animate-spin" /> Loading expenses...
              </div>
            ) : monthExpenses.length ? (
              <div className="divide-y divide-[#ededf0]">
                {monthExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    onClick={() => setEditingExpense(expense)}
                    className="group grid cursor-pointer gap-3 px-5 py-4 transition-colors hover:bg-black/[0.02] sm:grid-cols-[minmax(0,1.4fr)_minmax(140px,0.8fr)_140px_120px] sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#317cff]">
                        <ReceiptText className="size-4" strokeWidth={1.9} />
                      </span>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-[14px] font-semibold">{expense.title}</p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteExpense(expense);
                          }}
                          className="flex size-6 shrink-0 items-center justify-center rounded-md text-black/35 opacity-0 transition-all hover:bg-[#fff0ee] hover:text-[#c73b2f] focus-visible:opacity-100 group-hover:opacity-100"
                          aria-label={`Delete ${expense.title}`}
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.9} />
                        </button>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{customerNames.get(String(expense.customerId)) || "Unknown customer"}</p>
                    </div>
                    <p className="text-[12px] text-black/45">{formatExpenseDate(expense.expenseDate || expense.createdAt)}</p>
                    <p className="text-right text-[14px] font-semibold tabular-nums">{formatRm(expense.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f1f4fa] text-[#657188]">
                  <ReceiptText className="size-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold">No expenses in {monthLabel}</h3>
                <p className="mt-1 max-w-sm text-[13px] leading-5 text-black/45">
                  Add a proof of payment after meeting a client. AI will extract the amount and label the expense.
                </p>
                <button
                  type="button"
                  onClick={() => setEditingExpense("new")}
                  className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#317cff] px-3 text-[13px] font-semibold text-white hover:bg-[#286de5]"
                >
                  <Plus className="size-3.5" /> Add New Expenses
                </button>
              </div>
            )}
            {loadError ? <p className="border-t px-5 py-3 text-[12px] text-[#c73b2f]">{loadError}</p> : null}
          </section>
        </div>
      </main>

      {editingExpense ? (
        <AddExpenseModal
          customers={customers}
          initialExpense={editingExpense === "new" ? null : editingExpense}
          onClose={() => setEditingExpense(null)}
          onSaved={addSavedExpense}
        />
      ) : null}
    </div>
  );
}

function ExpenseMetric({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-[#ececf0] bg-[#fbfbfc] px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-black/40">{label}</p>
      <p className={`mt-1.5 text-[22px] font-semibold tracking-[-0.02em] tabular-nums ${tone === "spent" ? "text-[#c2413b]" : tone === "remaining" ? "text-[#16794c]" : "text-[#101112]"}`}>
        {value}
      </p>
    </div>
  );
}

function fileToDataUrl(file, maxDimension = 1024, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target.result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AddExpenseModal({ customers, initialExpense, onClose, onSaved }) {
  const inputRef = useRef(null);
  const [title, setTitle] = useState(initialExpense ? initialExpense.title : "");
  const [customerId, setCustomerId] = useState(initialExpense ? String(initialExpense.customerId) : "");
  const [expense, setExpense] = useState(initialExpense ? String(initialExpense.amount) : "");
  const [expenseDate, setExpenseDate] = useState(initialExpense ? toDateInputValue(initialExpense.expenseDate) : "");
  const [proofFile, setProofFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState("");
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (lightboxUrl) {
          setLightboxUrl("");
        } else if (!submitting) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting, lightboxUrl]);

  useEffect(() => {
    if (!proofFile) {
      if (initialExpense?.proofPath) {
        let alive = true;
        const path = initialExpense.proofPath;
        if (path.startsWith("data:") || path.startsWith("blob:") || path.startsWith("http")) {
          setPreviewUrl(path);
        } else {
          api.getExpenseProofUrl(path).then((url) => {
            if (alive) setPreviewUrl(url || initialExpense?.proofPreview || "");
          });
        }
        return () => {
          alive = false;
        };
      } else if (initialExpense?.proofPreview) {
        setPreviewUrl(initialExpense.proofPreview);
      } else {
        setPreviewUrl("");
      }
      return;
    }
    const url = URL.createObjectURL(proofFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile, initialExpense]);

  async function selectProof(file) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Upload an image receipt or payment screenshot.");
      return;
    }
    if (file.size > MAX_PROOF_SIZE) {
      setError("Proof of payment must be 5 MB or smaller.");
      return;
    }
    setProofFile(file);
    setLastAnalysis(null);
    setAnalysisFailed(false);

    setSubmitting(true);
    try {
      const customer = customers.find((item) => String(item.id) === customerId);
      const aiAnalysis = await api.analyzeExpenseProof({ file, title, customer });
      if (aiAnalysis?.amount) {
        setExpense(String(aiAnalysis.amount));
      }
      setLastAnalysis(aiAnalysis);
    } catch (err) {
      setAnalysisFailed(true);
      setError(err?.message || "Could not analyze receipt. Please enter the amount manually and save.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const isEdit = Boolean(initialExpense);
    if (!title.trim() || !customerId || !expense.trim() || (!isEdit && !proofFile)) {
      setError("Complete all required fields.");
      return;
    }

    const customer = customers.find((item) => String(item.id) === customerId);
    setSubmitting(true);
    try {
      let analysis = null;
      let localProofPreview = initialExpense?.proofPreview || null;
      if (proofFile) {
        let currentAnalysis = lastAnalysis;
        if (!currentAnalysis && !analysisFailed) {
          try {
            currentAnalysis = await api.analyzeExpenseProof({ file: proofFile, title, customer });
          } catch {
            currentAnalysis = null;
          }
        }
        analysis = {
          amount: parseFloat(expense) || currentAnalysis?.amount || 0,
          label: currentAnalysis?.label || "Other",
          merchant: currentAnalysis?.merchant || null,
          location: currentAnalysis?.location || null,
          expenseDate: expenseDate || currentAnalysis?.expenseDate || null,
          confidence: currentAnalysis?.confidence || 1.0,
        };
        try {
          localProofPreview = await fileToDataUrl(proofFile);
        } catch (e) {
          console.error(e);
        }
      } else if (isEdit) {
        analysis = {
          amount: parseFloat(expense),
          label: initialExpense.label || "Other",
          merchant: initialExpense.merchant || null,
          location: initialExpense.location || null,
          expenseDate: expenseDate || initialExpense.expenseDate,
          confidence: initialExpense.confidence,
        };
      }

      const saved = await api.saveAdvisorExpense({
        id: initialExpense?.id,
        title: title.trim(),
        customerId,
        proofFile: proofFile || undefined,
        analysis,
        existingProofPath: initialExpense?.proofPath,
        existingProofPreview: localProofPreview,
        existingProofName: proofFile ? proofFile.name : initialExpense?.proofName,
        existingCreatedAt: initialExpense?.createdAt,
      });
      onSaved(saved);
    } catch (submissionError) {
      setError(submissionError?.message || "The expense could not be analyzed. Try a clearer receipt image.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={initialExpense ? "Edit expense" : "Add new expense"}>
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={submitting ? undefined : onClose} aria-label="Close expense form" />
      <form onSubmit={submit} className="relative z-10 w-[500px] max-w-full overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold">{initialExpense ? "Edit Expense" : "Add New Expense"}</h2>
            <p className="mt-0.5 text-[12px] text-black/45">AI will read the amount and assign a label.</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="flex size-8 items-center justify-center rounded-lg text-black/45 hover:bg-black/[0.05] disabled:opacity-40" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold">Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Lunch after portfolio review" className="h-10 w-full rounded-lg border border-[#dedfe3] px-3 text-[14px] outline-none focus:border-[#317cff] focus:ring-2 focus:ring-[#317cff]/10" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold">Date</span>
            <input type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} className="h-10 w-full rounded-lg border border-[#dedfe3] px-3 text-[14px] outline-none focus:border-[#317cff] focus:ring-2 focus:ring-[#317cff]/10" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold">Client</span>
            <div className="relative">
              <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-[#dedfe3] bg-white pl-3 pr-9 text-[14px] outline-none focus:border-[#317cff] focus:ring-2 focus:ring-[#317cff]/10">
                <option value="">Select a client</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/40" />
            </div>
          </label>

          <div>
            <span className="mb-1.5 block text-[12px] font-semibold">Proof of Payment</span>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => selectProof(event.target.files?.[0])} />
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#cfd3da] bg-[#fafbfc] px-4 text-center transition-colors hover:border-[#317cff] hover:bg-[#f7faff] outline-none focus:ring-2 focus:ring-[#317cff]/20"
            >
              {previewUrl ? (
                <div className="relative flex flex-col items-center py-2 min-w-0">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    onError={() => {
                      const fallback = initialExpense?.proofPreview || "";
                      setPreviewUrl(previewUrl === fallback ? "" : fallback);
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setLightboxUrl(previewUrl);
                    }}
                    className="h-20 max-w-full rounded-lg object-contain border border-[#dedfe3] shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in"
                  />
                  <span className="mt-2 max-w-[300px] truncate text-[12px] font-semibold text-[#101112]">
                    {proofFile ? proofFile.name : (initialExpense?.proofName || "receipt.png")}
                  </span>
                  <span className="text-[10px] text-black/40">Click to replace · Click image to expand</span>
                </div>
              ) : (
                <>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white shadow-sm"><Upload className="size-4 text-[#317cff]" /></span>
                  <span className="mt-2 text-[13px] font-semibold">Upload receipt or payment screenshot</span>
                  <span className="mt-0.5 text-[11px] text-black/40">PNG, JPG or WebP · up to 5 MB</span>
                </>
              )}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold">Expense</span>
            <input type="number" step="0.01" min="0" value={expense} onChange={(event) => setExpense(event.target.value)} placeholder="e.g. 150.00" className="h-10 w-full rounded-lg border border-[#dedfe3] px-3 text-[14px] outline-none focus:border-[#317cff] focus:ring-2 focus:ring-[#317cff]/10" />
          </label>

          {error ? <p className="rounded-lg bg-[#fff0ee] px-3 py-2 text-[12px] font-medium text-[#b63227]">{error}</p> : null}
        </div>

        <div className="flex items-center justify-between border-t bg-[#fafafa] px-5 py-4">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-black/40">
            <Sparkles className="size-3.5 text-[#317cff]" /> AI receipt analysis
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={submitting} className="h-9 rounded-lg border border-[#dedfe3] bg-white px-3 text-[13px] font-semibold hover:bg-[#f5f5f6] disabled:opacity-40">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex h-9 min-w-36 items-center justify-center gap-2 rounded-lg bg-[#317cff] px-4 text-[13px] font-semibold text-white hover:bg-[#286de5] disabled:opacity-60">
              {submitting ? (
                <><LoaderCircle className="size-4 animate-spin" /> {proofFile && !lastAnalysis && !analysisFailed ? "Analyzing proof..." : "Saving..."}</>
              ) : (
                <><FileImage className="size-4" /> {proofFile && !lastAnalysis && !analysisFailed ? "Analyze & Save" : "Save Changes"}</>
              )}
            </button>
          </div>
        </div>
      </form>

      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setLightboxUrl("")}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl("")}
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Close preview"
          >
            <X className="size-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Receipt large preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}

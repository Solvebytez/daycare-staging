"use client";

import type { ReactNode } from "react";
import type { AutoApplyReviewSection } from "../../lib/autoApplyEnrollmentExtras";

export const inputRequiredClass =
  "w-full rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 px-5 py-3.5 text-lg text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-violet-300 hover:shadow-md focus:border-indigo-500 focus:from-white focus:to-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20";

export const textareaClass =
  "min-h-[8rem] w-full resize-y rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 px-5 py-3.5 text-base leading-relaxed text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-violet-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20";

export const inputOptionalClass =
  "w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-indigo-200 hover:shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15";

const STEP_LABELS = ["Parent", "Child", "Review"] as const;

export function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-3 gap-3">
        {STEP_LABELS.map((label, index) => {
          const n = (index + 1) as 1 | 2 | 3;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  active
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-100"
                    : done
                    ? "bg-emerald-500 text-white shadow-md"
                    : "border-2 border-slate-200 bg-white text-slate-400"
                }`}
              >
                {done ? "✓" : n}
              </div>
              <span
                className={`text-xs font-semibold sm:text-sm ${
                  active ? "text-indigo-700" : done ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500"
          style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
        />
      </div>
    </div>
  );
}

export function FormCard({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-300/25 ring-1 ring-slate-100 sm:p-10 p-6">
      {children}
    </section>
  );
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-base font-bold text-slate-900 sm:text-lg">{label}</label>
        {required ? (
          <span className="rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-100">
            Required
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Optional
          </span>
        )}
      </div>
      {children}
      {hint && !error ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-violet-50 to-blue-50 px-5 py-4 text-sm leading-relaxed text-indigo-900 shadow-sm sm:text-base">
      {children}
    </div>
  );
}

export function OptionalBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-dashed border-violet-200/90 bg-gradient-to-br from-violet-50/40 via-white to-indigo-50/30 p-5 text-slate-900 shadow-inner sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
          +
        </span>
        <div>
          <p className="text-base font-bold text-slate-900">{title}</p>
          <p className="mt-0.5 text-sm text-slate-600">
            Optional — skip anything you don&apos;t have handy.
          </p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function SubSectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wide text-slate-700">
      {children}
    </p>
  );
}

export function OptInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputOptionalClass}
      />
    </label>
  );
}

export function OptSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={onChange} className={inputOptionalClass}>
        {options.map((o) => (
          <option key={o || "empty"} value={o}>
            {o || "Select…"}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DayChip({
  day,
  checked,
  onToggle,
}: {
  day: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 ${
        checked
          ? "border-indigo-500 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25"
          : "border-slate-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
          checked ? "border-white/40 bg-white/20" : "border-slate-300 bg-slate-50"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      {day.slice(0, 3)}
    </button>
  );
}

export function OptCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
        checked
          ? "border-indigo-200 bg-indigo-50/80 shadow-sm"
          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
      />
      <span className="text-sm font-medium text-slate-900">{label}</span>
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 py-3.5 text-lg font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] ${className}`}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-lg font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

export function AutoApplyReviewSummary({
  sections,
  selectedCount,
}: {
  sections: AutoApplyReviewSection[];
  selectedCount: number;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-inner sm:p-6">
      <p className="text-sm text-slate-600">
        Confirm everything below before checkout. Optional fields only appear if you entered them.
      </p>

      {sections.map((section) => (
        <div
          key={section.title}
          className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100"
        >
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
              {section.title}
            </h3>
          </div>
          <dl className="divide-y divide-slate-50 px-4 py-1">
            {section.items.map((item) => (
              <div
                key={`${section.title}-${item.label}`}
                className="grid gap-1 py-3 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:gap-4"
              >
                <dt className="text-sm font-medium text-slate-500">{item.label}</dt>
                <dd className="text-sm font-semibold text-slate-900 sm:text-base">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-center font-bold text-white shadow-lg shadow-indigo-500/20">
        Applying to {selectedCount || 0} daycare{selectedCount === 1 ? "" : "s"}
      </div>
    </div>
  );
}

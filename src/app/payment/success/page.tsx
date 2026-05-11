"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { CheckCircle, Download, Loader } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { clearSearchSelection, clearAutoApplyPending } from "@/lib/autoApplyPending";
import { clearAutoApplyCheckoutDraft } from "@/lib/autoApplyCheckout";

function PaymentSuccessPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [, setHasPurchased] = useState(false);

  const product = (searchParams.get("product") || "").toLowerCase();
  const isAutoApply = product === "auto-apply";

  const getDashboardUrl = () => {
    if (!user) return "/dashboard";
    switch (user.userType) {
      case "provider":
        return "/provider/dashboard";
      case "parent":
        return isAutoApply
          ? "/parent/dashboard?tab=my-daycares"
          : "/parent/dashboard";
      default:
        return "/dashboard";
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (isAutoApply) {
      try {
        clearSearchSelection();
        clearAutoApplyPending();
        clearAutoApplyCheckoutDraft();
      } catch {
        // ignore
      }
    }

    setHasPurchased(true);
    setCheckingPurchase(false);
  }, [user, router, isAutoApply]);

  if (checkingPurchase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl md:p-12">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="mb-4 text-4xl font-bold text-gray-900">Payment Successful!</h1>

          <p className="mb-8 text-xl text-gray-600">
            {isAutoApply
              ? "Your auto-apply credits are ready and your applications are submitted."
              : "Thank you for your purchase!"}
          </p>

          <div className="mb-8 rounded-lg bg-blue-50 p-6">
            <div className="rounded-lg bg-blue-50 p-6">
              <div className="mb-4 flex items-center justify-center space-x-3">
                <Download className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Download your PDF</h2>
              </div>
              <p className="mb-6 text-gray-700">
                {isAutoApply
                  ? "If you purchased a report, you can download it here."
                  : "Your comprehensive Daycare Full Report is ready to download."}
              </p>
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  const button = e.currentTarget;
                  const originalContent = button.innerHTML;
                  button.disabled = true;
                  button.innerHTML =
                    '<svg class="animate-spin h-5 w-5 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generating PDF...</span>';

                  try {
                    const response = await apiClient.get(
                      isAutoApply ? "/api/reports/download/auto-apply" : "/api/reports/download",
                      {
                        responseType: "blob",
                      }
                    );

                    if (response.status !== 200) {
                      throw new Error(`Server error: ${response.status}`);
                    }

                    const contentType = response.headers["content-type"];
                    if (!contentType || !contentType.includes("application/pdf")) {
                      throw new Error("Server did not return a PDF file");
                    }

                    const blob = response.data;
                    if (blob.size === 0) {
                      throw new Error("PDF file is empty");
                    }

                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${isAutoApply ? "auto-apply-daycares" : "daycare-full-report"}-${new Date()
                      .toISOString()
                      .split("T")[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();

                    setTimeout(() => {
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }, 100);
                  } catch (error: unknown) {
                    const errorMessage =
                      error instanceof Error ? error.message : "Unknown error";
                    alert(
                      `Failed to download report: ${errorMessage}\n\nCheck browser console (F12) for details.`
                    );
                  } finally {
                    button.disabled = false;
                    button.innerHTML = originalContent;
                  }
                }}
                className="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/search"
              className="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
            >
              <span>{isAutoApply ? "Back to Search" : "Continue Searching"}</span>
            </Link>

            <div>
              <Link
                href={getDashboardUrl()}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <Navigation />
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      }
    >
      <PaymentSuccessPageInner />
    </Suspense>
  );
}

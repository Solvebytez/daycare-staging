"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  clearAutoApplyCheckoutDraft,
  readAutoApplyCheckoutDraft,
  type AutoApplyCheckoutDraft,
} from "@/lib/autoApplyCheckout";
import { getAutoApplyCredits, submitAutoApplyApplications } from "@/lib/applicationsService";
import {
  createAutoApplyPaymentIntent,
  getPaymentStatus,
  reconcilePaymentAfterSuccess,
  type CreateIntentResponseData,
} from "@/lib/paymentsService";
import Navigation from "@/components/Navigation";

function extractApiError(e: unknown): string | null {
  if (
    typeof e === "object" &&
    e !== null &&
    "response" in e &&
    typeof (e as { response?: { data?: { error?: string; message?: string } } }).response
      ?.data === "object"
  ) {
    const d = (e as { response: { data?: { error?: string; message?: string } } }).response
      .data;
    if (typeof d?.error === "string") return d.error;
    if (typeof d?.message === "string") return d.message;
  }
  if (e instanceof Error) return e.message;
  return null;
}

function logAxiosLikeError(context: string, e: unknown) {
  const isObj = typeof e === "object" && e !== null;
  const isAxios =
    isObj && "isAxiosError" in e && (e as { isAxiosError?: boolean }).isAxiosError;

  if (!isObj) {
    // eslint-disable-next-line no-console
    console.error(`[PAYMENTS] ${context} (non-object error)`, e);
    return;
  }

  const anyErr = e as {
    message?: string;
    code?: string;
    name?: string;
    response?: { status?: number; data?: unknown };
    config?: {
      url?: string;
      method?: string;
      baseURL?: string;
      withCredentials?: boolean;
    };
  };

  // eslint-disable-next-line no-console
  console.error(`[PAYMENTS] ${context}`, {
    isAxios,
    name: anyErr.name,
    message: anyErr.message,
    code: anyErr.code,
    request: {
      method: anyErr.config?.method,
      baseURL: anyErr.config?.baseURL,
      url: anyErr.config?.url,
      withCredentials: anyErr.config?.withCredentials,
    },
    response: anyErr.response
      ? { status: anyErr.response.status, data: anyErr.response.data }
      : null,
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForCreditsGrant = async (paymentIntentId: string) => {
  try {
    // eslint-disable-next-line no-console
    console.log("[PAYMENTS] reconcile start", { paymentIntentId });
    await reconcilePaymentAfterSuccess(paymentIntentId);
    // eslint-disable-next-line no-console
    console.log("[PAYMENTS] reconcile ok", { paymentIntentId });
  } catch {
    // eslint-disable-next-line no-console
    console.log("[PAYMENTS] reconcile skipped/failed; will poll status");
    /* Webhook may have already run; polling below still applies. */
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    let status;
    try {
      status = await getPaymentStatus(paymentIntentId);
    } catch (e) {
      logAxiosLikeError(`status poll failed (attempt ${attempt + 1})`, e);
      throw e;
    }

    // eslint-disable-next-line no-console
    console.log("[PAYMENTS] status poll", {
      attempt: attempt + 1,
      paymentIntentId,
      status: status?.data?.status,
      creditsGranted: status?.data?.creditsGranted,
    });
    if (
      status.success &&
      status.data.status === "completed" &&
      status.data.creditsGranted > 0
    ) {
      return;
    }
    if (status.success && status.data.status === "failed") {
      throw new Error("Payment failed while processing credits.");
    }
    await sleep(1500);
  }
  throw new Error(
    "Payment succeeded with Stripe, but credits are not recorded yet. If you are testing locally, run Stripe CLI: stripe listen --forward-to http://localhost:5001/api/payments/webhook — or retry in a moment."
  );
};

const stripeElementBase = {
  color: "#0f172a",
  fontSize: "16px",
  fontFamily:
    'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  "::placeholder": { color: "#94a3b8" },
} as const;

function StripeCheckoutForm({
  draft,
  intent,
  showTestCardHint,
}: {
  draft: AutoApplyCheckoutDraft;
  intent: CreateIntentResponseData;
  showTestCardHint: boolean;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [nameOnCard, setNameOnCard] = useState(draft.parentName || "");
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const orderLabel = useMemo(() => {
    const count = draft?.selectedCount || 0;
    return `Applications to ${count} daycare${count === 1 ? "" : "s"}`;
  }, [draft]);

  const orderPrice = intent.amountCents / 100;

  const handlePay = async () => {
    if (!stripe || !elements) {
      setError("Stripe is still loading. Please wait a moment.");
      return;
    }
    if (!nameOnCard.trim()) {
      setError("Please enter the card holder name.");
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setError("Card fields are not ready yet.");
      return;
    }

    setError(null);
    setIsPaying(true);

    try {
      // eslint-disable-next-line no-console
      console.log("[PAYMENTS] confirmCardPayment start");
      const confirmResult = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: nameOnCard.trim(),
            email: draft.parentEmail,
            phone: draft.parentPhone,
          },
        },
      });

      if (confirmResult.error) {
        // eslint-disable-next-line no-console
        console.error("[PAYMENTS] confirmCardPayment error", confirmResult.error);
        throw new Error(confirmResult.error.message || "Stripe payment failed.");
      }
      if (!confirmResult.paymentIntent || confirmResult.paymentIntent.status !== "succeeded") {
        // eslint-disable-next-line no-console
        console.error(
          "[PAYMENTS] confirmCardPayment not succeeded",
          confirmResult.paymentIntent
        );
        throw new Error("Payment is not completed yet. Please try again.");
      }

      // eslint-disable-next-line no-console
      console.log("[PAYMENTS] confirmCardPayment succeeded", {
        paymentIntentId: confirmResult.paymentIntent.id,
      });
      await waitForCreditsGrant(confirmResult.paymentIntent.id);

      // eslint-disable-next-line no-console
      console.log("[PAYMENTS] submitAutoApplyApplications start", {
        count: draft.daycareIds.length,
      });
      await submitAutoApplyApplications({
        daycareIds: draft.daycareIds,
        parentName: draft.parentName,
        parentEmail: draft.parentEmail,
        parentPhone: draft.parentPhone,
        childName: draft.childName,
        childDob: draft.childDob,
        preferredStartDate: draft.preferredStartDate,
        specialNotes: draft.specialNotes || "",
      });
      // eslint-disable-next-line no-console
      console.log("[PAYMENTS] submitAutoApplyApplications ok");

      clearAutoApplyCheckoutDraft();
      router.push("/payment/success?product=auto-apply");
    } catch (e: unknown) {
      logAxiosLikeError("handlePay failed", e);
      const apiMessage =
        typeof e === "object" &&
        e !== null &&
        "response" in e &&
        typeof (e as { response?: { data?: { error?: string } } }).response?.data
          ?.error === "string"
          ? (e as { response?: { data?: { error?: string } } }).response!.data!.error!
          : null;

      setError(apiMessage || (e instanceof Error ? e.message : "Payment failed. Please try again."));
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">Complete Your Order</h1>
        <p className="mt-2 text-sm text-slate-500">One-time fee • No subscription</p>
      </div>

      <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Order Summary</p>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">KinderBridge Auto-Apply</h2>
            <p className="text-sm text-slate-500">{orderLabel}</p>
          </div>
          <p className="text-4xl font-black text-slate-900">${orderPrice.toFixed(2)}</p>
        </div>
        <div className="my-5 border-t border-slate-200" />
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li>✓ 30 auto-apply daycare credits</li>
          <li>✓ Credits can be used over multiple checkouts</li>
          <li>✓ Real-time tracking dashboard</li>
          <li>✓ AI response classification</li>
        </ul>
        <div className="my-5 border-t border-slate-200" />
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-slate-900">Total</p>
          <p className="text-4xl font-black text-slate-900">
            ${orderPrice.toFixed(2)}{" "}
            <span className="text-sm text-slate-400">{intent.currency.toUpperCase()}</span>
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment</p>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="rounded border border-slate-200 px-2 py-0.5">Visa</span>
            <span className="rounded border border-slate-200 px-2 py-0.5">MC</span>
            <span className="rounded border border-slate-200 px-2 py-0.5">Amex</span>
          </div>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Name on Card</span>
          <input
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-300"
          />
        </label>

        {showTestCardHint && (
          <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-700">Test mode:</span> Card{" "}
            <code className="rounded bg-white px-1 py-0.5 text-[11px]">4242 4242 4242 4242</code>
            , any future expiry (e.g. 12/34), any 3-digit CVC.
          </p>
        )}

        <div className="mb-3">
          <span className="mb-1 block text-sm font-medium text-slate-700">Card number</span>
          <div className="min-h-[48px] rounded-xl border border-slate-200 bg-white px-4 py-3">
            <CardNumberElement
              options={{
                style: { base: stripeElementBase },
              }}
            />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Expiry</span>
            <div className="min-h-[48px] rounded-xl border border-slate-200 bg-white px-4 py-3">
              <CardExpiryElement options={{ style: { base: stripeElementBase } }} />
            </div>
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">CVC</span>
            <div className="min-h-[48px] rounded-xl border border-slate-200 bg-white px-4 py-3">
              <CardCvcElement options={{ style: { base: stripeElementBase } }} />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={isPaying || !stripe || !elements}
          className="w-full rounded-xl bg-[#FF7A45] py-3 text-lg font-bold text-white shadow transition hover:bg-[#F2682F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPaying ? "Processing..." : `Pay $${orderPrice.toFixed(2)} ${intent.currency.toUpperCase()}`}
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">🔒 Secured by Stripe</p>
      </section>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<AutoApplyCheckoutDraft | null>(null);
  const [intent, setIntent] = useState<CreateIntentResponseData | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [isSubmittingWithoutPay, setIsSubmittingWithoutPay] = useState(false);

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  const selectedCount = draft?.daycareIds?.length ?? 0;
  const canSkipPayment =
    typeof creditsRemaining === "number" &&
    creditsRemaining >= selectedCount &&
    selectedCount > 0;
  const hasPartialCreditsButNotEnough =
    typeof creditsRemaining === "number" &&
    creditsRemaining > 0 &&
    creditsRemaining < selectedCount;

  const handleSubmitWithoutPayment = async () => {
    if (!draft) return;

    setError(null);
    setIsSubmittingWithoutPay(true);
    try {
      const res = await submitAutoApplyApplications({
        daycareIds: draft.daycareIds,
        parentName: draft.parentName,
        parentEmail: draft.parentEmail,
        parentPhone: draft.parentPhone,
        childName: draft.childName,
        childDob: draft.childDob,
        preferredStartDate: draft.preferredStartDate,
        specialNotes: draft.specialNotes || "",
      });
      if (!res.success) {
        throw new Error(res.error || "Unable to submit applications.");
      }
      clearAutoApplyCheckoutDraft();
      router.push("/payment/success?product=auto-apply");
    } catch (e: unknown) {
      logAxiosLikeError("submit without payment failed", e);
      setError(extractApiError(e) || "Unable to submit applications. Please try again.");
    } finally {
      setIsSubmittingWithoutPay(false);
    }
  };

  useEffect(() => {
    const stored = readAutoApplyCheckoutDraft();
    if (!stored) {
      router.replace("/parent-details");
      return;
    }

    setDraft(stored);
    setError(null);
    setCheckoutReady(false);
    setPublishableKey(null);
    setIntent(null);
    setCreditsRemaining(null);

    let cancelled = false;

    (async () => {
      const [creditsOutcome, keyOutcome] = await Promise.allSettled([
        getAutoApplyCredits(),
        fetch("/api/stripe/publishable-key", { cache: "no-store" }).then(async (res) => {
          if (!res.ok) throw new Error("Could not load Stripe configuration.");
          return res.json() as Promise<{ publishableKey?: string }>;
        }),
      ]);

      if (cancelled) return;

      if (creditsOutcome.status === "fulfilled") {
        setCreditsRemaining(Number(creditsOutcome.value.data?.remainingCredits ?? 0));
      } else {
        logAxiosLikeError("credits fetch failed", creditsOutcome.reason);
        setCreditsRemaining(0);
      }

      let keyError: string | null = null;
      if (keyOutcome.status === "fulfilled") {
        setPublishableKey(String(keyOutcome.value.publishableKey ?? "").trim());
      } else {
        setPublishableKey("");
        keyError =
          extractApiError(keyOutcome.reason) ||
          "Could not load Stripe configuration.";
      }

      // If user has enough credits, skip initializing Stripe payment.
      const remaining =
        creditsOutcome.status === "fulfilled"
          ? Number(creditsOutcome.value.data?.remainingCredits ?? 0)
          : 0;
      const canSkip = remaining >= stored.daycareIds.length && stored.daycareIds.length > 0;

      let intentError: string | null = null;
      if (!canSkip && remaining > 0 && remaining < stored.daycareIds.length) {
        intentError = `You have ${remaining} credits remaining. Reduce your selection to ${remaining} daycares, submit, then come back to apply more.`;
      } else if (!canSkip) {
        try {
          const body = await createAutoApplyPaymentIntent({ daycareIds: stored.daycareIds });
          if (body.success && body.data) {
            setIntent(body.data);
          } else {
            intentError = body.error || "Unable to create payment with the server.";
          }
        } catch (e: unknown) {
          logAxiosLikeError("create intent failed", e);
          intentError = extractApiError(e) || "Request failed when creating payment.";
        }
      }

      setError(intentError ?? keyError);

      setCheckoutReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!draft) {
    return (
      <div className="min-h-screen bg-[#f4f6fb]">
        <Navigation />
      </div>
    );
  }

  const missingPublishableKey = checkoutReady && publishableKey === "";

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Navigation />
      <main className="px-4 py-10">
        {missingPublishableKey && (
          <div className="mx-auto mb-5 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-medium text-red-800">Missing Stripe publishable key</p>
            <p className="mt-2">
              <strong>On Vercel:</strong> Project → Settings → Environment Variables → add{" "}
              <code className="rounded bg-red-100 px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
              (or <code className="rounded bg-red-100 px-1">STRIPE_PUBLISHABLE_KEY</code>) for{" "}
              <em>Preview</em> and <em>Production</em>, then redeploy. Vercel does not read your laptop{" "}
              <code className="rounded bg-red-100 px-1">.env</code> file.
            </p>
            <p className="mt-2">
              <strong>Locally:</strong> put the same variable in{" "}
              <code className="rounded bg-red-100 px-1">frontend-staging/.env.local</code> or{" "}
              <code className="rounded bg-red-100 px-1">frontend-staging/.env</code> and restart{" "}
              <code className="rounded bg-red-100 px-1">npm run dev</code>.
            </p>
          </div>
        )}

        {error && (
          <div className="mx-auto mb-5 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!checkoutReady && !error && (
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Preparing secure checkout...
          </div>
        )}

        {checkoutReady && !error && !intent && !missingPublishableKey && !canSkipPayment && (
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Payment could not be initialized. Try again from the previous step.
          </div>
        )}

        {checkoutReady && !error && canSkipPayment && (
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              No payment required
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              You have enough credits
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              This checkout: <span className="font-semibold">{selectedCount}</span> • Available
              now: <span className="font-semibold">{creditsRemaining}</span>
            </p>
            <button
              type="button"
              onClick={handleSubmitWithoutPayment}
              disabled={isSubmittingWithoutPay}
              className="mt-5 w-full rounded-xl bg-[#16a34a] py-3 text-lg font-bold text-white shadow transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingWithoutPay ? "Submitting..." : "Submit applications"}
            </button>
          </div>
        )}

        {checkoutReady && !error && hasPartialCreditsButNotEnough && (
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Use remaining credits first
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Not enough credits for this batch
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Selected: <span className="font-semibold">{selectedCount}</span> • Remaining:{" "}
              <span className="font-semibold">{creditsRemaining}</span>
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Reduce your selection to {creditsRemaining} daycares and submit without payment.
              Once you reach 30/30 used, the next checkout will prompt payment again.
            </p>
            <button
              type="button"
              onClick={() => router.push("/parent-details")}
              className="mt-5 w-full rounded-xl bg-[#0f172a] py-3 text-lg font-bold text-white shadow transition hover:bg-black"
            >
              Back to selection
            </button>
          </div>
        )}

        {publishableKey && stripePromise && intent && !error && (
          <Elements stripe={stripePromise}>
            <StripeCheckoutForm
              draft={draft}
              intent={intent}
              showTestCardHint={publishableKey.startsWith("pk_test")}
            />
          </Elements>
        )}
      </main>
    </div>
  );
}

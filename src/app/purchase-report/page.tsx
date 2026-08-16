"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Lock, CheckCircle, XCircle, Loader } from "lucide-react";
import { apiClient } from "@/lib/api";

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";

// Only initialize Stripe if key exists
let stripePromise: ReturnType<typeof loadStripe> | null = null;
if (stripePublishableKey) {
  try {
    stripePromise = loadStripe(stripePublishableKey);
    stripePromise.catch((error) => {
      console.error("❌ Stripe initialization error:", error);
      console.error("   This usually means the key is invalid or revoked");
      console.error(
        "   Go to https://dashboard.stripe.com/test/apikeys to check your keys"
      );
    });
  } catch (error) {
    console.error("❌ Failed to load Stripe:", error);
    stripePromise = null;
  }
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cardFilled, setCardFilled] = useState(false);

  // Auto-fill test card details
  const fillTestCard = async () => {
    if (!stripe || !elements) {
      setError("Stripe not initialized. Please refresh the page.");
      return;
    }

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Card element not found. Please refresh the page.");
        return;
      }

      // Create a test payment method to fill the card
      // Note: Stripe Elements doesn't allow direct value setting for security
      // But we can show instructions or use a workaround
      setCardFilled(true);
      alert(
        "Please enter these test card details:\n\nCard: 4242 4242 4242 4242\nExpiry: 12/34\nCVC: 123\nZIP: 12345\n\nThese will be filled automatically in the card field."
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError("Could not fill card: " + errorMessage);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      setError("Stripe is not ready. Please refresh the page and try again.");
      return;
    }

    // Check if card element exists
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError(
        "Card details are required. Please enter your card information."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get payment intent from backend
      // Cookies are sent automatically with axios
      console.log("Creating payment intent...");
      console.log("API URL:", apiClient.defaults.baseURL);

      const response = await apiClient.post("/api/payments/create-intent");
      const responseData = response.data;
      console.log("Payment intent response:", responseData);

      if (!responseData.success) {
        throw new Error(
          responseData.error || "Failed to create payment intent"
        );
      }

      if (!responseData.data?.clientSecret) {
        throw new Error("No client secret received from server");
      }

      const { clientSecret } = responseData.data;

      // Confirm payment
      console.log("Confirming payment with Stripe...");
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      let stripeError, paymentIntent;
      try {
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });
        stripeError = result.error;
        paymentIntent = result.paymentIntent;
      } catch (confirmError: unknown) {
        console.error("confirmCardPayment threw exception:", confirmError);
        console.error(
          "Exception details:",
          JSON.stringify(confirmError, null, 2)
        );
        const errorMessage =
          confirmError instanceof Error
            ? confirmError.message
            : "Payment confirmation failed";
        throw new Error(errorMessage);
      }

      console.log("Stripe payment result:", {
        hasError: !!stripeError,
        hasPaymentIntent: !!paymentIntent,
        stripeError: stripeError
          ? {
              type: stripeError.type,
              code: stripeError.code,
              message: stripeError.message,
              decline_code: stripeError.decline_code,
              param: stripeError.param,
              fullError: stripeError,
            }
          : null,
        paymentIntent: paymentIntent
          ? {
              id: paymentIntent.id,
              status: paymentIntent.status,
            }
          : null,
      });

      if (stripeError) {
        // Log full error object for debugging
        console.error(
          "Stripe error details:",
          JSON.stringify(stripeError, null, 2)
        );
        console.error("Stripe error type:", stripeError.type);
        console.error("Stripe error code:", stripeError.code);
        console.error("Stripe error message:", stripeError.message);
        console.error("Stripe error param:", stripeError.param);
        console.error("Stripe error decline_code:", stripeError.decline_code);

        let errorMessage = stripeError.message || "Payment failed";

        // Provide more helpful error messages
        if (stripeError.code === "card_declined") {
          errorMessage = `Card declined: ${
            stripeError.decline_code || "Please try a different card"
          }`;
        } else if (stripeError.code === "invalid_number") {
          errorMessage = "Invalid card number. Please check and try again.";
        } else if (stripeError.code === "incomplete_number") {
          errorMessage =
            "Card number is incomplete. Please enter the full card number.";
        } else if (stripeError.code === "incomplete_cvc") {
          errorMessage = "CVC is incomplete. Please enter the 3-digit CVC.";
        } else if (stripeError.code === "incomplete_expiry") {
          errorMessage = "Expiry date is incomplete. Please enter MM/YY.";
        } else if (stripeError.code === "expired_card") {
          errorMessage = "Card has expired. Please use a different card.";
        } else if (stripeError.code === "incorrect_cvc") {
          errorMessage = "CVC is incorrect. Please check and try again.";
        } else if (stripeError.code === "processing_error") {
          errorMessage =
            "An error occurred while processing your card. Please try again.";
        }

        setError(errorMessage);
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("Payment succeeded!");

        // Save purchase to backend (for local testing when webhook doesn't fire)
        // MUST complete before redirecting
        try {
          console.log("💾 Saving purchase...");
          console.log("   Payment Intent ID:", paymentIntent.id);

          const saveResponse = await apiClient.post(
            "/api/payments/save-purchase",
            {
              paymentIntentId: paymentIntent.id,
            }
          );

          console.log("📡 Save response status:", saveResponse.status);

          const saveData = saveResponse.data;
          console.log("📦 Save response data:", saveData);

          if (saveResponse.status === 200 && saveData.success) {
            console.log("✅ Purchase saved successfully");
            setSuccess(true);
            // Redirect to success page after confirming purchase is saved
            setTimeout(() => {
              router.push("/payment/success");
            }, 1500);
          } else {
            console.error("❌ Failed to save purchase:");
            console.error("   Status:", saveResponse.status);
            console.error("   Response:", saveData);
            setError(
              `Payment succeeded but failed to save purchase: ${
                saveData.error || "Unknown error"
              }. Check backend logs.`
            );
            setLoading(false);
          }
        } catch (saveError: unknown) {
          console.error("❌ Error saving purchase:");
          console.error("   Error:", saveError);
          const errorMessage =
            saveError instanceof Error ? saveError.message : "Network error";
          const errorStack = saveError instanceof Error ? saveError.stack : "";
          console.error("   Message:", errorMessage);
          console.error("   Stack:", errorStack);
          setError(
            `Payment succeeded but failed to save purchase: ${errorMessage}. Check backend is running.`
          );
          setLoading(false);
        }
      } else {
        setError("Payment status unknown. Please try again.");
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error("Payment error caught:", err);
      console.error("Error type:", typeof err);
      console.error("Error keys:", Object.keys((err as object) || {}));
      console.error("Error stringified:", JSON.stringify(err, null, 2));

      let errorMessage = "An error occurred";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String((err as { message: unknown }).message);
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-600">
          Your report is being generated and will be sent to your email shortly.
        </p>
        <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Card Details
          </label>
          <button
            type="button"
            onClick={fillTestCard}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-medium transition-colors"
          >
            {cardFilled ? "✓ Test Card Ready" : "Fill Test Card"}
          </button>
        </div>
        <div className="p-4 border border-gray-300 rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>
        {cardFilled && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-2">
              ✅ Test Card Details (Enter manually):
            </p>
            <div className="text-xs text-blue-700 space-y-1 mb-2">
              <p>
                <strong>Card Number:</strong>{" "}
                <code className="bg-white px-2 py-1 rounded">
                  4242 4242 4242 4242
                </code>
              </p>
              <p>
                <strong>Expiry:</strong>{" "}
                <code className="bg-white px-2 py-1 rounded">12/34</code> (any
                future date)
              </p>
              <p>
                <strong>CVC:</strong>{" "}
                <code className="bg-white px-2 py-1 rounded">123</code> (any 3
                digits)
              </p>
              <p>
                <strong>ZIP:</strong>{" "}
                <code className="bg-white px-2 py-1 rounded">12345</code> (any 5
                digits)
              </p>
            </div>
            <p className="text-xs text-blue-600 italic">
              ⚠️ Stripe security prevents auto-fill. Please type these manually
              in the card field above.
            </p>
          </div>
        )}

        {/* Always show test card info */}
        {!cardFilled && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-700 mb-2">
              <strong>💡 Test Card:</strong> Click &quot;Fill Test Card&quot;
              button above to see test card details
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" />
            <span>Pay CA$1.99</span>
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment is secure and encrypted. You can download the PDF report
        immediately after payment.
      </p>
    </form>
  );
}

export default function PurchaseReportPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?returnTo=purchase-report");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Purchase Full KinderBridge Report
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Get complete access to all KinderBridge locations for just
            </p>
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              CA$1.99
            </div>
            <p className="text-gray-600">
              Download your comprehensive PDF report immediately after payment.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What&apos;s Included:
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Complete list of all daycares</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Detailed information for each daycare</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Ratings, pricing, and contact details</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Features and amenities</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Location and address information</span>
              </li>
            </ul>
          </div>

          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-semibold">
                Stripe API Key Not Configured
              </p>
              <p className="text-red-600 text-sm mt-2">
                Please check your .env.local file and ensure
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set correctly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

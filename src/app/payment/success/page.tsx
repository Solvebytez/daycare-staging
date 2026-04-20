'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { CheckCircle, Download, Loader } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { clearSearchSelection, clearAutoApplyPending } from '@/lib/autoApplyPending';
import { clearAutoApplyCheckoutDraft } from '@/lib/autoApplyCheckout';

export default function PaymentSuccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [, setHasPurchased] = useState(false);

  const product = (searchParams.get('product') || '').toLowerCase();
  const isAutoApply = product === 'auto-apply';

  // Get dashboard URL based on user type
  const getDashboardUrl = () => {
    if (!user) return '/dashboard';
    switch (user.userType) {
      case 'provider':
        return '/provider/dashboard';
      case 'parent':
        return '/parent/dashboard';
      default:
        return '/dashboard';
    }
  };

  useEffect(() => {
    // DISABLED: Purchase check endpoint not available
    // Skip purchase check and allow access directly
    if (!user) {
      router.push('/login');
      return;
    }

    // If this was an auto-apply flow, clear any persisted search selection + checkout draft.
    // This prevents going back to /search with old selections and accidental re-submits.
    if (isAutoApply) {
      try {
        clearSearchSelection();
        clearAutoApplyPending();
        clearAutoApplyCheckoutDraft();
      } catch {
        // ignore
      }
    }

    // Set purchase as true and stop checking since endpoint is not available
    setHasPurchased(true);
    setCheckingPurchase(false);

    // Original purchase check code (commented out):
    // const checkPurchase = async () => {
    //   if (!user) {
    //     router.push('/login');
    //     return;
    //   }

    //   try {
    //     // Cookies are sent automatically with credentials: 'include'

    //     // Retry logic: sometimes purchase save takes a moment
    //     let retries = 3;
    //     let hasPurchased = false;
        
    //     while (retries > 0 && !hasPurchased) {
    //       const response = await apiClient.get('/api/payments/check-purchase');

    //       if (response.data.success) {
    //         hasPurchased = response.data.hasPurchased || false;
            
    //         if (hasPurchased) {
    //           console.log('✅ Purchase verified');
    //           setHasPurchased(true);
    //           break;
    //         } else if (retries > 1) {
    //           console.log(`⏳ Purchase not found yet, retrying... (${retries - 1} attempts left)`);
    //           await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    //         }
    //       }
    //       retries--;
    //     }
        
    //     if (!hasPurchased) {
    //       console.warn('⚠️ Purchase not found after retries');
    //       // Still allow access - user reached this page after payment
    //       setHasPurchased(true);
    //     }
    //   } catch (error) {
    //     console.error('Error checking purchase:', error);
    //     // Still allow access - user reached this page after payment
    //     setHasPurchased(true);
    //   } finally {
    //     setCheckingPurchase(false);
    //   }
    // };

    // checkPurchase();
  }, [user, router, isAutoApply]);

  if (checkingPurchase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            {isAutoApply
              ? 'Your auto-apply credits are ready and your applications are submitted.'
              : 'Thank you for your purchase!'}
          </p>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Download className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Download your PDF
                </h2>
              </div>
              <p className="text-gray-700 mb-6">
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
                    console.log('📥 Starting PDF download...');
                    // Cookies are sent automatically with axios
                    const response = await apiClient.get(
                      isAutoApply ? '/api/reports/download/auto-apply' : '/api/reports/download',
                      {
                      responseType: 'blob', // Important for file downloads
                      }
                    );

                    console.log('📡 Response status:', response.status);

                    if (response.status !== 200) {
                      console.error('❌ Download failed:', response.status);
                      throw new Error(`Server error: ${response.status}`);
                    }

                    // Check if response is PDF
                    const contentType = response.headers['content-type'];
                    console.log('📄 Content-Type:', contentType);

                    if (!contentType || !contentType.includes('application/pdf')) {
                      console.error('❌ Expected PDF but got:', contentType);
                      throw new Error('Server did not return a PDF file');
                    }

                    const blob = response.data;
                    console.log('✅ PDF blob received, size:', blob.size, 'bytes');

                    if (blob.size === 0) {
                      throw new Error('PDF file is empty');
                    }

                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${isAutoApply ? "auto-apply-daycares" : "daycare-full-report"}-${new Date()
                      .toISOString()
                      .split('T')[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();

                    // Cleanup
                    setTimeout(() => {
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }, 100);

                    console.log('✅ PDF download initiated');
                  } catch (error: unknown) {
                    console.error('❌ Download error:', error);
                    const errorMessage =
                      error instanceof Error ? error.message : 'Unknown error';
                    alert(
                      `Failed to download report: ${errorMessage}\n\nCheck browser console (F12) for details.`
                    );
                  } finally {
                    button.disabled = false;
                    button.innerHTML = originalContent;
                  }
                }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-5 w-5" />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/search"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span>{isAutoApply ? 'Back to Search' : 'Continue Searching'}</span>
            </Link>
            
            <div>
              <Link
                href={getDashboardUrl()}
                className="text-blue-600 hover:text-blue-700 font-medium"
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


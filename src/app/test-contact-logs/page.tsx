"use client";

import { useContactLogs } from "@/hooks/useContactLogs";
import { useAuth } from "@/contexts/AuthContext";

export default function TestContactLogsPage() {
  const { user } = useAuth();
  const { contactLogs, isLoading, error, refetch } = useContactLogs();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view contact logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Contact Logs Test Page
            </h1>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading contact logs...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                Error loading contact logs: {error.message || "Unknown error"}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-gray-600">
                  <span className="font-semibold">Total Contact Logs:</span>{" "}
                  {contactLogs.length}
                </p>
              </div>

              {contactLogs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No contact logs found.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Submit a contact log from the search page to see it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contactLogs.map((log, index) => (
                    <div
                      key={log._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          Contact Log #{index + 1}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">ID:</p>
                          <p className="text-sm font-mono text-gray-900">
                            {log._id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">User ID:</p>
                          <p className="text-sm font-mono text-gray-900">
                            {log.userId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Daycare ID:</p>
                          <p className="text-sm font-mono text-gray-900">
                            {log.daycareId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Contact Method:
                          </p>
                          <p className="text-sm text-gray-900">
                            {log.contactMethod}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Purpose:</p>
                          <p className="text-sm text-gray-900">{log.purpose}</p>
                        </div>
                        {log.outcome && (
                          <div>
                            <p className="text-sm text-gray-600">Outcome:</p>
                            <p className="text-sm text-gray-900">
                              {log.outcome}
                            </p>
                          </div>
                        )}
                        {log.followUpDate && (
                          <div>
                            <p className="text-sm text-gray-600">
                              Follow-up Date:
                            </p>
                            <p className="text-sm text-gray-900">
                              {new Date(log.followUpDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-gray-600">Notes:</p>
                        <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                          {log.notes}
                        </p>
                      </div>

                      {log.daycare && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Daycare Details:
                          </p>
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">Name:</span>{" "}
                            {log.daycare.name || "N/A"}
                          </p>
                          {log.daycare.address && (
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Address:</span>{" "}
                              {log.daycare.address}
                            </p>
                          )}
                          {log.daycare.city && (
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">City:</span>{" "}
                              {log.daycare.city}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}




























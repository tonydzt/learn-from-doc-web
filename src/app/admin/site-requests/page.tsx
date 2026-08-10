import type { Metadata } from "next";

import { listSiteIndexRequests } from "@/lib/site-index-requests";

export const metadata: Metadata = {
  title: "Site requests admin | Developer Docs Progress Tracker",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminSiteRequestsPage() {
  const requests = await listSiteIndexRequests();

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Documentation demand</p>
        <h1>Site index requests</h1>
      </div>

      <section className="admin-panel" aria-label="Submitted site index requests">
        <span className="admin-stat">{requests.length}</span>
        <h2>Total requests</h2>

        {requests.length ? (
          <div className="admin-site-requests" role="table" aria-label="Site index requests">
            <div className="admin-site-request admin-table-head" role="row">
              <span role="columnheader">Requested site</span>
              <span role="columnheader">Submitted</span>
            </div>
            {requests.map((request) => (
              <div className="admin-site-request" role="row" key={request.id}>
                <strong role="cell">{request.requestText}</strong>
                <time role="cell" dateTime={request.createdAt}>
                  {new Date(request.createdAt).toLocaleString("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <p>No site requests yet.</p>
        )}
      </section>
    </>
  );
}

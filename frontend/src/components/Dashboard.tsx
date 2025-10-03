import React, { useEffect, useState } from "react";

type GithubAnalytics = {
  top5IssuesByComments: any[];
  authorWithMostIssues: { author: string; count: number };
  repoWithMostOpenIssues: { repo: string; count: number };
  fetchedAt: string;
};

type RedditAnalytics = {
  top5ByUpvotes: any[];
  authorWithHighestTotalUpvotes: { author: string; totalUpvotes: number };
  fetchedAt: string;
};

export default function Dashboard() {
  const [gh, setGh] = useState<GithubAnalytics | null>(null);
  const [rd, setRd] = useState<RedditAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      const [gres, rres] = await Promise.all([
        fetch("/api/github/analytics").then(r => r.json()),
        fetch("/api/reddit/analytics").then(r => r.json())
      ]);
      setGh(gres);
      setRd(rres);
    } catch (e) {
      console.error(e);
      alert("failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button onClick={fetchAll} disabled={loading}>{loading ? "Fetching..." : "Refresh Now"}</button>
      </div>

      <section>
        <h2>GitHub</h2>
        {gh ? (
          <>
            <div>Fetched: {gh.fetchedAt}</div>
            <h3>Top 5 Issues by Comments</h3>
            <ol>
              {gh.top5IssuesByComments.map(i => (
                <li key={i.id}><a href={i.url} target="_blank" rel="noreferrer">{i.title}</a> — {i.comments} comments — {i.repo} — by {i.author}</li>
              ))}
            </ol>
            <div>Author with most issues: {gh.authorWithMostIssues.author} ({gh.authorWithMostIssues.count})</div>
            <div>Repo with most open issues: {gh.repoWithMostOpenIssues.repo} ({gh.repoWithMostOpenIssues.count})</div>
          </>
        ) : <div>Loading...</div>}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Reddit</h2>
        {rd ? (
          <>
            <div>Fetched: {rd.fetchedAt}</div>
            <h3>Top 5 Posts by Upvotes</h3>
            <ol>
              {rd.top5ByUpvotes.map(p => (
                <li key={p.id}><a href={p.url} target="_blank" rel="noreferrer">{p.title}</a> — {p.score} upvotes — r/{p.subreddit} — by {p.author}</li>
              ))}
            </ol>
            <div>Top Reddit author by total upvotes: {rd.authorWithHighestTotalUpvotes.author} ({rd.authorWithHighestTotalUpvotes.totalUpvotes})</div>
          </>
        ) : <div>Loading...</div>}
      </section>
    </div>
  );
}

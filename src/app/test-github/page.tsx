"use client";

import { useState } from "react";
import { resolveGitHubIntent, ResolvedIntent } from "../../services/resolve-github-intent";
import { getRepositoryIssues } from "../../services/github-tools";

export default function TestGitHubPage() {
  const [result, setResult] = useState<{
    intent?: ResolvedIntent;
    issues?: number;
    issuesList?: Array<{ number: number; title: string; state: string }>;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testIntentResolution = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const testInput = "Can you show me 4 open issues for the vercel/examples repo?";
      console.log('Testing input:', testInput);
      
      const intent = resolveGitHubIntent({ 
        input: testInput, 
        fallback_per_page: 10 
      });
      
      console.log('Resolved intent:', intent);
      
      if (intent.kind === 'list_issues') {
        console.log('Calling getRepositoryIssues with params:', intent.params);
        const params = {
          ...intent.params,
          state: (intent.params.state || 'open') as 'open' | 'closed' | 'all',
          per_page: intent.params.per_page || 10
        };
        const issues = await getRepositoryIssues(params);
        console.log('Received issues:', issues.length);
        
        setResult({
          intent,
          issues: issues.length,
          issuesList: issues.map(issue => ({
            number: issue.number,
            title: issue.title,
            state: issue.state
          }))
        });
      } else {
        setResult({ intent, error: 'Wrong intent kind' });
      }
    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">GitHub API Test</h1>
      
      <button 
        onClick={testIntentResolution}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test "4 open issues for vercel/examples"'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import { resolveGitHubIntent } from "@/services/resolve-github-intent";
import { getOrganizationRepositories, getRepositoryIssues, getRepositoryPRs } from "@/services/github-tools";

export default function TestGitHubPage() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testExample = async (input: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      const intent = resolveGitHubIntent({ input, fallback_per_page: 4 });
      console.log('Resolved intent:', intent);
      
      let data;
      if (intent.kind === 'list_org_repos') {
        data = await getOrganizationRepositories(intent.params);
        setResult(`Found ${data.length} repositories from ${intent.params.org}`);
      } else if (intent.kind === 'list_issues') {
         data = await getRepositoryIssues({
           ...intent.params,
           state: intent.params.state || 'open',
           per_page: intent.params.per_page || 4
         });
        setResult(`Found ${data.length} issues from ${intent.params.owner}/${intent.params.repo}`);
      } else if (intent.kind === 'list_prs') {
         data = await getRepositoryPRs({
           ...intent.params,
           state: intent.params.state || 'open',
           per_page: intent.params.per_page || 4
         });
        setResult(`Found ${data.length} pull requests from ${intent.params.owner}/${intent.params.repo}`);
      }
    } catch (err) {
      console.error('Test error:', err);
      setResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "show 4 repos from vercel",
    "show 4 issues from vercel/next.js", 
    "show 4 pull requests from vercel/next.js"
  ];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">GitHub API Examples</h1>
      <p className="text-gray-600 mb-8">Test the three supported GitHub operations:</p>
      
      <div className="space-y-4">
        {examples.map((example, index) => (
          <div key={index} className="border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Example {index + 1}:</p>
            <p className="font-mono text-sm bg-gray-100 p-2 rounded mb-3">&quot;{example}&quot;</p>
            <button 
              onClick={() => testExample(example)}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-600"
            >
              {loading ? 'Testing...' : 'Test'}
            </button>
          </div>
        ))}
      </div>
      
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800 mb-2">Result:</h3>
          <p className="text-green-700">{result}</p>
        </div>
      )}
    </div>
  );
}
# GitHub Explorer

A natural language interface for GitHub repository management powered by [Tambo AI](https://tambo.co). Analyze repositories, manage issues, track pull requests, and perform GitHub operations through conversational AI.

## Setup

### Prerequisites

- Node.js 18+ or Bun
- GitHub Personal Access Token
- [Tambo](https://tambo.co) Account with API Key

### Installation

```bash
git clone <your-repo-url>
cd tambo-github

# Install dependencies (using npm, pnpm, or bun)
npm install
# or
pnpm install
# or
bun install
```

### Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Add your API keys to `.env`:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key
NEXT_PUBLIC_TAMBO_URL=https://api.tambo.co
GITHUB_TOKEN=your_github_personal_access_token
```

### Tambo API Key

1. Sign up on [Tambo](https://tambo.co).
2. Create a Project and then Generate an API Key.

If you have encounter any problems, just join their [discord community](https://discord.gg/hpT8n7XdyN).

### GitHub Token Setup

1. Go to GitHub Settings > Developer settings > Personal access tokens(Fine-grained tokens)
2. Generate a new token with these scopes:
   - `public_repo` (for public repositories)
   - `repo` (for private repositories, if needed)
   - `read:user` (for user information)

### Development

```bash
npm run dev
# or
pnpm dev
# or
bun dev
```
.

## Usage with Prompt Examples

1. **Search Repositories**: Use the sidebar search or ask the AI to find repositories
2. **Analyze Code**: Ask questions about repository structure, dependencies, or code quality
3. **Manage Issues**: View, filter, and interact with repository issues
4. **Track PRs**: Monitor pull request status and reviews
5. **Quick Actions**: Use sidebar buttons for starring, forking, and watching repositories


# GitHub Explorer

A natural language interface for GitHub repository management powered by [Tambo AI](https://tambo.co) and enhanced with [Exa](https://exa.ai) search. Analyze repositories, manage issues, track pull requests, and perform GitHub operations through conversational AI with advanced web search capabilities.

## Setup

### Prerequisites

- Node.js 18+ or Bun
- GitHub Personal Access Token
- [Tambo](https://tambo.co) Account with API Key
- [Exa](https://exa.ai) API Key (optional, for enhanced search)

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
EXASEARCH_API_KEY=your_exa_api_key
```

### API Keys Setup

#### Tambo API Key



https://github.com/user-attachments/assets/ce0580cb-2049-4653-ac93-0ce406049818


1. Sign up on [Tambo](https://tambo.co)
2. Create a Project and then Generate an API Key
3. For support, join their [Discord community](https://discord.gg/hpT8n7XdyN)

#### Exa API Key (Optional)
1. Sign up on [Exa](https://exa.ai)
2. Generate an API key from your dashboard
3. This enables enhanced web search for documentation, issues, and PRs

### GitHub Token Setup

1. Go to GitHub Settings > Developer settings > Personal access tokens(Fine-grained tokens)
2. Generate a new token with these scopes:
   - `public_repo` (for public repositories)
   - `repo` (for private repositories, if needed)
   - `read:user` (for user information)

### Local Development

```bash
# Start the development server
npm run dev
# or
pnpm dev
# or
bun dev
```

The application will be available at `http://localhost:3000`

## Features

### Core GitHub Operations
- Repository analysis and exploration
- Issue management and classification
- Pull request tracking and analysis
- Code quality assessment
- Release notes generation

### Enhanced Search with Exa
- Web search for documentation and resources
- GitHub-specific issue and PR discovery
- Technical documentation search
- Context-aware search results

### AI-Powered Insights
- Repository health scoring
- Issue classification and prioritization
- Pull request analysis and recommendations
- Natural language query processing

## GitHub Integration

This project includes comprehensive GitHub integration with intelligent intent recognition and automatic action execution:

### Core Features
- **Smart Intent Recognition**: Natural language processing for GitHub requests
- **Organization & User Repository Listing**: Automatic discovery of repos
- **Repository Analysis**: Detailed stats, health metrics, and AI insights
- **Issue & PR Management**: Full lifecycle management with AI assistance
- **Advanced Search**: Enhanced search with Exa integration
- **Real-time Data**: Live GitHub API integration

### Natural Language GitHub Operations

The system automatically understands and executes GitHub operations from natural language:

```
"Show me tambo-ai org repos" → Lists all tambo-ai organization repositories
"Get vercel repositories" → Lists all Vercel user repositories  
"Search React repositories" → Searches GitHub for React-related repos
"List issues in tambo-ai/tambo" → Shows issues for specific repository
```

### Environment Variables

Configure your API keys:

```bash
EXASEARCH_API_KEY=your_exa_api_key_here
GITHUB_TOKEN=your_github_token_here
```

### System Prompt for Enhanced GitHub Operations

To improve GitHub intent recognition in Tambo's dashboard, add the system prompt from `github-system-prompt.md`. This enables:

- Automatic organization repository discovery
- Enhanced content display with unified CardGroup component (supports all card types)
- Intelligent search suggestions
- Context-aware follow-up actions
- Proactive GitHub content presentation

## Usage Examples

- "Find React repositories with TypeScript"
- "Analyze the health of facebook/react"
- "Search for Next.js documentation about routing"
- "Show me recent issues about performance in vercel/next.js"
- "Generate release notes for the latest version"


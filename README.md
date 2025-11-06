# DocWeave Hub - Next.js Version

A modern web-based interface for the DocWeave documentation generation service, migrated from Python to Next.js with JavaScript.

## Features

- **Web-based UI** - Modern React interface matching the provided design
- **Repository Management** - Add, track, and manage documentation generation for multiple repositories
- **Real-time Status** - Live updates on documentation generation progress
- **API Integration** - RESTful API endpoints for all functionality
- **LLM Integration** - Uses NVIDIA's LLM API for documentation generation
- **Responsive Design** - Works on desktop and mobile devices

## Architecture

### Frontend (Next.js + React)
- **DocweaveHub.jsx** - Main UI component replicating the provided design
- **Tailwind CSS** - For styling and responsive design
- **Lucide React** - For icons and UI elements

### Backend (Next.js API Routes)
- **`/api/generate`** - Handles documentation generation requests
- **`/api/repositories`** - CRUD operations for repository management
- **`/api/status/[id]`** - Real-time status updates for generation jobs

### Core Logic (Migrated from Python)
- **`lib/analyzer.js`** - Repository analysis (equivalent to `analyzers.py`)
- **Code Analysis** - Language detection, framework identification, dependency analysis
- **API Spec Discovery** - OpenAPI, GraphQL, gRPC specification detection
- **LLM Integration** - Documentation generation using NVIDIA's API

## Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd docweave-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### Adding a Repository

1. **Enter Repository URL** - Paste a Git repository URL (GitHub, GitLab, Bitbucket)
2. **Set Branch** - Specify the branch to analyze (defaults to 'main')
3. **Configure Options** - Enable auto-update on push, auto-merge commits
4. **Add API Key** - Enter your NVIDIA API key for LLM generation
5. **Generate** - Click "Add & Auto Generate Merge Requests"

### Repository Status

- **✅ Success** - Documentation generated successfully
- **🔄 Generating** - Documentation generation in progress
- **❌ Error** - Generation failed (check API key and repository access)
- **📋 Up-to-date** - Documentation is current

### Documentation Preview

The right panel shows a live preview of the generated documentation with:
- Table of contents
- Code structure analysis
- API endpoint documentation
- Setup and configuration instructions

## API Endpoints

### POST `/api/generate`
Generate documentation for a repository
```json
{
  "repoUrl": "https://github.com/user/repo.git",
  "branch": "main",
  "apiKey": "your-nvidia-api-key"
}
```

### GET/POST `/api/repositories`
Manage repository list
```json
{
  "name": "my-service",
  "url": "https://github.com/user/repo.git",
  "branch": "main",
  "autoUpdate": true
}
```

### GET `/api/status/[id]`
Check generation status
```json
{
  "id": "generation-id",
  "status": "generating|success|error",
  "progress": 75,
  "message": "Analyzing codebase..."
}
```

## Migration from Python

This Next.js version maintains the same core functionality as the original Python CLI tool:

| Python Component | Next.js Equivalent | Description |
|------------------|-------------------|-------------|
| `doc_generator/analyzers.py` | `lib/analyzer.js` | Code and API spec analysis |
| `doc_generator/generator.py` | `api/generate/route.js` | LLM integration and doc generation |
| `doc_generator/cli.py` | Web UI | User interface (now web-based) |
| `doc_generator/utils.py` | Various utilities | File operations and helpers |

### Key Improvements

- **Web Interface** - No more command-line usage required
- **Real-time Updates** - Live status tracking for multiple repositories
- **Batch Processing** - Handle multiple repositories simultaneously
- **Visual Preview** - See generated documentation before committing
- **Team Collaboration** - Shareable web interface for team use

## Configuration

### Environment Variables

```bash
# Optional: Set default API key
NVIDIA_API_KEY=your-api-key-here

# Optional: Custom API base URL
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

### API Key Setup

You can provide the NVIDIA API key in several ways:
1. **UI Input** - Enter directly in the web interface
2. **Environment Variable** - Set `NVIDIA_API_KEY`
3. **Configuration File** - Add to `.env.local`

## Development

### Project Structure

```
docweave-hub/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── globals.css    # Global styles
│   │   └── page.js        # Main page
│   ├── components/
│   │   └── DocweaveHub.jsx # Main UI component
│   └── lib/
│       └── analyzer.js    # Repository analysis logic
├── package.json
└── README.md
```

### Adding New Features

1. **New Analysis Types** - Extend `lib/analyzer.js`
2. **Additional APIs** - Add routes in `src/app/api/`
3. **UI Enhancements** - Modify `components/DocweaveHub.jsx`
4. **Styling Changes** - Update Tailwind classes or `globals.css`

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```bash
docker build -t docweave-hub .
docker run -p 3000:3000 docweave-hub
```

### Traditional Hosting
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

Same license as the original Python version.

---

**Generated with ❤️ by DocWeave**
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
- **ManageIntegrations.jsx** - Repository management interface
- **Tailwind CSS** - For styling and responsive design
- **Lucide React** - For icons and UI elements

### Backend (Next.js API Routes)
- **`/api/generate`** - Handles documentation generation requests
- **`/api/repositories`** - CRUD operations for repository management
- **`/api/repositories/[id]`** - Individual repository operations (GET, PUT, DELETE)

### Data Storage
- **`data/repositories.json`** - JSON file storage for repository data
- **`data/documentation/*.md`** - Generated documentation files
- **`lib/repositoryStorage.js`** - File-based repository storage utilities
- **`lib/documentationStorage.js`** - Documentation file management
- **`lib/storage.js`** - In-memory documentation storage (fallback)

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

# Configure environment variables
cp .env.example .env.local
# Edit .env.local and add your NVIDIA API key

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

**Note**: Make sure to add your NVIDIA API key to `.env.local` before starting the application.

## Usage

### Adding a Repository

1. **Enter Repository URL** - Paste a Git repository URL (GitHub, GitLab, Bitbucket)
2. **Set Branch** - Specify the branch to analyze (defaults to 'main')
3. **Configure Options** - Enable auto-update on push, auto-merge commits
4. **Generate** - Click "Add & Auto Generate Documentation"

The system will automatically use the API key configured in `.env.local`.

### Repository Status

- **✅ Up-to-date** - Documentation generated successfully and current
- **🔄 Generating** - Documentation generation in progress
- **❌ Error** - Generation failed (check API key and repository access)

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
  "branch": "main"
}
```
Note: API key is read from environment variables on the server side.

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

### Repository Status Values
- `generating` - Documentation is being generated
- `up-to-date` - Documentation has been generated successfully
- `error` - Documentation generation failed

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

Create a `.env.local` file in the root directory:

```bash
# Required: NVIDIA API Key for documentation generation
NVIDIA_API_KEY=your_nvidia_api_key_here

# Optional: Application name
NEXT_PUBLIC_APP_NAME=Docweave Hub
```

### Getting Your NVIDIA API Key

1. Visit [NVIDIA Build](https://build.nvidia.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key and add it to your `.env.local` file

**Important**: The API key is now configured server-side for security. You no longer need to enter it in the UI.

## Data Persistence

### Repository Data
Repository metadata is stored in `data/repositories.json`:
- **Auto-generated** on first run with sample data
- **Persistent** across server restarts
- **Gitignored** to avoid committing local data
- **Human-readable** for easy inspection and backup

### Documentation Files
Generated documentation is saved as markdown files in `data/documentation/`:
- **File naming**: `{repo-name}-{repo-id}.md`
- **Linked to repositories** via `documentationFile` field
- **Persistent** across server restarts
- **Gitignored** to avoid committing generated content
- **Viewable** via Eye icon in UI

### Data Structure

```json
{
  "repositories": [
    {
      "id": "1",
      "name": "my-repo",
      "url": "https://github.com/user/repo.git",
      "branch": "main",
      "type": "integrated",
      "status": "up-to-date",
      "hasDocumentation": true,
      "autoUpdate": true,
      "autoMerge": false,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Field Descriptions

- **id**: Unique identifier for the repository
- **name**: Repository name (extracted from URL)
- **url**: Git repository URL
- **branch**: Branch to analyze (default: "main")
- **type**: Repository type (always "integrated")
- **status**: Current status (`generating`, `up-to-date`, or `error`)
- **hasDocumentation**: Whether documentation has been generated
- **autoUpdate**: Auto-run documentation generation on code changes
- **autoMerge**: Auto-merge README commit after generation
- **documentationFile**: Filename of generated documentation (e.g., "my-repo-1.md")
- **lastUpdated**: ISO timestamp of last update

### Backup and Migration

To backup your repositories:
```bash
cp data/repositories.json data/repositories.backup.json
```

To migrate to a new instance:
```bash
cp data/repositories.backup.json /new-instance/data/repositories.json
```

## Development

### Project Structure

```
docweave-hub/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/route.js      # Documentation generation
│   │   │   └── repositories/
│   │   │       ├── route.js           # List/Create repositories
│   │   │       └── [id]/route.js      # Update/Delete repository
│   │   ├── manage/
│   │   │   └── page.js                # Manage integrations page
│   │   ├── globals.css                # Global styles
│   │   └── page.js                    # Main page
│   ├── components/
│   │   ├── DocweaveHub.jsx            # Main UI component
│   │   └── ManageIntegrations.jsx     # Repository management UI
│   └── lib/
│       ├── analyzer.js                # Repository analysis logic
│       ├── repositoryStorage.js       # JSON file storage
│       └── storage.js                 # Documentation storage
├── data/
│   ├── repositories.json              # Repository data (auto-generated)
│   └── documentation/                 # Generated documentation files
│       └── *.md                       # Individual repo documentation
├── .env.local                         # Environment variables
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
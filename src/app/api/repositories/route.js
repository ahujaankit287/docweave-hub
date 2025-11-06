import { NextResponse } from "next/server";
import { setDocumentation } from "@/lib/storage";

// In-memory storage for demo (use database in production)
let repositories = [
  {
    id: "1",
    name: "docs-internal-cli",
    url: "https://github.com/example/docs-internal-cli.git",
    type: "existing",
    status: "success",
    branch: "main",
    lastUpdated: new Date().toISOString(),
    hasDocumentation: true,
  },
  {
    id: "2",
    name: "mobile-app-api",
    url: "https://github.com/example/mobile-app-api.git",
    type: "existing",
    status: "success",
    branch: "main",
    lastUpdated: new Date().toISOString(),
    hasDocumentation: true,
  },
  {
    id: "3",
    name: "payment-microservice",
    url: "https://github.com/example/payment-microservice.git",
    type: "existing",
    status: "success",
    branch: "main",
    lastUpdated: new Date().toISOString(),
    hasDocumentation: true,
  },
];

export async function GET() {
  return NextResponse.json({ repositories });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, url, branch = "main", autoUpdate = false } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    const newRepo = {
      id: Date.now().toString(),
      name,
      url,
      branch,
      autoUpdate,
      type: "integrated",
      status: "generating",
      lastUpdated: new Date().toISOString(),
    };

    repositories.push(newRepo);

    // Simulate documentation generation
    setTimeout(() => {
      const repo = repositories.find((r) => r.id === newRepo.id);
      if (repo) {
        repo.status = "success";
        repo.hasDocumentation = true;
        repo.lastUpdated = new Date().toISOString();
        
        // Generate sample documentation
        setDocumentation(repo.id, `# ${repo.name} Documentation

## Service Overview
Auto-generated documentation for ${repo.name}.

## Architecture
[TODO: Add architecture details based on code analysis]

## API Documentation
[TODO: Add API endpoints discovered from the codebase]

## Setup & Installation
\`\`\`bash
git clone ${repo.url}
cd ${repo.name}
# [TODO: Add specific setup instructions]
\`\`\`

## Configuration
[TODO: Add configuration details found in the repository]

## Dependencies
[TODO: List dependencies from package.json or requirements.txt]

## Development
[TODO: Add development workflow instructions]

Generated on: ${new Date().toLocaleString()}`);
      }
    }, 5000);

    return NextResponse.json({
      success: true,
      repository: newRepo,
    });
  } catch (error) {
    console.error("Repository creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    repositories = repositories.filter((repo) => repo.id !== id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Repository deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
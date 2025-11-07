import { NextResponse } from "next/server";
import { setDocumentation } from "@/lib/storage";
import {
  getAllRepositories,
  addRepository,
  deleteRepository,
} from "@/lib/repositoryStorage";

export async function GET() {
  try {
    const repositories = await getAllRepositories();
    return NextResponse.json({ repositories });
  } catch (error) {
    console.error("Failed to fetch repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, url, branch = "main", autoUpdate = false, autoMerge = false } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    const newRepo = await addRepository({
      name,
      url,
      branch,
      autoUpdate,
      autoMerge,
      type: "integrated",
      status: "generating",
    });

    // Simulate documentation generation
    setTimeout(async () => {
      try {
        const { updateRepositoryStatus } = await import("@/lib/repositoryStorage");
        await updateRepositoryStatus(newRepo.id, "up-to-date", true);
        
        // Generate sample documentation
        setDocumentation(newRepo.id, `# ${newRepo.name} Documentation

## Service Overview
Auto-generated documentation for ${newRepo.name}.

## Architecture
[TODO: Add architecture details based on code analysis]

## API Documentation
[TODO: Add API endpoints discovered from the codebase]

## Setup & Installation
\`\`\`bash
git clone ${newRepo.url}
cd ${newRepo.name}
# [TODO: Add specific setup instructions]
\`\`\`

## Configuration
[TODO: Add configuration details found in the repository]

## Dependencies
[TODO: List dependencies from package.json or requirements.txt]

## Development
[TODO: Add development workflow instructions]

Generated on: ${new Date().toLocaleString()}`);
      } catch (error) {
        console.error("Failed to update repository status:", error);
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

    await deleteRepository(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Repository deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

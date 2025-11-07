import { NextResponse } from "next/server";
import { getDocumentation, setDocumentation } from "@/lib/storage";
import { getRepositoryById } from "@/lib/repositoryStorage";
import { readDocumentation } from "@/lib/documentationStorage";

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Repository ID is required" },
      { status: 400 }
    );
  }

  try {
    // First, try to get documentation from file
    const repository = await getRepositoryById(id);
    
    if (repository && repository.documentationFile) {
      try {
        const documentation = await readDocumentation(repository.documentationFile);
        return NextResponse.json({
          success: true,
          documentation,
          source: 'file',
          filename: repository.documentationFile,
          generatedAt: repository.lastUpdated,
        });
      } catch (fileError) {
        console.warn('Failed to read documentation file, falling back to memory:', fileError);
      }
    }

    // Fallback to in-memory storage
    const documentation = getDocumentation(id);

    if (!documentation) {
      return NextResponse.json(
        { error: "Documentation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      documentation,
      source: 'memory',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching documentation:', error);
    return NextResponse.json(
      { error: "Failed to fetch documentation" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: "Repository ID is required" },
      { status: 400 }
    );
  }

  setDocumentation(id, body.documentation);

  return NextResponse.json({
    success: true,
    message: "Documentation stored successfully",
  });
}

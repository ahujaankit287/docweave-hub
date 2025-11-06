import { NextResponse } from "next/server";
import { getDocumentation, setDocumentation } from "@/lib/storage";

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Repository ID is required" },
      { status: 400 }
    );
  }

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
    generatedAt: new Date().toISOString(),
  });
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
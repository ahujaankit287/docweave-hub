import { NextResponse } from "next/server";
import {
  getRepositoryById,
  updateRepository,
  deleteRepository,
} from "@/lib/repositoryStorage";

// GET - Get a specific repository
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const repository = await getRepositoryById(id);

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ repository });
  } catch (error) {
    console.error("Error fetching repository:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a repository
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, url, branch, autoUpdate } = body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;
    if (branch !== undefined) updates.branch = branch;
    if (autoUpdate !== undefined) updates.autoUpdate = autoUpdate;

    const repository = await updateRepository(id, updates);

    return NextResponse.json({
      success: true,
      repository,
      message: "Repository updated successfully",
    });
  } catch (error) {
    console.error("Error updating repository:", error);

    if (error.message === "Repository not found") {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a repository
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await deleteRepository(id);

    return NextResponse.json({
      success: true,
      message: "Repository deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting repository:", error);

    if (error.message === "Repository not found") {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

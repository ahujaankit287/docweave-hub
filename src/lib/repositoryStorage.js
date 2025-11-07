// Repository storage using JSON file
import fs from "fs/promises";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), "data");
const REPOS_FILE = path.join(STORAGE_DIR, "repositories.json");

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create storage directory:", error);
  }
}

// Initialize storage file if it doesn't exist
async function initializeStorage() {
  try {
    await ensureStorageDir();

    try {
      await fs.access(REPOS_FILE);
    } catch {
      // File doesn't exist, create it with default data
      const defaultData = {
        repositories: [
          {
            id: "1",
            name: "example-docs-cli",
            url: "https://github.com/example/docs-cli.git",
            branch: "main",
            type: "integrated",
            status: "up-to-date",
            hasDocumentation: true,
            autoUpdate: true,
            autoMerge: true,
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "2",
            name: "example-api-service",
            url: "https://github.com/example/api-service.git",
            branch: "main",
            type: "integrated",
            status: "up-to-date",
            hasDocumentation: true,
            autoUpdate: false,
            autoMerge: false,
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "3",
            name: "example-microservice",
            url: "https://github.com/example/microservice.git",
            branch: "main",
            type: "integrated",
            status: "up-to-date",
            hasDocumentation: true,
            autoUpdate: true,
            autoMerge: false,
            lastUpdated: new Date().toISOString(),
          },
        ],
      };

      await fs.writeFile(
        REPOS_FILE,
        JSON.stringify(defaultData, null, 2),
        "utf8"
      );
    }
  } catch (error) {
    console.error("Failed to initialize storage:", error);
    throw error;
  }
}

// Read all repositories
export async function getAllRepositories() {
  try {
    await initializeStorage();
    const data = await fs.readFile(REPOS_FILE, "utf8");
    const parsed = JSON.parse(data);
    return parsed.repositories || [];
  } catch (error) {
    console.error("Failed to read repositories:", error);
    return [];
  }
}

// Get a single repository by ID
export async function getRepositoryById(id) {
  try {
    const repositories = await getAllRepositories();
    return repositories.find((repo) => repo.id === id);
  } catch (error) {
    console.error("Failed to get repository:", error);
    return null;
  }
}

// Add a new repository
export async function addRepository(repository) {
  try {
    const repositories = await getAllRepositories();

    // Generate new ID
    const newId = String(
      Math.max(0, ...repositories.map((r) => parseInt(r.id) || 0)) + 1
    );

    const newRepo = {
      ...repository,
      id: newId,
      type: repository.type || "integrated",
      status: repository.status || "generating",
      hasDocumentation: repository.hasDocumentation || false,
      lastUpdated: new Date().toISOString(),
    };

    repositories.push(newRepo);

    await fs.writeFile(
      REPOS_FILE,
      JSON.stringify({ repositories }, null, 2),
      "utf8"
    );

    return newRepo;
  } catch (error) {
    console.error("Failed to add repository:", error);
    throw error;
  }
}

// Update a repository
export async function updateRepository(id, updates) {
  try {
    const repositories = await getAllRepositories();
    const index = repositories.findIndex((repo) => repo.id === id);

    if (index === -1) {
      throw new Error("Repository not found");
    }

    repositories[index] = {
      ...repositories[index],
      ...updates,
      id, // Ensure ID doesn't change
      lastUpdated: new Date().toISOString(),
    };

    await fs.writeFile(
      REPOS_FILE,
      JSON.stringify({ repositories }, null, 2),
      "utf8"
    );

    return repositories[index];
  } catch (error) {
    console.error("Failed to update repository:", error);
    throw error;
  }
}

// Delete a repository
export async function deleteRepository(id) {
  try {
    const repositories = await getAllRepositories();
    const filtered = repositories.filter((repo) => repo.id !== id);

    if (filtered.length === repositories.length) {
      throw new Error("Repository not found");
    }

    await fs.writeFile(
      REPOS_FILE,
      JSON.stringify({ repositories: filtered }, null, 2),
      "utf8"
    );

    return true;
  } catch (error) {
    console.error("Failed to delete repository:", error);
    throw error;
  }
}

// Update repository status
export async function updateRepositoryStatus(
  id,
  status,
  hasDocumentation = null
) {
  try {
    const updates = { status };
    if (hasDocumentation !== null) {
      updates.hasDocumentation = hasDocumentation;
    }
    return await updateRepository(id, updates);
  } catch (error) {
    console.error("Failed to update repository status:", error);
    throw error;
  }
}

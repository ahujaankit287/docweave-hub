// Documentation file storage
import fs from 'fs/promises';
import path from 'path';

const DOCS_DIR = path.join(process.cwd(), 'data', 'documentation');

// Ensure documentation directory exists
async function ensureDocsDir() {
  try {
    await fs.mkdir(DOCS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create documentation directory:', error);
  }
}

// Save documentation to file
export async function saveDocumentation(repoId, repoName, documentation) {
  try {
    await ensureDocsDir();
    
    // Create filename from repo name and ID
    const filename = `${repoName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${repoId}.md`;
    const filePath = path.join(DOCS_DIR, filename);
    
    // Write documentation to file
    await fs.writeFile(filePath, documentation, 'utf8');
    
    console.log(`Documentation saved: ${filename}`);
    return filename;
  } catch (error) {
    console.error('Failed to save documentation:', error);
    throw error;
  }
}

// Read documentation from file
export async function readDocumentation(filename) {
  try {
    const filePath = path.join(DOCS_DIR, filename);
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Failed to read documentation:', error);
    throw error;
  }
}

// Delete documentation file
export async function deleteDocumentation(filename) {
  try {
    if (!filename) return;
    
    const filePath = path.join(DOCS_DIR, filename);
    await fs.unlink(filePath);
    console.log(`Documentation deleted: ${filename}`);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error.code !== 'ENOENT') {
      console.error('Failed to delete documentation:', error);
    }
  }
}

// List all documentation files
export async function listDocumentation() {
  try {
    await ensureDocsDir();
    const files = await fs.readdir(DOCS_DIR);
    return files.filter(file => file.endsWith('.md'));
  } catch (error) {
    console.error('Failed to list documentation:', error);
    return [];
  }
}

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { repoUrl, branch = "main", apiKey } = body;

    if (!repoUrl || !apiKey) {
      return NextResponse.json(
        { error: "Repository URL and API key are required" },
        { status: 400 }
      );
    }

    // Validate repository URL
    const urlPattern =
      /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/.+\.git$/;
    if (!urlPattern.test(repoUrl) && !repoUrl.includes("github.com")) {
      return NextResponse.json(
        {
          error:
            "Invalid repository URL. Please provide a valid Git repository URL.",
        },
        { status: 400 }
      );
    }

    // Start documentation generation process
    const generationId = generateId();

    // In a real implementation, this would:
    // 1. Clone the repository
    // 2. Analyze the codebase
    // 3. Generate documentation using LLM
    // 4. Return the generated markdown

    // Generate documentation synchronously and return it
    const documentation = await generateDocumentation(
      repoUrl,
      branch,
      apiKey,
      generationId
    );

    return NextResponse.json({
      success: true,
      generationId,
      documentation,
      message: "Documentation generated successfully",
      repoName: repoUrl.split("/").pop()?.replace(".git", "") || "Repository",
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function generateDocumentation(repoUrl, branch, apiKey, generationId) {
  try {
    // 1. Repository Analysis (equivalent to analyzers.py)
    const analysis = await analyzeRepository(repoUrl, branch);

    // 2. Generate documentation using LLM (or simulate for demo)
    const documentation = await generateWithLLM(analysis, apiKey);

    // 3. Store result
    await storeGeneratedDocs(generationId, documentation);

    console.log(`Documentation generated for ${repoUrl}`);
    return documentation;
  } catch (error) {
    console.error(`Generation failed for ${repoUrl}:`, error);
    await storeGenerationError(generationId, error);
    throw error;
  }
}

async function analyzeRepository(repoUrl, branch) {
  // Use the migrated analyzer from Python codebase
  const { CodeAnalyzer, APISpecAnalyzer } = await import("@/lib/analyzer");

  const codeAnalyzer = new CodeAnalyzer();
  const apiAnalyzer = new APISpecAnalyzer();

  const analysis = await codeAnalyzer.analyzeRepository(repoUrl, branch);
  const apiSpecs = await apiAnalyzer.findApiSpecs(repoUrl, branch);

  return {
    ...analysis,
    apiSpecs,
  };
}

async function generateWithLLM(analysis, apiKey) {
  // Use the actual NVIDIA OpenAI API call as in the original docweave-snackoverflow
  const prompt = `You are a technical documentation expert. Generate comprehensive service documentation based on the following repository analysis:

${JSON.stringify(analysis, null, 2)}


Generate a well-structured markdown document that includes:

1. **Service Overview** - What this service does, its purpose and main functionality
2. **Architecture** - High-level architecture and key components
3. **API Documentation** - Endpoints, request/response formats, authentication
4. **Setup & Installation** - How to set up and run the service
5. **Configuration** - Environment variables, config files, and settings
6. **Usage Examples** - Code examples and common use cases
7. **Dependencies** - Key libraries and external services
8. **Development** - How to contribute, build, test, and deploy

Make the documentation clear, comprehensive, and developer-friendly. Use proper markdown formatting with headers, code blocks, and tables where appropriate.
`;

  try {
    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          top_p: 1,
          max_tokens: 40960,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("LLM generation error:", error);

    // Fallback to a basic template if API fails
    const repoName = analysis.structure.split("/")[0] || "Repository";
    return `# ${repoName} Documentation

## Service Overview
[TODO: Add service description - API call failed]

**Detected Information:**
- **Languages**: ${analysis.languages.join(", ")}
- **Frameworks**: ${analysis.frameworks.join(", ") || "None detected"}
- **Dependencies**: ${analysis.dependencies}

## Architecture
### Project Structure
\`\`\`
${analysis.structure}
\`\`\`

## API Documentation
${analysis.apiSpecs}

## Setup & Installation
[TODO: Add setup instructions]

## Configuration
[TODO: Add configuration details]

## Usage Examples
[TODO: Add usage examples]

## Development
[TODO: Add development instructions]

---
*Note: This documentation was generated with limited information due to API connectivity issues.*
*Generated on: ${new Date().toLocaleString()}*`;
  }
}

import { setDocumentation } from "@/lib/storage";

async function storeGeneratedDocs(generationId, documentation) {
  // Store in memory instead of file system
  setDocumentation(generationId, documentation);
  console.log(`Storing docs for ${generationId}`, {
    length: documentation.length,
  });
}

async function storeGenerationError(generationId, error) {
  // Store error information
  console.log(`Storing error for ${generationId}:`, error);
}

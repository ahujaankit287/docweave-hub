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
  // Use the comprehensive local clone-based analyzer
  const { CodeAnalyzer } = await import("@/lib/analyzer");
  
  const codeAnalyzer = new CodeAnalyzer();
  
  // The new analyzer returns comprehensive analysis including API specs
  const analysis = await codeAnalyzer.analyzeRepository(repoUrl, branch);
  
  return analysis;
}

async function generateWithLLM(analysis, apiKey) {
  // Build comprehensive prompt with real analysis data
  const languageInfo = analysis.languages?.map(l => `${l.language} (${l.fileCount} files)`).join(', ') || 'Unknown';
  const frameworkInfo = analysis.frameworks?.join(', ') || 'None detected';
  
  const prompt = `You are a technical documentation expert. Generate comprehensive service documentation based on this REAL repository analysis:

## Repository Analysis Results
- **Repository**: ${analysis.repository?.name || 'Unknown'}
- **Analyzed**: ${analysis.repository?.analyzedAt || 'Unknown'}
- **Languages**: ${languageInfo}
- **Frameworks**: ${frameworkInfo}
- **Package Manager**: ${analysis.dependencies?.packageManager || 'Unknown'}

## Code Metrics
- **Total Files**: ${analysis.metrics?.totalFiles || 0}
- **Code Files**: ${analysis.metrics?.codeFiles || 0}
- **Estimated Lines of Code**: ${analysis.metrics?.estimatedLinesOfCode || 0}
- **Average File Size**: ${analysis.metrics?.averageFileSize || 0} bytes

## Project Structure
\`\`\`
${analysis.structure || 'Structure not available'}
\`\`\`

## Dependencies Analysis
**Production Dependencies**: ${analysis.dependencies?.production?.length || 0} packages
**Development Dependencies**: ${analysis.dependencies?.development?.length || 0} packages
**Total Dependencies**: ${analysis.dependencies?.total || 0}

Key Dependencies:
${analysis.dependencies?.production?.slice(0, 10).map(dep => `- ${dep}`).join('\n') || 'None found'}

## Entry Points
${analysis.entryPoints?.length > 0 ? analysis.entryPoints.map(ep => `- ${ep}`).join('\n') : 'No clear entry points found'}

## Configuration Files Found
${analysis.configFiles?.length > 0 ? analysis.configFiles.slice(0, 15).map(cf => `- ${cf}`).join('\n') : 'No config files found'}

## API Specifications
${analysis.apiSpecs?.length > 0 ? 
  analysis.apiSpecs.map(spec => `- **${spec.type}**: ${spec.file} (${spec.size} bytes)`).join('\n') : 
  'No API specifications found'}

## Test Coverage
**Test Files Found**: ${analysis.testFiles?.length || 0}
${analysis.testFiles?.length > 0 ? 
  analysis.testFiles.slice(0, 10).map(tf => `- ${tf}`).join('\n') : 
  'No test files detected'}

## README Analysis
${analysis.readme ? 
  `**File**: ${analysis.readme.filename}
**Length**: ${analysis.readme.fullLength} characters
**Content Preview**:
${analysis.readme.content}` : 
  'No README file found'}

---

Based on this REAL analysis data, generate a comprehensive markdown documentation that includes:

1. **Service Overview** - Infer the service purpose from the actual code structure, dependencies, and README content
2. **Architecture** - Describe the architecture based on the real project structure and frameworks detected
3. **Technology Stack** - Detail the actual languages, frameworks, and key dependencies found
4. **Setup & Installation** - Provide setup instructions based on the detected package manager and dependencies
5. **Configuration** - Document the configuration files and environment setup based on actual files found
6. **API Documentation** - If API specs were found, document them; otherwise infer API structure from the codebase
7. **Development Workflow** - Based on test files and build configuration found
8. **File Structure Guide** - Explain the actual directory structure and key files

Be specific and accurate - use only the information provided in the analysis. Don't make assumptions beyond what the data shows. Focus on practical, actionable documentation that reflects the real codebase structure.`;

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

    // Fallback to a template using real analysis data if API fails
    const repoName = analysis.repository?.name || "Repository";
    const languageList = analysis.languages?.map(l => l.language).join(", ") || "Unknown";
    const frameworkList = analysis.frameworks?.join(", ") || "None detected";
    
    return `# ${repoName} Documentation

## Service Overview
This repository contains a ${languageList} project${analysis.frameworks?.length > 0 ? ` using ${frameworkList}` : ''}.

**Repository Analysis:**
- **Total Files**: ${analysis.metrics?.totalFiles || 0}
- **Code Files**: ${analysis.metrics?.codeFiles || 0}
- **Languages**: ${languageList}
- **Frameworks**: ${frameworkList}
- **Dependencies**: ${analysis.dependencies?.total || 0} packages

## Project Structure
\`\`\`
${analysis.structure || 'Structure not available'}
\`\`\`

## Technology Stack
${analysis.languages?.map(l => `- **${l.language}**: ${l.fileCount} files`).join('\n') || 'No languages detected'}

## Dependencies
**Package Manager**: ${analysis.dependencies?.packageManager || 'Unknown'}
**Production Dependencies**: ${analysis.dependencies?.production?.length || 0}
**Development Dependencies**: ${analysis.dependencies?.development?.length || 0}

${analysis.dependencies?.production?.length > 0 ? 
  `### Key Dependencies
${analysis.dependencies.production.slice(0, 10).map(dep => `- ${dep}`).join('\n')}` : 
  'No dependencies found'}

## Entry Points
${analysis.entryPoints?.length > 0 ? 
  analysis.entryPoints.map(ep => `- \`${ep}\``).join('\n') : 
  'No clear entry points identified'}

## Configuration
${analysis.configFiles?.length > 0 ? 
  `Configuration files found:
${analysis.configFiles.slice(0, 10).map(cf => `- \`${cf}\``).join('\n')}` : 
  'No configuration files found'}

${analysis.apiSpecs?.length > 0 ? 
  `## API Documentation
${analysis.apiSpecs.map(spec => `- **${spec.type}**: \`${spec.file}\``).join('\n')}` : 
  ''}

${analysis.testFiles?.length > 0 ? 
  `## Testing
Test files found: ${analysis.testFiles.length}
${analysis.testFiles.slice(0, 5).map(tf => `- \`${tf}\``).join('\n')}` : 
  ''}

${analysis.readme ? 
  `## README Content
${analysis.readme.content.slice(0, 1000)}${analysis.readme.hasMore ? '...' : ''}` : 
  ''}

---
*Note: This documentation was generated from repository analysis. API call failed, so this is a basic template.*
*Generated on: ${new Date().toLocaleString()}*
*Repository analyzed: ${analysis.repository?.analyzedAt || 'Unknown'}*`;
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

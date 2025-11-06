import { NextRequest, NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { repoUrl, branch = 'main', apiKey } = body

    if (!repoUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Repository URL and API key are required' },
        { status: 400 }
      )
    }

    // Validate repository URL
    const urlPattern = /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/.+\.git$/
    if (!urlPattern.test(repoUrl) && !repoUrl.includes('github.com')) {
      return NextResponse.json(
        { error: 'Invalid repository URL. Please provide a valid Git repository URL.' },
        { status: 400 }
      )
    }

    // Start documentation generation process
    const generationId = generateId()
    
    // In a real implementation, this would:
    // 1. Clone the repository
    // 2. Analyze the codebase
    // 3. Generate documentation using LLM
    // 4. Return the generated markdown
    
    // For now, simulate the process
    setTimeout(async () => {
      await generateDocumentation(repoUrl, branch, apiKey, generationId)
    }, 1000)

    return NextResponse.json({
      success: true,
      generationId,
      message: 'Documentation generation started',
      estimatedTime: '2-5 minutes'
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

async function generateDocumentation(repoUrl, branch, apiKey, generationId) {
  try {
    // This would implement the core logic from the Python version:
    
    // 1. Repository Analysis (equivalent to analyzers.py)
    const analysis = await analyzeRepository(repoUrl, branch)
    
    // 2. LLM Generation (equivalent to generator.py)
    const documentation = await generateWithLLM(analysis, apiKey)
    
    // 3. Store result
    await storeGeneratedDocs(generationId, documentation)
    
    console.log(`Documentation generated for ${repoUrl}`)
    
  } catch (error) {
    console.error(`Generation failed for ${repoUrl}:`, error)
    await storeGenerationError(generationId, error)
  }
}

async function analyzeRepository(repoUrl, branch) {
  // Use the migrated analyzer from Python codebase
  const { CodeAnalyzer, APISpecAnalyzer } = await import('@/lib/analyzer')
  
  const codeAnalyzer = new CodeAnalyzer()
  const apiAnalyzer = new APISpecAnalyzer()
  
  const analysis = await codeAnalyzer.analyzeRepository(repoUrl, branch)
  const apiSpecs = await apiAnalyzer.findApiSpecs(repoUrl, branch)
  
  return {
    ...analysis,
    apiSpecs
  }
}

async function generateWithLLM(analysis, apiKey) {
  // Equivalent to Python's _generate_documentation method
  const prompt = `
You are a technical documentation expert. Generate comprehensive service documentation based ONLY on the following repository analysis. 

IMPORTANT RULES:
- Only use information that can be directly observed from the codebase analysis provided
- Do NOT invent or assume functionality that isn't evident in the code
- Use placeholder text like "Lorem ipsum" or "[TODO: Add description]" for sections where information is not available in the codebase
- Do NOT create fake examples, demo data, or fictional API endpoints
- If specific details are missing, use placeholders that the code owner can fill in later

Repository Analysis:
${JSON.stringify(analysis, null, 2)}

Generate a well-structured markdown document with these sections:

1. **Service Overview** 
   - Only describe what can be determined from the actual code structure and README
   - Use "[TODO: Add service description]" if purpose is unclear

2. **Architecture** 
   - Document only the components and structure visible in the codebase
   - Use "[TODO: Add architecture details]" for missing information

3. **API Documentation** 
   - Only document APIs/endpoints found in actual spec files or code
   - Use "[TODO: Add API documentation]" if no APIs are detected

4. **Setup & Installation** 
   - Base this only on actual setup files (package.json, requirements.txt, etc.)
   - Use "[TODO: Add setup instructions]" for missing steps

5. **Configuration** 
   - Only document config files and environment variables found in the code
   - Use "[TODO: Add configuration details]" for undocumented settings

6. **Usage Examples** 
   - Only provide examples based on actual code patterns found
   - Use "[TODO: Add usage examples]" if no clear usage patterns exist

7. **Dependencies** 
   - List only the actual dependencies found in dependency files
   - Use "[TODO: Add dependency descriptions]" for unexplained dependencies

8. **Development** 
   - Base this only on actual build scripts, test files, and development tools found
   - Use "[TODO: Add development instructions]" for missing information

Remember: It's better to have placeholder text that maintainers can fill in than to generate fictional information.
`

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096
      })
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content

  } catch (error) {
    console.error('LLM generation error:', error)
    throw error instanceof Error ? error : new Error('Unknown LLM generation error')
  }
}

async function storeGeneratedDocs(generationId, documentation) {
  // Store in database or file system
  console.log(`Storing docs for ${generationId}`, { length: documentation.length })
}

async function storeGenerationError(generationId, error) {
  // Store error information
  console.log(`Storing error for ${generationId}:`, error)
}
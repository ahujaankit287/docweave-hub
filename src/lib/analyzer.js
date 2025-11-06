// Repository analysis utilities - real git clone and file system analysis
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class CodeAnalyzer {
  constructor() {
    this.tempDir = '/tmp/docweave-analysis';
    this.maxCloneTime = 120000; // 2 minutes timeout
  }

  async analyzeRepository(repoUrl, branch = 'main') {
    const repoName = this.extractRepoName(repoUrl);
    const timestamp = Date.now();
    const clonePath = path.join(this.tempDir, `${repoName}-${timestamp}`);

    console.log(`Starting analysis of ${repoUrl} (branch: ${branch})`);

    try {
      // Step 1: Clone the repository
      await this.cloneRepository(repoUrl, branch, clonePath);
      
      // Step 2: Analyze the cloned repository
      console.log('Repository cloned, starting analysis...');
      const analysis = await this.performAnalysis(clonePath, repoName);
      
      console.log('Analysis completed successfully');
      return analysis;
      
    } catch (error) {
      console.error('Repository analysis failed:', error);
      throw error;
    } finally {
      // Always cleanup, even if analysis fails
      await this.cleanup(clonePath);
    }
  }

  extractRepoName(repoUrl) {
    // Extract repo name from various URL formats
    const match = repoUrl.match(/\/([^\/]+?)(?:\.git)?(?:\/)?$/);
    return match ? match[1] : 'unknown-repo';
  }

  async cloneRepository(repoUrl, branch, targetPath) {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });
      
      console.log(`Cloning ${repoUrl} to ${targetPath}`);
      
      // Clone with timeout and proper error handling
      const cloneCommand = `git clone --depth 1 --single-branch --branch ${branch} "${repoUrl}" "${targetPath}"`;
      
      const { stderr } = await execAsync(cloneCommand, {
        timeout: this.maxCloneTime,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (stderr && !stderr.includes('Cloning into')) {
        console.warn('Git clone warnings:', stderr);
      }
      
      console.log('Clone completed successfully');
      
      // Verify the directory exists and has content
      const stats = await fs.stat(targetPath);
      if (!stats.isDirectory()) {
        throw new Error('Clone failed - target is not a directory');
      }
      
    } catch (error) {
      if (error.code === 'TIMEOUT') {
        throw new Error('Repository clone timed out - repository may be too large');
      }
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async performAnalysis(repoPath, repoName) {
    try {
      // Get all files in the repository
      const allFiles = await this.scanDirectory(repoPath);
      console.log(`Found ${allFiles.length} files to analyze`);
      
      // Perform different types of analysis
      const [
        projectStructure,
        languages,
        frameworks,
        dependencies,
        readme,
        entryPoints,
        configFiles,
        testFiles,
        apiSpecs,
        codeMetrics
      ] = await Promise.all([
        this.analyzeProjectStructure(allFiles, repoPath),
        this.analyzeLanguages(allFiles),
        this.analyzeFrameworks(allFiles, repoPath),
        this.analyzeDependencies(allFiles, repoPath),
        this.findAndReadReadme(allFiles, repoPath),
        this.findEntryPoints(allFiles),
        this.findConfigFiles(allFiles),
        this.findTestFiles(allFiles),
        this.findApiSpecs(allFiles, repoPath),
        this.calculateCodeMetrics(allFiles, repoPath)
      ]);

      return {
        repository: {
          name: repoName,
          analyzedAt: new Date().toISOString(),
          totalFiles: allFiles.length
        },
        structure: projectStructure,
        languages,
        frameworks,
        dependencies,
        readme,
        entryPoints,
        configFiles,
        testFiles,
        apiSpecs,
        metrics: codeMetrics
      };
      
    } catch (error) {
      console.error('Analysis failed:', error);
      throw new Error(`Repository analysis failed: ${error.message}`);
    }
  }

  async scanDirectory(dirPath, relativePath = '', maxDepth = 8, currentDepth = 0) {
    const files = [];
    
    if (currentDepth >= maxDepth) {
      return files;
    }
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip hidden files and common ignore patterns
        if (this.shouldSkipFile(entry.name)) {
          continue;
        }
        
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            const subFiles = await this.scanDirectory(fullPath, relPath, maxDepth, currentDepth + 1);
            files.push(...subFiles);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            files.push({
              name: entry.name,
              path: relPath,
              fullPath: fullPath,
              size: stats.size,
              extension: path.extname(entry.name).toLowerCase(),
              isDirectory: false
            });
          }
        } catch (err) {
          console.warn(`Skipping ${fullPath}: ${err.message}`);
        }
      }
    } catch (error) {
      console.warn(`Cannot read directory ${dirPath}: ${error.message}`);
    }
    
    return files;
  }

  shouldSkipFile(filename) {
    const skipPatterns = [
      // Hidden files (except important ones)
      /^\./,
      // Dependencies and build artifacts
      /^node_modules$/,
      /^__pycache__$/,
      /^\.git$/,
      /^target$/,
      /^build$/,
      /^dist$/,
      /^\.next$/,
      /^coverage$/,
      // Temporary files
      /\.tmp$/,
      /\.log$/,
      /~$/
    ];
    
    // Allow important dotfiles
    const allowedDotfiles = ['.env', '.gitignore', '.dockerignore', '.eslintrc', '.prettierrc'];
    if (filename.startsWith('.') && !allowedDotfiles.some(allowed => filename.startsWith(allowed))) {
      return true;
    }
    
    return skipPatterns.some(pattern => pattern.test(filename));
  }

  async analyzeProjectStructure(files, repoPath) {
    const directories = new Set();
    const rootFiles = [];
    
    // Collect directories and root files
    files.forEach(file => {
      const parts = file.path.split(path.sep);
      
      // Add all parent directories
      for (let i = 1; i <= parts.length - 1; i++) {
        const dirPath = parts.slice(0, i).join('/');
        directories.add(dirPath);
      }
      
      // Collect root files
      if (parts.length === 1) {
        rootFiles.push(file.name);
      }
    });
    
    // Build tree structure
    const sortedDirs = Array.from(directories).sort();
    const tree = [`${path.basename(repoPath)}/`];
    
    // Add important directories first (limited to avoid clutter)
    const importantDirs = sortedDirs
      .filter(dir => !dir.includes('/')) // Only top-level dirs
      .slice(0, 15); // Limit to 15 directories
    
    importantDirs.forEach(dir => {
      tree.push(`├── ${dir}/`);
    });
    
    // Add important root files
    const importantFiles = rootFiles
      .filter(file => this.isImportantFile(file))
      .slice(0, 10); // Limit to 10 files
    
    importantFiles.forEach(file => {
      tree.push(`├── ${file}`);
    });
    
    return tree.join('\n');
  }

  isImportantFile(filename) {
    const important = [
      'package.json', 'requirements.txt', 'pom.xml', 'Cargo.toml', 'go.mod',
      'README.md', 'README.txt', 'LICENSE', 'Dockerfile', 'docker-compose.yml',
      'tsconfig.json', 'webpack.config.js', 'vite.config.js', '.env.example'
    ];
    return important.includes(filename) || filename.toLowerCase().startsWith('readme');
  }

  analyzeLanguages(files) {
    const languageMap = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.kt': 'Kotlin',
      '.go': 'Go',
      '.rs': 'Rust',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
      '.swift': 'Swift',
      '.dart': 'Dart',
      '.scala': 'Scala'
    };
    
    const languageCounts = {};
    
    files.forEach(file => {
      const language = languageMap[file.extension];
      if (language) {
        languageCounts[language] = (languageCounts[language] || 0) + 1;
      }
    });
    
    // Return languages sorted by frequency
    return Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([lang, count]) => ({ language: lang, fileCount: count }));
  }

  async analyzeFrameworks(files, repoPath) {
    const frameworks = new Set();
    
    // Check package.json for JavaScript/TypeScript frameworks
    const packageJsonFile = files.find(f => f.name === 'package.json' && !f.path.includes('/'));
    if (packageJsonFile) {
      try {
        const content = await fs.readFile(packageJsonFile.fullPath, 'utf8');
        const packageJson = JSON.parse(content);
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Framework detection
        if (allDeps.react) frameworks.add('React');
        if (allDeps.next) frameworks.add('Next.js');
        if (allDeps.vue) frameworks.add('Vue.js');
        if (allDeps['@angular/core']) frameworks.add('Angular');
        if (allDeps.express) frameworks.add('Express.js');
        if (allDeps.fastify) frameworks.add('Fastify');
        if (allDeps['@nestjs/core']) frameworks.add('NestJS');
        if (allDeps.svelte) frameworks.add('Svelte');
        if (allDeps.nuxt) frameworks.add('Nuxt.js');
        if (allDeps.gatsby) frameworks.add('Gatsby');
        
      } catch (error) {
        console.warn('Error parsing package.json:', error.message);
      }
    }
    
    // Check requirements.txt for Python frameworks
    const requirementsFile = files.find(f => f.name === 'requirements.txt');
    if (requirementsFile) {
      try {
        const content = await fs.readFile(requirementsFile.fullPath, 'utf8');
        const lines = content.toLowerCase();
        
        if (lines.includes('django')) frameworks.add('Django');
        if (lines.includes('flask')) frameworks.add('Flask');
        if (lines.includes('fastapi')) frameworks.add('FastAPI');
        if (lines.includes('tornado')) frameworks.add('Tornado');
        if (lines.includes('pyramid')) frameworks.add('Pyramid');
        
      } catch (error) {
        console.warn('Error reading requirements.txt:', error.message);
      }
    }
    
    // Check pom.xml for Java frameworks
    const pomFile = files.find(f => f.name === 'pom.xml');
    if (pomFile) {
      try {
        const content = await fs.readFile(pomFile.fullPath, 'utf8');
        
        if (content.includes('spring-boot')) frameworks.add('Spring Boot');
        if (content.includes('spring-web')) frameworks.add('Spring Framework');
        if (content.includes('quarkus')) frameworks.add('Quarkus');
        
      } catch (error) {
        console.warn('Error reading pom.xml:', error.message);
      }
    }
    
    return Array.from(frameworks);
  }

  async analyzeDependencies(files, repoPath) {
    const dependencies = {
      production: [],
      development: [],
      total: 0,
      packageManager: null
    };
    
    // JavaScript/TypeScript dependencies
    const packageJsonFile = files.find(f => f.name === 'package.json' && !f.path.includes('/'));
    if (packageJsonFile) {
      try {
        const content = await fs.readFile(packageJsonFile.fullPath, 'utf8');
        const packageJson = JSON.parse(content);
        
        dependencies.packageManager = 'npm';
        
        if (packageJson.dependencies) {
          dependencies.production = Object.keys(packageJson.dependencies);
        }
        if (packageJson.devDependencies) {
          dependencies.development = Object.keys(packageJson.devDependencies);
        }
        dependencies.total = dependencies.production.length + dependencies.development.length;
        
        // Check for yarn.lock or package-lock.json
        const hasYarnLock = files.some(f => f.name === 'yarn.lock');
        const hasPackageLock = files.some(f => f.name === 'package-lock.json');
        
        if (hasYarnLock) dependencies.packageManager = 'yarn';
        else if (hasPackageLock) dependencies.packageManager = 'npm';
        
      } catch (error) {
        console.warn('Error parsing package.json:', error.message);
      }
    }
    
    // Python dependencies
    const requirementsFile = files.find(f => f.name === 'requirements.txt');
    if (requirementsFile) {
      try {
        const content = await fs.readFile(requirementsFile.fullPath, 'utf8');
        const pythonDeps = content
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.split(/[>=<]/)[0].trim());
        
        dependencies.production = pythonDeps;
        dependencies.total = pythonDeps.length;
        dependencies.packageManager = 'pip';
        
      } catch (error) {
        console.warn('Error reading requirements.txt:', error.message);
      }
    }
    
    return dependencies;
  }

  async findAndReadReadme(files, repoPath) {
    const readmeFile = files.find(f => 
      f.name.toLowerCase().startsWith('readme') && 
      !f.path.includes('/') // Only root README
    );
    
    if (readmeFile) {
      try {
        const content = await fs.readFile(readmeFile.fullPath, 'utf8');
        return {
          filename: readmeFile.name,
          content: content.slice(0, 8000), // First 8000 chars
          fullLength: content.length,
          hasMore: content.length > 8000
        };
      } catch (error) {
        console.warn('Error reading README:', error.message);
        return { filename: readmeFile.name, content: null, error: error.message };
      }
    }
    
    return null;
  }

  findEntryPoints(files) {
    const entryPatterns = [
      // JavaScript/TypeScript
      { pattern: /^(index|main|app|server)\.(js|ts|jsx|tsx)$/, priority: 1 },
      // Python
      { pattern: /^(main|app|server|manage)\.py$/, priority: 1 },
      // Java
      { pattern: /^(Main|Application)\.java$/, priority: 1 },
      // Go
      { pattern: /^main\.go$/, priority: 1 },
      // Rust
      { pattern: /^main\.rs$/, priority: 1 }
    ];
    
    const entryPoints = [];
    
    files.forEach(file => {
      if (!file.isDirectory) {
        entryPatterns.forEach(({ pattern, priority }) => {
          if (pattern.test(file.name)) {
            entryPoints.push({
              file: file.path,
              priority,
              type: this.getFileType(file.extension)
            });
          }
        });
      }
    });
    
    // Sort by priority and return paths
    return entryPoints
      .sort((a, b) => a.priority - b.priority)
      .map(ep => ep.file);
  }

  getFileType(extension) {
    const typeMap = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust'
    };
    return typeMap[extension] || 'Unknown';
  }

  findConfigFiles(files) {
    const configPatterns = [
      'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.js',
      'requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile',
      'pom.xml', 'build.gradle', 'Cargo.toml', 'go.mod',
      '.env', '.env.example', '.env.local',
      'docker-compose.yml', 'Dockerfile',
      'nginx.conf', 'apache.conf',
      '.eslintrc', '.prettierrc', '.babelrc'
    ];
    
    return files
      .filter(file => 
        !file.isDirectory && 
        (configPatterns.includes(file.name) ||
         file.name.endsWith('.config.js') ||
         file.name.endsWith('.config.ts') ||
         file.name.endsWith('.yml') ||
         file.name.endsWith('.yaml') ||
         file.name.endsWith('.toml') ||
         file.name.endsWith('.json'))
      )
      .map(f => f.path)
      .slice(0, 20); // Limit to 20 config files
  }

  findTestFiles(files) {
    return files
      .filter(file => 
        !file.isDirectory && 
        (file.path.includes('test') || 
         file.path.includes('spec') ||
         file.path.includes('__tests__') ||
         file.name.includes('.test.') ||
         file.name.includes('.spec.') ||
         file.name.endsWith('_test.py') ||
         file.name.endsWith('Test.java'))
      )
      .map(f => f.path)
      .slice(0, 30); // Limit to 30 test files
  }

  async findApiSpecs(files, repoPath) {
    const apiSpecs = [];
    
    // Look for OpenAPI/Swagger specs
    const specFiles = files.filter(file => 
      !file.isDirectory && 
      (file.name.toLowerCase().includes('swagger') ||
       file.name.toLowerCase().includes('openapi') ||
       file.name.toLowerCase().includes('api') ||
       (file.extension === '.yaml' || file.extension === '.yml')) &&
      file.size < 1024 * 1024 // Less than 1MB
    );
    
    for (const specFile of specFiles.slice(0, 5)) { // Limit to 5 spec files
      try {
        const content = await fs.readFile(specFile.fullPath, 'utf8');
        if (content.includes('openapi:') || content.includes('swagger:')) {
          apiSpecs.push({
            file: specFile.path,
            type: 'OpenAPI/Swagger',
            size: specFile.size,
            preview: content.slice(0, 500)
          });
        }
      } catch (error) {
        console.warn(`Error reading spec file ${specFile.path}:`, error.message);
      }
    }
    
    // Look for GraphQL schemas
    const graphqlFiles = files.filter(file => 
      !file.isDirectory && 
      (file.extension === '.graphql' || 
       file.extension === '.gql' ||
       file.name.toLowerCase().includes('schema'))
    );
    
    for (const gqlFile of graphqlFiles.slice(0, 3)) { // Limit to 3 GraphQL files
      try {
        const content = await fs.readFile(gqlFile.fullPath, 'utf8');
        if (content.includes('type ') || content.includes('schema ')) {
          apiSpecs.push({
            file: gqlFile.path,
            type: 'GraphQL',
            size: gqlFile.size,
            preview: content.slice(0, 500)
          });
        }
      } catch (error) {
        console.warn(`Error reading GraphQL file ${gqlFile.path}:`, error.message);
      }
    }
    
    return apiSpecs;
  }

  async calculateCodeMetrics(files, repoPath) {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.kt', '.go', '.rs', '.php', '.rb', '.cs', '.cpp', '.c'];
    
    const codeFiles = files.filter(f => 
      !f.isDirectory && 
      codeExtensions.includes(f.extension)
    );
    
    let totalLines = 0;
    let totalSize = 0;
    
    // Sample a few files to estimate lines of code
    const sampleFiles = codeFiles.slice(0, 10);
    for (const file of sampleFiles) {
      try {
        const content = await fs.readFile(file.fullPath, 'utf8');
        const lines = content.split('\n').length;
        totalLines += lines;
        totalSize += file.size;
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    // Estimate total lines based on sample
    const avgLinesPerFile = sampleFiles.length > 0 ? totalLines / sampleFiles.length : 0;
    const estimatedTotalLines = Math.round(avgLinesPerFile * codeFiles.length);
    
    return {
      totalFiles: files.length,
      codeFiles: codeFiles.length,
      estimatedLinesOfCode: estimatedTotalLines,
      totalSizeBytes: files.reduce((sum, f) => sum + f.size, 0),
      averageFileSize: files.length > 0 ? Math.round(files.reduce((sum, f) => sum + f.size, 0) / files.length) : 0
    };
  }

  async cleanup(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      console.log(`Cleaned up ${dirPath}`);
    } catch (error) {
      console.warn(`Cleanup failed for ${dirPath}:`, error.message);
    }
  }
}

export class APISpecAnalyzer {
  async findApiSpecs(repoUrl, branch) {
    // Delegate to CodeAnalyzer for consistency
    const analyzer = new CodeAnalyzer();
    const analysis = await analyzer.analyzeRepository(repoUrl, branch);
    return analysis.apiSpecs;
  }
}
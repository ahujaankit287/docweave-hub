// Repository analysis utilities - local clone-based analyzer
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export class CodeAnalyzer {
  constructor() {
    this.tempDir = '/tmp/repo-analysis';
    this.supportedLanguages = {
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
      '.scala': 'Scala',
      '.clj': 'Clojure',
      '.ex': 'Elixir',
      '.hs': 'Haskell'
    };
  }

  async analyzeRepository(repoUrl, branch = 'main') {
    const repoName = this.extractRepoName(repoUrl);
    const clonePath = path.join(this.tempDir, repoName);

    try {
      // Clone repository
      await this.cloneRepository(repoUrl, branch, clonePath);
      
      // Analyze the cloned repository
      const analysis = await this.analyzeLocalRepository(clonePath, repoName);
      
      // Cleanup
      this.cleanup(clonePath);
      
      return analysis;
    } catch (error) {
      console.error('Repository analysis failed:', error);
      this.cleanup(clonePath);
      throw new Error(`Failed to analyze repository: ${error.message}`);
    }
  }

  extractRepoName(repoUrl) {
    return repoUrl.split('/').pop()?.replace('.git', '') || 'repository';
  }

  async cloneRepository(repoUrl, branch, targetPath) {
    try {
      // Ensure temp directory exists
      execSync(`mkdir -p ${this.tempDir}`, { stdio: 'pipe' });
      
      // Remove existing directory if it exists
      execSync(`rm -rf ${targetPath}`, { stdio: 'pipe' });
      
      // Clone repository
      console.log(`Cloning ${repoUrl} (branch: ${branch}) to ${targetPath}`);
      execSync(`git clone --depth 1 --branch ${branch} ${repoUrl} ${targetPath}`, { 
        stdio: 'pipe',
        timeout: 60000 // 60 second timeout
      });
      
      console.log('Repository cloned successfully');
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async analyzeLocalRepository(repoPath, repoName) {
    const fileTree = await this.buildFileTree(repoPath);
    
    const [
      structure,
      languages,
      frameworks,
      dependencies,
      readme,
      entryPoints,
      configFiles,
      testFiles,
      documentation,
      apiSpecs
    ] = await Promise.all([
      this.buildProjectStructure(fileTree, repoPath),
      this.detectLanguages(fileTree),
      this.detectFrameworks(repoPath, fileTree),
      this.analyzeDependencies(repoPath, fileTree),
      this.findReadme(repoPath, fileTree),
      this.findEntryPoints(fileTree),
      this.findConfigFiles(fileTree),
      this.findTestFiles(fileTree),
      this.findDocumentationFiles(fileTree),
      this.findApiSpecs(repoPath, fileTree)
    ]);

    return {
      repository: {
        name: repoName,
        path: repoPath
      },
      structure,
      languages,
      frameworks,
      dependencies,
      readme,
      entryPoints,
      configFiles,
      testFiles,
      documentation,
      apiSpecs,
      metrics: {
        totalFiles: fileTree.length,
        codeFiles: fileTree.filter(f => this.isCodeFile(f.name)).length,
        testFiles: testFiles.length,
        configFiles: configFiles.length,
        directories: fileTree.filter(f => f.isDirectory).length
      }
    };
  }

  async buildFileTree(dirPath, relativePath = '') {
    const files = [];
    
    try {
      const items = await readdir(dirPath);
      
      for (const item of items) {
        // Skip hidden files and common ignore patterns
        if (item.startsWith('.') && item !== '.env' && item !== '.gitignore') continue;
        if (item === 'node_modules' || item === '__pycache__' || item === 'target' || item === 'build') continue;
        
        const fullPath = path.join(dirPath, item);
        const itemRelativePath = path.join(relativePath, item);
        
        try {
          const stats = await stat(fullPath);
          
          if (stats.isDirectory()) {
            files.push({
              name: item,
              path: itemRelativePath,
              fullPath,
              isDirectory: true,
              size: 0
            });
            
            // Recursively get subdirectory contents (limit depth to avoid infinite loops)
            if (relativePath.split(path.sep).length < 5) {
              const subFiles = await this.buildFileTree(fullPath, itemRelativePath);
              files.push(...subFiles);
            }
          } else {
            files.push({
              name: item,
              path: itemRelativePath,
              fullPath,
              isDirectory: false,
              size: stats.size,
              extension: path.extname(item).toLowerCase()
            });
          }
        } catch (err) {
          console.warn(`Skipping ${fullPath}: ${err.message}`);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
    
    return files;
  }

  async buildProjectStructure(fileTree, repoPath) {
    const structure = [];
    const directories = new Set();
    
    // Build directory structure
    fileTree.forEach(file => {
      const parts = file.path.split(path.sep);
      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join('/');
        directories.add(dirPath);
      }
    });
    
    // Sort directories and files
    const sortedDirs = Array.from(directories).sort();
    const rootFiles = fileTree.filter(f => !f.isDirectory && !f.path.includes(path.sep));
    
    // Create tree representation
    structure.push(`${path.basename(repoPath)}/`);
    
    // Add key directories first
    const keyDirs = sortedDirs.filter(dir => 
      ['src', 'lib', 'app', 'components', 'pages', 'api', 'utils', 'config', 'tests', 'docs'].some(key => 
        dir.includes(key)
      )
    ).slice(0, 10);
    
    keyDirs.forEach(dir => {
      const depth = dir.split('/').length;
      const indent = '  '.repeat(depth);
      structure.push(`${indent}├── ${path.basename(dir)}/`);
    });
    
    // Add important root files
    const importantFiles = rootFiles.filter(f => 
      ['package.json', 'requirements.txt', 'pom.xml', 'Cargo.toml', 'go.mod', 'README.md', 'LICENSE'].includes(f.name)
    );
    
    importantFiles.forEach(file => {
      structure.push(`├── ${file.name}`);
    });
    
    return structure.join('\n');
  }

  detectLanguages(fileTree) {
    const languageCounts = {};
    
    fileTree.forEach(file => {
      if (!file.isDirectory && file.extension) {
        const language = this.supportedLanguages[file.extension];
        if (language) {
          languageCounts[language] = (languageCounts[language] || 0) + 1;
        }
      }
    });
    
    // Sort by frequency and return top languages
    return Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([lang]) => lang);
  }

  async detectFrameworks(repoPath, fileTree) {
    const frameworks = new Set();
    
    // Check package.json for JS/TS frameworks
    const packageJsonFile = fileTree.find(f => f.name === 'package.json');
    if (packageJsonFile) {
      try {
        const content = await readFile(packageJsonFile.fullPath, 'utf8');
        const packageJson = JSON.parse(content);
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.react) frameworks.add('React');
        if (deps.next) frameworks.add('Next.js');
        if (deps.vue) frameworks.add('Vue.js');
        if (deps.angular || deps['@angular/core']) frameworks.add('Angular');
        if (deps.express) frameworks.add('Express.js');
        if (deps.fastify) frameworks.add('Fastify');
        if (deps.nestjs || deps['@nestjs/core']) frameworks.add('NestJS');
        if (deps.svelte) frameworks.add('Svelte');
        if (deps.nuxt) frameworks.add('Nuxt.js');
      } catch (error) {
        console.warn('Error parsing package.json:', error.message);
      }
    }
    
    // Check requirements.txt for Python frameworks
    const requirementsFile = fileTree.find(f => f.name === 'requirements.txt');
    if (requirementsFile) {
      try {
        const content = await readFile(requirementsFile.fullPath, 'utf8');
        if (content.includes('django')) frameworks.add('Django');
        if (content.includes('flask')) frameworks.add('Flask');
        if (content.includes('fastapi')) frameworks.add('FastAPI');
        if (content.includes('tornado')) frameworks.add('Tornado');
      } catch (error) {
        console.warn('Error reading requirements.txt:', error.message);
      }
    }
    
    // Check pom.xml for Java frameworks
    const pomFile = fileTree.find(f => f.name === 'pom.xml');
    if (pomFile) {
      try {
        const content = await readFile(pomFile.fullPath, 'utf8');
        if (content.includes('spring-boot')) frameworks.add('Spring Boot');
        if (content.includes('spring-web')) frameworks.add('Spring Framework');
        if (content.includes('quarkus')) frameworks.add('Quarkus');
      } catch (error) {
        console.warn('Error reading pom.xml:', error.message);
      }
    }
    
    return Array.from(frameworks);
  } 
 async analyzeDependencies(repoPath, fileTree) {
    const dependencies = {
      production: [],
      development: [],
      total: 0
    };
    
    // JavaScript/TypeScript dependencies
    const packageJsonFile = fileTree.find(f => f.name === 'package.json');
    if (packageJsonFile) {
      try {
        const content = await readFile(packageJsonFile.fullPath, 'utf8');
        const packageJson = JSON.parse(content);
        
        if (packageJson.dependencies) {
          dependencies.production = Object.keys(packageJson.dependencies);
        }
        if (packageJson.devDependencies) {
          dependencies.development = Object.keys(packageJson.devDependencies);
        }
        dependencies.total = dependencies.production.length + dependencies.development.length;
      } catch (error) {
        console.warn('Error parsing package.json:', error.message);
      }
    }
    
    // Python dependencies
    const requirementsFile = fileTree.find(f => f.name === 'requirements.txt');
    if (requirementsFile) {
      try {
        const content = await readFile(requirementsFile.fullPath, 'utf8');
        const pythonDeps = content.split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim());
        dependencies.production = pythonDeps;
        dependencies.total = pythonDeps.length;
      } catch (error) {
        console.warn('Error reading requirements.txt:', error.message);
      }
    }
    
    return dependencies;
  }

  async findReadme(repoPath, fileTree) {
    const readmeFile = fileTree.find(f => 
      f.name.toLowerCase().startsWith('readme') && 
      ['.md', '.txt', '.rst', ''].includes(f.extension)
    );
    
    if (readmeFile) {
      try {
        const content = await readFile(readmeFile.fullPath, 'utf8');
        return {
          filename: readmeFile.name,
          content: content.slice(0, 5000), // Limit to first 5000 chars
          length: content.length
        };
      } catch (error) {
        console.warn('Error reading README:', error.message);
      }
    }
    
    return null;
  }

  findEntryPoints(fileTree) {
    const entryPoints = [];
    
    // Common entry point patterns
    const entryPatterns = [
      'main.py', 'app.py', 'server.py', 'manage.py',
      'index.js', 'app.js', 'server.js', 'main.js',
      'index.ts', 'app.ts', 'server.ts', 'main.ts',
      'Main.java', 'Application.java',
      'main.go', 'main.rs'
    ];
    
    fileTree.forEach(file => {
      if (!file.isDirectory) {
        if (entryPatterns.includes(file.name)) {
          entryPoints.push(file.path);
        }
        // Also check for files in root that might be entry points
        if (!file.path.includes('/') && file.name.includes('main')) {
          entryPoints.push(file.path);
        }
      }
    });
    
    return entryPoints;
  }

  findConfigFiles(fileTree) {
    const configPatterns = [
      'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.js',
      'requirements.txt', 'setup.py', 'pyproject.toml',
      'pom.xml', 'build.gradle', 'Cargo.toml', 'go.mod',
      '.env', '.env.example', 'docker-compose.yml', 'Dockerfile',
      'nginx.conf', 'apache.conf'
    ];
    
    return fileTree.filter(file => 
      !file.isDirectory && 
      (configPatterns.includes(file.name) || 
       file.name.endsWith('.config.js') ||
       file.name.endsWith('.config.ts') ||
       file.name.endsWith('.yml') ||
       file.name.endsWith('.yaml') ||
       file.name.endsWith('.toml'))
    ).map(f => f.path);
  }

  findTestFiles(fileTree) {
    return fileTree.filter(file => 
      !file.isDirectory && 
      (file.path.includes('test') || 
       file.path.includes('spec') ||
       file.name.includes('.test.') ||
       file.name.includes('.spec.') ||
       file.name.endsWith('_test.py') ||
       file.name.endsWith('Test.java'))
    ).map(f => f.path);
  }

  findDocumentationFiles(fileTree) {
    return fileTree.filter(file => 
      !file.isDirectory && 
      (file.path.includes('doc') || 
       file.path.includes('README') ||
       file.extension === '.md' ||
       file.extension === '.rst' ||
       file.name.toLowerCase().includes('changelog') ||
       file.name.toLowerCase().includes('license'))
    ).map(f => f.path);
  }

  async findApiSpecs(repoPath, fileTree) {
    const apiSpecs = [];
    
    // Look for OpenAPI/Swagger specs
    const specFiles = fileTree.filter(file => 
      !file.isDirectory && 
      (file.name.includes('swagger') ||
       file.name.includes('openapi') ||
       file.name.includes('api-spec') ||
       file.extension === '.yaml' ||
       file.extension === '.yml') &&
      (file.name.includes('api') || file.path.includes('api'))
    );
    
    for (const specFile of specFiles) {
      try {
        const content = await readFile(specFile.fullPath, 'utf8');
        if (content.includes('openapi:') || content.includes('swagger:')) {
          apiSpecs.push({
            file: specFile.path,
            type: 'OpenAPI/Swagger',
            content: content.slice(0, 1000) // First 1000 chars for analysis
          });
        }
      } catch (error) {
        console.warn(`Error reading spec file ${specFile.path}:`, error.message);
      }
    }
    
    // Look for GraphQL schemas
    const graphqlFiles = fileTree.filter(file => 
      !file.isDirectory && 
      (file.extension === '.graphql' || 
       file.extension === '.gql' ||
       file.name.includes('schema'))
    );
    
    for (const gqlFile of graphqlFiles) {
      try {
        const content = await readFile(gqlFile.fullPath, 'utf8');
        if (content.includes('type ') || content.includes('schema ')) {
          apiSpecs.push({
            file: gqlFile.path,
            type: 'GraphQL',
            content: content.slice(0, 1000)
          });
        }
      } catch (error) {
        console.warn(`Error reading GraphQL file ${gqlFile.path}:`, error.message);
      }
    }
    
    return apiSpecs;
  }

  isCodeFile(filename) {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.kt', '.go', '.rs', '.php', '.rb', '.cs', '.cpp', '.c', '.swift', '.dart', '.scala', '.clj', '.ex', '.hs'];
    const ext = path.extname(filename).toLowerCase();
    return codeExtensions.includes(ext);
  }

  cleanup(dirPath) {
    try {
      execSync(`rm -rf ${dirPath}`, { stdio: 'pipe' });
      console.log('Cleanup completed');
    } catch (error) {
      console.warn('Cleanup failed:', error.message);
    }
  }
}

export class APISpecAnalyzer {
  async findApiSpecs(repoUrl, branch) {
    // This is now handled by CodeAnalyzer.findApiSpecs
    // Keeping for backward compatibility
    const analyzer = new CodeAnalyzer();
    const analysis = await analyzer.analyzeRepository(repoUrl, branch);
    return analysis.apiSpecs;
  }
}
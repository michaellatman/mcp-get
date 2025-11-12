import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as TOML from '@iarna/toml';
import { loadAllPackages, addPackage } from '../utils/package-registry.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PackageInfo {
  name: string;
  description: string;
  vendor: string;
  sourceUrl: string;
  homepage: string;
  license: string;
  runtime: 'node' | 'python' | 'go' | 'http';
}

interface RepoConfig {
  url: string;
  branch: string;
  packagePath: string;
  runtime: 'node' | 'python' | 'go' | 'http' | 'mixed';
}

interface PyProjectToml {
  project?: {
    name?: string;
    description?: string;
    authors?: Array<{ name: string; email?: string }>;
    maintainers?: Array<{ name: string; email?: string }>;
    license?: { text: string } | string;
    homepage?: string;
    repository?: string;
  };
}

const REPOS: RepoConfig[] = [
  {
    url: 'https://github.com/modelcontextprotocol/servers.git',
    branch: 'main',
    packagePath: 'src',
    runtime: 'mixed'
  },
  {
    url: 'https://github.com/mcp-get/community-servers.git',
    branch: 'main',
    packagePath: 'src',
    runtime: 'mixed'
  }
];

async function cloneRepo(config: RepoConfig, tempDir: string): Promise<void> {
  const repoDir = path.join(tempDir, path.basename(config.url, '.git'));
  console.log(`Cloning ${config.url} into ${repoDir}...`);
  
  await execAsync(
    `git clone --depth 1 --branch ${config.branch} ${config.url} ${repoDir}`,
    { cwd: tempDir }
  );
  
  return;
}

async function extractNodePackage(packageJsonPath: string, repoUrl: string, subPath: string): Promise<PackageInfo | null> {
  try {
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const repoPath = `${repoUrl}/blob/main/${subPath}`;
    
    return {
      name: packageData.name || '',
      description: packageData.description || '',
      vendor: packageData.author || '',
      sourceUrl: repoPath,
      homepage: packageData.homepage || '',
      license: packageData.license || '',
      runtime: 'node'
    };
  } catch (error) {
    console.error(`Error extracting Node package from ${packageJsonPath}:`, error);
    return null;
  }
}

async function extractPythonPackage(pyprojectPath: string, repoUrl: string, subPath: string): Promise<PackageInfo | null> {
  try {
    const pyprojectContent = fs.readFileSync(pyprojectPath, 'utf8');
    const pyproject = TOML.parse(pyprojectContent) as PyProjectToml;
    
    if (!pyproject.project) {
      console.error(`No [project] section found in ${pyprojectPath}`);
      return null;
    }

    const { project } = pyproject;
    
    // Set vendor to Anthropic
    const vendor = 'Anthropic, PBC (https://anthropic.com)';
    
    // Set license to MIT
    const license = 'MIT';

    return {
      name: project.name || '',
      description: project.description || '',
      vendor,
      sourceUrl: `${repoUrl}/blob/main/${subPath}`,
      homepage: project.homepage || project.repository || repoUrl,
      license,
      runtime: 'python'
    };
  } catch (error) {
    console.error(`Error extracting Python package from ${pyprojectPath}:`, error);
    return null;
  }
}

export async function extractPackageInfo(): Promise<PackageInfo[]> {
  const tempDir = path.join(__dirname, '../../temp');
  const packagesDir = path.join(__dirname, '../../packages');
  const commitMsgPath = path.join(__dirname, '../../temp/commit-msg.txt');

  console.log("Starting package extraction...");

  try {
    // Load existing packages
    const existingPackages = loadAllPackages();
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Initialize commit message
    let commitMsg = "chore(packages): update MCP package list\n\nChanges:\n";
    let changes: string[] = [];

    // Process each repository
    const newPackages: PackageInfo[] = [];
    
    for (const repo of REPOS) {
      await cloneRepo(repo, tempDir);
      
      const repoDir = path.join(tempDir, path.basename(repo.url, '.git'));
      const packagePath = path.join(repoDir, repo.packagePath);
      
      if (!fs.existsSync(packagePath)) continue;
      
      const dirs = fs.readdirSync(packagePath);
      
      for (const dir of dirs) {
        const fullPath = path.join(packagePath, dir);
        if (!fs.statSync(fullPath).isDirectory()) continue;
        
        // Try to extract as Node.js package
        const packageJsonPath = path.join(fullPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const nodePackage = await extractNodePackage(
            packageJsonPath,
            repo.url.replace('.git', ''),
            path.join(repo.packagePath, dir)
          );
          if (nodePackage) {
            newPackages.push(nodePackage);
            continue;
          }
        }

        // Try to extract as Python package
        const pyprojectPath = path.join(fullPath, 'pyproject.toml');
        if (fs.existsSync(pyprojectPath)) {
          const pythonPackage = await extractPythonPackage(
            pyprojectPath,
            repo.url.replace('.git', ''),
            path.join(repo.packagePath, dir)
          );
          if (pythonPackage) {
            newPackages.push(pythonPackage);
            continue;
          }
        }
        
        // Try to extract as Go package
        const goModPath = path.join(fullPath, 'go.mod');
        if (fs.existsSync(goModPath)) {
          try {
            const goModContent = fs.readFileSync(goModPath, 'utf8');
            const moduleMatch = goModContent.match(/^module\s+(.+)$/m);
            const moduleName = moduleMatch ? moduleMatch[1].trim() : dir;
            
            const goPackage: PackageInfo = {
              name: moduleName,
              description: 'Go MCP server',
              vendor: 'Go Module',
              sourceUrl: `${repo.url.replace('.git', '')}/blob/main/${path.join(repo.packagePath, dir)}`,
              homepage: repo.url.replace('.git', ''),
              license: 'MIT', // Default license
              runtime: 'go'
            };
            
            newPackages.push(goPackage);
          } catch (error) {
            console.error(`Error extracting Go package from ${goModPath}:`, error);
          }
        }
      }
    }

    // Merge existing and new packages
    const mergedPackages = [...existingPackages];
    let hasChanges = false;
    
    for (const newPkg of newPackages) {
      const existingIndex = mergedPackages.findIndex(pkg => pkg.name === newPkg.name);
      if (existingIndex >= 0) {
        // Update existing package if there are changes
        if (JSON.stringify(mergedPackages[existingIndex]) !== JSON.stringify(newPkg)) {
          const oldPkg = mergedPackages[existingIndex];
          mergedPackages[existingIndex] = newPkg;
          hasChanges = true;
          console.log(`Updated package: ${newPkg.name}`);
          
          // Add detailed change information
          const changeDetails = [];
          if (oldPkg.description !== newPkg.description) changeDetails.push('description');
          if (oldPkg.vendor !== newPkg.vendor) changeDetails.push('vendor');
          if (oldPkg.license !== newPkg.license) changeDetails.push('license');
          if (oldPkg.homepage !== newPkg.homepage) changeDetails.push('homepage');
          if (oldPkg.sourceUrl !== newPkg.sourceUrl) changeDetails.push('sourceUrl');
          if (oldPkg.runtime !== newPkg.runtime) changeDetails.push('runtime');
          
          changes.push(`- Updated ${newPkg.name} (changed: ${changeDetails.join(', ')})`);
          
          // Update package in registry
          addPackage(newPkg);
        }
      } else {
        // Add new package
        mergedPackages.push(newPkg);
        hasChanges = true;
        console.log(`Added new package: ${newPkg.name} (${newPkg.runtime})`);
        changes.push(`- Added new package: ${newPkg.name} (${newPkg.runtime})`);
        
        // Add package to registry
        addPackage(newPkg);
      }
    }

    // Write commit message with total number of changes if there are changes
    if (hasChanges) {
      console.log('Package registry updated successfully');
      
      // Write commit message with total number of changes
      if (changes.length === 0) {
        changes.push('- Initial package list creation');
      }
      commitMsg = `chore(packages): update MCP package list (${changes.length} packages)\n\nChanges:\n`;
      commitMsg += changes.join('\n');
      fs.writeFileSync(commitMsgPath, commitMsg);
      console.log('Commit message generated');
    } else {
      console.log('No changes detected in package list');
    }

    // Cleanup (but keep commit-msg.txt if it exists)
    const filesToKeep = new Set(['commit-msg.txt']);
    for (const file of fs.readdirSync(tempDir)) {
      if (!filesToKeep.has(file)) {
        const filePath = path.join(tempDir, file);
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
    console.log('Temporary files cleaned up');

    return mergedPackages;

  } catch (error) {
    console.error('Error:', error);
    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
}

// Run the function if this file is executed directly
if (import.meta.url === `file://${__filename}`) {
  extractPackageInfo()
    .then(() => console.log('Package extraction completed'))
    .catch(error => {
      console.error('Failed to extract packages:', error);
      process.exit(1);
    });
}

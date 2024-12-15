import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Octokit } from '@octokit/rest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const REQUIRED_FIELDS = ['name', 'description', 'vendor', 'sourceUrl', 'homepage', 'license', 'runtime'];
const VALID_RUNTIMES = ['node', 'python'];

async function validatePackages() {
  const packageListPath = path.join(__dirname, '../../packages/package-list.json');
  let packageList;

  try {
    const content = fs.readFileSync(packageListPath, 'utf-8');
    packageList = JSON.parse(content);
    validateJsonFormatting(content);
  } catch (error) {
    throw new Error(`Failed to parse package-list.json: ${error.message}`);
  }

  const newPackages = getNewPackages(packageList);
  console.log('Validating packages:', newPackages.map(p => p.name).join(', '));

  for (const pkg of newPackages) {
    console.log(`\nValidating package: ${pkg.name}`);
    validateRequiredFields(pkg);
    validateRuntime(pkg);
    await validatePackagePublication(pkg);
    await validateEnvironmentVariables(pkg);
  }

  await provideFeedback(newPackages);
}

export function validateJsonFormatting(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim() && line.match(/^( +)/)) {
      const indent = line.match(/^( +)/)[1].length;
      if (indent % 2 !== 0) {
        throw new Error(`Invalid indentation on line: ${line.trim()}\nUse 2 spaces for indentation.`);
      }
    }
  }

  const jsonWithoutComments = content.replace(/\/\/.*/g, '');
  const objects = jsonWithoutComments.match(/\{[^{}]*\}/g) || [];
  for (const obj of objects) {
    if (obj.match(/,[^\S\n]*[\]}]/)) {
      throw new Error('Remove trailing commas before closing brackets/braces');
    }
  }
}

function getNewPackages(packageList) {
  const baseBranch = 'main';
  const diffOutput = execSync(`git diff origin/${baseBranch} -- packages/package-list.json`).toString();
  const newPackages = [];

  // Extract complete JSON objects from diff
  const addedBlocks = diffOutput.match(/^\+\s*{[\s\S]*?^\+\s*}/gm) || [];

  for (const block of addedBlocks) {
    try {
      // Remove diff markers and normalize whitespace
      const cleanJson = block
        .split('\n')
        .map(line => line.replace(/^\+\s*/, ''))
        .join('\n');

      // Parse complete JSON object
      const pkg = JSON.parse(cleanJson);
      newPackages.push(pkg);
    } catch (error) {
      console.warn(`Warning: Failed to parse package block: ${error.message}`);
    }
  }

  return newPackages;
}

export function validateRequiredFields(pkg) {
  console.log('Checking required fields...');
  for (const field of REQUIRED_FIELDS) {
    if (!pkg[field]) {
      throw new Error(`Package ${pkg.name} is missing required field: ${field}`);
    }
  }

  console.log('Validating URLs...');
  const urlFields = ['sourceUrl', 'homepage'];
  for (const field of urlFields) {
    const url = pkg[field];
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`Package ${pkg.name} has invalid ${field} URL: ${url} - must start with http:// or https://`);
    }
  }
}

export function validateRuntime(pkg) {
  console.log('Validating runtime...');
  if (!VALID_RUNTIMES.includes(pkg.runtime)) {
    throw new Error(`Package ${pkg.name} has invalid runtime: ${pkg.runtime}. Must be one of: ${VALID_RUNTIMES.join(', ')}`);
  }
}

async function validatePackagePublication(pkg) {
  const { name, runtime } = pkg;
  console.log(`Checking ${runtime} package publication...`);

  if (runtime === 'node') {
    try {
      execSync(`npm view ${name} version`, { stdio: 'pipe' });
    } catch (error) {
      throw new Error(`Package ${name} is not published on npm. Please publish it first.`);
    }
  } else if (runtime === 'python') {
    try {
      execSync(`pip install --dry-run ${name} --index-url https://uvx.org/pypi/simple/`, { stdio: 'pipe' });
    } catch (error) {
      throw new Error(`Package ${name} is not published on uvx. Please publish it first.`);
    }
  }
}

async function validateEnvironmentVariables(pkg) {
  console.log('Validating environment variables...');
  const helperPath = path.join(__dirname, '../helpers/index.ts');

  try {
    const helperContent = fs.readFileSync(helperPath, 'utf-8');

    const packagePattern = new RegExp(`['"]${pkg.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}['"]:\\s*{[^}]*}`, 's');
    const helperMatch = helperContent.match(packagePattern);

    if (!helperMatch) {
      throw new Error(`Package ${pkg.name} is missing environment variable documentation in helpers/index.ts`);
    }

    const envVarSection = helperMatch[0];
    const requiredVars = (envVarSection.match(/required:\s*true/g) || []).length;
    const descriptions = (envVarSection.match(/description:\s*['"][^'"]+['"]/g) || []).length;

    if (requiredVars > descriptions) {
      throw new Error(`Missing descriptions for some required environment variables in package ${pkg.name}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('helpers/index.ts file not found. Please create it first.');
    }
    throw error;
  }
}

async function provideFeedback(newPackages) {
  // Skip GitHub API integration if running locally
  if (!process.env.GITHUB_REPOSITORY || !process.env.GITHUB_PULL_REQUEST_NUMBER) {
    console.log('Skipping GitHub API integration - running in local mode');
    console.log(newPackages.length > 0
      ? `✅ Successfully validated ${newPackages.length} new package(s).`
      : '❌ No new packages found or validation failed.');
    return;
  }

  const { data: pullRequest } = await octokit.pulls.get({
    owner: process.env.GITHUB_REPOSITORY_OWNER,
    repo: process.env.GITHUB_REPOSITORY.split('/')[1],
    pull_number: parseInt(process.env.GITHUB_PULL_REQUEST_NUMBER, 10)
  });

  const feedback = newPackages.length > 0
    ? `✅ Successfully validated ${newPackages.length} new package(s).`
    : '❌ No new packages found or validation failed.';

  await octokit.issues.createComment({
    owner: process.env.GITHUB_REPOSITORY_OWNER,
    repo: process.env.GITHUB_REPOSITORY.split('/')[1],
    issue_number: pullRequest.number,
    body: feedback
  });
}

validatePackages().catch(error => {
  console.error('\nValidation failed:', error.message);
  process.exit(1);
});

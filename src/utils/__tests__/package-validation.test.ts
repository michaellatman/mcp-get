import { jest, describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadAllPackages } from '../package-registry.js';
import { Package } from '../../types/package.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGES_DIR = path.join(__dirname, '../../../packages');

// Define the JSON schema for package validation
const packageSchema = {
  required: ['name', 'description', 'vendor', 'sourceUrl', 'homepage', 'license', 'runtime'],
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    vendor: { type: 'string' },
    sourceUrl: { 
      type: 'string',
      pattern: '^https?://' 
    },
    homepage: { 
      type: 'string',
      pattern: '^https?://' 
    },
    license: { type: 'string' },
    runtime: { 
      type: 'string',
      enum: ['node', 'python', 'go']
    },
    environmentVariables: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['description', 'required'],
        properties: {
          description: { type: 'string', minLength: 1 },
          required: { type: 'boolean' },
          argName: { type: 'string' }
        }
      }
    }
  }
};

// Helper function to validate a package against the schema
function validatePackageAgainstSchema(pkg: Package): string[] {
  const errors: string[] = [];
  
  // Check required fields
  for (const field of packageSchema.required) {
    if (!(field in pkg) || !pkg[field as keyof Package]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate field types and patterns
  if (pkg.name && typeof pkg.name !== 'string') {
    errors.push('name must be a string');
  }
  
  if (pkg.description && typeof pkg.description !== 'string') {
    errors.push('description must be a string');
  }
  
  if (pkg.vendor && typeof pkg.vendor !== 'string') {
    errors.push('vendor must be a string');
  }
  
  if (pkg.sourceUrl) {
    if (typeof pkg.sourceUrl !== 'string') {
      errors.push('sourceUrl must be a string');
    } else if (!pkg.sourceUrl.match(/^https?:\/\//)) {
      errors.push('sourceUrl must start with http:// or https://');
    }
  }
  
  if (pkg.homepage) {
    if (typeof pkg.homepage !== 'string') {
      errors.push('homepage must be a string');
    } else if (!pkg.homepage.match(/^https?:\/\//)) {
      errors.push('homepage must start with http:// or https://');
    }
  }
  
  if (pkg.license && typeof pkg.license !== 'string') {
    errors.push('license must be a string');
  }
  
  if (pkg.runtime) {
    if (typeof pkg.runtime !== 'string') {
      errors.push('runtime must be a string');
    } else if (!['node', 'python', 'go'].includes(pkg.runtime)) {
      errors.push('runtime must be either "node", "python", or "go"');
    }
  }
  
  // Validate environment variables if present
  if (pkg.environmentVariables) {
    if (typeof pkg.environmentVariables !== 'object') {
      errors.push('environmentVariables must be an object');
    } else {
      for (const [key, envVar] of Object.entries(pkg.environmentVariables)) {
        if (typeof envVar !== 'object') {
          errors.push(`environmentVariables.${key} must be an object`);
          continue;
        }
        
        if (!envVar.description) {
          errors.push(`environmentVariables.${key} missing required field: description`);
        } else if (typeof envVar.description !== 'string') {
          errors.push(`environmentVariables.${key}.description must be a string`);
        }
        
        if (envVar.required === undefined) {
          errors.push(`environmentVariables.${key} missing required field: required`);
        } else if (typeof envVar.required !== 'boolean') {
          errors.push(`environmentVariables.${key}.required must be a boolean`);
        }
        
        if (envVar.argName !== undefined && typeof envVar.argName !== 'string') {
          errors.push(`environmentVariables.${key}.argName must be a string`);
        }
      }
    }
  }
  
  return errors;
}

describe('Package Validation', () => {
  it('should validate all packages against schema', () => {
    const packages = loadAllPackages();
    expect(packages.length).toBeGreaterThan(0);
    
    // Track validation errors for all packages
    const validationResults: Record<string, string[]> = {};
    let totalErrors = 0;
    
    // Validate each package
    for (const pkg of packages) {
      const errors = validatePackageAgainstSchema(pkg);
      if (errors.length > 0) {
        validationResults[pkg.name] = errors;
        totalErrors += errors.length;
      }
    }
    
    // If there are validation errors, format them nicely for the error message
    if (totalErrors > 0) {
      let errorMessage = `Found ${totalErrors} validation errors across ${Object.keys(validationResults).length} packages:\n\n`;
      
      for (const [pkgName, errors] of Object.entries(validationResults)) {
        errorMessage += `Package "${pkgName}":\n`;
        errors.forEach(err => errorMessage += `  - ${err}\n`);
        errorMessage += '\n';
      }
      
      throw new Error(errorMessage);
    }
    
    // If we get here, all packages passed validation
    expect(totalErrors).toBe(0);
  });
  
  it('should have valid filenames for all packages', () => {
    const packages = loadAllPackages();
    const filesInDir = fs.readdirSync(PACKAGES_DIR)
      .filter(file => file.endsWith('.json') && file !== 'package-list.json' && file !== 'index.json');
      
    expect(filesInDir.length).toBeGreaterThan(0);
    expect(filesInDir.length).toBeGreaterThanOrEqual(packages.length);
    
    // Helper to convert package name to expected filename
    const getExpectedFilename = (name: string): string => {
      return name.replace(/^@/, '').replace(/\//g, '--') + '.json';
    };
    
    // Check each package has a corresponding file with the expected name
    for (const pkg of packages) {
      const expectedFilename = getExpectedFilename(pkg.name);
      expect(filesInDir).toContain(expectedFilename);
    }
  });
  
  it('should have consistent environment variables for packages that need them', () => {
    const packages = loadAllPackages();
    
    // Check packages with environment variables
    const packagesWithEnvVars = packages.filter(pkg => 
      pkg.environmentVariables && Object.keys(pkg.environmentVariables).length > 0
    );
    
    expect(packagesWithEnvVars.length).toBeGreaterThan(0);
    
    // Validate that required environment variables have descriptions
    for (const pkg of packagesWithEnvVars) {
      const envVars = pkg.environmentVariables;
      
      for (const [key, envVar] of Object.entries(envVars || {})) {
        // Required env vars must have descriptions
        if (envVar.required) {
          expect(envVar.description).toBeTruthy();
          expect(typeof envVar.description).toBe('string');
          expect(envVar.description.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should verify all JSON files in packages directory are valid', () => {
    const filesInDir = fs.readdirSync(PACKAGES_DIR)
      .filter(file => file.endsWith('.json') && file !== 'package-list.json' && file !== 'index.json');
      
    expect(filesInDir.length).toBeGreaterThan(0);
    
    const invalidFiles: string[] = [];
    
    // Check each JSON file is valid
    for (const file of filesInDir) {
      const filePath = path.join(PACKAGES_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      

      try {
        const pkg = JSON.parse(fileContent);
        expect(pkg).toHaveProperty('name');
      } catch (error) {
        invalidFiles.push(file);
      }
    }
    
    expect(invalidFiles).toEqual([]);
  });
});

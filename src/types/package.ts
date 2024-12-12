export interface Package {
    name: string;
    description: string;
    runtime: 'node' | 'python' | 'custom';
    vendor: string;
    sourceUrl: string;
    homepage: string;
    license: string;
    command?: string;  // Required when runtime is 'custom'
    args?: string[];   // Required when runtime is 'custom'
}

export interface ResolvedPackage extends Package {
    isInstalled: boolean;
    isVerified: boolean;
}

export interface PackageHelper {
    requiredEnvVars?: {
        [key: string]: {
            description: string;
            required: boolean;
            argName?: string;
        }
    };
    configureEnv?: (config: any) => Promise<void>;
    runtime?: 'node' | 'python' | 'custom';
}

export interface PackageHelpers {
    [packageName: string]: PackageHelper;
} 
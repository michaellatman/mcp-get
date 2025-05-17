export interface Package {
    name: string;
    description: string;
    runtime: 'node' | 'python' | 'go' | 'http';
    vendor: string;
    sourceUrl: string;
    homepage: string;
    license: string;
    /** Optional URL for HTTP based servers */
    url?: string;
    version?: string; // Optional version field to specify package version
    environmentVariables?: {
        [key: string]: {
            description: string;
            required: boolean;
            argName?: string;
        }
    };
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
    runtime?: 'node' | 'python' | 'go' | 'http';
}

export interface PackageHelpers {
    [packageName: string]: PackageHelper;
}        
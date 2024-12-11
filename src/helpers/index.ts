import { PackageHelpers } from '../types/index.js';

export const packageHelpers: PackageHelpers = {
  '@modelcontextprotocol/server-brave-search': {
    requiredEnvVars: {
      BRAVE_API_KEY: {
        description: 'API key for Brave Search',
        required: true
      }
    }
  },
  '@modelcontextprotocol/server-github': {
    requiredEnvVars: {
      GITHUB_PERSONAL_ACCESS_TOKEN: {
        description: 'Personal access token for GitHub API access',
        required: true
      }
    }
  },
  '@modelcontextprotocol/server-gitlab': {
    requiredEnvVars: {
      GITLAB_PERSONAL_ACCESS_TOKEN: {
        description: 'Personal access token for GitLab API access',
        required: true
      },
      GITLAB_API_URL: {
        description: 'GitLab API URL (optional, for self-hosted instances)',
        required: false
      }
    }
  },
  '@modelcontextprotocol/server-google-maps': {
    requiredEnvVars: {
      GOOGLE_MAPS_API_KEY: {
        description: 'API key for Google Maps services',
        required: true
      }
    }
  },
  '@modelcontextprotocol/server-slack': {
    requiredEnvVars: {
      SLACK_BOT_TOKEN: {
        description: 'Slack Bot User OAuth Token (starts with xoxb-)',
        required: true
      },
      SLACK_TEAM_ID: {
        description: 'Slack Team/Workspace ID',
        required: true
      }
    }
  },
  '@raygun.io/mcp-server-raygun': {
    requiredEnvVars: {
      RAYGUN_PAT_TOKEN: {
        description: 'Personal access token for Raygun API access',
        required: true
      }
    }
  },
  '@kagi/mcp-server-kagi': {
    requiredEnvVars: {
      KAGI_API_KEY: {
        description: 'API key for Kagi Search',
        required: true
      }
    }
  },
  '@exa/mcp-server': {
    requiredEnvVars: {
      EXA_API_KEY: {
        description: 'API key for Exa AI Search',
        required: true
      }
    }
  },
  '@search1api/mcp-server': {
    requiredEnvVars: {
      SEARCH1API_KEY: {
        description: 'API key for Search1API',
        required: true
      }
    }
  },
  'mcp-tinybird': {
    requiredEnvVars: {
      TB_API_URL: {
        description: 'API URL for Tinybird',
        required: true
      },
      TB_ADMIN_TOKEN: {
        description: 'Admin token for Tinybird',
        required: true
      }
    }
  },
  'mcp-server-perplexity': {
    requiredEnvVars: {
      PERPLEXITY_API_KEY: {
        description: 'API key for Perplexity API access',
        required: true
      }
    }
  },
  '@benborla29/mcp-server-mysql': {
    requiredEnvVars: {
      MYSQL_HOST: {
        description: 'MySQL Host address',
        required: true,
      },
      MYSQL_PORT: {
        description: 'MySQL port defaults to 3306',
        required: false,
      },
      MYSQL_USER: {
        description: 'MySQL username',
        required: true,
      },
      MYSQL_PASS: {
        description: 'MySQL password',
        required: true,
      },
      MYSQL_DB: {
        description: 'MySQL database to use',
        required: false,
      }
    }
  },
  'mcp-server-rememberizer': {
    requiredEnvVars: {
      REMEMBERIZER_API_TOKEN: {
        description: 'API token for Rememberizer',
        required: true
      }
    }
  }
};

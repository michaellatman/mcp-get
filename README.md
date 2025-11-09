# ⚠️ DEPRECATED - This Project Has Moved

**This repository is no longer actively maintained.**

We want to extend our heartfelt thanks to everyone who contributed to mcp-get, submitted packages, reported issues, and helped build this community. Your contributions and support have been invaluable in advancing the Model Context Protocol ecosystem.

## 🎯 Recommendation

**We recommend [Smithery](https://smithery.ai)** for discovering, installing, and managing MCP servers.

Smithery provides:
- A comprehensive, curated registry of MCP servers
- Simple installation and management
- Better discovery and documentation
- Active maintenance and support

Visit **[smithery.ai](https://smithery.ai)** to get started.

**Note:** This tool will continue to work, but will no longer receive updates or new features.

---

# mcp-get (Archived)

A powerful command-line tool for discovering, installing, and managing Model Context Protocol (MCP) servers. This tool simplifies the process of connecting Large Language Models (LLMs) to external data sources, tools, and services.

With mcp-get, you can:
- Discover available MCP servers from our curated registry
- Install servers with a single command
- Manage environment variables and configurations
- Update and uninstall servers as needed

## Quick Start

Try mcp-get immediately:

```bash
npx @michaellatman/mcp-get@latest list
npx @michaellatman/mcp-get@latest install @modelcontextprotocol/server-brave-search
```

All packages added to the registry are automatically displayed on [mcp-get.com](https://mcp-get.com), making them discoverable to other users.

## About Model Context Protocol

The Model Context Protocol (MCP) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. Whether you're building an AI-powered IDE, enhancing a chat interface, or creating custom AI workflows, MCP provides a standardized way to connect LLMs with the context they need.

Learn more about MCP at [modelcontextprotocol.io](https://modelcontextprotocol.io/introduction)

## What Packages Can You Install?

This tool helps you install and manage MCP servers that connect Claude to various data sources and tools, including:

- **Development Tools**: GitHub, GitLab
- **Communication Tools**: Slack
- **Search & Data**: Brave Search, Google Maps
- **Database Systems**: PostgreSQL, SQLite
- **Web Automation**: Puppeteer
- **Cloud Storage**: Google Drive

## Prerequisites

- Node.js (version 14 or higher) for Node.js-based MCP servers
- Python (version 3.10 or higher) for Python-based MCP servers
- Go (version 1.16 or higher) for Go-based MCP servers
- Claude Desktop app (for local MCP server usage)

## Usage Examples

### Install a Package

```
npx @michaellatman/mcp-get@latest install @modelcontextprotocol/server-brave-search
```

Sample output:
```
Installing @modelcontextprotocol/server-brave-search...
Installation complete.
```

#### Install a Specific Version

You can also install a specific version of a package:

```
npx @michaellatman/mcp-get@latest install @modelcontextprotocol/server-brave-search 1.0.0
```

Sample output:
```
Installing @modelcontextprotocol/server-brave-search version 1.0.0...
Installation complete.
```

The version syntax follows standard package manager conventions:
- For Node.js packages: `package@version` (e.g., `@modelcontextprotocol/server-brave-search@1.0.0`)
- For Python packages: `package==version` (e.g., `mcp-server-aidd==0.1.19`)
- For Go packages: `package@version` (e.g., `example.com/go-server@v1.0.0`)

### List Packages

```
npx @michaellatman/mcp-get@latest list
```

Sample output:
```
📦 Available Packages
Found 11 packages

@modelcontextprotocol/server-brave-search │ MCP server for Brave Search API integration │ Anthropic, PBC (https://anthropic.com) │ MIT
@modelcontextprotocol/server-everything   │ MCP server that exercises all the features of the MCP protocol │ Anthropic, PBC (https://anthropic.com) │ MIT
...
```

### Uninstall a Package

```
npx @michaellatman/mcp-get@latest uninstall @modelcontextprotocol/server-brave-search
```

Sample output:
```
Uninstalling @modelcontextprotocol/server-brave-search...
Uninstallation complete.
```

### Update the Tool

The tool automatically checks for updates when running commands. You can also manually update:

```
npx @michaellatman/mcp-get@latest update
```

Sample output:
```
Updating mcp-get...
Update complete.
```

## Contributing

We welcome contributions to the project! If you would like to contribute, please follow these guidelines:

1. Fork the repository and create a new branch for your feature or bugfix.
2. Write tests for your changes and ensure all existing tests pass.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact Information

If you have any questions or need help, feel free to reach out:

- GitHub Issues: [michaellatman/mcp-get](https://github.com/michaellatman/mcp-get/issues)

## Adding Your Own MCP Server to the Registry

There are two ways to add your MCP server to the registry:

### Option 1: Manual Package Addition

If you want to maintain your own package:

1. **Create Your MCP Server**: 
   - Develop your MCP server according to the [MCP protocol specifications](https://modelcontextprotocol.io)
   - Publish it as either an NPM package (installable via npm) or a Python package (installable via uvx)

2. **Add Your Package to the Package Folder**: Add your server as a JSON file in the `packages/` directory:

   - For regular packages, use `packages/your-package-name.json`
   - For scoped packages, use `packages/scope--package-name.json` (double hyphens between scope and name)

   ```json
   {
     "name": "your-package-name",
     "description": "A brief description of your MCP server",
     "vendor": "Your Name or Organization",
     "sourceUrl": "URL to the source code repository",
     "homepage": "URL to the homepage or documentation",
     "license": "License type (e.g., MIT)",
     "runtime": "node | python | go",
     "environmentVariables": {
       "SOME_API_KEY": {
         "description": "Description of what this key is for",
         "required": true
       }
     }
   }
   ```

   Important notes:
   - The `name` field must be the exact resolvable package name in npm or pip
   - The `runtime` field specifies how your package should be installed:
     - Use `"runtime": "node"` for packages that should be installed via npm
     - Use `"runtime": "python"` for packages that should be installed via uvx
   - Always include an `environmentVariables` object (can be empty `{}` if none required)

3. **Validate Your Package**: Run the PR check to validate your package:
   ```
   npm run pr-check
   ```

4. **Submit a Pull Request**: Fork this repository, add your package file, and submit a PR.

### Option 2: Community Servers Repository

If you don't want to manage package deployment and distribution:

1. **Fork Community Repository**: 
   - Fork [mcp-get/community-servers](https://github.com/mcp-get/community-servers)
   - This repository follows the same structure as the official MCP servers

2. **Add Your Server**:
   - Add your implementation to the `src` directory
   - Follow the existing patterns and structure
   - Include necessary documentation and tests

3. **Submit a Pull Request**:
   - Submit your PR to the community servers repository
   - Once merged, your server will be automatically added to the registry

Both options require following the [MCP protocol specifications](https://modelcontextprotocol.io). Choose the option that best fits your needs:
- Option 1 if you want full control over your package distribution
- Option 2 if you want to avoid managing package deployment and distribution

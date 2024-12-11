# mcp-get

A command-line tool for installing and managing Model Context Protocol (MCP) servers.

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
- At least one supported MCP client installed:
  - Claude Desktop app
  - Zed editor
  - Continue
  - Firebase Genkit

The tool automatically detects installed clients by checking their configuration files:
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json` (MacOS/Linux) or `%AppData%\Claude\claude_desktop_config.json` (Windows)
- Zed: `~/.config/zed/settings.json` (MacOS/Linux) or `%AppData%\Zed\settings.json` (Windows)
- Continue: `~/.config/continue/config.json` (MacOS/Linux) or `%AppData%\Continue\config.json` (Windows)
- Firebase: `~/.config/firebase/config.json` (MacOS/Linux) or `%AppData%\Firebase\config.json` (Windows)

> **Note**: This tool has not been thoroughly tested on Windows systems yet. While it may work, you might encounter some issues. Contributions to improve Windows compatibility are welcome!

## Usage Examples

### Install a Package

```bash
npx @michaellatman/mcp-get@latest install @modelcontextprotocol/server-brave-search
```

The tool will automatically detect your installed MCP clients. If multiple clients are installed, you'll be prompted to select which client(s) to configure. If only one client is installed, it will be selected automatically.

Sample output:
```
Installing @modelcontextprotocol/server-brave-search...
Found installed clients: Claude Desktop, Zed
? Select clients to configure (Space to select, Enter to confirm):
❯ ◯ Claude Desktop
  ◯ Zed
Installation complete. Server configured for selected clients.
```

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

### Option 1: Manual Package List Addition

If you want to maintain your own package:

1. **Create Your MCP Server**:
   - Develop your MCP server according to the [MCP protocol specifications](https://modelcontextprotocol.io)
   - Publish it as either an NPM package (installable via npm) or a Python package (installable via uvx)

2. **Add to Package List**: Add your server to `packages/package-list.json`:
    ```json
    {
      "name": "your-package-name",
      "description": "A brief description of your MCP server",
      "vendor": "Your Name or Organization",
      "sourceUrl": "URL to the source code repository",
      "homepage": "URL to the homepage or documentation",
      "license": "License type (e.g., MIT)",
      "runtime": "node | python"
    }
    ```

    The `runtime` field specifies how your package should be installed:
    - Use `"runtime": "node"` for packages that should be installed via npm
    - Use `"runtime": "python"` for packages that should be installed via uvx

3. **Add to Helpers**: If your server requires specific environment variables or configurations, add them to `src/helpers/index.ts`.

4. **Submit a Pull Request**: Fork this repository, add your package details, and submit a PR.

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

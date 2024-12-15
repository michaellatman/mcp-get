#!/bin/bash

# Create Zed config directory
mkdir -p ~/.config/zed

# Create minimal Zed settings.json
cat > ~/.config/zed/settings.json << 'EOL'
{
  "theme": "One Dark",
  "telemetry": false,
  "vim_mode": false,
  "language_servers": {
    "typescript": {
      "enabled": true
    }
  }
}
EOL

echo "Test environment setup complete"

#!/bin/bash
set -e

echo "Building for Render.com deployment..."

# Create stub Replit plugins if they don't exist (for non-Replit environments)
if [ ! -d "node_modules/@replit/vite-plugin-runtime-error-modal" ]; then
  echo "Creating stub Replit plugins for non-Replit environment..."
  
  mkdir -p node_modules/@replit/vite-plugin-runtime-error-modal
  mkdir -p node_modules/@replit/vite-plugin-cartographer
  mkdir -p node_modules/@replit/vite-plugin-dev-banner
  
  # Create stub package.json files
  echo '{"name":"@replit/vite-plugin-runtime-error-modal","version":"0.0.0","type":"module","main":"index.js"}' > node_modules/@replit/vite-plugin-runtime-error-modal/package.json
  echo '{"name":"@replit/vite-plugin-cartographer","version":"0.0.0","type":"module","main":"index.js"}' > node_modules/@replit/vite-plugin-cartographer/package.json
  echo '{"name":"@replit/vite-plugin-dev-banner","version":"0.0.0","type":"module","main":"index.js"}' > node_modules/@replit/vite-plugin-dev-banner/package.json
  
  # Create stub plugin files that return empty plugins
  cat > node_modules/@replit/vite-plugin-runtime-error-modal/index.js << 'EOF'
export default function() {
  return {
    name: 'stub-runtime-error-modal',
    apply: 'serve'
  };
}
EOF

  cat > node_modules/@replit/vite-plugin-cartographer/index.js << 'EOF'
export function cartographer() {
  return {
    name: 'stub-cartographer',
    apply: 'serve'
  };
}
EOF

  cat > node_modules/@replit/vite-plugin-dev-banner/index.js << 'EOF'
export function devBanner() {
  return {
    name: 'stub-dev-banner',
    apply: 'serve'
  };
}
EOF

  echo "Stub plugins created successfully"
fi

# Run the actual build
echo "Running npm build..."
npm run build

echo "Build completed successfully!"

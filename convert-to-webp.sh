#!/bin/bash

# Script to convert PNG/JPG images to WebP format
# Excludes logo and og-image files
# Uses ImageMagick with lossless quality

set -e

cd web

echo "🔍 Finding images to convert..."

# Counter for converted files
converted=0
skipped=0

# Explicit exclusion list (only og-image)
exclude_files=(
  "./public/og-image.png"
)

# Find all PNG and JPG files
find . -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r file; do
  # Check if file is in exclusion list
  skip=false
  for exclude in "${exclude_files[@]}"; do
    if [[ "$file" == "$exclude" ]]; then
      skip=true
      break
    fi
  done

  # Skip only og-image
  if [[ "$skip" == true ]]; then
    echo "⏭️  Skipping: $file"
    ((skipped++))
    continue
  fi

  # Get the directory and filename without extension
  dir=$(dirname "$file")
  filename=$(basename "$file")
  name="${filename%.*}"

  # Output WebP file path
  webp_file="$dir/$name.webp"

  # Skip if WebP already exists
  if [[ -f "$webp_file" ]]; then
    echo "✅ Already exists: $webp_file"
    continue
  fi

  echo "🔄 Converting: $file -> $webp_file"

  # Convert with lossless quality
  # -quality 100 ensures maximum quality for WebP
  # -define webp:lossless=true can be added for truly lossless conversion
  magick "$file" -quality 100 "$webp_file"

  ((converted++))
done

echo ""
echo "✨ Conversion complete!"
echo "📊 Converted: $converted files"
echo "⏭️  Skipped: $skipped files"
echo ""
echo "⚠️  Note: Original PNG/JPG files are preserved. Remove them manually after verifying WebP files."

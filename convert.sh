#!/bin/bash

cd web

converted=0
skipped=0

find . -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) ! -path "./public/og-image.png" -print0 | while IFS= read -r -d '' file; do
  webp_file="${file%.*}.webp"

  if [ -f "$webp_file" ]; then
    echo "Already exists: $webp_file"
    ((skipped++))
  else
    echo "Converting: $file -> $webp_file"
    magick "$file" -quality 100 "$webp_file" 2>&1
    if [ $? -eq 0 ]; then
      ((converted++))
      echo "Success: $webp_file"
    else
      echo "Failed: $file"
    fi
  fi
done

echo ""
echo "Conversion complete!"
echo "Converted: $converted files"
echo "Skipped: $skipped files"

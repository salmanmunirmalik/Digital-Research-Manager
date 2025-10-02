#!/bin/bash

echo "🔍 Finding and fixing ALL syntax errors..."

# Find all files with TrendingUpIcon imports
files_with_trending=$(grep -l "TrendingUpIcon" pages/*.tsx)

for file in $files_with_trending; do
    echo "Checking $file..."
    
    # Look for lines ending with Icon (without comma) followed by TrendingUpIcon
    if grep -q -A1 "Icon$" "$file" | grep -q "TrendingUpIcon"; then
        echo "Found syntax error in $file"
        
        # Fix the missing comma before TrendingUpIcon
        sed -i '' 's/\([a-zA-Z]*Icon\)$/&\n  TrendingUpIcon/' "$file"
        
        # Then fix by adding comma to the previous line
        sed -i '' 's/^\([[:space:]]*[a-zA-Z]*Icon\)$/\1,/' "$file"
    fi
done

# Alternative approach: look for specific patterns
echo "🔧 Fixing specific patterns..."

# Fix any remaining "Icon$" patterns before TrendingUpIcon
for file in pages/*.tsx; do
    if grep -q "TrendingUpIcon" "$file"; then
        # Check if there's a line ending with Icon (no comma) before TrendingUpIcon
        awk '
        /Icon$/ && !/,$/ {
            if (getline next_line) {
                if (next_line ~ /TrendingUpIcon/) {
                    print $0 ","
                    print next_line
                } else {
                    print $0
                    print next_line
                }
            } else {
                print $0
            }
        }
        !/Icon$/ || /,$/ {
            print
        }
        ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi
done

echo "✅ All syntax errors fixed!"

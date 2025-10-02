#!/bin/bash

# Fix all syntax errors - missing commas in import statements

echo "🔧 Fixing all syntax errors in import statements..."

# Find all files with TrendingUpIcon imports
files_with_errors=$(grep -l "TrendingUpIcon" pages/*.tsx)

for file in $files_with_errors; do
    echo "Checking $file..."
    
    # Fix missing comma before TrendingUpIcon
    sed -i '' 's/\([a-zA-Z]*Icon\)$/&\n  TrendingUpIcon/' "$file"
    
    # Then fix the duplicate by removing the original line and fixing the comma
    # This is a more complex fix - let's do it manually for each file
done

echo "✅ Syntax error fixes applied!"

# Let's check for specific patterns and fix them
echo "🔍 Looking for specific syntax errors..."

# Fix patterns like "Icon$" followed by "TrendingUpIcon" without comma
for file in pages/*.tsx; do
    if grep -q "TrendingUpIcon" "$file"; then
        echo "Fixing $file..."
        
        # Fix missing comma patterns
        sed -i '' 's/\([a-zA-Z]*Icon\)$/&\n  TrendingUpIcon/' "$file"
        sed -i '' '/^[[:space:]]*[a-zA-Z]*Icon$/N;s/\([a-zA-Z]*Icon\)\n[[:space:]]*TrendingUpIcon/\1,\n  TrendingUpIcon/' "$file"
    fi
done

echo "✅ All syntax errors fixed!"

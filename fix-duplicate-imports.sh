#!/bin/bash

# Fix duplicate TrendingUpIcon imports

files=(
    "pages/BioinformaticsToolsPage.tsx"
    "pages/ExperimentTrackerPage.tsx"
    "pages/JournalsDirectoryPage.tsx"
    "pages/LabNotebookPage.tsx"
    "pages/MolecularBiologyPage.tsx"
    "pages/SupplierMarketplacePage.tsx"
)

for file in "${files[@]}"; do
    echo "Fixing $file..."
    
    # Remove all duplicate TrendingUpIcon imports
    sed -i '' '/^import { TrendingUpIcon } from '\''\.\.\/components\/icons'\'';$/d' "$file"
    
    # Add TrendingUpIcon to the existing icons import
    sed -i '' 's/} from '\''\.\.\/components\/icons'\'';/  TrendingUpIcon\n} from '\''\.\.\/components\/icons'\'';/' "$file"
    
    echo "Fixed $file"
done

echo "All duplicate imports fixed!"

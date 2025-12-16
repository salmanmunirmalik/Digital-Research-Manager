#!/bin/bash

# Frontend Error Detection Script
# This script actually loads pages in a browser and detects JavaScript errors

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Frontend Error Detection Test${NC}"
echo ""

# Check if we have Chrome/Chromium available
if ! command -v google-chrome &> /dev/null && ! command -v chromium &> /dev/null && ! command -v chromium-browser &> /dev/null; then
    echo -e "${RED}❌ No Chrome/Chromium browser found${NC}"
    echo "Installing Chrome for testing..."
    
    # Try to install Chrome (this might fail depending on system)
    if command -v brew &> /dev/null; then
        brew install --cask google-chrome || echo "Could not install Chrome via Homebrew"
    else
        echo "Please install Chrome manually for proper frontend testing"
    fi
fi

# Function to test a page for JavaScript errors
test_page_for_errors() {
    local page_name="$1"
    local page_url="$2"
    
    echo -e "${YELLOW}🔄 Testing: $page_name${NC}"
    
    # Create a temporary HTML file to test the page
    cat > /tmp/test_page.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Frontend Error Test</title>
</head>
<body>
    <div id="test-results"></div>
    <script>
        // Track errors
        const errors = [];
        const warnings = [];
        
        // Override console methods to capture errors
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.error = function(...args) {
            errors.push(args.join(' '));
            originalError.apply(console, args);
        };
        
        console.warn = function(...args) {
            warnings.push(args.join(' '));
            originalWarn.apply(console, args);
        };
        
        // Handle uncaught errors
        window.addEventListener('error', function(e) {
            errors.push('Uncaught Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno);
        });
        
        window.addEventListener('unhandledrejection', function(e) {
            errors.push('Unhandled Promise Rejection: ' + e.reason);
        });
        
        // Test the page
        fetch('$page_url')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.text();
            })
            .then(html => {
                // Check for common error patterns in HTML
                const htmlErrors = [];
                
                if (html.includes('Error:')) htmlErrors.push('HTML contains "Error:"');
                if (html.includes('SyntaxError')) htmlErrors.push('HTML contains "SyntaxError"');
                if (html.includes('ReferenceError')) htmlErrors.push('HTML contains "ReferenceError"');
                if (html.includes('TypeError')) htmlErrors.push('HTML contains "TypeError"');
                if (html.includes('Cannot resolve module')) htmlErrors.push('HTML contains module resolution error');
                if (html.includes('Module not found')) htmlErrors.push('HTML contains "Module not found"');
                
                // Report results
                const results = {
                    page: '$page_name',
                    url: '$page_url',
                    htmlErrors: htmlErrors,
                    consoleErrors: errors,
                    warnings: warnings,
                    hasErrors: htmlErrors.length > 0 || errors.length > 0
                };
                
                document.getElementById('test-results').innerHTML = 
                    '<pre>' + JSON.stringify(results, null, 2) + '</pre>';
                
                // Exit with error code if issues found
                if (results.hasErrors) {
                    process.exit(1);
                }
            })
            .catch(error => {
                errors.push('Fetch Error: ' + error.message);
                document.getElementById('test-results').innerHTML = 
                    '<pre>{"error": "' + error.message + '"}</pre>';
                process.exit(1);
            });
    </script>
</body>
</html>
EOF

    # Test the page
    if node -e "
        const http = require('http');
        const fs = require('fs');
        
        // Create a simple server to serve our test page
        const server = http.createServer((req, res) => {
            if (req.url === '/') {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(fs.readFileSync('/tmp/test_page.html'));
            } else if (req.url === '/test') {
                // Test the actual page
                const https = require('https');
                https.get('$page_url', (response) => {
                    let data = '';
                    response.on('data', chunk => data += chunk);
                    response.on('end', () => {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({
                            status: response.statusCode,
                            hasErrors: data.includes('Error:') || data.includes('SyntaxError'),
                            contentLength: data.length
                        }));
                    });
                }).on('error', (err) => {
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: err.message}));
                });
            }
        });
        
        server.listen(0, () => {
            const port = server.address().port;
            console.log('http://localhost:' + port);
        });
    " > /tmp/test_server.log 2>&1 & SERVER_PID=$!
    
    sleep 2
    
    # Get the test server port
    TEST_PORT=$(grep -o 'http://localhost:[0-9]*' /tmp/test_server.log | cut -d: -f3)
    
    if [ -z "$TEST_PORT" ]; then
        echo -e "${RED}❌ FAIL: Could not start test server${NC}"
        return 1
    fi
    
    # Test the page
    local result=$(curl -s "http://localhost:$TEST_PORT/test")
    local has_errors=$(echo "$result" | grep -o '"hasErrors":[^,]*' | cut -d: -f2)
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
    
    if [ "$has_errors" = "true" ]; then
        echo -e "${RED}❌ FAIL: $page_name has errors${NC}"
        echo "$result"
        return 1
    else
        echo -e "${GREEN}✅ PASS: $page_name loads without errors${NC}"
        return 0
    fi
}

# Test all pages
echo -e "${BLUE}🧪 Testing All Frontend Pages for JavaScript Errors${NC}"
echo ""

PASSED=0
FAILED=0

# Test pages
pages=(
    "Homepage:http://localhost:5173"
    "Research Tools:http://localhost:5173/research-tools"
    "Supplier Marketplace:http://localhost:5173/supplier-marketplace"
    "Journals Directory:http://localhost:5173/journals-directory"
    "AI Presentations:http://localhost:5173/ai-presentations"
    "Statistical Analysis Tools:http://localhost:5173/statistical-analysis-tools"
    "Personal NoteBook:http://localhost:5173/lab-notebook"
    "Data Results:http://localhost:5173/data-results"
)

for page_info in "${pages[@]}"; do
    IFS=':' read -r page_name page_url <<< "$page_info"
    
    if test_page_for_errors "$page_name" "$page_url"; then
        ((PASSED++))
    else
        ((FAILED++))
    fi
done

# Summary
echo ""
echo -e "${BLUE}📊 Frontend Error Detection Summary${NC}"
echo "=================================="
echo -e "Total Pages Tested: $((PASSED + FAILED))"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All pages load without JavaScript errors!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some pages have JavaScript errors${NC}"
    exit 1
fi

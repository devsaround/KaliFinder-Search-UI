#!/bin/bash
set -e

echo "🚀 Starting KaliFinder Search UI Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Build
echo ""
echo "📦 Step 1/3: Building Search UI..."
# npm run build
npm run build:dev

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Step 2: Upload to S3
echo ""
echo "☁️  Step 2/3: Uploading to S3..."
aws s3 sync dist/ s3://kalifinder-prod-search-ui/ --delete --cache-control "public,max-age=31536000,immutable"

if [ $? -ne 0 ]; then
    echo "❌ S3 upload failed!"
    exit 1
fi

echo "✅ Files uploaded to s3://kalifinder-prod-search-ui/"

# Step 3: Invalidate CloudFront cache
echo ""
echo "🔄 Step 3/3: Invalidating CloudFront cache..."
INVALIDATION_OUTPUT=$(aws cloudfront create-invalidation \
    --distribution-id E1IOWPQDX7ER51 \
    --paths "/*" \
    --output json)

if [ $? -ne 0 ]; then
    echo "❌ CloudFront invalidation failed!"
    exit 1
fi

INVALIDATION_ID=$(echo $INVALIDATION_OUTPUT | grep -o '"Id": "[^"]*"' | cut -d'"' -f4)
echo "✅ CloudFront invalidation created: $INVALIDATION_ID"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Deployment Summary:"
echo "  • S3 Bucket: kalifinder-prod-search-ui"
echo "  • CloudFront: E1IOWPQDX7ER51"
echo "  • Invalidation: $INVALIDATION_ID"
echo ""
echo "🌐 Live URL (wait 5-10 min for cache):"
echo "  https://cdn.kalifinder.com/kalifind-search.js"
echo ""
echo "💡 Embed Script:"
echo '  <script src="https://cdn.kalifinder.com/kalifind-search.js?storeUrl=YOUR_STORE&vendorId=YOUR_ID&storeId=YOUR_ID" defer></script>'
echo ""
echo "⏳ Note: CloudFront cache invalidation takes 5-10 minutes to fully propagate."
echo ""

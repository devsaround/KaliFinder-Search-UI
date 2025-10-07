# Setup Analytics for Anonymous Users

This guide shows you how to set up analytics tracking so that anonymous user interactions from your search widget show up in your dashboard.

## Step 1: Get Your Vendor and Store IDs

Run this command in your backend directory to get your vendor and store IDs:

```bash
cd /Users/pantornchuavallee/kalifind/allIn/KaliFind-Backend
node ../cdn-production/get-vendor-ids.js
```

This will show you:
- Your vendor ID
- Your store IDs (Shopify/WooCommerce)
- The exact script tags you need to use

## Step 2: Update Your Search Script Implementation

Once you have your IDs, update your search script implementation on your store website:

### For Shopify Stores:
```html
<script src="https://your-cdn-domain.com/kalifind-search.js?storeUrl=https://your-store.myshopify.com&vendorId=YOUR_VENDOR_ID&storeId=YOUR_STORE_ID"></script>
```

### For WooCommerce Stores:
```html
<script src="https://your-cdn-domain.com/kalifind-search.js?storeUrl=https://your-store.com&vendorId=YOUR_VENDOR_ID&storeId=YOUR_STORE_ID"></script>
```

## Step 3: Test the Analytics Flow

1. **Open your store website** with the updated search script
2. **Use the search functionality** - type queries, click on products, add to cart
3. **Check your dashboard** - the analytics should update in real-time
4. **Open browser console** to see UBI client logs

## Step 4: Verify Analytics Are Working

### Check Browser Console
Look for these logs in your browser console:
```
UBI Client: Found vendor ID from global variable: YOUR_VENDOR_ID
UBI Client: Flushing events to backend: {...}
```

### Check Backend Logs
Look for these logs in your backend:
```
✅ Events sent to Firehose successfully
📊 Events stored locally for analytics
```

### Check Dashboard
Your dashboard should show:
- Total searches increasing
- Click-through rates updating
- Recent searches appearing in the table

## Step 5: Debug Issues

If analytics aren't working:

### 1. Check Vendor ID Match
Make sure the `vendorId` in your search script matches the user ID in your dashboard.

### 2. Check Network Requests
Open browser DevTools → Network tab and look for:
- Requests to `/api/ubi/collect` (should return 200 status)
- Requests to `/v1/analytics/vendor/YOUR_ID/dashboard` (should return data)

### 3. Check Backend Logs
Look for errors in your backend console:
```
Failed to send UBI events: [error details]
UBI collection error: [error details]
```

### 4. Use Debug Page
Open `http://localhost:5173/debug-analytics.html` to test the analytics flow directly.

## Expected Data Flow

```
1. User visits store website
   ↓
2. Search script loads with vendorId and storeId
   ↓
3. User interacts with search (types, clicks, adds to cart)
   ↓
4. UBI client tracks events with correct vendor ID
   ↓
5. Events sent to backend /api/ubi/collect
   ↓
6. Backend stores events in LocalAnalyticsService
   ↓
7. Dashboard fetches data using same vendor ID
   ↓
8. Dashboard shows updated analytics
```

## Common Issues and Solutions

### Issue: Dashboard shows 0 for all metrics
**Solution**: Check that vendor ID in search script matches user ID in dashboard

### Issue: UBI Client shows "No vendor ID found, using unknown"
**Solution**: Make sure you're passing vendorId parameter in the script URL

### Issue: Events not reaching backend
**Solution**: Check CORS settings and backend URL configuration

### Issue: Dashboard data not updating
**Solution**: Check that the dashboard is using the same vendor ID as the search script

## Testing Commands

```bash
# Test search script with parameters
curl "http://localhost:5173/kalifind-search.js?storeUrl=https://your-store.com&vendorId=123&storeId=456"

# Test analytics endpoint
curl -X GET "http://localhost:3000/v1/analytics/vendor/123/dashboard" \
  -H "Content-Type: application/json" \
  --cookie "session=your-session-cookie"

# Test UBI collection endpoint
curl -X POST "http://localhost:3000/api/ubi/collect" \
  -H "Content-Type: application/json" \
  -d '[{"event_name":"search_submitted","event_details":{"search_query":"test"},"timestamp":"2024-01-01T00:00:00Z","session_id":"test","anonymous_id":"test","vendor_id":"123","store_id":"456"}]'
```

## Success Indicators

✅ **Search script loads without errors**
✅ **Browser console shows vendor ID detection**
✅ **Network tab shows successful requests to /api/ubi/collect**
✅ **Backend logs show events being received**
✅ **Dashboard shows updated metrics after search interactions**
✅ **Recent searches table populates with actual queries**

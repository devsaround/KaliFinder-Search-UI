# Dashboard Data Sync Fix

## Problem Identified

The dashboard data in `DashboardVendor.tsx` is not updating when users interact with the search functionality in `cdn-production` because:

1. **Vendor ID Mismatch**: The search components are sending analytics events with `vendor_id: 'unknown'` while the dashboard is fetching data using the authenticated user's ID.

2. **Missing Configuration**: The search script doesn't receive or set the vendor ID and store ID parameters.

3. **Data Flow Disconnect**: Analytics events are being sent to the backend but with incorrect vendor identification.

## Solutions Implemented

### 1. Updated Search Script Configuration

**File**: `cdn-production/src/embed-search.tsx`

- Added support for `vendorId` and `storeId` URL parameters
- Set global variables for UBI client to access
- Added debugging logs

```typescript
const configFromUrl = {
  storeUrl: storeUrl || undefined,
  vendorId: url.searchParams.get("vendorId") || undefined,
  storeId: url.searchParams.get("storeId") || undefined,
};

// Set global variables for UBI client
if (configFromUrl.vendorId) {
  (window as any).KALIFIND_VENDOR_ID = configFromUrl.vendorId;
}
if (configFromUrl.storeId) {
  (window as any).KALIFIND_STORE_ID = configFromUrl.storeId;
}
```

### 2. Enhanced UBI Client Debugging

**File**: `cdn-production/src/analytics/ubiClient.ts`

- Added detailed logging for vendor ID detection
- Enhanced debugging for event flushing
- Better error handling and reporting

### 3. Created Debug Tools

**File**: `cdn-production/debug-analytics.html`

- Test page for debugging analytics flow
- Direct UBI client testing
- Analytics endpoint testing

## How to Fix the Issue

### Step 1: Update Search Script Implementation

When implementing the search script on your store, include the vendor ID and store ID parameters:

```html
<script src="https://your-cdn-domain.com/kalifind-search.js?storeUrl=https://your-store.com&vendorId=YOUR_VENDOR_ID&storeId=YOUR_STORE_ID"></script>
```

### Step 2: Verify Vendor ID in Dashboard

Make sure the dashboard is using the correct vendor ID. In `DashboardVendor.tsx`, the API calls use:

```typescript
fetch(`${import.meta.env.VITE_BACKEND_URL}/v1/analytics/vendor/${user.id}/dashboard`)
```

The `user.id` should match the `vendorId` parameter in the search script.

### Step 3: Test the Analytics Flow

1. Open the debug page: `http://localhost:5173/debug-analytics.html`
2. Check browser console for UBI client logs
3. Verify that events are being sent with correct vendor ID
4. Check that dashboard data updates after search interactions

### Step 4: Monitor Backend Logs

Check the backend logs for:
- UBI events being received at `/api/ubi/collect`
- Events being stored in `LocalAnalyticsService`
- Dashboard API calls returning updated data

## Expected Data Flow

1. **Search Script Load**: Sets `KALIFIND_VENDOR_ID` and `KALIFIND_STORE_ID` global variables
2. **User Interaction**: Search, clicks, add to cart actions trigger UBI events
3. **Event Tracking**: UBI client sends events to `/api/ubi/collect` with correct vendor ID
4. **Data Storage**: Backend stores events in `LocalAnalyticsService`
5. **Dashboard Update**: Dashboard fetches data using same vendor ID and shows updated metrics

## Debugging Checklist

- [ ] Search script includes `vendorId` and `storeId` parameters
- [ ] Global variables `KALIFIND_VENDOR_ID` and `KALIFIND_STORE_ID` are set
- [ ] UBI client logs show correct vendor ID detection
- [ ] Events are being sent to `/api/ubi/collect` endpoint
- [ ] Backend logs show events being received and stored
- [ ] Dashboard API calls use the same vendor ID
- [ ] Dashboard data updates after search interactions

## Common Issues

1. **Vendor ID Mismatch**: Ensure the vendor ID in the search script matches the user ID in the dashboard
2. **CORS Issues**: Make sure the backend allows requests from your CDN domain
3. **Authentication**: Ensure the dashboard user is properly authenticated
4. **Timing**: Analytics events may take a few seconds to appear in the dashboard

## Testing Commands

```bash
# Test the search script with parameters
curl "http://localhost:5173/kalifind-search.js?storeUrl=https://findifly.kinsta.cloud&vendorId=test-vendor-123&storeId=test-store-456"

# Test analytics endpoint
curl -X GET "http://localhost:3000/v1/analytics/vendor/test-vendor-123/dashboard" \
  -H "Content-Type: application/json" \
  --cookie "session=your-session-cookie"
```

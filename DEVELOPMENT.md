# Development Mode Guide

## 🧪 Local Development

When running the admin form locally (`npm run dev`), the system automatically detects development mode and:

✅ **Skips Netlify functions** - No network calls to `/.netlify/functions/`
✅ **Validates all data** - Ensures form validation works
✅ **Logs output** - Shows exactly what would be submitted
✅ **Simulates success** - Shows success message with 🧪 icon

## 📋 What Happens in Development

1. **Form submission** → Validates all fields
2. **Data processing** → Calculates placement shifts
3. **Console logging** → Shows level data and updated levels.json
4. **Success message** → "Level validated successfully! (Development Mode) 🧪"

## 🔍 Check Console Output

When you submit in development mode, look for:

```
🚧 DEVELOPMENT MODE - Netlify functions not available
📝 Level data that would be submitted:
Level: { placement: 1, levelName: "Test Level", ... }
Updated levels.json: { "metadata": {...}, "levels": [...] }
```

## 🚀 Testing on Netlify

To test the actual submission:

1. **Push changes** to your GitHub repo
2. **Wait for Netlify deploy** (~1-2 minutes)
3. **Visit your Netlify URL** (not localhost)
4. **Submit a level** → Should create actual staging branch commit

## 🛠 Troubleshooting

### "NetworkError when attempting to fetch"
- **Expected in development** - Functions only work on deployed Netlify site
- **Solution**: Check console logs for development mode confirmation

### "Level validated successfully! (Development Mode)"  
- **This is correct** - Development mode is working
- **Data is logged** - Check browser console for the level data

### Testing Video Uploads
- **Development**: Files are validated but not uploaded
- **Production**: Files uploaded to staging branch via GitHub API

## 🔄 Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Form validation | ✅ Full validation | ✅ Full validation |
| Data processing | ✅ Placement shifts | ✅ Placement shifts |
| File uploads | ⚠️ Validation only | ✅ Upload to GitHub |
| Staging commits | ⚠️ Console logs | ✅ Real git commits |
| Success message | 🧪 Dev mode | 🚀 Production |

This ensures you can develop and test the form logic locally without needing Netlify functions!
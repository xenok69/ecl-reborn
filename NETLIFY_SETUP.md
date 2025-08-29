# Netlify Setup Instructions

## 🚀 Complete Setup for Admin Level Submission

### 1. Environment Variables (Netlify Dashboard)

Go to your Netlify site dashboard → **Site settings** → **Environment variables** and add:

```
GITHUB_TOKEN=ghp_your_github_personal_access_token_here
GITHUB_OWNER=your-github-username
GITHUB_REPO=ecl-reborn
NODE_ENV=production
```

### 2. GitHub Personal Access Token Setup

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. Copy the token and use it as `GITHUB_TOKEN`

### 3. Required Dependencies

The serverless functions need these packages (already configured):
- `@octokit/rest` - GitHub API client  
- `lambda-multipart-parser` - File upload handling

### 4. How It Works

**File Upload Flow:**
1. Admin uploads video → `/.netlify/functions/upload-video`
2. Function saves video to `/assets/lvl_videos/` in staging branch
3. Returns file path for level data

**Level Submission Flow:**
1. Admin submits level → `/.netlify/functions/submit-level`
2. Function shifts existing placements
3. Updates `levels.json` in staging branch
4. Creates git commit with descriptive message

### 5. Staging Branch Workflow

- **All submissions go to `staging` branch**
- **Never touches `main/production` branch**
- **Manual review before merging to production**

### 6. Testing the Setup

1. **Deploy to Netlify** (should auto-deploy from GitHub)
2. **Add environment variables** in Netlify dashboard
3. **Test admin form** at `/submit` route
4. **Check staging branch** for commits

### 7. File Structure Created

```
your-repo/
├── netlify.toml                    # Netlify configuration
├── netlify/
│   └── functions/
│       ├── package.json            # Function dependencies
│       ├── submit-level.js         # Level submission handler
│       └── upload-video.js         # Video upload handler
└── NETLIFY_SETUP.md               # This file
```

### 8. Troubleshooting

**Function not found (404):**
- Check `netlify.toml` is in root directory
- Verify function files are in `netlify/functions/`
- Check Netlify build logs

**GitHub API errors:**
- Verify `GITHUB_TOKEN` has correct permissions
- Check `GITHUB_OWNER` and `GITHUB_REPO` are correct
- Ensure staging branch exists or can be created

**File upload errors:**
- Check file size (max 100MB)
- Verify file type (MP4, WebM, OGG, MOV only)
- Check GitHub token permissions

### 9. Security Features

✅ **CORS enabled** for frontend access
✅ **File type validation** (videos only)
✅ **File size limits** (100MB max)
✅ **GitHub token authentication**
✅ **Staging branch isolation**
✅ **Error handling and logging**

### 10. Next Steps

1. **Set up environment variables** in Netlify
2. **Test the admin form** submission
3. **Review staging branch** commits
4. **Set up staging → production workflow** (manual merge or GitHub Actions)

That's it! Your admin submission system should now be fully functional! 🎉
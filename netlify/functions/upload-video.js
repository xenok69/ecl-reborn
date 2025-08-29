const multipart = require('lambda-multipart-parser')
const { Octokit } = require('@octokit/rest')

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        }
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        }
    }

    try {
        // Parse multipart form data
        const result = await multipart.parse(event)
        
        const videoFile = result.files.find(file => file.fieldname === 'videoFile')
        const levelName = result.levelName || 'unknown-level'

        if (!videoFile) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No video file provided' })
            }
        }

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/quicktime']
        if (!allowedTypes.includes(videoFile.contentType)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Invalid file type. Only MP4, WebM, OGG, and MOV files are allowed.' 
                })
            }
        }

        // Validate file size (100MB limit)
        const maxSize = 100 * 1024 * 1024 // 100MB
        if (videoFile.content.length > maxSize) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'File too large. Maximum size is 100MB.' 
                })
            }
        }

        // Validate required environment variables
        if (!process.env.GITHUB_TOKEN) {
            throw new Error('GitHub token not configured')
        }

        // Initialize Octokit with GitHub token
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        })

        // GitHub repository info
        const owner = process.env.GITHUB_OWNER || 'your-username'
        const repo = process.env.GITHUB_REPO || 'ecl-reborn'
        
        // Generate unique filename
        const timestamp = Date.now()
        const fileExtension = videoFile.filename.split('.').pop()
        const sanitizedLevelName = levelName.replace(/[^a-zA-Z0-9-_]/g, '_')
        const filename = `${timestamp}_${sanitizedLevelName}.${fileExtension}`
        const filePath = `assets/lvl_videos/${filename}`

        // Convert buffer to base64 for GitHub API
        const base64Content = videoFile.content.toString('base64')

        // Create or update the file in the repository
        const { data: uploadResult } = await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: `Upload video for level: ${levelName}`,
            content: base64Content,
            branch: 'staging' // Upload to staging branch
        })

        console.log(`Successfully uploaded video: ${filename}`)

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                filePath: `./${filePath}`,
                filename: filename,
                message: 'Video uploaded successfully',
                commitHash: uploadResult.commit.sha
            })
        }

    } catch (error) {
        console.error('Error in upload-video function:', error)

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: error.message || 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        }
    }
}
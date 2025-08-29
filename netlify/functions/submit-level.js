const { Octokit } = require('@octokit/rest')

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }

    // Debug logging
    console.log('HTTP Method:', event.httpMethod)
    console.log('Headers:', event.headers)

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
        console.error(`Method not allowed: ${event.httpMethod}`)
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                error: 'Method not allowed',
                method: event.httpMethod,
                allowedMethods: ['POST', 'OPTIONS']
            })
        }
    }

    try {
        // Validate and parse the request body
        if (!event.body) {
            throw new Error('Request body is missing')
        }

        let parsedBody
        try {
            parsedBody = JSON.parse(event.body)
        } catch (parseError) {
            console.error('JSON parse error:', parseError)
            console.error('Request body:', event.body)
            throw new Error('Invalid JSON in request body')
        }

        const { levelData, updatedData, targetBranch = 'main', commitMessage } = parsedBody

        // Validate required environment variables
        if (!process.env.GITHUB_TOKEN) {
            throw new Error('GitHub token not configured')
        }

        // Initialize Octokit with GitHub token
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        })

        // GitHub repository info (you'll need to set these in Netlify env vars)
        const owner = process.env.GITHUB_OWNER || 'your-username'
        const repo = process.env.GITHUB_REPO || 'ecl-reborn'
        const filePath = 'src/data/levels.json'

        // Get the current main branch to create staging from
        let mainBranch
        try {
            const { data: repoInfo } = await octokit.rest.repos.get({
                owner,
                repo
            })
            mainBranch = repoInfo.default_branch
        } catch (error) {
            console.error('Error getting repo info:', error)
            mainBranch = 'main'
        }

        // Create or update staging branch
        try {
            // Get main branch reference
            const { data: mainRef } = await octokit.rest.git.getRef({
                owner,
                repo,
                ref: `heads/${mainBranch}`
            })

            // Try to create staging branch
            try {
                await octokit.rest.git.createRef({
                    owner,
                    repo,
                    ref: `refs/heads/${targetBranch}`,
                    sha: mainRef.object.sha
                })
                console.log(`Created new ${targetBranch} branch`)
            } catch (createError) {
                // Branch might already exist, that's okay
                console.log(`${targetBranch} branch already exists`)
            }
        } catch (error) {
            console.error('Error managing branches:', error)
            // Continue anyway, might still work
        }

        // Get current levels.json file from staging branch
        let currentFileSha
        try {
            const { data: currentFile } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: filePath,
                ref: targetBranch
            })
            currentFileSha = currentFile.sha
        } catch (error) {
            // File might not exist on staging branch, get from main
            try {
                const { data: currentFile } = await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path: filePath,
                    ref: mainBranch
                })
                currentFileSha = currentFile.sha
            } catch (mainError) {
                console.error('Error getting levels.json from both staging and main:', mainError)
                throw new Error('Could not find levels.json file')
            }
        }

        // Prepare the updated file content
        const fileContent = JSON.stringify(updatedData, null, 2)
        const encodedContent = Buffer.from(fileContent).toString('base64')

        // Update the file in the staging branch
        const { data: updateResult } = await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: commitMessage || `Added Level to data list: ${levelData.levelName}`,
            content: encodedContent,
            sha: currentFileSha,
            branch: targetBranch
        })

        console.log('Successfully updated levels.json in staging branch')

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: `Level submitted to ${targetBranch} branch successfully`,
                commitHash: updateResult.commit.sha,
                commitUrl: updateResult.commit.html_url,
                stagingUrl: `https://github.com/${owner}/${repo}/tree/${targetBranch}`
            })
        }

    } catch (error) {
        console.error('Error in submit-level function:', error)

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
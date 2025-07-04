# Deploying QnA2 to Vercel: Step-by-Step Guide

This guide will walk you through the process of deploying your QnA2 React application to Vercel with minimal code alterations.

## Prerequisites

- Your QnA2 project code (already complete)
- A GitHub, GitLab, or Bitbucket account (for source code hosting)
- Internet connection

## Step 1: Prepare Your Project for Deployment

Before deploying to Vercel, make sure your project is ready:

1. **Ensure all dependencies are correctly listed in package.json**
   - Your project already has the necessary dependencies listed

2. **Check your build script in package.json**
   - Your current build script `"build": "vite build"` is already compatible with Vercel

3. **Create a simple vercel.json configuration file (optional but recommended)**
   ```bash
   # In your project root directory, create vercel.json
   touch vercel.json
   ```

   Add the following content to vercel.json:
   ```json
   {
     "framework": "vite",
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "routes": [
       { "handle": "filesystem" },
       { "src": "/(.*)", "dest": "/index.html" }
     ]
   }
   ```
   This configuration tells Vercel to use Vite for building, specifies the output directory, and sets up routing for a single-page application.

## Step 2: Create a Vercel Account

1. Go to [Vercel's website](https://vercel.com/)
2. Click on "Sign Up" in the top-right corner
3. Choose to sign up with GitHub, GitLab, Bitbucket, or email
   - Signing up with your Git provider is recommended for easier integration
4. Follow the on-screen instructions to complete the signup process
5. Verify your email if required

## Step 3: Push Your Code to a Git Repository

If your code is not already in a Git repository:

1. Initialize a Git repository in your project folder:
   ```bash
   git init
   ```

2. Add all files to the repository:
   ```bash
   git add .
   ```

3. Commit the changes:
   ```bash
   git commit -m "Initial commit for Vercel deployment"
   ```

4. Create a new repository on GitHub/GitLab/Bitbucket
   - Go to your Git provider's website
   - Create a new repository (keep it private if your code is sensitive)
   - Follow the instructions to push an existing repository

5. Push your code:
   ```bash
   git remote add origin <your-repository-url>
   git branch -M main
   git push -u origin main
   ```

## Step 4: Import Your Project to Vercel

1. Log in to your Vercel dashboard
2. Click on "Add New..." and select "Project"
3. Connect to your Git provider if you haven't already
4. Select the repository containing your QnA2 project
5. Vercel will automatically detect that it's a Vite project

## Step 5: Configure Project Settings

1. **Project Name**: Enter a name for your project (e.g., "qna2-app")
2. **Framework Preset**: Ensure "Vite" is selected
3. **Root Directory**: Keep as default if your project is at the root of the repository
4. **Build and Output Settings**: These should be automatically configured based on your vercel.json

5. **Environment Variables**: Add any necessary environment variables
   - Click on "Environment Variables"
   - Add your Gemini API key:
     - NAME: `VITE_GEMINI_API_KEY`
     - VALUE: Your Gemini API key
   - Make sure to set this as a production environment variable

6. **Advanced Build Settings**: Usually, you can leave these at their defaults

7. Click "Deploy"

## Step 6: Monitor the Deployment

1. Vercel will now build and deploy your application
2. You can watch the build logs in real-time
3. If there are any errors, Vercel will show them in the logs

## Step 7: Test Your Deployed Application

1. Once deployment is complete, Vercel will provide you with a URL (e.g., https://qna2-app.vercel.app)
2. Open the URL in your browser to test your application
3. Test all the main features:
   - File upload
   - PDF processing
   - Question extraction and analysis
   - Bookmarking functionality

## Step 8: Set Up a Custom Domain (Optional)

If you want to use a custom domain:

1. In your project dashboard, go to "Settings" > "Domains"
2. Click "Add" and enter your domain name
3. Follow the instructions to configure DNS settings for your domain

## Step 9: Set Up Continuous Deployment

Vercel automatically sets up continuous deployment:

1. Any push to your main branch will trigger a new deployment
2. You can configure preview deployments for pull requests in the project settings

## Troubleshooting Common Issues

### PDF.js Worker Path

If you encounter issues with PDF.js worker:

1. Check the worker path in `pdfProcessingService.js`
2. You might need to update:
   ```javascript
   // From
   pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
   
   // To
   pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.mjs'
   ```

### CORS Issues with Tesseract.js

If OCR functionality doesn't work due to CORS:

1. Make sure the Tesseract worker files are properly included in your build
2. Consider adding a `public/_redirects` file with appropriate CORS headers

### API Key Issues

If the Gemini API doesn't work:

1. Verify that the environment variable is correctly set in Vercel
2. Check that your application is correctly accessing the environment variable
3. Ensure your Gemini API key has the correct permissions and rate limits

## Maintenance and Updates

After deployment:

1. Monitor your application's performance in the Vercel dashboard
2. Set up usage alerts to be notified of unusual traffic patterns
3. For updates, simply push changes to your Git repository, and Vercel will automatically redeploy

## Conclusion

You've now successfully deployed your QnA2 application to Vercel! The platform will handle scaling, CDN distribution, and HTTPS for you. With continuous deployment set up, any future updates you push to your repository will be automatically deployed.

Remember that Vercel offers additional features like:
- Analytics
- Performance monitoring
- Edge functions
- Team collaboration

Explore these features in the Vercel dashboard to get the most out of your deployment.
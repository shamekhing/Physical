# GitHub Pages Deployment Guide

This React application is configured for deployment to GitHub Pages using both manual and automated deployment methods.

## Repository Setup

Your repository should be named `physical` and located at `https://github.com/shsuw/physical` for the deployment to work correctly with the current configuration.

## Deployment Methods

### Method 1: Manual Deployment (Quick)

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

This will:
- Build the project for production
- Deploy the `build` folder to the `gh-pages` branch
- Make your site available at `https://shsuw.github.io/physical`

### Method 2: Automated Deployment (Recommended)

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys your site whenever you push to the `main` branch.

1. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "GitHub Actions"

2. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **Monitor deployment:**
   - Go to the "Actions" tab in your repository
   - Watch the deployment workflow run
   - Your site will be available at `https://shsuw.github.io/physical` once complete

## Configuration Details

- **Homepage URL:** `https://shsuw.github.io/physical`
- **Build Output:** `build/` directory
- **Deploy Branch:** `gh-pages`
- **Source Branch:** `main`

## Troubleshooting

### Build Warnings
The current build shows some ESLint warnings about unused variables. These don't affect functionality but can be cleaned up by:
- Removing unused imports/variables
- Adding `// eslint-disable-next-line` comments for intentionally unused variables

### GitHub Pages Not Updating
- Ensure GitHub Pages is set to use "GitHub Actions" as the source
- Check that the workflow has completed successfully in the Actions tab
- Verify the repository name matches the homepage URL in package.json

### Local Testing
To test the production build locally:
```bash
npm run build
npx serve -s build -l 3000
```

## Custom Domain (Optional)
To use a custom domain:
1. Add a `CNAME` file to the `public/` directory with your domain
2. Update the `homepage` field in `package.json`
3. Configure DNS settings with your domain provider

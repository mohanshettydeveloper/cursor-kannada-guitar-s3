#!/bin/bash

# Kannada Guitar Website - S3 Deployment Script
# This script uploads the website files to Amazon S3

# Configuration
BUCKET_NAME="kannada-guitar-website"
REGION="us-east-1"
PROFILE="default"  # Change this to your AWS profile name

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎸 Deploying Kannada Guitar Website to S3...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if bucket exists, create if it doesn't
echo -e "${YELLOW}📦 Checking S3 bucket...${NC}"
if ! aws s3 ls "s3://$BUCKET_NAME" --profile $PROFILE 2>&1 | grep -q 'NoSuchBucket'; then
    echo -e "${GREEN}✅ Bucket $BUCKET_NAME already exists${NC}"
else
    echo -e "${YELLOW}📦 Creating S3 bucket...${NC}"
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION --profile $PROFILE
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Bucket created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create bucket${NC}"
        exit 1
    fi
fi

# Enable static website hosting
echo -e "${YELLOW}🌐 Configuring static website hosting...${NC}"
aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document error.html --profile $PROFILE

# Set bucket policy for public read access
echo -e "${YELLOW}🔒 Setting bucket policy...${NC}"
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://s3-bucket-policy.json --profile $PROFILE

# Upload files
echo -e "${YELLOW}📤 Uploading website files...${NC}"

# Upload HTML files with proper content type
aws s3 cp index.html "s3://$BUCKET_NAME/" --content-type "text/html" --profile $PROFILE
aws s3 cp about.html "s3://$BUCKET_NAME/" --content-type "text/html" --profile $PROFILE
aws s3 cp contact.html "s3://$BUCKET_NAME/" --content-type "text/html" --profile $PROFILE
aws s3 cp error.html "s3://$BUCKET_NAME/" --content-type "text/html" --profile $PROFILE
aws s3 cp post-template.html "s3://$BUCKET_NAME/" --content-type "text/html" --profile $PROFILE

# Upload CSS files
aws s3 cp styles.css "s3://$BUCKET_NAME/" --content-type "text/css" --profile $PROFILE

# Upload JavaScript files
aws s3 cp script.js "s3://$BUCKET_NAME/" --content-type "application/javascript" --profile $PROFILE

# Upload other files
aws s3 cp robots.txt "s3://$BUCKET_NAME/" --content-type "text/plain" --profile $PROFILE
aws s3 cp sitemap.xml "s3://$BUCKET_NAME/" --content-type "application/xml" --profile $PROFILE

# Set cache headers for static assets
echo -e "${YELLOW}⏰ Setting cache headers...${NC}"
aws s3 cp styles.css "s3://$BUCKET_NAME/" --content-type "text/css" --cache-control "max-age=31536000" --profile $PROFILE
aws s3 cp script.js "s3://$BUCKET_NAME/" --content-type "application/javascript" --cache-control "max-age=31536000" --profile $PROFILE

# Sync any additional files (if you have images, etc.)
if [ -d "images" ]; then
    echo -e "${YELLOW}🖼️ Uploading images...${NC}"
    aws s3 sync images/ "s3://$BUCKET_NAME/images/" --profile $PROFILE
fi

# Get website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Website URL: $WEBSITE_URL${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Test your website at: $WEBSITE_URL"
echo -e "   2. Set up CloudFront distribution for HTTPS and custom domain"
echo -e "   3. Configure your domain DNS to point to CloudFront"
echo -e "   4. Update AdSense and affiliate links with your domain"
echo -e ""
echo -e "${GREEN}🎸 Your Kannada Guitar website is now live!${NC}"

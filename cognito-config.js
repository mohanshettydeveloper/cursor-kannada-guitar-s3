// AWS Cognito Configuration
// ⚠️ IMPORTANT: Replace these values with your actual AWS Cognito User Pool details
// For production, use environment variables or server-side configuration

const cognitoConfig = {
    // Your Cognito User Pool ID (e.g., us-east-1_XXXXXXXXX)
    UserPoolId: 'us-east-1_XXXXXXXXX',
    
    // Your Cognito App Client ID
    ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    
    // Your AWS Region (e.g., us-east-1, us-west-2, ap-south-1)
    Region: 'us-east-1'
};

// Validate configuration on load
if (cognitoConfig.UserPoolId.includes('XXXXXXXXX') || cognitoConfig.ClientId.includes('xxxxxxxx')) {
    console.warn('⚠️ AWS Cognito configuration not set! Please update cognito-config.js with your actual values.');
    console.warn('See AWS_COGNITO_INTEGRATION.md for setup instructions.');
}

// Make config available globally
window.cognitoConfig = cognitoConfig;


# AWS Cognito Integration Guide for Kannada Guitar Community

This guide will help you integrate AWS Cognito authentication into your Kannada Guitar community website.

## Prerequisites

1. AWS Account
2. AWS Cognito User Pool created
3. AWS Cognito User Pool Client ID
4. AWS Region where your Cognito User Pool is located

## Step 1: Set Up AWS Cognito User Pool

### 1.1 Create a User Pool

1. Go to AWS Console → Cognito → User Pools
2. Click "Create user pool"
3. Configure sign-in experience:
   - Sign-in options: Email, Username (optional)
   - Password policy: Set your requirements
4. Configure security requirements:
   - MFA: Optional (recommended for production)
   - User account recovery: Enable email/phone
5. Configure sign-up experience:
   - Allow self-registration: Yes
   - Required attributes: Email, Name
   - Custom attributes: Location, Experience (optional)
6. Configure message delivery:
   - Email provider: Send email with Cognito
7. Integrate your app:
   - User pool name: `kannada-guitar-users` (or your choice)
   - App client:
     - Name: `kannada-guitar-web-client`
     - Client secret: **DO NOT GENERATE** (for browser apps)
     - Authentication flows: ALLOW_USER_PASSWORD_AUTH, ALLOW_REFRESH_TOKEN_AUTH
8. Review and create

### 1.2 Get Your Configuration Values

After creating the User Pool, note down:
- **User Pool ID**: `us-east-1_XXXXXXXXX` (example)
- **App Client ID**: `xxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Region**: `us-east-1` (or your region)

### 1.3 Configure App Client Settings

1. Go to App integration → App client settings
2. Configure:
   - Enabled Identity Providers: Cognito User Pool
   - Callback URLs: `https://yourdomain.com/index.html`, `http://localhost:5500/index.html` (for local testing)
   - Sign-out URLs: `https://yourdomain.com/index.html`, `http://localhost:5500/index.html`
   - Allowed OAuth flows: Authorization code grant
   - Allowed OAuth scopes: email, openid, profile

## Step 2: Install AWS Cognito SDK

### Option A: Using CDN (Recommended for Quick Start)

Add this to your HTML files (in `<head>` section):

```html
<script src="https://cdn.jsdelivr.net/npm/amazon-cognito-identity-js@6.3.0/dist/amazon-cognito-identity.min.js"></script>
```

### Option B: Using npm (For Production)

```bash
npm install amazon-cognito-identity-js
```

Then import in your JavaScript:
```javascript
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
```

## Step 3: Configuration File

Create a `cognito-config.js` file with your Cognito settings:

```javascript
const cognitoConfig = {
    UserPoolId: 'us-east-1_XXXXXXXXX', // Replace with your User Pool ID
    ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with your App Client ID
    Region: 'us-east-1' // Replace with your AWS region
};
```

**⚠️ IMPORTANT**: For production, use environment variables or a server-side configuration. Never commit actual credentials to public repositories.

## Step 4: Update Authentication Code

The `auth-cognito.js` file has been created with all necessary Cognito integration code. This replaces the localStorage-based authentication.

## Step 5: Update HTML Files

Replace the auth.js script reference with auth-cognito.js:

```html
<!-- OLD -->
<script src="auth.js"></script>

<!-- NEW -->
<script src="cognito-config.js"></script>
<script src="https://cdn.jsdelivr.net/npm/amazon-cognito-identity-js@6.3.0/dist/amazon-cognito-identity.min.js"></script>
<script src="auth-cognito.js"></script>
```

## Step 6: User Pool Attribute Mapping

### Standard Attributes (Already Available)
- `email` - User's email address
- `name` - User's full name
- `given_name` - First name
- `family_name` - Last name

### Custom Attributes (If Needed)

To add custom attributes like `location` or `experience`:

1. Go to User Pool → Sign-up experience → Attributes
2. Click "Add custom attribute"
3. Add:
   - Name: `location`, Type: String
   - Name: `experience`, Type: String
4. Save changes

## Step 7: Testing

### Test Registration Flow
1. Open register.html
2. Fill in the form
3. Check email for verification code
4. Verify email (if required by your User Pool settings)

### Test Login Flow
1. Open login.html
2. Enter credentials
3. Should successfully authenticate

### Test Logout
1. Click logout in Account dropdown
2. Should clear session and redirect

## Step 8: Email Verification

### Option 1: Automatic Verification (Development)
- User Pool → Sign-up experience → Required attributes
- Uncheck "Email" if you want to allow unverified emails

### Option 2: Manual Verification (Production - Recommended)
- Users receive verification code via email
- They must verify before first login
- Add verification page/flow

## Step 9: Password Reset Flow

AWS Cognito handles password reset automatically:
1. User clicks "Forgot password"
2. Receives verification code via email
3. Enters new password with code
4. Password is reset

## Step 10: Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **CORS Configuration**: Configure CORS in Cognito for your domain
3. **Token Storage**: Tokens are stored securely by Cognito SDK
4. **Token Refresh**: Tokens automatically refresh when expired
5. **Rate Limiting**: Cognito has built-in rate limiting
6. **MFA**: Enable MFA for production

## Step 11: Error Handling

Common errors and solutions:

- **UserAlreadyExistsException**: User is already registered
- **NotAuthorizedException**: Invalid credentials
- **UserNotFoundException**: User doesn't exist
- **CodeMismatchException**: Verification code is incorrect
- **ExpiredCodeException**: Verification code has expired
- **PasswordResetRequiredException**: Password reset is required

## Step 12: Deployment

### For Production:

1. Update `cognito-config.js` with production User Pool ID
2. Update callback URLs in Cognito console
3. Use HTTPS
4. Enable CORS for your domain
5. Test all flows thoroughly

### Environment Variables (Recommended):

Instead of hardcoding in `cognito-config.js`, use:

```javascript
const cognitoConfig = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID || window.COGNITO_USER_POOL_ID,
    ClientId: process.env.COGNITO_CLIENT_ID || window.COGNITO_CLIENT_ID,
    Region: process.env.COGNITO_REGION || window.COGNITO_REGION || 'us-east-1'
};
```

## Troubleshooting

### Issue: "Invalid username or password"
- Check User Pool ID and Client ID are correct
- Verify user exists in Cognito
- Check if email is verified (if required)

### Issue: "User is not confirmed"
- User needs to verify email first
- Check email for verification code
- Resend verification code if needed

### Issue: CORS errors
- Add your domain to Cognito allowed origins
- Check callback URLs are correct

### Issue: Tokens not refreshing
- Check token expiration settings
- Verify refresh token is being stored

## Additional Features

### Social Login (Optional)

To add social login (Google, Facebook, etc.):

1. Go to User Pool → Sign-in experience → Federated identity provider sign-in
2. Configure identity providers
3. Update callback URLs
4. Modify auth-cognito.js to support OAuth flows

### User Attributes Update

To update user attributes after registration:

```javascript
const attributeList = [
    new AmazonCognitoIdentity.CognitoUserAttribute({
        Name: 'custom:location',
        Value: 'Bangalore, Karnataka'
    })
];

cognitoUser.updateAttributes(attributeList, (err, result) => {
    if (err) {
        console.error('Error updating attributes:', err);
        return;
    }
    console.log('Attributes updated:', result);
});
```

## Support

For AWS Cognito documentation:
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Amazon Cognito Identity JS SDK](https://github.com/amazon-archives/amazon-cognito-identity-js)

## Migration from localStorage

When migrating from localStorage to Cognito:

1. Export existing users from localStorage
2. Import users into Cognito User Pool (AWS Console or CLI)
3. Notify users to reset passwords
4. Update all HTML files to use new auth-cognito.js
5. Test thoroughly before deploying

---

**Note**: This integration replaces the localStorage-based authentication with AWS Cognito, providing enterprise-grade security, scalability, and user management.


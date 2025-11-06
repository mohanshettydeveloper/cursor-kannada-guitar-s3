# Quick Start: AWS Cognito Integration

## Step 1: Set Up AWS Cognito (5 minutes)

1. **Create User Pool**:
   - Go to AWS Console → Cognito → User Pools → Create user pool
   - Choose "Email" as sign-in option
   - Set password policy
   - Enable self-registration
   - Create app client (DO NOT generate client secret)
   - Note your User Pool ID and Client ID

2. **Configure App Client**:
   - Go to App integration → App client settings
   - Add callback URLs: `http://localhost:5500/index.html` (for testing)
   - Enable OAuth flows: Authorization code grant
   - Enable OAuth scopes: email, openid, profile

## Step 2: Update Configuration (2 minutes)

1. Open `cognito-config.js`
2. Replace placeholder values:
   ```javascript
   UserPoolId: 'us-east-1_YourActualPoolID',
   ClientId: 'YourActualClientID',
   Region: 'us-east-1' // or your region
   ```

## Step 3: Update HTML Files (5 minutes)

### For each HTML file (index.html, register.html, login.html, etc.):

**Replace this:**
```html
<script src="auth.js"></script>
```

**With this:**
```html
<!-- AWS Cognito SDK -->
<script src="https://cdn.jsdelivr.net/npm/amazon-cognito-identity-js@6.3.0/dist/amazon-cognito-identity.min.js"></script>
<!-- Cognito Configuration -->
<script src="cognito-config.js"></script>
<!-- Cognito Authentication -->
<script src="auth-cognito.js"></script>
```

## Step 4: Update Registration Form (register.html)

Replace the registration form submit handler with the code from `register-cognito-example.html`.

Key changes:
- Use `registerUser()` instead of `saveUserRegistration()`
- Handle email verification
- Show verification modal or redirect to verification page

## Step 5: Update Login Form (login.html)

Replace the login form submit handler with the code from `login-cognito-example.html`.

Key changes:
- Use `loginUser()` instead of `authenticateUser()`
- Handle new password required scenario
- Use `getCognitoErrorMessage()` for error messages

## Step 6: Test

1. **Test Registration**:
   - Go to register.html
   - Fill form and submit
   - Check email for verification code
   - Verify email

2. **Test Login**:
   - Go to login.html
   - Enter credentials
   - Should login successfully

3. **Test Logout**:
   - Click Account dropdown → Logout
   - Should clear session

## Files Created

- ✅ `cognito-config.js` - Configuration file
- ✅ `auth-cognito.js` - Cognito authentication functions
- ✅ `register-cognito-example.html` - Example registration code
- ✅ `login-cognito-example.html` - Example login code
- ✅ `AWS_COGNITO_INTEGRATION.md` - Detailed documentation

## Next Steps

1. Read `AWS_COGNITO_INTEGRATION.md` for detailed setup
2. Create email verification page (optional)
3. Create password reset page (optional)
4. Test all flows thoroughly
5. Deploy to production

## Troubleshooting

**Error: "Cognito SDK not loaded"**
- Make sure you included the CDN script before auth-cognito.js

**Error: "Configuration not found"**
- Check cognito-config.js has correct values
- Make sure it's loaded before auth-cognito.js

**Error: "UserNotFoundException"**
- User doesn't exist in Cognito
- Check username/email is correct

**Error: "UserNotConfirmedException"**
- User needs to verify email first
- Check email for verification code

## Security Notes

- ✅ Tokens are stored securely by Cognito SDK
- ✅ Passwords are never stored locally
- ✅ Sessions are managed by AWS Cognito
- ✅ HTTPS required for production
- ✅ Rate limiting handled by Cognito

## Support

For issues, check:
- AWS Cognito Console for user pool status
- Browser console for detailed errors
- AWS_COGNITO_INTEGRATION.md for detailed guide


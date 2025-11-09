// AWS Cognito Authentication Management for Kannada Guitar Community
// This replaces the localStorage-based authentication with AWS Cognito

// Initialize Cognito User Pool
let userPool;
let currentCognitoUser = null;

// Initialize Cognito on load
function initializeCognito() {
    if (typeof AmazonCognitoIdentity === 'undefined') {
        console.error('AWS Cognito SDK not loaded! Please include the SDK script.');
        return false;
    }

    if (!window.cognitoConfig || !window.cognitoConfig.UserPoolId) {
        console.error('Cognito configuration not found! Please check cognito-config.js');
        return false;
    }

    const poolData = {
        UserPoolId: window.cognitoConfig.UserPoolId,
        ClientId: window.cognitoConfig.ClientId
    };

    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    return true;
}

// Get current logged-in user from Cognito
async function getCurrentUser() {
    if (!userPool) {
        if (!initializeCognito()) return null;
    }

    try {
        const cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) {
            return null;
        }

        // Get session to verify user is still authenticated
        return new Promise((resolve, reject) => {
            cognitoUser.getSession((err, session) => {
                if (err || !session.isValid()) {
                    // Session invalid or expired
                    logout();
                    resolve(null);
                    return;
                }

                // Get user attributes
                cognitoUser.getUserAttributes((err, attributes) => {
                    if (err) {
                        console.error('Error getting user attributes:', err);
                        resolve(null);
                        return;
                    }

                    // Convert attributes to user object
                    const user = {
                        username: cognitoUser.getUsername(),
                        sub: cognitoUser.getUsername() // Cognito sub (unique user ID)
                    };

                    // Extract attributes
                    attributes.forEach(attr => {
                        if (attr.Name === 'email') {
                            user.email = attr.Value;
                        } else if (attr.Name === 'name') {
                            user.fullName = attr.Value;
                        } else if (attr.Name === 'given_name') {
                            user.firstName = attr.Value;
                        } else if (attr.Name === 'family_name') {
                            user.lastName = attr.Value;
                        } else if (attr.Name.startsWith('custom:')) {
                            // Custom attributes
                            const key = attr.Name.replace('custom:', '');
                            user[key] = attr.Value;
                        }
                    });

                    // Store session info
                    user.session = session;
                    user.idToken = session.getIdToken().getJwtToken();
                    user.accessToken = session.getAccessToken().getJwtToken();
                    user.refreshToken = session.getRefreshToken().getToken();

                    currentCognitoUser = cognitoUser;
                    resolve(user);
                });
            });
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Check if user is logged in
async function isLoggedIn() {
    const user = await getCurrentUser();
    return user !== null;
}

// Register new user
async function registerUser(userData) {
    if (!userPool) {
        if (!initializeCognito()) {
            throw new Error('Cognito not initialized');
        }
    }

    return new Promise((resolve, reject) => {
        // Prepare attribute list
        const attributeList = [];

        // Email attribute
        attributeList.push(
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: 'email',
                Value: userData.email
            })
        );

        // Name attribute
        if (userData.fullName) {
            attributeList.push(
                new AmazonCognitoIdentity.CognitoUserAttribute({
                    Name: 'name',
                    Value: userData.fullName
                })
            );
        }

        // Custom attributes (if configured in User Pool)
        if (userData.location) {
            attributeList.push(
                new AmazonCognitoIdentity.CognitoUserAttribute({
                    Name: 'custom:location',
                    Value: userData.location
                })
            );
        }

        if (userData.experience) {
            attributeList.push(
                new AmazonCognitoIdentity.CognitoUserAttribute({
                    Name: 'custom:experience',
                    Value: userData.experience
                })
            );
        }

        // Sign up user
        userPool.signUp(
            userData.username,
            userData.password,
            attributeList,
            null,
            (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve({
                    user: result.user,
                    userSub: result.userSub,
                    codeDeliveryDetails: result.codeDeliveryDetails
                });
            }
        );
    });
}

// Verify email with code
async function verifyEmail(username, verificationCode) {
    if (!userPool) {
        if (!initializeCognito()) {
            throw new Error('Cognito not initialized');
        }
    }

    return new Promise((resolve, reject) => {
        const userData = {
            Username: username,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

// Resend verification code
async function resendVerificationCode(username) {
    if (!userPool) {
        if (!initializeCognito()) {
            throw new Error('Cognito not initialized');
        }
    }

    return new Promise((resolve, reject) => {
        const userData = {
            Username: username,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.resendConfirmationCode((err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

// Login user
async function loginUser(username, password, rememberMe = false) {
    if (!userPool) {
        if (!initializeCognito()) {
            throw new Error('Cognito not initialized');
        }
    }

    return new Promise((resolve, reject) => {
        const authenticationData = {
            Username: username,
            Password: password
        };

        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
            authenticationData
        );

        const userData = {
            Username: username,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                currentCognitoUser = cognitoUser;
                resolve(result);
            },
            onFailure: (err) => {
                reject(err);
            },
            newPasswordRequired: (userAttributes, requiredAttributes) => {
                // Handle new password required (for first-time login after admin creation)
                reject({
                    code: 'NewPasswordRequired',
                    message: 'New password required',
                    userAttributes: userAttributes,
                    requiredAttributes: requiredAttributes
                });
            }
        });
    });
}

// Logout user
function logout() {
    if (currentCognitoUser) {
        currentCognitoUser.signOut();
        currentCognitoUser = null;
    } else if (userPool) {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
        }
    }

    // Clear any local storage (if needed)
    localStorage.removeItem('currentUser');
    
    // Update navigation
    updateNavigation();
    
    // Redirect to home page if not already there
    if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
    }
}

// Forgot password - initiate
async function forgotPassword(username) {
    if (!userPool) {
        if (!initializeCognito()) {
            throw new Error('Cognito not initialized');
        }
    }

    return new Promise((resolve, reject) => {
        const userData = {
            Username: username,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.forgotPassword({
            onSuccess: (data) => {
                resolve(data);
            },
            onFailure: (err) => {
                reject(err);
            }
        });
    });
}

// Confirm password reset
async function confirmPassword(username, verificationCode, newPassword) {
    if (!userPool) {
        if (!initializeCognito()) {
            throw new Error('Cognito not initialized');
        }
    }

    return new Promise((resolve, reject) => {
        const userData = {
            Username: username,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.confirmPassword(verificationCode, newPassword, {
            onSuccess: () => {
                resolve();
            },
            onFailure: (err) => {
                reject(err);
            }
        });
    });
}

// Update user attributes
async function updateUserAttributes(attributes) {
    if (!currentCognitoUser) {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }
    }

    return new Promise((resolve, reject) => {
        const attributeList = attributes.map(attr => 
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: attr.Name,
                Value: attr.Value
            })
        );

        currentCognitoUser.updateAttributes(attributeList, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

// Get user token (for API calls)
async function getUserToken() {
    const user = await getCurrentUser();
    if (!user || !user.idToken) {
        return null;
    }
    return user.idToken;
}

// Refresh user session
async function refreshSession() {
    if (!currentCognitoUser) {
        const user = await getCurrentUser();
        if (!user) {
            return null;
        }
    }

    return new Promise((resolve, reject) => {
        currentCognitoUser.getSession((err, session) => {
            if (err) {
                reject(err);
                return;
            }

            // Refresh the session
            currentCognitoUser.refreshSession(session.getRefreshToken(), (err, session) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(session);
            });
        });
    });
}

// Update navigation based on login status
async function updateNavigation() {
    const accountDropdown = document.querySelector('.nav-dropdown.account-dropdown');
    if (!accountDropdown) return;
    
    const dropdownMenu = accountDropdown.querySelector('.dropdown-menu');
    if (!dropdownMenu) return;
    
    const user = await getCurrentUser();
    
    if (user) {
        // User is logged in - show Logout and Profile
        dropdownMenu.innerHTML = `
            <li><a href="profile.html" class="dropdown-link">👤 Profile</a></li>
            <li><a href="#" class="dropdown-link" onclick="event.preventDefault(); logout(); return false;">🚪 Logout</a></li>
        `;
        
        // Update dropdown trigger text
        const dropdownTrigger = accountDropdown.querySelector('.nav-link');
        if (dropdownTrigger) {
            const displayName = user.fullName || user.username || 'User';
            dropdownTrigger.innerHTML = `👤 ${displayName} ▼`;
        }
    } else {
        // User is not logged in - show Login and Register
        dropdownMenu.innerHTML = `
            <li><a href="login.html" class="dropdown-link">🔐 Login</a></li>
            <li><a href="register.html" class="dropdown-link">📝 Register</a></li>
        `;
        
        // Update dropdown trigger text
        const dropdownTrigger = accountDropdown.querySelector('.nav-link');
        if (dropdownTrigger) {
            dropdownTrigger.innerHTML = `Account ▼`;
        }
    }
    
    // Show/hide "Add New Post" and "Create Post" links based on login status
    const addPostLinks = document.querySelectorAll('a[onclick*="openAddPostModal"]');
    addPostLinks.forEach(link => {
        if (user) {
            // Show link for logged-in users
            link.style.display = '';
            const parentLi = link.closest('li');
            if (parentLi) {
                parentLi.style.display = '';
            }
        } else {
            // Hide link for non-logged-in users
            link.style.display = 'none';
            // Keep parent visible if it has other content, but hide just the link
            const parentLi = link.closest('li');
            // Only hide parent if it only contains this link (or has minimal content)
            if (parentLi && parentLi.children.length === 1 && parentLi.textContent.trim() === link.textContent.trim()) {
                parentLi.style.display = 'none';
            }
        }
    });
}

// Show user profile - redirect to profile page
async function showUserProfile() {
    const user = await getCurrentUser();
    if (!user) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Redirect to profile page
    window.location.href = 'profile.html';
}

// Helper function to get Cognito error message
function getCognitoErrorMessage(err) {
    if (!err || !err.code) {
        return err.message || 'An error occurred';
    }

    const errorMessages = {
        'UserNotFoundException': 'User does not exist. Please check your username/email.',
        'NotAuthorizedException': 'Incorrect username or password.',
        'UserNotConfirmedException': 'User is not confirmed. Please verify your email.',
        'PasswordResetRequiredException': 'Password reset is required. Please reset your password.',
        'UserLambdaValidationException': 'User validation failed. Please check your information.',
        'UsernameExistsException': 'Username already exists. Please use a different username.',
        'InvalidPasswordException': 'Password does not meet requirements.',
        'InvalidParameterException': 'Invalid parameter. Please check your input.',
        'CodeMismatchException': 'Invalid verification code. Please try again.',
        'ExpiredCodeException': 'Verification code has expired. Please request a new one.',
        'LimitExceededException': 'Attempt limit exceeded. Please try again later.',
        'TooManyRequestsException': 'Too many requests. Please try again later.',
        'AliasExistsException': 'An account with this email already exists.',
        'InvalidUserPoolConfigurationException': 'User pool configuration is invalid.'
    };

    return errorMessages[err.code] || err.message || 'An error occurred. Please try again.';
}

// Initialize Cognito when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Cognito SDK and config to load
    setTimeout(() => {
        initializeCognito();
        updateNavigation();
    }, 100);
});

// Make functions available globally
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.logout = logout;
window.updateNavigation = updateNavigation;
window.showUserProfile = showUserProfile;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.verifyEmail = verifyEmail;
window.resendVerificationCode = resendVerificationCode;
window.forgotPassword = forgotPassword;
window.confirmPassword = confirmPassword;
window.updateUserAttributes = updateUserAttributes;
window.getUserToken = getUserToken;
window.getCognitoErrorMessage = getCognitoErrorMessage;


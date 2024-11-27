document.addEventListener('DOMContentLoaded', function() {
    // Modal functionality
    const modal = document.getElementById("loginModal");
    const loginBtn = document.getElementById("loginBtn");
    const closeButtons = document.querySelectorAll(".close");
    const showRegisterLink = document.getElementById("showRegister");
    const showLoginLink = document.getElementById("showLogin");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // Open modal
    loginBtn.onclick = () => {
        modal.style.display = "block";
        loginForm.style.display = "block";
        registerForm.style.display = "none";
    };

    // Close modal when clicking 'x' or outside the modal
    closeButtons.forEach(btn => {
        btn.onclick = () => modal.style.display = "none";
    });
    window.onclick = event => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    // Switch between login and register forms
    showRegisterLink.onclick = (e) => {
        e.preventDefault();
        loginForm.style.display = "none";
        registerForm.style.display = "block";
    };

    showLoginLink.onclick = (e) => {
        e.preventDefault();
        registerForm.style.display = "none";
        loginForm.style.display = "block";
    };

    // Handle Logout and show/hide authenticated content
    firebase.auth().onAuthStateChanged((user) => {
        const authRequiredElements = document.querySelectorAll('.auth-required');
        if (user) {
            loginBtn.innerText = "Logout";
            loginBtn.onclick = () => {
                firebase.auth().signOut().then(() => {
                    alert("Successfully logged!");
                    loginBtn.innerText = "Login/Sign-up";
                    loginBtn.onclick = () => modal.style.display = "block";
                    hideAuthenticatedContent();
                }).catch((error) => {
                    alert("error to logged out! " + error.message);
                });
            };
            showAuthenticatedContent();
        } else {
            loginBtn.innerText = "Login/Sign-up";
            loginBtn.onclick = () => modal.style.display = "block";
            hideAuthenticatedContent();
        }
    });

    function showAuthenticatedContent() {
        document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
        document.getElementById('about').style.display = 'none';
        document.getElementById('home').classList.add('logged-in');
        loadEvents(); // इवेंट्स लोड करें
    }

    function hideAuthenticatedContent() {
        document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
        document.getElementById('about').style.display = 'block';
        document.getElementById('home').classList.remove('logged-in');
        document.getElementById('eventsList').innerHTML = ''; // इवेंट्स को साफ करें
    }

    // Welcome message function
    window.showWelcomeMessage = function(name) {
        const welcomeMessage = document.createElement('div');
        welcomeMessage.innerHTML = `<h3>Wellcome, ${name}!</h3><p>Your Successfully logged in!</p>`;
        welcomeMessage.style.position = 'fixed';
        welcomeMessage.style.top = '50%';
        welcomeMessage.style.left = '50%';
        welcomeMessage.style.transform = 'translate(-50%, -50%)';
        welcomeMessage.style.background = 'white';
        welcomeMessage.style.padding = '20px';
        welcomeMessage.style.border = '1px solid black';
        welcomeMessage.style.zIndex = '1000';
        document.body.appendChild(welcomeMessage);
        setTimeout(() => {
            document.body.removeChild(welcomeMessage);
        }, 3000);
    };
});

// Login functionality
document.getElementById("loginFormElement").addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    console.log("Attempting login with email:", email);

    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = 'Logging in...';
    submitButton.disabled = true;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Check if user data exists in database
            return firebase.database().ref('users/' + user.uid).once('value')
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        // User data doesn't exist in database, create it
                        const userData = {
                            email: email,
                            fullName: 'Zenith Admin', // Default name for editor
                            isEditor: email.toLowerCase() === "zenithuser207@gmail.com",
                            createdAt: firebase.database.ServerValue.TIMESTAMP
                        };
                        return firebase.database().ref('users/' + user.uid).set(userData)
                            .then(() => userData);
                    }
                    return snapshot.val();
                });
        })
        .then((userData) => {
            // Success handling
            document.getElementById("loginModal").style.display = "none";
            document.getElementById("loginBtn").textContent = userData.fullName || 'User';
            
            // Show appropriate message based on editor status
            const message = userData.isEditor ? 
                `Welcome back, Editor ${userData.fullName || 'User'}!` :
                `Welcome back, ${userData.fullName || 'User'}!`;
            alert(message);
            
            // Update UI for authenticated state
            document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
            
            // Show/hide editor-specific elements
            if (userData.isEditor) {
                document.getElementById('createEventLink').style.display = 'block';
                document.getElementById('createEvent').style.display = 'block';
            } else {
                document.getElementById('createEventLink').style.display = 'none';
                document.getElementById('createEvent').style.display = 'none';
            }
        })
        .catch((error) => {
            console.error("Login error:", error);
            let errorMessage = "An error occurred during login.";
            
            switch (error.code) {
                case 'auth/invalid-login-credentials':
                    errorMessage = "Invalid email or password. Please check your credentials and try again.";
                    break;
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email. Please sign up first.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Incorrect password. Please try again.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Please enter a valid email address.";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "This account has been disabled. Please contact support.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Too many failed login attempts. Please try again later.";
                    break;
                default:
                    errorMessage = `Login error: ${error.message}`;
            }
            
            console.error(errorMessage);
            alert(errorMessage);
        })
        .finally(() => {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        });
});

// Add this helper function to clear form fields
function clearLoginForm() {
    document.getElementById("email").value = '';
    document.getElementById("password").value = '';
}

// Update the auth state change listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        firebase.database().ref('users/' + user.uid).once('value')
            .then((snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    document.getElementById("loginBtn").textContent = userData.fullName || user.email;
                    document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
                }
            });
    } else {
        document.getElementById("loginBtn").textContent = "Login/Sign-up";
        document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
        clearLoginForm();
    }
});

// Register functionality यथाव रहेगा, लेकिन ल पंजीकरण के बाद showAuthenticatedContent() कॉल रें

// Load events
function loadEvents() {
    console.log("loadEvents function called");
    const eventsContainer = document.getElementById('eventsList');
    if (!eventsContainer) {
        console.error("Events container not found");
        return;
    }
    
    eventsContainer.innerHTML = '<p>Loading events...</p>';
    
    // Get current user
    const user = firebase.auth().currentUser;
    
    if (user) {
        // User is signed in, fetch events
        firebase.database().ref('events').once('value')
            .then((snapshot) => {
                eventsContainer.innerHTML = ''; // Clear loading message
                
                if (!snapshot.exists() || snapshot.val() === null) {
                    console.log("No events found in the database");
                    eventsContainer.innerHTML = '<p class="no-events">No completed events available at this time.</p>';
                    return;
                }
                
                let eventCount = 0;
                snapshot.forEach((childSnapshot) => {
                    const eventData = childSnapshot.val();
                    const eventId = childSnapshot.key;
                    console.log("Processing event:", eventData);
                    
                    if (eventData && typeof eventData === 'object') {
                        const eventElement = createEventElement(eventData, eventId, user);
                        eventsContainer.appendChild(eventElement);
                        eventCount++;
                    } else {
                        console.error("Invalid event data:", eventData);
                    }
                });
                
                console.log(`Total events loaded: ${eventCount}`);
                if (eventCount === 0) {
                    eventsContainer.innerHTML = '<p class="no-events">No completed events available at this time.</p>';
                }
            })
            .catch((error) => {
                console.error("Error loading events:", error);
                eventsContainer.innerHTML = '<p class="error-message">Error loading events. Please try again later.</p>';
            });
    } else {
        // User is not signed in
        eventsContainer.innerHTML = '<p class="no-events">Please log in to view events.</p>';
    }
}

// Show dashboard
function showDashboard(eventId) {
    const dashboardContent = document.getElementById('dashboardContent');
    if (!dashboardContent) {
        console.error('Dashboard content element not found');
        return;
    }
    dashboardContent.style.display = 'block';
    const eventsSection = document.getElementById('events');
    if (eventsSection) {
        eventsSection.style.display = 'none';
    }

    // Load dashboard.html content
    fetch('dashboard.html')
        .then(response => response.text())
        .then(html => {
            dashboardContent.innerHTML = html;
            // अब हम इवेंट डेटा ो लोड नहीं करेंगे, बस dashboard.html को दिखाएंगे
        })
        .catch(error => {
            console.error('Error loading dashboard:', error);
            dashboardContent.innerHTML = '<p>Error loading dashboard. Please try again.</p>';
        });
}

// Add event listener for the Events link
document.querySelector('a[href="#events"]').addEventListener('click', function(e) {
    e.preventDefault();
    if (firebase.auth().currentUser) {
        document.getElementById('events').style.display = 'block';
        document.getElementById('dashboardContent').style.display = 'none';
        loadEvents(); // इवेंट्स को हर बार लोड करें जब इवेंट्स टैब पर क्लिक किया जाए
    }
});

// Add this to hide the About link after login
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        document.querySelector('a[href="#about"]').style.display = 'none';
    } else {
        document.querySelector('a[href="#about"]').style.display = 'inline-block';
    }
});

function createEventElement(eventData, eventId, user) {
    console.log("Creating element for event:", eventData);
    try {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-box';

        const imageSection = document.createElement('div');
        imageSection.className = 'event-image';
        if (eventData && eventData.photoURL) {
            const img = document.createElement('img');
            img.src = eventData.photoURL;
            img.alt = eventData.eventName || 'Event image';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            imageSection.appendChild(img);
        } else {
            imageSection.style.backgroundColor = '#f0f0f0';
        }

        const detailsSection = document.createElement('div');
        detailsSection.className = 'event-details';
        
        // Safely get event properties with default values
        const eventName = eventData && eventData.eventName ? eventData.eventName : 'Unnamed Event';
        const eventDate = eventData && eventData.eventDate ? eventData.eventDate : 'TBA';
        const eventVenue = eventData && eventData.eventVenue ? eventData.eventVenue : 'TBA';
        const guestOfHonor = eventData && eventData.guestOfHonor ? eventData.guestOfHonor : 'N/A';
        const eventDescription = eventData && eventData.eventDescription ? eventData.eventDescription : 'No description available';
        const performances = eventData.performances ? 
            (Array.isArray(eventData.performances) ? eventData.performances.join(', ') : 
            typeof eventData.performances === 'string' ? eventData.performances : 
            Object.values(eventData.performances).join(', ')) : 'None';

        detailsSection.innerHTML = `
            <h3>${eventName}</h3>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${eventData.eventTime || 'Not specified'}</p>
            <p><strong>Venue:</strong> ${eventVenue}</p>
            <p><strong>Guest of Honor:</strong> ${guestOfHonor}</p>
            <p><strong>Description:</strong> ${eventDescription}</p>
            <p><strong>Performances:</strong> ${performances}</p>
        `;

        // Check if user is editor before adding delete button
        if (user) {
            firebase.database().ref('users/' + user.uid).once('value')
                .then((snapshot) => {
                    const userData = snapshot.val();
                    if (userData && userData.isEditor === true) {
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Delete Event';
                        deleteButton.className = 'delete-event-btn';
                        deleteButton.onclick = () => deleteEvent(eventId);
                        detailsSection.appendChild(deleteButton);
                    }
                })
                .catch(error => {
                    console.error("Error checking editor status:", error);
                });
        }

        const registerButton = document.createElement('a');
        registerButton.href = `r1.html?eventId=${eventId}&eventName=${encodeURIComponent(eventData.eventName)}`;
        registerButton.className = 'btn';
        registerButton.textContent = 'Register';
        detailsSection.appendChild(registerButton);

        eventDiv.appendChild(imageSection);
        eventDiv.appendChild(detailsSection);
        
        return eventDiv;
    } catch (error) {
        console.error("Error creating event element:", error);
        return document.createElement('div'); // Return an empty div in case of error
    }
}

function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        firebase.database().ref('events/' + eventId).remove()
            .then(() => {
                alert('Event deleted successfully');
                loadEvents(); // Reload events after deletion
            })
            .catch((error) => {
                console.error("Error deleting event:", error);
                alert('Error deleting event. Please try again.');
            });
    }
}

// Remove the showEventDetails function as it's no longer needed

function updateUIOnAuth(user) {
    console.log("updateUIOnAuth called, user:", user);
    if (user) {
        document.getElementById('subMessage').style.display = 'none';
        
        database.ref('users/' + user.uid).once('value')
            .then((snapshot) => {
                const userData = snapshot.val();
                console.log("User data:", userData);
                const isEditor = userData && userData.isEditor === true;
                document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
                if (isEditor) {
                    document.getElementById('createEventLink').style.display = 'block';
                    document.getElementById('createEvent').style.display = 'block';
                } else {
                    document.getElementById('createEventLink').style.display = 'none';
                    document.getElementById('createEvent').style.display = 'none';
                }
                document.getElementById('welcomeMessage').textContent = `Welcome back, ${userData.fullName || 'User'}!`;
                loadEvents(); // Ensure this line is present
            });
    } else {
        // Show welcome message for non-logged-in users
        document.getElementById('subMessage').style.display = 'block';
        document.getElementById('welcomeMessage').textContent = 'Welcome to ZENITH';
        
        document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
        document.getElementById('createEventLink').style.display = 'none';
        document.getElementById('createEvent').style.display = 'none';
    }
}

// Add this registration functionality
document.getElementById("registerFormElement").addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const phone = document.getElementById("phone").value;

    console.log("Starting registration process..."); // Debug log
    console.log("Email:", email);
    console.log("Full Name:", fullName);
    console.log("Phone:", phone);

    // Enhanced validation
    if (!email || !password || !fullName || !phone) {
        alert("All fields are required!");
        return;
    }

    if (!email.includes('@')) {
        alert("Please enter a valid email address!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    if (password.length < 6) {
        alert("Password should be at least 6 characters long!");
        return;
    }

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = 'Creating account...';
    submitButton.disabled = true;

    // Create user in Firebase Authentication
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Firebase Auth account created successfully");
            console.log("User ID:", userCredential.user.uid);
            
            const user = userCredential.user;
            
            // Save additional user data to Realtime Database
            const userData = {
                fullName: fullName,
                email: email,
                phoneNumber: phone,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                isEditor: email.toLowerCase() === "zenithuser207@gmail.com" // Only true for editor email
            };

            console.log("Saving user data to database:", userData);
            
            return firebase.database().ref('users/' + user.uid).set(userData);
        })
        .then(() => {
            console.log("User data saved successfully to database");
            alert(`Account created successfully!\nEmail: ${email}\nPlease log in with these credentials.`);
            
            // Clear form
            this.reset();
            
            // Switch to login form
            document.getElementById("registerForm").style.display = "none";
            document.getElementById("loginForm").style.display = "block";
            
            // Pre-fill login form
            document.getElementById("email").value = email;
            document.getElementById("password").value = password;
        })
        .catch((error) => {
            console.error("Registration error:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            
            let errorMessage = "An error occurred during registration.";
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "This email is already registered. Please try logging in instead.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Please enter a valid email address.";
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = "Email/password accounts are not enabled. Please contact support.";
                    break;
                case 'auth/weak-password':
                    errorMessage = "Please choose a stronger password (at least 6 characters).";
                    break;
                default:
                    errorMessage = `Registration error: ${error.message}`;
            }
            
            alert(errorMessage);
        })
        .finally(() => {
            // Reset button state
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        });
});

// Update the auth state change listener to use loadEvents properly
firebase.auth().onAuthStateChanged((user) => {
    console.log("Auth state changed, user:", user);
    updateUIOnAuth(user);
    if (user) {
        loadEvents();
    }
});

// Add this to your existing script.js
document.getElementById('createEventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Creating...</span>';

    // Get form data
    const formData = new FormData(this);
    const eventData = {};
    const performances = [];

    formData.forEach((value, key) => {
        if (key === 'performances') {
            performances.push(value);
        } else {
            eventData[key] = value;
        }
    });

    // Add performances array to eventData
    if (performances.length > 0) {
        eventData.performances = performances;
    }

    // Add timestamp and status
    eventData.createdAt = firebase.database.ServerValue.TIMESTAMP;
    eventData.status = 'upcoming';

    // Get the file
    const file = document.getElementById('eventPhoto').files[0];
    if (!file) {
        alert('Please select an event photo!');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Event</span>';
        return;
    }

    // Create a storage reference
    const storageRef = firebase.storage().ref('event_photos/' + Date.now() + '_' + file.name);
    
    // Upload file
    storageRef.put(file)
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(downloadURL => {
            // Add download URL to eventData
            eventData.photoURL = downloadURL;
            
            // Save event data to Firebase Realtime Database
            return firebase.database().ref('events').push({
                ...eventData,
                status: 'upcoming',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                registrations: {}, // Initialize empty registrations object
                photoURL: downloadURL
            });
        })
        .then(() => {
            // Show success animation
            submitBtn.classList.add('success');
            submitBtn.innerHTML = '<div class="success-animation"><i class="fas fa-check"></i></div>';
            
            // Reset form after delay
            setTimeout(() => {
                this.reset();
                submitBtn.classList.remove('success');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Create Event</span>';
                document.getElementById('imagePreview').innerHTML = '';
                alert('Event created successfully!');
            }, 2000);
        })
        .catch(error => {
            console.error('Error creating event:', error);
            alert('Error creating event: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Create Event</span>';
        });
});

// Add image preview functionality
document.getElementById('eventPhoto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Event photo preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// Add form field animations
document.querySelectorAll('.form-group input, .form-group textarea').forEach(element => {
    element.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    element.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});

// Add these functions for form navigation
function nextStep(currentStep) {
    const currentFormStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const nextFormStep = document.querySelector(`.form-step[data-step="${currentStep + 1}"]`);
    
    if (currentFormStep && nextFormStep) {
        currentFormStep.classList.remove('active');
        nextFormStep.classList.add('active');
        updateProgress(currentStep + 1);
    }
}

function prevStep(currentStep) {
    const currentFormStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const prevFormStep = document.querySelector(`.form-step[data-step="${currentStep - 1}"]`);
    
    if (currentFormStep && prevFormStep) {
        currentFormStep.classList.remove('active');
        prevFormStep.classList.add('active');
        updateProgress(currentStep - 1);
    }
}

function updateProgress(step) {
    const totalSteps = 4;
    const progressBar = document.querySelector('.progress');
    const progressSteps = document.querySelectorAll('.step');
    
    // Update progress bar
    const progressPercentage = ((step) / totalSteps) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    
    // Update step indicators
    progressSteps.forEach((stepEl, index) => {
        if (index < step) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });
}

const app = document.getElementById('app');
let currentUser = null;
let userProfile = null;

// Mock data
const countries = ['USA', 'UK', 'Canada', 'Australia'];
const cities = {
    'USA': ['New York', 'Los Angeles', 'Chicago'],
    'UK': ['London', 'Manchester', 'Birmingham'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane']
};
const interestsList = ['Music', 'Sports', 'Travel', 'Gaming', 'Food'];
const genders = ['Male', 'Female', 'Bi', 'Lesbian', 'Gay'];
const ADMIN_IDS = [/* Замени на свой Telegram ID, например: 123456789 */];

function showToast(message, type = 'info') {
    console.log(`Toast: ${message} (${type})`);
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function loadTelegramSDK() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;
        script.onload = () => {
            console.log('Telegram SDK loaded');
            resolve();
        };
        script.onerror = () => {
            console.error('Failed to load Telegram SDK');
            reject(new Error('Failed to load Telegram SDK'));
        };
        document.head.appendChild(script);
    });
}

async function initWebApp() {
    console.log('Initializing Web App...');
    try {
        // Try loading Telegram SDK
        await loadTelegramSDK();
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            currentUser = Telegram.WebApp.initDataUnsafe.user || null;
            console.log('Telegram mode, user:', currentUser);
            checkUserStatus();
        } else {
            console.warn('No Telegram WebApp, switching to demo mode');
            currentUser = { id: 'demo', username: 'DemoUser' };
            checkUserStatus();
        }
    } catch (error) {
        console.error('Init error:', error);
        app.innerHTML = `
            <div class="card">
                <p class="text-red-500">Error: ${error.message}</p>
                <p class="text-gray-300">Please try opening this app in Telegram.</p>
                <button id="retry" class="button mt-4">Retry</button>
            </div>
        `;
        document.getElementById('retry')?.addEventListener('click', initWebApp);
        showToast('Failed to initialize app', 'error');
    }
}

async function checkUserStatus() {
    console.log('Checking user status...');
    try {
        userProfile = JSON.parse(localStorage.getItem('userProfile')) || null;
        if (!userProfile) {
            userProfile = {
                nickname: currentUser?.username || 'User',
                age: 18,
                country: 'USA',
                city: 'New York',
                gender: 'Male',
                interests: 'Music',
                photo: '/static/images/avatar.png',
                coins: 10,
                likes: [],
                matches: [],
                blocked: false
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            console.log('Set default profile:', userProfile);
        }
        console.log('Current profile:', userProfile);
        renderMainMenu();
    } catch (error) {
        console.error('Check user status error:', error);
        showToast('Failed to load profile', 'error');
        renderLogin();
    }
}

function renderLogin() {
    console.log('Rendering login page...');
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-4xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">CryptoDiveBot</h2>
            <p class="mb-6 text-gray-300">Join the ultimate crypto adventure!</p>
            <button id="startRegistration" class="button w-full">Start Now</button>
            <p class="mt-4 text-gray-400">Debug: App loaded</p>
        </div>
    `;
    const startButton = document.getElementById('startRegistration');
    if (startButton) {
        startButton.addEventListener('click', startRegistration);
        console.log('Start button event listener added');
    } else {
        console.error('Start button not found');
        showToast('UI error: Start button missing', 'error');
    }
}

function renderMainMenu() {
    console.log('Rendering main menu...');
    const isAdmin = currentUser && Telegram.WebApp?.initDataUnsafe?.user?.id && ADMIN_IDS.includes(Telegram.WebApp.initDataUnsafe.user.id);
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Menu</h2>
            <button id="viewProfile" class="button w-full mb-4">👤 Profile</button>
            <button id="findUsers" class="button w-full mb-4">🔍 Find Users</button>
            <button id="playQuiz" class="button w-full mb-4">🎮 Play Quiz</button>
            ${isAdmin ? '<button id="adminPanel" class="button w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">🛠 Admin Panel</button>' : ''}
            <p class="mt-4 text-gray-400">Debug: Menu loaded</p>
        </div>
    `;
    document.getElementById('viewProfile')?.addEventListener('click', viewProfile);
    document.getElementById('findUsers')?.addEventListener('click', findUsers);
    document.getElementById('playQuiz')?.addEventListener('click', playQuiz);
    if (document.getElementById('adminPanel')) {
        document.getElementById('adminPanel').addEventListener('click', adminPanel);
    }
}

let registrationStep = 0;
const registrationData = {};

function startRegistration() {
    console.log('Starting registration...');
    try {
        registrationStep = 0;
        registrationData = {};
        renderRegistrationStep();
    } catch (error) {
        console.error('Start registration error:', error);
        showToast('Failed to start registration', 'error');
    }
}

function renderRegistrationStep() {
    console.log('Rendering registration step:', registrationStep);
    const steps = [
        {
            title: 'Nickname',
            input: '<input id="nickname" type="text" placeholder="Your nickname" class="w-full p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition">'
        },
        {
            title: 'Age',
            input: '<input id="age" type="number" placeholder="Your age (18+)" class="w-full p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition">'
        },
        {
            title: 'Country',
            input: `
                <select id="country" class="w-full p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                    <option value="">Select country</option>
                    ${countries.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            `
        },
        {
            title: 'City',
            input: `
                <select id="city" class="w-full p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                    <option value="">Select city</option>
                </select>
            `
        },
        {
            title: 'Gender',
            input: `
                <select id="gender" class="w-full p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                    <option value="">Select gender</option>
                    ${genders.map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
            `
        },
        {
            title: 'Interests',
            input: `
                <div class="mb-4 grid grid-cols-2 gap-3">
                    ${interestsList.map(i => `
                        <label class="flex items-center text-sm"><input type="checkbox" value="${i}" class="mr-2 accent-purple-500">${i}</label>
                    `).join('')}
                </div>
            `
        },
        {
            title: 'Photo',
            input: `
                <input id="photo" type="file" accept="image/*" class="w-full p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg text-white">
                <button id="skipPhoto" class="button w-full mt-3 bg-gray-700/50 hover:bg-gray-800/50">Skip</button>
            `
        }
    ];

    if (registrationStep >= steps.length) {
        submitRegistration();
        return;
    }

    app.innerHTML = `
        <div class="card flip-in">
            <h2 class="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">${steps[registrationStep].title}</h2>
            <div class="progress-bar mb-6">
                <div class="h-4 rounded-full transition-all duration-300" style="width: ${(registrationStep + 1) / steps.length * 100}%"></div>
            </div>
            ${steps[registrationStep].input}
            <button id="nextStep" class="button w-full mt-4">Next</button>
            <p class="mt-4 text-gray-400">Debug: Step ${registrationStep + 1}</p>
        </div>
    `;

    const nextButton = document.getElementById('nextStep');
    if (nextButton) {
        nextButton.addEventListener('click', nextRegistrationStep);
        console.log('Next step button event listener added');
    } else {
        console.error('Next step button not found');
        showToast('UI error: Next button missing', 'error');
    }

    if (document.getElementById('skipPhoto')) {
        document.getElementById('skipPhoto').addEventListener('click', skipPhoto);
    }

    if (steps[registrationStep].title === 'City') {
        const country = registrationData.country || '';
        const citySelect = document.getElementById('city');
        citySelect.innerHTML = `<option value="">Select city</option>` + 
            (cities[country] || []).map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

function nextRegistrationStep() {
    console.log('Next registration step:', registrationStep);
    try {
        const stepFields = ['nickname', 'age', 'country', 'city', 'gender', 'interests', 'photo'];
        const field = stepFields[registrationStep];
        let value;

        if (field === 'interests') {
            value = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value).join(', ');
        } else if (field === 'photo') {
            const input = document.getElementById('photo');
            if (input && input.files.length) {
                const reader = new FileReader();
                reader.onload = () => {
                    registrationData.photo = reader.result;
                    console.log('Photo saved as base64:', registrationData.photo.substring(0, 50));
                    registrationStep++;
                    renderRegistrationStep();
                };
                reader.readAsDataURL(input.files[0]);
                return;
            } else {
                value = null;
            }
        } else {
            const input = document.getElementById(field);
            value = input ? input.value : '';
        }

        if (field !== 'photo' && !value) {
            showToast(`Please enter ${field}`, 'error');
            console.log('Validation failed for field:', field);
            return;
        }

        if (field === 'age' && (isNaN(value) || value < 18)) {
            showToast('Age must be a number and at least 18', 'error');
            console.log('Invalid age:', value);
            return;
        }

        registrationData[field] = value;
        console.log('Registration data updated:', registrationData);
        registrationStep++;
        renderRegistrationStep();
    } catch (error) {
        console.error('Next registration step error:', error);
        showToast('Registration error', 'error');
    }
}

function skipPhoto() {
    console.log('Skipping photo upload');
    registrationData.photo = null;
    registrationStep++;
    renderRegistrationStep();
}

function submitRegistration() {
    console.log('Submitting registration:', registrationData);
    try {
        const action = userProfile ? 'edit_profile' : 'register';
        registrationData.nickname = registrationData.nickname || userProfile?.nickname || 'User';
        registrationData.age = registrationData.age || userProfile?.age || 18;
        registrationData.country = registrationData.country || userProfile?.country || 'USA';
        registrationData.city = registrationData.city || userProfile?.city || 'New York';
        registrationData.gender = registrationData.gender || userProfile?.gender || 'Male';
        registrationData.interests = registrationData.interests || userProfile?.interests || 'Music';
        
        if (Telegram.WebApp) {
            Telegram.WebApp.sendData(JSON.stringify({
                action,
                data: registrationData
            }));
            console.log('Sent to Telegram:', { action, data: registrationData });
        } else {
            console.warn('No Telegram WebApp, simulating submission');
        }
        userProfile = { 
            ...registrationData, 
            coins: userProfile?.coins || 10,
            likes: userProfile?.likes || [],
            matches: userProfile?.matches || [],
            blocked: userProfile?.blocked || false
        };
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        showToast(action === 'register' ? 'Profile created!' : 'Profile updated!', 'success');
        renderMainMenu();
    } catch (error) {
        console.error('Submit registration error:', error);
        showToast('Failed to save profile', 'error');
    }
}

function viewProfile() {
    console.log('Viewing profile:', userProfile);
    try {
        const profile = userProfile || {
            nickname: currentUser?.username || 'User',
            age: 18,
            country: 'USA',
            city: 'New York',
            gender: 'Male',
            interests: 'Music',
            photo: '/static/images/avatar.png',
            coins: 10,
            likes: [],
            matches: [],
            blocked: false
        };
        app.innerHTML = `
            <div class="card flip-in">
                <div class="relative">
                    <div class="avatar-ring mx-auto w-36 h-36">
                        <img src="${profile.photo}" alt="Profile" class="w-full h-full object-cover rounded-full">
                    </div>
                    <div class="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-900/50 to-transparent rounded-t-2xl"></div>
                </div>
                <div class="p-4 text-center">
                    <h2 class="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">${profile.nickname}</h2>
                    <p class="text-gray-300">${profile.age} • ${profile.city}, ${profile.country}</p>
                    <p class="mt-2"><strong>Gender:</strong> ${profile.gender}</p>
                    <p class="mt-1"><strong>Interests:</strong> ${profile.interests}</p>
                    <p class="mt-1"><strong>Coins:</strong> <span id="coinCount" class="text-yellow-400 animate-pulse">💰 ${profile.coins}</span></p>
                    <button id="editProfile" class="button w-full mt-4">Edit Profile</button>
                    <button id="back" class="button w-full mt-2 bg-gray-700/50 hover:bg-gray-800/50">Back</button>
                    <p class="mt-4 text-gray-400">Debug: Profile loaded</p>
                </div>
            </div>
        `;
        const editButton = document.getElementById('editProfile');
        if (editButton) {
            editButton.addEventListener('click', editProfile);
            console.log('Edit profile button event listener added');
        } else {
            console.error('Edit profile button not found');
            showToast('UI error: Edit button missing', 'error');
        }
        document.getElementById('back').addEventListener('click', renderMainMenu);
    } catch (error) {
        console.error('View profile error:', error);
        showToast('Failed to load profile', 'error');
    }
}

function editProfile() {
    console.log('Editing profile, current userProfile:', userProfile);
    try {
        if (!userProfile) {
            console.error('No profile data to edit');
            showToast('No profile data to edit. Please register first.', 'error');
            renderLogin();
            return;
        }
        registrationStep = 0;
        registrationData = { ...userProfile };
        renderRegistrationStep();
        console.log('Registration data for edit:', registrationData);
    } catch (error) {
        console.error('Edit profile error:', error);
        showToast('Failed to edit profile', 'error');
    }
}

async function findUsers() {
    console.log('Finding users...');
    try {
        const users = [
            { id: 1, nickname: 'Alice', age: 25, city: userProfile?.city || 'New York', gender: 'Female', interests: 'Music, Travel', photo: '/static/images/avatar.png' },
            { id: 2, nickname: 'Bob', age: 30, city: userProfile?.city || 'New York', gender: 'Male', interests: 'Sports, Gaming', photo: '/static/images/avatar.png' }
        ];
        let currentIndex = 0;

        function renderUser() {
            if (currentIndex >= users.length) {
                app.innerHTML = `
                    <div class="card fade-in">
                        <h2 class="text-3xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">No More Users</h2>
                        <p class="text-gray-300 mb-4">Come back later!</p>
                        <button id="back" class="button w-full">Back</button>
                        <p class="mt-4 text-gray-400">Debug: No more users</p>
                    </div>
                `;
                document.getElementById('back').addEventListener('click', renderMainMenu);
                return;
            }
            const user = users[currentIndex];
            app.innerHTML = `
                <div class="card slide-in">
                    <img src="${user.photo}" alt="Profile" class="w-full h-72 object-cover rounded-t-2xl">
                    <div class="p-4">
                        <h2 class="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">${user.nickname}, ${user.age}</h2>
                        <p class="text-gray-300">${user.city}</p>
                        <p class="mb-4">${user.interests}</p>
                        <div class="flex justify-between">
                            <button id="likeButton" class="like-button">❤️</button>
                            <button id="nextButton" class="next-button">❌</button>
                        </div>
                    </div>
                    <p class="mt-4 text-gray-400 text-center">Debug: User ${user.id}</p>
                </div>
            `;
            document.getElementById('likeButton').addEventListener('click', () => likeUser(user.id));
            document.getElementById('nextButton').addEventListener('click', nextUser);
        }

        window.likeUser = function(userId) {
            if (Telegram.WebApp) {
                Telegram.WebApp.sendData(JSON.stringify({
                    action: 'like',
                    target_id: userId
                }));
            }
            currentIndex++;
            try {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#3b82f6', '#ec4899'] });
            } catch (e) {
                console.warn('Confetti not available:', e);
            }
            showToast('Liked!', 'success');
            renderUser();
        };

        window.nextUser = function() {
            currentIndex++;
            renderUser();
        };

        renderUser();
    } catch (error) {
        console.error('Find users error:', error);
        showToast('Failed to load users', 'error');
    }
}

function playQuiz() {
    console.log('Starting quiz...');
    const question = {
        id: '1',
        text: 'What is the capital of France?',
        options: ['Paris', 'London', 'Berlin', 'Madrid'],
        correct: 'Paris'
    };
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Quiz Time!</h2>
            <p class="mb-6 text-gray-200">${question.text}</p>
            <div class="grid gap-3">
                ${question.options.map(opt => `
                    <button class="button w-full quiz-option" data-answer="${opt}">${opt}</button>
                `).join('')}
            </div>
            <button id="back" class="button w-full mt-4 bg-gray-700/50 hover:bg-gray-800/50">Back</button>
            <p class="mt-4 text-gray-400">Debug: Quiz loaded</p>
        </div>
    `;
    document.querySelectorAll('.quiz-option').forEach(button => {
        button.addEventListener('click', () => {
            const answer = button.getAttribute('data-answer');
            submitQuizAnswer(question.id, answer);
            button.classList.add(answer === question.correct ? 'bg-green-600' : 'bg-red-600');
            showToast(answer === question.correct ? 'Correct!' : 'Wrong!', answer === question.correct ? 'success' : 'error');
            setTimeout(renderMainMenu, 1000);
        });
    });
    document.getElementById('back').addEventListener('click', renderMainMenu);
}

function submitQuizAnswer(questionId, answer) {
    if (Telegram.WebApp) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'quiz_answer',
            question_id: questionId,
            answer: answer
        }));
    }
}

function adminPanel() {
    console.log('Opening admin panel...');
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Admin Panel</h2>
            <div class="grid gap-3">
                <button id="viewStats" class="button bg-purple-600 hover:bg-purple-700">📊 View Stats</button>
                <button id="manageCoins" class="button bg-blue-600 hover:bg-blue-700">💰 Manage Coins</button>
                <button id="viewUsers" class="button bg-green-600 hover:bg-green-700">👥 View Users</button>
                <button id="banUser" class="button bg-red-600 hover:bg-red-700">🚫 Ban User</button>
                <button id="sendBroadcast" class="button bg-pink-600 hover:bg-pink-700">📢 Send Broadcast</button>
                <button id="back" class="button bg-gray-700/50 hover:bg-gray-800/50">Back</button>
            </div>
            <p class="mt-4 text-gray-400">Debug: Admin panel loaded</p>
        </div>
    `;
    document.getElementById('viewStats').addEventListener('click', viewStats);
    document.getElementById('manageCoins').addEventListener('click', manageCoins);
    document.getElementById('viewUsers').addEventListener('click', viewUsers);
    document.getElementById('banUser').addEventListener('click', banUser);
    document.getElementById('sendBroadcast').addEventListener('click', sendBroadcast);
    document.getElementById('back').addEventListener('click', renderMainMenu);
}

function viewStats() {
    if (Telegram.WebApp) {
        Telegram.WebApp.sendData(JSON.stringify({ action: 'admin_stats' }));
    }
    showToast('Fetching stats...', 'info');
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Statistics</h2>
            <p class="mb-2"><strong>Users:</strong> 123</p>
            <p class="mb-2"><strong>Matches:</strong> 456</p>
            <p class="mb-4"><strong>Active Chats:</strong> 789</p>
            <button id="back" class="button w-full">Back</button>
            <p class="mt-4 text-gray-400">Debug: Stats loaded</p>
        </div>
    `;
    document.getElementById('back').addEventListener('click', adminPanel);
}

function manageCoins() {
    const userId = prompt('Enter user ID:');
    const amount = prompt('Enter coins amount (positive to add, negative to subtract):');
    if (userId && amount) {
        if (Telegram.WebApp) {
            Telegram.WebApp.sendData(JSON.stringify({ action: 'admin_coins', user_id: userId, amount: parseInt(amount) }));
        }
        showToast(`Coins updated for user ${userId}`, 'success');
    } else {
        showToast('Invalid input', 'error');
    }
    adminPanel();
}

function viewUsers() {
    const users = [
        { id: 1, nickname: 'Alice', coins: 50, photo: '/static/images/avatar.png' },
        { id: 2, nickname: 'Bob', coins: 30, photo: '/static/images/avatar.png' }
    ];
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Users</h2>
            <div class="grid gap-3">
                ${users.map(user => `
                    <div class="flex items-center p-3 bg-gray-800/50 rounded-lg">
                        <img src="${user.photo}" alt="${user.nickname}" class="w-10 h-10 rounded-full mr-3">
                        <div>
                            <p><strong>${user.nickname}</strong> (ID: ${user.id})</p>
                            <p>Coins: ${user.coins}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button id="back" class="button w-full mt-4">Back</button>
            <p class="mt-4 text-gray-400">Debug: Users loaded</p>
        </div>
    `;
    document.getElementById('back').addEventListener('click', adminPanel);
}

function banUser() {
    const userId = prompt('Enter user ID to ban:');
    if (userId) {
        if (Telegram.WebApp) {
            Telegram.WebApp.sendData(JSON.stringify({ action: 'ban_user', user_id: userId }));
        }
        showToast(`User ${userId} banned`, 'success');
    } else {
        showToast('Invalid user ID', 'error');
    }
    adminPanel();
}

function sendBroadcast() {
    const message = prompt('Enter broadcast message:');
    if (message) {
        if (Telegram.WebApp) {
            Telegram.WebApp.sendData(JSON.stringify({ action: 'broadcast', message }));
        }
        showToast('Broadcast sent', 'success');
    } else {
        showToast('Invalid message', 'error');
    }
    adminPanel();
}

// Initialize
initWebApp();

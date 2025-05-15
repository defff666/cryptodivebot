const app = document.getElementById('app');
let currentUser = null;
let userProfile = null;

// Данные
const countries = ['USA', 'UK', 'Canada', 'Australia'];
const cities = {
    'USA': ['New York', 'Los Angeles', 'Chicago'],
    'UK': ['London', 'Manchester', 'Birmingham'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane']
};
const interestsList = ['Music', 'Sports', 'Travel', 'Gaming', 'Food'];
const genders = ['Male', 'Female', 'Bi', 'Lesbian', 'Gay'];

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function initWebApp() {
    try {
        if (typeof Telegram === 'undefined' || !Telegram.WebApp) {
            console.error('Telegram WebApp not available');
            app.innerHTML = '<div class="card"><p class="text-red-500">Error: Telegram WebApp not loaded</p></div>';
            return;
        }
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        currentUser = Telegram.WebApp.initDataUnsafe.user;
        if (!currentUser) {
            renderLogin();
        } else {
            checkUserStatus();
        }
    } catch (error) {
        console.error('Error initializing Web App:', error);
        app.innerHTML = '<div class="card"><p class="text-red-500">Error: ' + error.message + '</p></div>';
    }
}

async function checkUserStatus() {
    // Симуляция загрузки профиля (замени на API)
    userProfile = JSON.parse(localStorage.getItem('userProfile')) || null;
    renderMainMenu();
}

function renderLogin() {
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-4xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">CryptoDiveBot</h2>
            <p class="mb-6 text-gray-300">Join the ultimate crypto adventure!</p>
            <button id="startRegistration" class="button w-full">Start Now</button>
        </div>
    `;
    document.getElementById('startRegistration').addEventListener('click', startRegistration);
}

function renderMainMenu() {
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Menu</h2>
            <button id="viewProfile" class="button w-full mb-4">👤 Profile</button>
            <button id="findUsers" class="button w-full mb-4">🔍 Find Users</button>
            <button id="playQuiz" class="button w-full mb-4">🎮 Play Quiz</button>
            ${currentUser && currentUser.id in (Telegram.WebApp.initDataUnsafe.admin_ids || []) ? 
                '<button id="adminPanel" class="button w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">🛠 Admin Panel</button>' : ''}
        </div>
    `;
    document.getElementById('viewProfile').addEventListener('click', viewProfile);
    document.getElementById('findUsers').addEventListener('click', findUsers);
    document.getElementById('playQuiz').addEventListener('click', playQuiz);
    if (document.getElementById('adminPanel')) {
        document.getElementById('adminPanel').addEventListener('click', adminPanel);
    }
}

let registrationStep = 0;
const registrationData = {};

function startRegistration() {
    registrationStep = 0;
    registrationData = {};
    renderRegistrationStep();
}

function renderRegistrationStep() {
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
        </div>
    `;

    document.getElementById('nextStep').addEventListener('click', nextRegistrationStep);
    if (document.getElementById('skipPhoto')) {
        document.getElementById('skipPhoto').addEventListener('click', skipPhoto);
    }

    if (steps[registrationStep].title === 'City') {
        const country = registrationData.country;
        const citySelect = document.getElementById('city');
        citySelect.innerHTML = `<option value="">Select city</option>` + 
            (cities[country] || []).map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

function nextRegistrationStep() {
    const stepFields = ['nickname', 'age', 'country', 'city', 'gender', 'interests', 'photo'];
    const field = stepFields[registrationStep];
    let value;

    if (field === 'interests') {
        value = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value).join(', ');
    } else if (field === 'photo') {
        const input = document.getElementById('photo');
        if (input.files.length) {
            const reader = new FileReader();
            reader.onload = () => {
                registrationData.photo = reader.result; // base64
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
        value = document.getElementById(field)?.value;
    }

    if (field !== 'photo' && !value) {
        showToast(`Please enter ${field}`, 'error');
        return;
    }

    if (field === 'age' && (isNaN(value) || value < 18)) {
        showToast('Age must be a number and at least 18', 'error');
        return;
    }

    registrationData[field] = value;
    registrationStep++;
    renderRegistrationStep();
}

function skipPhoto() {
    registrationData.photo = null;
    registrationStep++;
    renderRegistrationStep();
}

function submitRegistration() {
    const action = userProfile ? 'edit_profile' : 'register';
    Telegram.WebApp.sendData(JSON.stringify({
        action,
        data: registrationData
    }));
    userProfile = { ...registrationData, coins: userProfile?.coins || 10 };
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    showToast(action === 'register' ? 'Profile created!' : 'Profile updated!', 'success');
    renderMainMenu();
}

function viewProfile() {
    const profile = userProfile || {
        nickname: 'User',
        age: 18,
        country: 'Unknown',
        city: 'Unknown',
        gender: 'Unknown',
        interests: 'None',
        photo: 'static/images/avatar.png',
        coins: 10
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
            </div>
        </div>
        <script>
            let coins = ${profile.coins};
            setInterval(() => {
                coins += 1;
                document.getElementById('coinCount').textContent = \`💰 \${coins}\`;
                document.getElementById('coinCount').classList.add('animate-bounce');
                setTimeout(() => document.getElementById('coinCount').classList.remove('animate-bounce'), 500);
            }, 10000);
        </script>
    `;
    document.getElementById('editProfile').addEventListener('click', editProfile);
    document.getElementById('back').addEventListener('click', renderMainMenu);
}

function editProfile() {
    registrationStep = 0;
    registrationData = { ...userProfile };
    renderRegistrationStep();
}

async function findUsers() {
    const users = [
        { id: 1, nickname: 'Alice', age: 25, city: 'New York', gender: 'Female', interests: 'Music, Travel', photo: 'static/images/avatar.png' },
        { id: 2, nickname: 'Bob', age: 30, city: 'New York', gender: 'Male', interests: 'Sports, Gaming', photo: 'static/images/avatar.png' }
    ];
    let currentIndex = 0;

    function renderUser() {
        if (currentIndex >= users.length) {
            app.innerHTML = `
                <div class="card fade-in">
                    <h2 class="text-3xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">No More Users</h2>
                    <p class="text-gray-300 mb-4">Come back later!</p>
                    <button id="back" class="button w-full">Back</button>
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
            </div>
        `;
        document.getElementById('likeButton').addEventListener('click', () => likeUser(user.id));
        document.getElementById('nextButton').addEventListener('click', nextUser);
    }

    window.likeUser = function(userId) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'like',
            target_id: userId
        }));
        currentIndex++;
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#3b82f6', '#ec4899'] });
        showToast('Liked!', 'success');
        document.getElementById('likeSound')?.play();
        renderUser();
    };

    window.nextUser = function() {
        currentIndex++;
        renderUser();
    };

    renderUser();
}

function playQuiz() {
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
        </div>
    `;
    document.querySelectorAll('.quiz-option').forEach(button => {
        button.addEventListener('click', () => {
            const answer = button.getAttribute('data-answer');
            submitQuizAnswer(question.id, answer);
            button.classList.add(answer === question.correct ? 'bg-green-600' : 'bg-red-600');
            showToast(answer === question.correct ? 'Correct!' : 'Wrong!', answer === question.correct ? 'success' : 'error');
            document.getElementById('quizSound')?.play();
            setTimeout(renderMainMenu, 1000);
        });
    });
    document.getElementById('back').addEventListener('click', renderMainMenu);
}

function submitQuizAnswer(questionId, answer) {
    Telegram.WebApp.sendData(JSON.stringify({
        action: 'quiz_answer',
        question_id: questionId,
        answer: answer
    }));
}

function adminPanel() {
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
    Telegram.WebApp.sendData(JSON.stringify({ action: 'admin_stats' }));
    showToast('Fetching stats...', 'info');
    // Симуляция (замени на API)
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Statistics</h2>
            <p class="mb-2"><strong>Users:</strong> 123</p>
            <p class="mb-2"><strong>Matches:</strong> 456</p>
            <p class="mb-4"><strong>Active Chats:</strong> 789</p>
            <button id="back" class="button w-full">Back</button>
        </div>
    `;
    document.getElementById('back').addEventListener('click', adminPanel);
}

function manageCoins() {
    const userId = prompt('Enter user ID:');
    const amount = prompt('Enter coins amount (positive to add, negative to subtract):');
    if (userId && amount) {
        Telegram.WebApp.sendData(JSON.stringify({ action: 'admin_coins', user_id: userId, amount: parseInt(amount) }));
        showToast(`Coins updated for user ${userId}`, 'success');
    } else {
        showToast('Invalid input', 'error');
    }
}

function viewUsers() {
    // Симуляция (замени на API)
    const users = [
        { id: 1, nickname: 'Alice', coins: 50, photo: 'static/images/avatar.png' },
        { id: 2, nickname: 'Bob', coins: 30, photo: 'static/images/avatar.png' }
    ];
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Users</h2>
            <div class="grid gap-2">
                ${users.map(u => `
                    <div class="bg-gray-800/50 backdrop-blur-sm p-3 rounded-lg">
                        <div class="flex items-center">
                            <img src="${u.photo}" alt="${u.nickname}" class="w-12 h-12 rounded-full mr-3">
                            <div>
                                <p><strong>${u.nickname}</strong> (ID: ${u.id})</p>
                                <p>Coins: ${u.coins}</p>
                            </div>
                        </div>
                        <button class="button bg-blue-600 hover:bg-blue-700 mt-2 w-full" onclick="editUser(${u.id})">Edit</button>
                    </div>
                `).join('')}
            </div>
            <button id="back" class="button w-full mt-4">Back</button>
        </div>
    `;
    document.getElementById('back').addEventListener('click', adminPanel);
}

function editUser(userId) {
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Edit User ${userId}</h2>
            <input id="nickname" type="text" placeholder="Nickname" class="w-full p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg mb-3">
            <input id="coins" type="number" placeholder="Coins" class="w-full p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg mb-3">
            <button id="save" class="button w-full">Save</button>
            <button id="back" class="button w-full mt-2 bg-gray-700/50 hover:bg-gray-800/50">Back</button>
        </div>
    `;
    document.getElementById('save').addEventListener('click', () => {
        const nickname = document.getElementById('nickname').value;
        const coins = document.getElementById('coins').value;
        if (!nickname && !coins) {
            showToast('Enter at least one field', 'error');
            return;
        }
        Telegram.WebApp.sendData(JSON.stringify({ 
            action: 'admin_edit_user', 
            user_id: userId, 
            nickname: nickname || undefined, 
            coins: coins ? parseInt(coins) : undefined 
        }));
        showToast(`User ${userId} updated`, 'success');
        viewUsers();
    });
    document.getElementById('back').addEventListener('click', viewUsers);
}

function banUser() {
    const userId = prompt('Enter user ID to ban:');
    if (userId) {
        Telegram.WebApp.sendData(JSON.stringify({ action: 'admin_ban', user_id: userId }));
        showToast(`User ${userId} banned`, 'success');
    } else {
        showToast('Invalid user ID', 'error');
    }
}

function sendBroadcast() {
    const text = prompt('Enter broadcast message:');
    if (text) {
        Telegram.WebApp.sendData(JSON.stringify({ action: 'admin_broadcast', text }));
        showToast('Broadcast sent', 'success');
    } else {
        showToast('Enter a message', 'error');
    }
}

initWebApp();

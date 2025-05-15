const app = document.getElementById('app');
let currentUser = null;

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
    renderMainMenu();
}

function renderLogin() {
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-bold mb-6 text-blue-400">CryptoDiveBot</h2>
            <p class="mb-4 text-gray-300">Join the crypto adventure!</p>
            <button id="startRegistration" class="button w-full">Start Registration</button>
        </div>
    `;
    document.getElementById('startRegistration').addEventListener('click', startRegistration);
}

function renderMainMenu() {
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-3xl font-bold mb-6 text-blue-400">Main Menu</h2>
            <button id="viewProfile" class="button w-full mb-3">👤 Profile</button>
            <button id="findUsers" class="button w-full mb-3">🔍 Find Users</button>
            <button id="playQuiz" class="button w-full mb-3">🎮 Play Quiz</button>
            ${currentUser && currentUser.id in (Telegram.WebApp.initDataUnsafe.admin_ids || []) ? 
                '<button id="adminPanel" class="button w-full bg-purple-600 hover:bg-purple-700">🛠 Admin Panel</button>' : ''}
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
            input: '<input id="nickname" type="text" placeholder="Enter your nickname" class="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition">'
        },
        {
            title: 'Age',
            input: '<input id="age" type="number" placeholder="Enter your age (18+)" class="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition">'
        },
        {
            title: 'Country',
            input: `
                <select id="country" class="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                    <option value="">Select country</option>
                    ${countries.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            `
        },
        {
            title: 'City',
            input: `
                <select id="city" class="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                    <option value="">Select city</option>
                </select>
            `
        },
        {
            title: 'Gender',
            input: `
                <select id="gender" class="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                    <option value="">Select gender</option>
                    ${genders.map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
            `
        },
        {
            title: 'Interests',
            input: `
                <div class="mb-4 grid grid-cols-2 gap-2">
                    ${interestsList.map(i => `
                        <label class="flex items-center"><input type="checkbox" value="${i}" class="mr-2 accent-blue-500">${i}</label>
                    `).join('')}
                </div>
            `
        },
        {
            title: 'Photo',
            input: `
                <input id="photo" type="file" accept="image/*" class="w-full p-3 bg-gray-700 rounded-lg text-white">
                <button id="skipPhoto" class="button w-full mt-2 bg-gray-600 hover:bg-gray-700">Skip</button>
            `
        }
    ];

    if (registrationStep >= steps.length) {
        submitRegistration();
        return;
    }

    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-2xl font-bold mb-4 text-blue-400">${steps[registrationStep].title}</h2>
            <div class="progress-bar mb-4">
                <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${(registrationStep + 1) / steps.length * 100}%"></div>
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
        value = input.files.length ? URL.createObjectURL(input.files[0]) : null;
    } else {
        value = document.getElementById(field)?.value;
    }

    if (field !== 'photo' && !value) {
        app.innerHTML += '<p class="text-red-500 mt-2">Please enter ' + field + '</p>';
        setTimeout(() => renderRegistrationStep(), 2000);
        return;
    }

    if (field === 'age' && (isNaN(value) || value < 18)) {
        app.innerHTML += '<p class="text-red-500 mt-2">Age must be a number and at least 18</p>';
        setTimeout(() => renderRegistrationStep(), 2000);
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
    Telegram.WebApp.sendData(JSON.stringify({
        action: 'register',
        data: registrationData
    }));
    renderMainMenu();
}

function viewProfile() {
    const profile = {
        nickname: registrationData.nickname || 'User',
        age: registrationData.age || 18,
        country: registrationData.country || 'Unknown',
        city: registrationData.city || 'Unknown',
        gender: registrationData.gender || 'Unknown',
        interests: registrationData.interests || 'None',
        photo: registrationData.photo || 'static/images/avatar.png',
        coins: 10
    };
    app.innerHTML = `
        <div class="card fade-in">
            <div class="relative">
                <img src="${profile.photo}" alt="Profile" class="w-full h-64 object-cover rounded-t-2xl">
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-4">
                    <h2 class="text-2xl font-bold text-white">${profile.nickname}</h2>
                    <p class="text-gray-300">${profile.age} • ${profile.city}, ${profile.country}</p>
                </div>
            </div>
            <div class="p-4">
                <p class="mb-2"><strong>Gender:</strong> ${profile.gender}</p>
                <p class="mb-2"><strong>Interests:</strong> ${profile.interests}</p>
                <p class="mb-4"><strong>Coins:</strong> <span class="text-yellow-400">💰 ${profile.coins}</span></p>
                <button id="editProfile" class="button w-full">Edit Profile</button>
                <button id="back" class="button w-full mt-2 bg-gray-600 hover:bg-gray-700">Back</button>
            </div>
        </div>
    `;
    document.getElementById('editProfile').addEventListener('click', editProfile);
    document.getElementById('back').addEventListener('click', renderMainMenu);
}

function editProfile() {
    registrationStep = 0;
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
                    <h2 class="text-2xl font-bold mb-4 text-blue-400">No more users</h2>
                    <p class="text-gray-300 mb-4">Check back later!</p>
                    <button id="back" class="button w-full">Back</button>
                </div>
            `;
            document.getElementById('back').addEventListener('click', renderMainMenu);
            return;
        }
        const user = users[currentIndex];
        app.innerHTML = `
            <div class="card slide-in">
                <img src="${user.photo}" alt="Profile" class="w-full h-64 object-cover rounded-t-2xl">
                <div class="p-4">
                    <h2 class="text-2xl font-bold">${user.nickname}, ${user.age}</h2>
                    <p class="text-gray-300">${user.city}</p>
                    <p class="mb-4">${user.interests}</p>
                    <div class="flex justify-between">
                        <button id="likeButton" class="like-button text-3xl">❤️</button>
                        <button id="nextButton" class="next-button text-3xl">❌</button>
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
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
            <h2 class="text-2xl font-bold mb-4 text-blue-400">Quiz Time!</h2>
            <p class="mb-4 text-gray-200">${question.text}</p>
            <div class="grid gap-2">
                ${question.options.map(opt => `
                    <button class="button w-full quiz-option" data-answer="${opt}">${opt}</button>
                `).join('')}
            </div>
            <button id="back" class="button w-full mt-4 bg-gray-600 hover:bg-gray-700">Back</button>
        </div>
    `;
    document.querySelectorAll('.quiz-option').forEach(button => {
        button.addEventListener('click', () => {
            const answer = button.getAttribute('data-answer');
            submitQuizAnswer(question.id, answer);
            button.classList.add(answer === question.correct ? 'bg-green-600' : 'bg-red-600');
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
            <h2 class="text-2xl font-bold mb-4 text-purple-400">Admin Panel</h2>
            <button id="viewStats" class="button w-full mb-3 bg-purple-600 hover:bg-purple-700">📊 View Stats</button>
            <button id="banUser" class="button w-full mb-3 bg-red-600 hover:bg-red-700">🚫 Ban User</button>
            <button id="sendBroadcast" class="button w-full mb-3 bg-green-600 hover:bg-green-700">📢 Send Broadcast</button>
            <button id="back" class="button w-full bg-gray-600 hover:bg-gray-700">Back</button>
        </div>
    `;
    document.getElementById('viewStats').addEventListener('click', viewStats);
    document.getElementById('banUser').addEventListener('click', banUser);
    document.getElementById('sendBroadcast').addEventListener('click', sendBroadcast);
    document.getElementById('back').addEventListener('click', renderMainMenu);
}

function viewStats() {
    Telegram.WebApp.sendData(JSON.stringify({ action: 'admin_stats' }));
}

function banUser() {
    const userId = prompt('Enter user ID to ban:');
    if (userId) {
        Telegram.WebApp.sendData(JSON.stringify({ action: 'admin_ban', user_id: userId }));
    }
}

function sendBroadcast() {
    const text = prompt('Enter broadcast message:');
    if (text) {
        Telegram.WebApp.sendData(JSON.stringify({ action: 'admin_broadcast', text }));
    }
}

initWebApp();

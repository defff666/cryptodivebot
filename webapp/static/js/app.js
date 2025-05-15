// Инициализация Web App
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
            app.innerHTML = '<div class="card"><p>Error: Telegram WebApp not loaded</p></div>';
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
        app.innerHTML = '<div class="card"><p>Error: ' + error.message + '</p></div>';
    }
}

async function checkUserStatus() {
    renderMainMenu();
}

function renderLogin() {
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-2xl font-bold mb-4">Welcome to CryptoDiveBot</h2>
            <button id="startRegistration" class="button">Start Registration</button>
        </div>
    `;
    document.getElementById('startRegistration').addEventListener('click', startRegistration);
}

function renderMainMenu() {
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-2xl font-bold mb-4">Main Menu</h2>
            <button id="viewProfile" class="button mb-2">View Profile</button>
            <button id="findUsers" class="button mb-2">Find Users</button>
            <button id="playQuiz" class="button mb-2">Play Quiz</button>
            ${currentUser && currentUser.id in (Telegram.WebApp.initDataUnsafe.admin_ids || []) ? 
                '<button id="adminPanel" class="button">Admin Panel</button>' : ''}
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
            input: '<input id="nickname" type="text" placeholder="Enter your nickname" class="w-full p-2 mb-4 bg-gray-700 rounded">'
        },
        {
            title: 'Age',
            input: '<input id="age" type="number" placeholder="Enter your age (18+)" class="w-full p-2 mb-4 bg-gray-700 rounded">'
        },
        {
            title: 'Country',
            input: `
                <select id="country" class="w-full p-2 mb-4 bg-gray-700 rounded">
                    <option value="">Select country</option>
                    ${countries.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            `
        },
        {
            title: 'City',
            input: `
                <select id="city" class="w-full p-2 mb-4 bg-gray-700 rounded">
                    <option value="">Select city</option>
                </select>
            `
        },
        {
            title: 'Gender',
            input: `
                <select id="gender" class="w-full p-2 mb-4 bg-gray-700 rounded">
                    <option value="">Select gender</option>
                    ${genders.map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
            `
        },
        {
            title: 'Interests',
            input: `
                <div class="mb-4">
                    ${interestsList.map(i => `
                        <label class="block"><input type="checkbox" value="${i}" class="mr-2">${i}</label>
                    `).join('')}
                </div>
            `
        },
        {
            title: 'Photo',
            input: `
                <input id="photo" type="file" accept="image/*" class="w-full p-2 mb-4 bg-gray-700 rounded">
                <button id="skipPhoto" class="button">Skip</button>
            `
        }
    ];

    if (registrationStep >= steps.length) {
        submitRegistration();
        return;
    }

    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-2xl font-bold mb-4">${steps[registrationStep].title}</h2>
            <div class="progress-bar mb-4">
                <div class="bg-blue-600 h-2 rounded" style="width: ${(registrationStep + 1) / steps.length * 100}%"></div>
            </div>
            ${steps[registrationStep].input}
            <button id="nextStep" class="button">Next</button>
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
        alert(`Please enter ${field}`);
        return;
    }

    if (field === 'age' && (isNaN(value) || value < 18)) {
        alert('Age must be a number and at least 18');
        return;
    }

    registrationData[field] = value;
    registrationStep++;
    renderRegistrationStep();
}

function skipPhoto() {
    if (confirm('Skip photo?')) {
        registrationData.photo = null;
        registrationStep++;
        renderRegistrationStep();
    }
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
            <h2 class="text-2xl font-bold mb-4">Your Profile</h2>
            <img src="${profile.photo}" alt="Profile" class="w-full h-48 object-cover rounded-lg mb-4">
            <p><strong>Nickname:</strong> ${profile.nickname}</p>
            <p><strong>Age:</strong> ${profile.age}</p>
            <p><strong>City:</strong> ${profile.city}, ${profile.country}</p>
            <p><strong>Gender:</strong> ${profile.gender}</p>
            <p><strong>Interests:</strong> ${profile.interests}</p>
            <p><strong>Coins:</strong> ${profile.coins}</p>
            <button id="editProfile" class="button mt-4">Edit Profile</button>
            <button id="back" class="button mt-2">Back</button>
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
                    <h2 class="text-2xl font-bold mb-4">No more users</h2>
                    <button id="back" class="button">Back</button>
                </div>
            `;
            document.getElementById('back').addEventListener('click', renderMainMenu);
            return;
        }
        const user = users[currentIndex];
        app.innerHTML = `
            <div class="card slide-in">
                <img src="${user.photo}" alt="Profile" class="w-full h-48 object-cover rounded-lg mb-4">
                <p><strong>${user.nickname}</strong>, ${user.age}</p>
                <p>${user.city}</p>
                <p>${user.interests}</p>
                <div class="flex justify-between mt-4">
                    <button id="likeButton" class="like-button">❤️</button>
                    <button id="nextButton" class="next-button">❌</button>
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
        renderUser();
        alert("It's a Match!");
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
            <h2 class="text-2xl font-bold mb-4">Quiz</h2>
            <p class="mb-4">${question.text}</p>
            ${question.options.map(opt => `
                <button class="button mb-2 w-full quiz-option">${opt}</button>
            `).join('')}
            <button id="back" class="button mt-2">Back</button>
        </div>
    `;
    document.querySelectorAll('.quiz-option').forEach(button => {
        button.addEventListener('click', () => submitQuizAnswer(question.id, button.textContent));
    });
    document.getElementById('back').addEventListener('click', renderMainMenu);
}

function submitQuizAnswer(questionId, answer) {
    Telegram.WebApp.sendData(JSON.stringify({
        action: 'quiz_answer',
        question_id: questionId,
        answer: answer
    }));
    renderMainMenu();
}

function adminPanel() {
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-2xl font-bold mb-4">Admin Panel</h2>
            <button id="viewStats" class="button mb-2">View Stats</button>
            <button id="banUser" class="button mb-2">Ban User</button>
            <button id="sendBroadcast" class="button mb-2">Send Broadcast</button>
            <button id="back" class="button">Back</button>
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

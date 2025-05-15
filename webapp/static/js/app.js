const app = document.getElementById('app');
let currentUser = null;

// Countries and cities (simplified)
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
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    currentUser = Telegram.WebApp.initDataUnsafe.user;
    if (!currentUser) {
        renderLogin();
    } else {
        checkUserStatus();
    }
}

async function checkUserStatus() {
    // Simulate checking user registration (handled by backend)
    renderMainMenu();
}

function renderLogin() {
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-2xl font-bold mb-4">Welcome to CryptoDiveBot</h2>
            <button class="button" onclick="startRegistration()">Start Registration</button>
        </div>
    `;
}

function renderMainMenu() {
    app.innerHTML = `
        <div class="card fade-in">
            <h2 class="text-2xl font-bold mb-4">Main Menu</h2>
            <button class="button mb-2" onclick="viewProfile()">View Profile</button>
            <button class="button mb-2" onclick="findUsers()">Find Users</button>
            <button class="button mb-2" onclick="playQuiz()">Play Quiz</button>
            ${currentUser && currentUser.id in Telegram.WebApp.initDataUnsafe.admin_ids ? 
                '<button class="button" onclick="adminPanel()">Admin Panel</button>' : ''}
        </div>
    `;
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
                <button class="button" onclick="skipPhoto()">Skip</button>
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
            <button class="button" onclick="nextRegistrationStep()">Next</button>
        </div>
    `;

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
    // Simulate fetching profile (handled by backend)
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
            <button class="button mt-4" onclick="editProfile()">Edit Profile</button>
            <button class="button mt-2" onclick="renderMainMenu()">Back</button>
        </div>
    `;
}

function editProfile() {
    registrationStep = 0;
    renderRegistrationStep();
}

async function findUsers() {
    // Simulate fetching users (handled by backend)
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
                    <button class="button" onclick="renderMainMenu()">Back</button>
                </div>
            `;
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
                    <button class="like-button" onclick="likeUser(${user.id})">❤️</button>
                    <button class="next-button" onclick="nextUser()">❌</button>
                </div>
            </div>
        `;
    }

    window.likeUser = function(userId) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'like',
            target_id: userId
        }));
        currentIndex++;
        renderUser();
        // Simulate confetti
        alert("It's a Match!"); // Replace with confetti library
    };

    window.nextUser = function() {
        currentIndex++;
        renderUser();
    };

    renderUser();
}

function playQuiz() {
    // Simulate quiz (handled by backend)
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
                <button class="button mb-2 w-full" onclick="submitQuizAnswer('${question.id}', '${opt}')">${opt}</button>
            `).join('')}
            <button class="button mt-2" onclick="renderMainMenu()">Back</button>
        </div>
    `;
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
            <button class="button mb-2" onclick="viewStats()">View Stats</button>
            <button class="button mb-2" onclick="banUser()">Ban User</button>
            <button class="button mb-2" onclick="sendBroadcast()">Send Broadcast</button>
            <button class="button" onclick="renderMainMenu()">Back</button>
        </div>
    `;
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
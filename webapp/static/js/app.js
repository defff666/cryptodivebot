const steps = [
    { id: "nickname", label: "Nickname", type: "text", maxLength: 50, required: true },
    { id: "age", label: "Age (18+)", type: "number", min: 18, required: true },
    { id: "country", label: "Country", type: "text", required: true },
    { id: "city", label: "City", type: "text", required: true },
    { id: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Bi", "Lesbian", "Gay"], required: true },
    { id: "interests", label: "Interests", type: "select", options: ["Music", "Sports", "Travel", "Movies", "Books"], multiple: true, required: true },
    { id: "photo", label: "Photo", type: "file", required: false }
];

let currentStep = 0;
let userData = {};

function init() {
    Telegram.WebApp.onEvent("mainButtonClicked", submitStep);
    checkUser();
}

async function checkUser() {
    try {
        const response = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: Telegram.WebApp.initDataUnsafe.user.id })
        });
        const user = await response.json();
        if (user) {
            showProfile(user);
        } else {
            showRegistration();
        }
    } catch (e) {
        console.error("Error checking user:", e);
        showError("Failed to load user data.");
    }
}

function showRegistration() {
    document.getElementById("registration").classList.remove("hidden");
    renderStep();
}

function renderStep() {
    const step = steps[currentStep];
    let html = `<label class="block text-sm font-medium mb-2">${step.label}</label>`;
    if (step.type === "select") {
        html += `<select id="${step.id}" ${step.multiple ? "multiple" : ""} class="w-full bg-gray-700 p-2 rounded mb-4 animate-slide-in">`;
        step.options.forEach(opt => {
            html += `<option value="${opt}">${opt}</option>`;
        });
        html += `</select>`;
    } else if (step.type === "file") {
        html += `<input id="${step.id}" type="file" accept="image/*" class="w-full bg-gray-700 p-2 rounded mb-4 animate-slide-in" />`;
        html += `<button onclick="skipPhoto()" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mt-2">Skip Photo</button>`;
    } else {
        html += `<input id="${step.id}" type="${step.type}" ${step.maxLength ? `maxlength="${step.maxLength}"` : ""} ${step.min ? `min="${step.min}"` : ""} class="w-full bg-gray-700 p-2 rounded mb-4 animate-slide-in" required />`;
    }
    document.getElementById("form-content").innerHTML = html;
    document.getElementById("progress-bar").style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    Telegram.WebApp.MainButton.setText(currentStep < steps.length - 1 ? "Next" : "Submit").show();
}

async function submitStep() {
    const step = steps[currentStep];
    const input = document.getElementById(step.id);
    if (step.required && !input.value && step.type !== "file") {
        showError(`${step.label} is required.`);
        return;
    }
    if (step.type === "number" && input.value < step.min) {
        showError(`${step.label} must be at least ${step.min}.`);
        return;
    }
    userData[step.id] = step.type === "select" && step.multiple ? Array.from(input.selectedOptions).map(opt => opt.value) : input.value;
    if (step.type === "file" && input.files.length > 0) {
        userData[step.id] = await uploadPhoto(input.files[0]);
    }
    currentStep++;
    if (currentStep < steps.length) {
        renderStep();
    } else {
        await submitProfile();
    }
}

async function uploadPhoto(file) {
    const formData = new FormData();
    formData.append("photo", file);
    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
    });
    const result = await response.json();
    return result.url;
}

async function submitProfile() {
    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: Telegram.WebApp.initDataUnsafe.user.id, ...userData })
        });
        if (response.ok) {
            showProfile(await response.json());
        } else {
            showError("Registration failed.");
        }
    } catch (e) {
        console.error("Error submitting profile:", e);
        showError("Failed to submit profile.");
    }
}

function skipPhoto() {
    userData.photo = null;
    currentStep++;
    if (currentStep < steps.length) {
        renderStep();
    } else {
        submitProfile();
    }
}

function showProfile(user) {
    document.getElementById("registration").classList.add("hidden");
    document.getElementById("profile").classList.remove("hidden");
    document.getElementById("profile-photo").src = user.photo_url || "static/images/avatar-placeholder.png";
    document.getElementById("profile-info").innerHTML = `
        <p><b>Nickname:</b> ${user.nickname}</p>
        <p><b>Age:</b> ${user.age}</p>
        <p><b>City:</b> ${user.city}</p>
        <p><b>Gender:</b> ${user.gender}</p>
        <p><b>Interests:</b> ${user.interests.join(", ")}</p>
        <p><b>Coins:</b> ${user.coins}</p>
    `;
}

function showError(message) {
    Telegram.WebApp.showAlert(message);
}

init();

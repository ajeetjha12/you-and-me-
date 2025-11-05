// =======================================================
// ** 1. Firebase कॉन्फिगरेशन **
// (आपकी डिटेल्स यहाँ हैं)
// =======================================================

const firebaseConfig = {
    apiKey: "AIzaSyCnHHZFAqeWGkpiL0ivwvP4e67MVkKCh6k",
    authDomain: "you-and-me-d321d.firebaseapp.com",
    projectId: "you-and-me-d321d",
    storageBucket: "you-and-me-d321d.appspot.com", 
    messagingSenderId: "640686566091",
    appId: "1:640686566091:web:3a6d55214ff5b3462d494e",
};

// Firebase को Initialize करें
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();
const messagesRef = database.ref('you_and_me_chat/messages'); // चैट डेटाबेस पाथ

// =======================================================
// ** 2. DOM एलिमेंट्स और इवेंट हैंडलर **
// =======================================================

const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const usernameInput = document.getElementById('username-input');
const imageUpload = document.getElementById('image-upload');
const imageBtn = document.getElementById('image-btn');
const voiceBtn = document.getElementById('voice-btn');
const emojiBtn = document.getElementById('emoji-btn');
const userStatus = document.getElementById('user-status');

let currentUsername = localStorage.getItem('chatUsername') || ''; 

// ** एंटर दबाने पर मैसेज भेजें **
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault();
        sendMessage();
    }
});

// बटन इवेंट्स
sendBtn.addEventListener('click', sendMessage);
imageBtn.addEventListener('click', () => imageUpload.click());
voiceBtn.addEventListener('click', () => document.getElementById('audio-upload').click());

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file, 'image');
    }
});

document.getElementById('audio-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file, 'audio');
    }
});

emojiBtn.addEventListener('click', () => {
    const emojis = ['😊', '❤️', '🔥', '🥳', '😘', '😂', '🌹', '💍', '🙈'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    messageInput.value += randomEmoji;
    messageInput.focus();
});


// यूज़रनेम स्टोर करें और ऑनलाइन स्टेटस दिखाएं
usernameInput.addEventListener('change', () => {
    currentUsername = usernameInput.value.trim();
    if (currentUsername) {
        localStorage.setItem('chatUsername', currentUsername);
        alert(`आपका नाम सेट हो गया है: ${currentUsername}`);
        updateStatus(true);
    } else {
        updateStatus(false);
    }
});

if (currentUsername) {
    usernameInput.value = currentUsername;
    updateStatus(true);
} else {
    updateStatus(false);
}

function updateStatus(isOnline) {
    userStatus.textContent = isOnline ? 'Online' : 'Offline';
    userStatus.classList.toggle('online', isOnline);
    userStatus.classList.toggle('offline', !isOnline);
}


// =======================================================
// ** 3. मुख्य फंक्शन (Core Functions) **
// =======================================================

/**
 * मैसेज भेजने का मुख्य फंक्शन
 */
function sendMessage() {
    const messageText = messageInput.value.trim();
    
    if (!currentUsername) {
        alert('कृपया पहले चैट बॉक्स के ऊपर अपना नाम डालें!');
        return;
    }
    
    if (messageText !== '') {
        const newMessage = {
            user: currentUsername,
            text: messageText,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'text'
        };

        // डेटाबेस में भेजें
        messagesRef.push(newMessage);
        messageInput.value = '';
    }
}

/**
 * फ़ाइल (फोटो/ऑडियो) अपलोड करने का फंक्शन
 */
function uploadFile(file, type) {
    if (!currentUsername) {
        alert('कृपया पहले चैट बॉक्स के ऊपर अपना नाम डालें!');
        return;
    }
    
    alert(`Uploading ${type}... कृपया इंतज़ार करें।`);

    const filePath = `${type}/${currentUsername}/${Date.now()}-${file.name}`;
    const storageRef = storage.ref(filePath);
    
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            // अपलोड प्रोग्रेस
        }, 
        (error) => {
            console.error('Upload failed:', error);
            alert('फ़ाइल अपलोड नहीं हो पाई। शायद स्टोरेज रूल्स चेक करें या Blaze प्लान इनेबल करें।');
        }, 
        () => {
            // अपलोड सफल होने पर URL प्राप्त करें
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                const newMessage = {
                    user: currentUsername,
                    url: downloadURL,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    type: type 
                };
                messagesRef.push(newMessage);
                imageUpload.value = ''; 
                document.getElementById('audio-upload').value = ''; 
            });
        }
    );
}

/**
 * रियल-टाइम मैसेज को UI में दिखाने का फंक्शन
 */
messagesRef.on('child_added', (snapshot) => {
    const message = snapshot.val();
    displayMessage(message);
});

function displayMessage(message) {
    const isOutgoing = message.user === currentUsername; 
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isOutgoing ? 'outgoing' : 'incoming');

    const senderName = isOutgoing ? 'You' : message.user;
    
    let content = `<strong>${senderName}</strong>`;
    
    if (message.type === 'text') {
        content += `<p>${message.text}</p>`;
    } else if (message.type === 'image' && message.url) {
        content += `<a href="${message.url}" target="_blank"><img src="${message.url}" alt="Image Attachment"></a>`;
    } else if (message.type === 'audio' && message.url) {
        content += `<audio controls src="${message.url}"></audio>`;
    }

    const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) : '...';
    content += `<span class="message-time">${time}</span>`;

    messageElement.innerHTML = content;
    chatMessages.appendChild(messageElement);

    // ऑटो स्क्रॉल टू बॉटम
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
    apiKey: "AIzaSyA_6juvelSPbBAbAlOvAhDk2aMZvPe6KiY",
    authDomain: "nexus-messenger-faba1.firebaseapp.com",
    projectId: "nexus-messenger-faba1",
    storageBucket: "nexus-messenger-faba1.firebasestorage.app",
    messagingSenderId: "161709378003",
    appId: "1:161709378003:web:87e5f3f4f821e3b822c726"
};

// Инициализация Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase успешно инициализирован");
} catch (error) {
    console.error("❌ Ошибка инициализации Firebase:", error);
}

// Сервисы Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ===== NEXUS MESSENGER APP =====
class NexusMessenger {
    constructor() {
        this.currentUser = null;
        this.currentChannel = 'general-chat';
        this.currentServer = 'general';
        this.messages = [];
        this.voiceChannels = [];
        this.members = [];
        this.isRecording = false;
        this.voiceConnected = false;
        this.emojiPickerVisible = false;
        
        this.init();
    }
    
    async init() {
        console.log("🚀 Инициализация Nexus Messenger...");
        
        // Инициализация Firebase Auth
        await this.initAuth();
        
        // Загрузка начальных данных
        await this.loadInitialData();
        
        // Настройка обработчиков событий
        this.setupEventListeners();
        
        // Настройка адаптивного поведения
        this.setupResponsive();
        
        // Запуск анимаций и эффектов
        this.startAnimations();
        
        console.log("✅ Nexus Messenger готов!");
    }
    
    // ===== AUTHENTICATION =====
    async initAuth() {
        try {
            // Подписка на изменения авторизации
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    console.log("👤 Пользователь авторизован:", user.uid);
                    await this.updateUserProfile(user);
                } else {
                    // Анонимная авторизация
                    const result = await auth.signInAnonymously();
                    this.currentUser = result.user;
                    console.log("👤 Анонимная авторизация успешна");
                    
                    // Создаем профиль пользователя
                    await this.createUserProfile();
                }
            });
        } catch (error) {
            console.error("❌ Ошибка авторизации:", error);
            this.showError("Ошибка авторизации. Проверьте консоль.");
        }
    }
    
    async createUserProfile() {
        try {
            const userId = this.currentUser.uid;
            const username = `User#${Math.floor(Math.random() * 10000)}`;
            const avatar = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
            
            // Сохраняем в Firestore
            await db.collection('users').doc(userId).set({
                username: username,
                avatar: avatar,
                status: 'online',
                created: firebase.firestore.FieldValue.serverTimestamp(),
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Обновляем интерфейс
            this.updateUserProfile(this.currentUser);
            
        } catch (error) {
            console.error("❌ Ошибка создания профиля:", error);
        }
    }
    
    async updateUserProfile(user) {
        try {
            // Получаем данные пользователя из Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            
            const username = userData?.username || `User#${Math.floor(Math.random() * 10000)}`;
            const avatar = userData?.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
            
            // Обновляем DOM элементы
            const usernameElements = document.querySelectorAll('.username');
            const avatarElements = document.querySelectorAll('.user-avatar img, .user-avatar-small img');
            
            usernameElements.forEach(el => {
                el.textContent = username;
            });
            
            avatarElements.forEach(el => {
                el.src = avatar;
            });
            
        } catch (error) {
            console.error("❌ Ошибка обновления профиля:", error);
        }
    }
    
    // ===== DATA LOADING =====
    async loadInitialData() {
        await Promise.all([
            this.loadVoiceChannels(),
            this.loadMembers(),
            this.loadMessages(),
            this.loadDemoData()
        ]);
    }
    
    async loadVoiceChannels() {
        try {
            const channelsRef = db.collection('voiceChannels');
            const snapshot = await channelsRef.where('server', '==', this.currentServer).get();
            
            this.voiceChannels = [];
            const voiceList = document.querySelector('.voice-channel-list');
            
            snapshot.forEach(doc => {
                const channel = { id: doc.id, ...doc.data() };
                this.voiceChannels.push(channel);
                
                // Создаем элемент канала
                const channelElement = this.createVoiceChannelElement(channel);
                voiceList.appendChild(channelElement);
            });
            
            // Если каналов нет, добавляем демо
            if (this.voiceChannels.length === 0) {
                this.createDemoVoiceChannels();
            }
            
        } catch (error) {
            console.error("❌ Ошибка загрузки голосовых каналов:", error);
            this.createDemoVoiceChannels();
        }
    }
    
    createDemoVoiceChannels() {
        const demoChannels = [
            { 
                name: 'General Voice', 
                users: 5, 
                link: 'https://meet.google.com/new',
                description: 'Основной голосовой чат'
            },
            { 
                name: 'Gaming Lounge', 
                users: 3, 
                link: 'https://discord.gg/voice',
                description: 'Для игровых сессий'
            },
            { 
                name: 'Music Room', 
                users: 2, 
                link: 'https://teams.microsoft.com',
                description: 'Слушаем музыку вместе'
            },
            { 
                name: 'Stream Chat', 
                users: 1, 
                link: 'https://zoom.us/j/123456',
                description: 'Обсуждаем стримы'
            }
        ];
        
        const voiceList = document.querySelector('.voice-channel-list');
        voiceList.innerHTML = '';
        
        demoChannels.forEach((channel, index) => {
            const element = this.createVoiceChannelElement({ id: `demo-${index}`, ...channel });
            voiceList.appendChild(element);
            this.voiceChannels.push({ id: `demo-${index}`, ...channel });
        });
    }
    
    createVoiceChannelElement(channel) {
        const element = document.createElement('div');
        element.className = 'voice-channel-item';
        element.dataset.channelId = channel.id;
        element.dataset.link = channel.link;
        
        element.innerHTML = `
            <i class="fas fa-headphones"></i>
            <span>${channel.name}</span>
            <span class="voice-users">${channel.users || 0}</span>
        `;
        
        element.addEventListener('click', () => this.joinVoiceChannel(channel));
        
        // Эффект при наведении
        element.addEventListener('mouseenter', () => {
            element.classList.add('pulse-ring');
        });
        
        element.addEventListener('mouseleave', () => {
            element.classList.remove('pulse-ring');
        });
        
        return element;
    }
    
    async loadMembers() {
        try {
            const membersRef = db.collection('users').where('status', '==', 'online').limit(20);
            const snapshot = await membersRef.get();
            
            this.members = [];
            const membersList = document.querySelector('.members-list');
            const membersCountElements = document.querySelectorAll('.members-count');
            
            membersList.innerHTML = '';
            
            // Демо-участники если база пуста
            if (snapshot.empty) {
                this.createDemoMembers();
                return;
            }
            
            snapshot.forEach(doc => {
                const member = { id: doc.id, ...doc.data() };
                this.members.push(member);
                
                const memberElement = this.createMemberElement(member);
                membersList.appendChild(memberElement);
            });
            
            // Обновляем счетчик
            membersCountElements.forEach(el => {
                el.textContent = this.members.length;
            });
            
        } catch (error) {
            console.error("❌ Ошибка загрузки участников:", error);
            this.createDemoMembers();
        }
    }
    
    createDemoMembers() {
        const demoMembers = [
            { id: '1', username: 'Alex#1234', avatar: 'https://i.pravatar.cc/150?img=1', status: 'В сети', customStatus: 'Разрабатываю Nexus' },
            { id: '2', username: 'Maria#5678', avatar: 'https://i.pravatar.cc/150?img=5', status: 'Не беспокоить', customStatus: 'В режиме концентрации' },
            { id: '3', username: 'John#9101', avatar: 'https://i.pravatar.cc/150?img=3', status: 'В сети', customStatus: 'Играет в Valorant' },
            { id: '4', username: 'Sarah#1121', avatar: 'https://i.pravatar.cc/150?img=8', status: 'Нет на месте', customStatus: 'Отошёл' },
            { id: '5', username: 'Mike#3141', avatar: 'https://i.pravatar.cc/150?img=12', status: 'В сети', customStatus: 'Стримит на Twitch' },
            { id: '6', username: 'Emma#5161', avatar: 'https://i.pravatar.cc/150?img=15', status: 'В сети', customStatus: 'Слушает Spotify' },
            { id: '7', username: 'David#7181', avatar: 'https://i.pravatar.cc/150?img=20', status: 'В сети', customStatus: 'Готов к играм' },
            { id: '8', username: 'Lisa#9202', avatar: 'https://i.pravatar.cc/150?img=25', status: 'Нет на месте', customStatus: 'Спит 😴' }
        ];
        
        const membersList = document.querySelector('.members-list');
        const membersCountElements = document.querySelectorAll('.members-count');
        
        membersList.innerHTML = '';
        this.members = demoMembers;
        
        demoMembers.forEach(member => {
            const memberElement = this.createMemberElement(member);
            membersList.appendChild(memberElement);
        });
        
        membersCountElements.forEach(el => {
            el.textContent = demoMembers.length;
        });
    }
    
    createMemberElement(member) {
        const element = document.createElement('div');
        element.className = 'member-item';
        element.dataset.userId = member.id;
        
        element.innerHTML = `
            <div class="member-avatar">
                <img src="${member.avatar}" alt="${member.username}" loading="lazy">
                <div class="user-status ${member.status === 'В сети' ? 'online' : 
                                       member.status === 'Не беспокоить' ? 'dnd' : 
                                       member.status === 'Нет на месте' ? 'idle' : 'offline'}"></div>
            </div>
            <div class="member-info">
                <div class="member-name">${member.username}</div>
                <div class="member-status">${member.customStatus || member.status}</div>
            </div>
        `;
        
        element.addEventListener('click', () => this.showUserProfile(member));
        
        return element;
    }
    
    async loadMessages() {
        try {
            const messagesRef = db.collection('messages')
                .where('channel', '==', this.currentChannel)
                .where('server', '==', this.currentServer)
                .orderBy('timestamp', 'desc')
                .limit(50);
            
            const snapshot = await messagesRef.get();
            const messagesContainer = document.querySelector('.messages-container');
            
            messagesContainer.innerHTML = '';
            
            if (snapshot.empty) {
                this.createWelcomeMessage();
                return;
            }
            
            snapshot.forEach(doc => {
                const message = doc.data();
                message.id = doc.id;
                this.addMessageToChat(message, false);
            });
            
            // Подписка на новые сообщения в реальном времени
            messagesRef.onSnapshot((snapshot) => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const message = change.doc.data();
                        message.id = change.doc.id;
                        
                        // Проверяем, нет ли уже такого сообщения
                        if (!this.messages.some(m => m.id === change.doc.id)) {
                            this.addMessageToChat(message, true);
                            
                            // Воспроизводим звук нового сообщения
                            if (message.author !== this.currentUser?.uid) {
                                this.playNotificationSound();
                            }
                        }
                    }
                });
            }, (error) => {
                console.error("❌ Ошибка подписки на сообщения:", error);
            });
            
        } catch (error) {
            console.error("❌ Ошибка загрузки сообщений:", error);
            this.createWelcomeMessage();
        }
    }
    
    createWelcomeMessage() {
        const welcomeMessage = {
            id: 'welcome',
            author: 'Nexus Bot',
            avatar: 'https://img.icons8.com/fluency/96/000000/discord-logo.png',
            text: `🎉 Добро пожаловать в **Nexus Messenger**!\n\nЗдесь вы можете:\n• 💬 Общаться в текстовых чатах\n• 🎧 Присоединяться к голосовым каналам\n• 📹 Подключаться к телемостам\n• 🎮 Создавать игровые сессии\n\nНажмите на голосовой канал, чтобы подключиться!`,
            timestamp: new Date(),
            badges: ['BOT', 'VERIFIED']
        };
        
        this.addMessageToChat(welcomeMessage, false);
    }
    
    async loadDemoData() {
        // Добавляем демо-данные в Firestore если они отсутствуют
        try {
            const channelsSnapshot = await db.collection('voiceChannels').limit(1).get();
            
            if (channelsSnapshot.empty) {
                await this.createDemoFirestoreData();
            }
        } catch (error) {
            console.error("❌ Ошибка проверки демо-данных:", error);
        }
    }
    
    async createDemoFirestoreData() {
        const demoVoiceChannels = [
            {
                name: 'General Voice',
                server: 'general',
                link: 'https://meet.google.com/new',
                description: 'Основной голосовой чат',
                users: 5,
                maxUsers: 25,
                created: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'Gaming Lounge',
                server: 'gaming',
                link: 'https://discord.gg/voice',
                description: 'Для игровых сессий',
                users: 3,
                maxUsers: 10,
                created: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        const demoMessages = [
            {
                author: 'Nexus Bot',
                avatar: 'https://img.icons8.com/fluency/96/000000/discord-logo.png',
                text: 'Чат инициализирован! 🚀',
                channel: 'general-chat',
                server: 'general',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                badges: ['BOT']
            }
        ];
        
        try {
            // Сохраняем голосовые каналы
            for (const channel of demoVoiceChannels) {
                await db.collection('voiceChannels').add(channel);
            }
            
            // Сохраняем сообщения
            for (const message of demoMessages) {
                await db.collection('messages').add(message);
            }
            
            console.log("✅ Демо-данные созданы в Firestore");
            
        } catch (error) {
            console.error("❌ Ошибка создания демо-данных:", error);
        }
    }
    
    // ===== MESSAGES =====
    addMessageToChat(message, isNew = false) {
        const messagesContainer = document.querySelector('.messages-container');
        
        // Форматируем время
        const time = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp);
        const timeString = time.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        const dateString = time.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long'
        });
        
        // Проверяем, нужно ли добавить дату
        const lastMessage = this.messages[this.messages.length - 1];
        const shouldAddDate = !lastMessage || 
            lastMessage.timestamp?.toDate().toDateString() !== time.toDateString();
        
        // Добавляем разделитель даты если нужно
        if (shouldAddDate && isNew) {
            const dateDivider = document.createElement('div');
            dateDivider.className = 'date-divider';
            dateDivider.innerHTML = `<span>${dateString}</span>`;
            dateDivider.style.cssText = `
                text-align: center;
                margin: 20px 0;
                color: var(--text-gray);
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                position: relative;
            `;
            
            dateDivider.querySelector('span').style.cssText = `
                background: var(--background);
                padding: 4px 12px;
                border-radius: var(--radius-full);
                position: relative;
                z-index: 1;
            `;
            
            dateDivider.insertBefore(dateDivider, messagesContainer.firstChild);
        }
        
        // Создаем элемент сообщения
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isNew ? 'fade-in' : ''}`;
        messageElement.dataset.messageId = message.id;
        
        // Форматируем текст с поддержкой markdown
        let formattedText = message.text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        // Проверяем ссылки
        formattedText = formattedText.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" style="color: var(--primary); text-decoration: none;">$1</a>'
        );
        
        messageElement.innerHTML = `
            <div class="message-avatar">
                <img src="${message.avatar}" alt="${message.author}" loading="lazy">
                ${message.badges?.includes('BOT') ? 
                    '<div class="message-badge"><i class="fas fa-robot"></i></div>' : ''}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${message.author}</span>
                    <span class="message-time">${timeString}</span>
                    <div class="message-badges">
                        ${message.badges?.map(badge => 
                            `<span class="badge">${badge}</span>`
                        ).join('') || ''}
                    </div>
                </div>
                <div class="message-text">${formattedText}</div>
                <div class="message-actions">
                    <button class="message-action-btn" title="Ответить">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button class="message-action-btn" title="Реакция">
                        <i class="fas fa-smile"></i>
                    </button>
                    <button class="message-action-btn" title="Закрепить">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Добавляем в начало (новые сообщения сверху)
        messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
        
        // Анимация для нового сообщения
        if (isNew) {
            messageElement.style.animation = 'messageAppear 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Прокручиваем к новому сообщению
            setTimeout(() => {
                messagesContainer.scrollTop = 0;
            }, 100);
            
            // Уведомление если это не наш пользователь
            if (message.author !== this.currentUser?.displayName && isNew) {
                this.showNotification(`Новое сообщение от ${message.author}`);
            }
        }
        
        // Сохраняем сообщение в памяти
        this.messages.unshift(message);
        
        // Ограничиваем количество сообщений в памяти
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(0, 100);
        }
    }
    
    async sendMessage(text) {
        if (!text.trim() || !this.currentUser) return;
        
        try {
            // Получаем данные пользователя
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            
            const messageData = {
                author: userData?.username || `User#${Math.floor(Math.random() * 10000)}`,
                avatar: userData?.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
                text: text.trim(),
                channel: this.currentChannel,
                server: this.currentServer,
                userId: this.currentUser.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                badges: userData?.badges || []
            };
            
            // Добавляем в Firestore
            await db.collection('messages').add(messageData);
            
            // Очищаем поле ввода
            const messageInput = document.querySelector('.message-input');
            messageInput.value = '';
            messageInput.style.height = 'auto';
            
            // Анимация отправки
            const sendBtn = document.querySelector('.send-message-btn');
            sendBtn.classList.add('pulse-ring');
            setTimeout(() => sendBtn.classList.remove('pulse-ring'), 1000);
            
        } catch (error) {
            console.error("❌ Ошибка отправки сообщения:", error);
            this.showError("Не удалось отправить сообщение");
        }
    }
    
    // ===== VOICE CHANNELS =====
    joinVoiceChannel(channel) {
        if (this.voiceConnected) {
            this.showNotification("Вы уже подключены к голосовому каналу");
            return;
        }
        
        this.voiceConnected = true;
        
        // Показываем модальное окно
        const modal = document.querySelector('.voice-chat-modal');
        const channelName = modal.querySelector('h3');
        const telemostBtn = modal.querySelector('.connect-telemost');
        
        channelName.textContent = channel.name;
        telemostBtn.dataset.link = channel.link;
        
        modal.style.display = 'block';
        
        // Анимация
        modal.style.animation = 'slideUp 0.3s ease';
        
        // Обновляем счетчик пользователей
        const voiceItem = document.querySelector(`.voice-channel-item[data-channel-id="${channel.id}"]`);
        if (voiceItem) {
            const usersCount = parseInt(voiceItem.querySelector('.voice-users').textContent) + 1;
            voiceItem.querySelector('.voice-users').textContent = usersCount;
        }
        
        // Воспроизводим звук подключения
        this.playSound('connect');
        
        this.showNotification(`Подключено к ${channel.name}`);
    }
    
    disconnectVoiceChannel() {
        if (!this.voiceConnected) return;
        
        this.voiceConnected = false;
        const modal = document.querySelector('.voice-chat-modal');
        modal.style.display = 'none';
        
        this.playSound('disconnect');
        this.showNotification("Отключено от голосового канала");
    }
    
    connectToTelemost(link) {
        if (!link) {
            link = prompt("Введите ссылку на телемост:");
            if (!link) return;
        }
        
        // Открываем в новой вкладке
        window.open(link, '_blank', 'noopener,noreferrer');
        
        this.showNotification("Открывается телемост...");
    }
    
    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Отправка сообщения
        const sendBtn = document.querySelector('.send-message-btn');
        const messageInput = document.querySelector('.message-input');
        
        sendBtn.addEventListener('click', () => {
            const text = messageInput.value;
            if (text.trim()) {
                this.sendMessage(text);
            }
        });
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = messageInput.value;
                if (text.trim()) {
                    this.sendMessage(text);
                }
            }
        });
        
        // Автоматическое увеличение высоты textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        // Голосовое сообщение
        const voiceBtn = document.querySelector('.voice-input-btn');
        voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());
        
        // Голосовые каналы
        document.querySelectorAll('.voice-channel-item').forEach(item => {
            item.addEventListener('click', () => {
                const channelId = item.dataset.channelId;
                const channel = this.voiceChannels.find(c => c.id === channelId);
                if (channel) {
                    this.joinVoiceChannel(channel);
                }
            });
        });
        
        // Кнопки голосового чата
        document.querySelector('.connect-telemost').addEventListener('click', (e) => {
            const link = e.currentTarget.dataset.link;
            this.connectToTelemost(link);
        });
        
        document.querySelector('.disconnect-btn').addEventListener('click', () => {
            this.disconnectVoiceChannel();
        });
        
        document.querySelector('.close-voice-modal').addEventListener('click', () => {
            this.disconnectVoiceChannel();
        });
        
        // Переключение микрофона и наушников
        document.querySelector('.mic-toggle').addEventListener('click', function() {
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            const text = this.querySelector('span');
            
            if (this.classList.contains('active')) {
                icon.className = 'fas fa-microphone';
                text.textContent = 'Вкл. микрофон';
                NexusApp.playSound('mic-on');
            } else {
                icon.className = 'fas fa-microphone-slash';
                text.textContent = 'Выкл. микрофон';
                NexusApp.playSound('mic-off');
            }
        });
        
        document.querySelector('.headphones-toggle').addEventListener('click', function() {
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            const text = this.querySelector('span');
            
            if (this.classList.contains('active')) {
                icon.className = 'fas fa-headphones';
                text.textContent = 'Вкл. звук';
                NexusApp.playSound('sound-on');
            } else {
                icon.className = 'fas fa-headphones-alt';
                text.textContent = 'Выкл. звук';
                NexusApp.playSound('sound-off');
            }
        });
        
        // Серверы
        document.querySelectorAll('.server-item').forEach(item => {
            item.addEventListener('click', () => {
                if (item.classList.contains('add-server')) {
                    this.createNewServer();
                    return;
                }
                
                document.querySelectorAll('.server-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                this.currentServer = item.dataset.server;
                this.loadVoiceChannels();
                this.loadMessages();
                
                // Анимация
                item.classList.add('pulse-ring');
                setTimeout(() => item.classList.remove('pulse-ring'), 1000);
            });
        });
        
        // Каналы
        document.querySelectorAll('.channel-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.channel-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                const channelName = item.querySelector('span').textContent;
                this.currentChannel = channelName.toLowerCase().replace(/\s+/g, '-');
                
                // Обновляем заголовок
                document.querySelector('.channel-header h3').textContent = channelName;
                
                this.loadMessages();
            });
        });
        
        // Прикрепление файлов
        document.querySelectorAll('.attach-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const title = e.currentTarget.title;
                this.handleAttachment(title);
            });
        });
        
        // Поиск
        const searchInput = document.querySelector('.search-box input');
        searchInput.addEventListener('focus', () => {
            searchInput.parentElement.style.width = '280px';
        });
        
        searchInput.addEventListener('blur', () => {
            if (!searchInput.value) {
                searchInput.parentElement.style.width = '';
            }
        });
        
        // Мобильное меню
        if (window.innerWidth <= 768) {
            this.setupMobileMenu();
        }
        
        // Настройки
        document.querySelector('.settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // Приглашение
        document.querySelector('.invite-btn').addEventListener('click', () => {
            this.showInviteModal();
        });
        
        // Добавление каналов
        document.querySelectorAll('.add-channel').forEach(btn => {
            btn.addEventListener('click', () => {
                this.createNewChannel();
            });
        });
        
        // Обработка ссылок в сообщениях
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.href) {
                e.preventDefault();
                window.open(e.target.href, '_blank', 'noopener,noreferrer');
            }
        });
    }
    
    setupMobileMenu() {
        const menuButtons = {
            'channels-toggle': () => this.toggleSidebar('channels'),
            'members-toggle': () => this.toggleSidebar('members'),
            'voice-btn': () => this.showVoiceChannels(),
            'profile-btn': () => this.showUserProfile(this.currentUser)
        };
        
        Object.entries(menuButtons).forEach(([className, handler]) => {
            const btn = document.querySelector(`.${className}`);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
        
        // Свайпы
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = endX - startX;
            const diffY = endY - startY;
            
            // Горизонтальный свайп
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Свайп вправо - показываем каналы
                    this.toggleSidebar('channels');
                } else {
                    // Свайп влево - показываем участников
                    this.toggleSidebar('members');
                }
            }
        }, { passive: true });
    }
    
    setupResponsive() {
        const checkResponsive = () => {
            const isMobile = window.innerWidth <= 768;
            const mobileMenu = document.querySelector('.mobile-menu');
            const membersToggle = document.querySelector('.members-toggle');
            
            if (isMobile) {
                mobileMenu.style.display = 'flex';
                if (membersToggle) {
                    membersToggle.style.display = 'flex';
                }
            } else {
                mobileMenu.style.display = 'none';
                if (membersToggle) {
                    membersToggle.style.display = 'none';
                }
                
                // Показываем все сайдбары на десктопе
                document.querySelector('.channels-sidebar').style.display = 'flex';
                document.querySelector('.members-sidebar').style.display = 'flex';
            }
        };
        
        checkResponsive();
        window.addEventListener('resize', checkResponsive);
    }
    
    // ===== UI METHODS =====
    toggleSidebar(type) {
        const sidebar = document.querySelector(`.${type}-sidebar`);
        const isActive = sidebar.classList.contains('active');
        
        // Закрываем все сайдбары
        document.querySelectorAll('.channels-sidebar, .members-sidebar').forEach(sb => {
            sb.classList.remove('active');
        });
        
        // Открываем/закрываем нужный
        if (!isActive) {
            sidebar.classList.add('active');
        }
        
        // Анимация
        sidebar.style.animation = 'slideInRight 0.3s ease';
    }
    
    toggleVoiceRecording() {
        const btn = document.querySelector('.voice-input-btn');
        const input = document.querySelector('.message-input');
        
        if (!this.isRecording) {
            // Начинаем запись
            this.isRecording = true;
            btn.innerHTML = '<i class="fas fa-stop"></i>';
            btn.style.color = 'var(--danger)';
            btn.classList.add('pulse-ring');
            
            input.placeholder = '🎤 Запись... Нажмите чтобы остановить';
            input.disabled = true;
            
            this.showNotification("Запись начата...");
            this.playSound('recording-start');
            
            // Симуляция записи
            this.recordingTimer = setTimeout(() => {
                this.toggleVoiceRecording();
            }, 10000);
            
        } else {
            // Останавливаем запись
            this.isRecording = false;
            clearTimeout(this.recordingTimer);
            
            btn.innerHTML = '<i class="fas fa-microphone"></i>';
            btn.style.color = '';
            btn.classList.remove('pulse-ring');
            
            input.placeholder = 'Напишите сообщение...';
            input.disabled = false;
            
            // Отправляем голосовое сообщение
            const duration = Math.floor(Math.random() * 30) + 5;
            this.sendMessage(`🎤 Голосовое сообщение (${duration} сек.)`);
            
            this.showNotification("Голосовое сообщение отправлено");
            this.playSound('recording-stop');
        }
    }
    
    handleAttachment(type) {
        const handlers = {
            'Прикрепить файл': () => this.uploadFile(),
            'Гифка': () => this.sendGIF(),
            'Стикер': () => this.sendSticker(),
            'Эмодзи': () => this.showEmojiPicker()
        };
        
        const handler = handlers[type];
        if (handler) {
            handler();
        }
    }
    
    uploadFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
        input.multiple = true;
        
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.showNotification(`Загрузка ${files.length} файлов...`);
                
                // Симуляция загрузки
                setTimeout(() => {
                    files.forEach(file => {
                        this.sendMessage(`📎 Файл: ${file.name} (${this.formatFileSize(file.size)})`);
                    });
                    this.showNotification("Файлы загружены успешно!");
                }, 1500);
            }
        };
        
        input.click();
    }
    
    sendGIF() {
        const gifs = [
            'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
            'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif',
            'https://media.giphy.com/media/3o7abAHdYvZdBNnGZq/giphy.gif',
            'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif'
        ];
        
        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
        this.sendMessage(`![GIF](${randomGif})`);
    }
    
    sendSticker() {
        const stickers = ['😎', '🚀', '🎮', '💻', '🎵', '🎨', '🔥', '🌟'];
        const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];
        this.sendMessage(randomSticker.repeat(3));
    }
    
    showEmojiPicker() {
        if (this.emojiPickerVisible) return;
        
        this.emojiPickerVisible = true;
        
        const emojis = ['😀', '😂', '🥰', '😎', '🤔', '😮', '🎮', '🚀', '💻', '📱', '🎵', '🎨', '🎬', '⚡', '🔥', '🌟', '❤️', '👍', '👋'];
        
        const picker = document.createElement('div');
        picker.className = 'emoji-picker';
        picker.style.cssText = `
            position: absolute;
            bottom: 80px;
            right: 100px;
            background: var(--background-secondary);
            border: 1px solid var(--background-accent);
            border-radius: var(--radius-lg);
            padding: 16px;
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            z-index: 1000;
            box-shadow: var(--shadow-xl);
            animation: fadeIn 0.2s ease;
        `;
        
        emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.textContent = emoji;
            btn.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 8px;
                border-radius: var(--radius-md);
                transition: all var(--transition-fast);
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            btn.onmouseenter = () => {
                btn.style.background = 'var(--background-accent)';
                btn.style.transform = 'scale(1.2)';
            };
            
            btn.onmouseleave = () => {
                btn.style.background = 'none';
                btn.style.transform = 'scale(1)';
            };
            
            btn.onclick = () => {
                const input = document.querySelector('.message-input');
                input.value += emoji;
                input.focus();
                picker.remove();
                this.emojiPickerVisible = false;
            };
            
            picker.appendChild(btn);
        });
        
        document.querySelector('.message-input-area').appendChild(picker);
        
        // Закрытие при клике вне
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!picker.contains(e.target) && !e.target.closest('.fa-smile')) {
                    picker.remove();
                    this.emojiPickerVisible = false;
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 0);
    }
    
    createNewServer() {
        const name = prompt('Введите название нового сервера:');
        if (name && name.trim()) {
            this.showNotification(`Сервер "${name}" создан!`);
            
            // Анимация
            const serverList = document.querySelector('.server-list');
            const newServer = document.createElement('div');
            newServer.className = 'server-item';
            newServer.dataset.server = name.toLowerCase().replace(/\s+/g, '-');
            newServer.innerHTML = `
                <div class="server-icon">
                    <i class="fas fa-hashtag"></i>
                </div>
                <div class="server-tooltip">${name}</div>
            `;
            
            newServer.addEventListener('click', () => {
                document.querySelectorAll('.server-item').forEach(i => i.classList.remove('active'));
                newServer.classList.add('active');
                this.currentServer = newServer.dataset.server;
                this.loadVoiceChannels();
                this.loadMessages();
            });
            
            serverList.insertBefore(newServer, document.querySelector('.add-server'));
        }
    }
    
    createNewChannel() {
        const name = prompt('Введите название нового канала:');
        if (name && name.trim()) {
            this.showNotification(`Канал #${name} создан!`);
            
            const channelList = document.querySelector('.channel-list');
            const newChannel = document.createElement('div');
            newChannel.className = 'channel-item';
            newChannel.innerHTML = `
                <i class="fas fa-hashtag"></i>
                <span>${name}</span>
            `;
            
            newChannel.addEventListener('click', () => {
                document.querySelectorAll('.channel-item').forEach(i => i.classList.remove('active'));
                newChannel.classList.add('active');
                this.currentChannel = name.toLowerCase().replace(/\s+/g, '-');
                document.querySelector('.channel-header h3').textContent = name;
                this.loadMessages();
            });
            
            channelList.appendChild(newChannel);
        }
    }
    
    showUserProfile(user) {
        const profileModal = document.createElement('div');
        profileModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        profileModal.innerHTML = `
            <div style="background: var(--background-secondary); border-radius: var(--radius-xl); padding: 24px; width: 90%; max-width: 400px;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                    <img src="${user.avatar}" alt="${user.username}" style="width: 80px; height: 80px; border-radius: 50%;">
                    <div>
                        <h3 style="margin: 0 0 8px 0;">${user.username}</h3>
                        <p style="color: var(--text-muted); margin: 0;">${user.customStatus || user.status}</p>
                    </div>
                </div>
                <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                        style="background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: var(--radius-md); width: 100%; cursor: pointer;">
                    Закрыть
                </button>
            </div>
        `;
        
        document.body.appendChild(profileModal);
        
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.remove();
            }
        });
    }
    
    showSettings() {
        const settingsModal = document.createElement('div');
        settingsModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        settingsModal.innerHTML = `
            <div style="background: var(--background-secondary); border-radius: var(--radius-xl); padding: 24px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-cog"></i> Настройки Nexus
                </h3>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Тема</label>
                    <select style="width: 100%; padding: 10px; border-radius: var(--radius-md); background: var(--background-accent); border: 1px solid var(--background-accent); color: var(--text);">
                        <option>Тёмная (по умолчанию)</option>
                        <option>Светлая</option>
                        <option>AMOLED</option>
                        <option>Авто</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Уведомления</label>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Звуки уведомлений</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span></span>
                        </label>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span>Виброотклик</span>
                        <label class="switch">
                            <input type="checkbox">
                            <span></span>
                        </label>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Конфиденциальность</label>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Статус онлайн</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span></span>
                        </label>
                    </div>
                </div>
                
                <button onclick="NexusApp.saveSettings()" style="background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: var(--radius-md); width: 100%; cursor: pointer; margin-top: 20px;">
                    Сохранить настройки
                </button>
                
                <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                        style="background: transparent; color: var(--text-muted); border: 1px solid var(--background-accent); padding: 12px 24px; border-radius: var(--radius-md); width: 100%; cursor: pointer; margin-top: 10px;">
                    Отмена
                </button>
            </div>
        `;
        
        // Добавляем стили для switch
        const style = document.createElement('style');
        style.textContent = `
            .switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
            }
            
            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .switch span {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--background-accent);
                transition: .4s;
                border-radius: 24px;
            }
            
            .switch span:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            .switch input:checked + span {
                background-color: var(--primary);
            }
            
            .switch input:checked + span:before {
                transform: translateX(26px);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(settingsModal);
        
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.remove();
            }
        });
    }
    
    saveSettings() {
        this.showNotification("Настройки сохранены!");
        document.querySelector('div[style*="position: fixed"]').remove();
    }
    
    showInviteModal() {
        const inviteLink = `https://nexus-messenger.com/invite/${Math.random().toString(36).substr(2, 9)}`;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="background: var(--background-secondary); border-radius: var(--radius-xl); padding: 24px; width: 90%; max-width: 400px;">
                <h3 style="margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-user-plus"></i> Пригласить друзей
                </h3>
                
                <p style="margin-bottom: 20px; color: var(--text-muted);">
                    Отправьте эту ссылку друзьям, чтобы они присоединились к серверу:
                </p>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <input type="text" value="${inviteLink}" readonly 
                           style="flex: 1; padding: 10px; border-radius: var(--radius-md); background: var(--background-accent); border: 1px solid var(--background-accent); color: var(--text);">
                    <button onclick="navigator.clipboard.writeText('${inviteLink}'); NexusApp.showNotification('Ссылка скопирована!')"
                            style="background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--radius-md); cursor: pointer;">
                        Копировать
                    </button>
                </div>
                
                <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                        style="background: transparent; color: var(--text-muted); border: 1px solid var(--background-accent); padding: 12px 24px; border-radius: var(--radius-md); width: 100%; cursor: pointer;">
                    Закрыть
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    showVoiceChannels() {
        const voiceList = document.querySelector('.voice-channel-list');
        voiceList.scrollIntoView({ behavior: 'smooth' });
        
        // Подсветка
        voiceList.classList.add('pulse-ring');
        setTimeout(() => voiceList.classList.remove('pulse-ring'), 2000);
    }
    
    // ===== UTILITIES =====
    showNotification(message, duration = 3000) {
        const notification = document.querySelector('.notification');
        const content = notification.querySelector('.notification-content span');
        
        content.textContent = message;
        notification.style.display = 'block';
        
        // Анимация
        notification.style.animation = 'slideInRight 0.3s ease';
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, duration);
        
        // Клик для закрытия
        notification.onclick = () => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        };
    }
    
    showError(message) {
        const originalColor = document.querySelector('.notification').style.background;
        document.querySelector('.notification').style.background = 'var(--danger)';
        this.showNotification(`❌ ${message}`);
        setTimeout(() => {
            document.querySelector('.notification').style.background = originalColor;
        }, 3000);
    }
    
    playSound(type) {
        // Создаем аудио контекст для звуков
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            let frequency = 440;
            let duration = 0.1;
            
            switch(type) {
                case 'connect':
                    frequency = 523.25; // C5
                    break;
                case 'disconnect':
                    frequency = 392.00; // G4
                    break;
                case 'notification':
                    frequency = 659.25; // E5
                    break;
                case 'recording-start':
                    frequency = 349.23; // F4
                    duration = 0.3;
                    break;
                case 'recording-stop':
                    frequency = 261.63; // C4
                    break;
                case 'mic-on':
                case 'mic-off':
                case 'sound-on':
                case 'sound-off':
                    frequency = 329.63; // E4
                    break;
            }
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
            
        } catch (error) {
            console.log("Браузер не поддерживает Web Audio API");
        }
    }
    
    playNotificationSound() {
        this.playSound('notification');
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    startAnimations() {
        // Пульсация для активных элементов
        setInterval(() => {
            const activeElements = document.querySelectorAll('.active');
            activeElements.forEach(el => {
                if (Math.random() > 0.7) {
                    el.classList.add('pulse-ring');
                    setTimeout(() => el.classList.remove('pulse-ring'), 1000);
                }
            });
        }, 5000);
        
        // Анимация статусов участников
        setInterval(() => {
            const statuses = document.querySelectorAll('.user-status');
            statuses.forEach(status => {
                if (Math.random() > 0.9) {
                    const classes = ['online', 'idle', 'dnd'];
                    const current = classes.find(c => status.classList.contains(c));
                    const next = classes.filter(c => c !== current)[Math.floor(Math.random() * 2)];
                    
                    status.classList.remove(current);
                    status.classList.add(next);
                    
                    // Обновляем текст статуса
                    const statusText = status.closest('.member-item')?.querySelector('.member-status');
                    if (statusText) {
                        const statusMessages = {
                            'online': ['В сети', 'Играет', 'Работает'],
                            'idle': ['Нет на месте', 'Отошёл'],
                            'dnd': ['Не беспокоить', 'Встреча']
                        };
                        
                        const messages = statusMessages[next] || ['В сети'];
                        statusText.textContent = messages[Math.floor(Math.random() * messages.length)];
                    }
                }
            });
        }, 10000);
        
        // Анимация счетчиков пользователей в голосовых каналах
        setInterval(() => {
            const userCounts = document.querySelectorAll('.voice-users');
            userCounts.forEach(count => {
                const current = parseInt(count.textContent);
                if (current > 0 && Math.random() > 0.8) {
                    const change = Math.random() > 0.5 ? 1 : -1;
                    const newCount = Math.max(0, current + change);
                    count.textContent = newCount;
                    
                    // Анимация изменения
                    count.style.transform = 'scale(1.2)';
                    count.style.color = change > 0 ? 'var(--success)' : 'var(--danger)';
                    
                    setTimeout(() => {
                        count.style.transform = '';
                        count.style.color = '';
                    }, 300);
                }
            });
        }, 8000);
    }
}

// ===== INITIALIZATION =====
// Глобальная переменная для доступа из консоли
window.NexusApp = null;

// Запускаем приложение когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        NexusApp = new NexusMessenger();
        console.log("🌟 Nexus Messenger запущен!");
        console.log("💡 Доступен как NexusApp в консоли");
    }, 1000);
});

// Service Worker для PWA (опционально)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(() => {
            console.log('✅ Service Worker зарегистрирован');
        }).catch(error => {
            console.log('❌ Ошибка регистрации Service Worker:', error);
        });
    });
}

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('🚨 Глобальная ошибка:', e.error);
    
    // Показываем пользователю дружелюбное сообщение
    if (NexusApp) {
        NexusApp.showError('Произошла ошибка. Проверьте консоль.');
    }
});

// Сохранение состояния при закрытии
window.addEventListener('beforeunload', () => {
    if (NexusApp?.currentUser) {
        // Обновляем время последнего посещения
        db.collection('users').doc(NexusApp.currentUser.uid).update({
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'offline'
        });
    }
});

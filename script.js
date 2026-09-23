/* ============================================================
   AP Assistant — app logic
   ============================================================ */

const STORAGE_NAME = 'ap_assistant_name';
const STORAGE_HISTORY = 'ap_assistant_history';

const onboardModal = document.getElementById('onboardModal');
const nameInput = document.getElementById('nameInput');
const saveNameBtn = document.getElementById('saveNameBtn');

const greetingText = document.getElementById('greetingText');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');

const heroView = document.getElementById('heroView');
const chatView = document.getElementById('chatView');
const chatWindow = document.getElementById('chatWindow');

const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatFormBottom = document.getElementById('chatFormBottom');
const chatInputBottom = document.getElementById('chatInputBottom');

const newChatBtn = document.getElementById('newChatBtn');
const recentList = document.getElementById('recentList');
const quickPills = document.querySelectorAll('.pill');

/* ------------------------------------------------------------
   Onboarding — first-time name capture
   ------------------------------------------------------------ */
function initOnboarding(){
  const saved = localStorage.getItem(STORAGE_NAME);
  if(saved){
    applyName(saved);
    onboardModal.classList.add('hidden');
  }else{
    onboardModal.classList.remove('hidden');
    nameInput.focus();
  }
}

function applyName(name){
  greetingText.textContent = `Back at it, ${name}`;
  userName.textContent = name;
  userAvatar.textContent = name.trim().charAt(0).toUpperCase() || '?';
}

function saveName(){
  const name = nameInput.value.trim();
  if(!name) { nameInput.focus(); return; }
  localStorage.setItem(STORAGE_NAME, name);
  applyName(name);
  onboardModal.classList.add('hidden');
}

saveNameBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') saveName(); });

/* ------------------------------------------------------------
   Sidebar — recent conversations
   ------------------------------------------------------------
   Recent chats are saved as full conversation objects, so clicking
   a recent item restores the complete chat instead of only showing
   its title.
   ------------------------------------------------------------ */
function loadHistory(){
  try{
    const raw = JSON.parse(localStorage.getItem(STORAGE_HISTORY)) || [];
    // Migrate old title-only history into the new format.
    return raw.map(item => {
      if(typeof item === 'string') return { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()), title: item, messages: [] };
      return item;
    });
  }catch{ return []; }
}

function saveHistory(list){
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(list.slice(0, 12)));
}

function renderHistory(){
  const history = loadHistory();
  recentList.innerHTML = '';
  if(history.length === 0){
    recentList.innerHTML = '<div class="recent-empty">No conversations yet</div>';
    return;
  }
  history.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.textContent = chat.title || 'New conversation';
    item.title = chat.title || 'New conversation';
    item.dataset.chatId = chat.id;
    item.addEventListener('click', () => openConversation(chat.id));
    recentList.appendChild(item);
  });
}

function createConversation(title){
  const chat = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random())),
    title: title.length > 42 ? title.slice(0, 42) + '…' : title,
    messages: [],
    updatedAt: Date.now()
  };
  const history = loadHistory();
  history.unshift(chat);
  saveHistory(history);
  renderHistory();
  return chat;
}

function updateConversation(chatId, message){
  const history = loadHistory();
  const chat = history.find(c => c.id === chatId);
  if(!chat) return;
  chat.messages = chat.messages || [];
  chat.messages.push(message);
  chat.updatedAt = Date.now();
  saveHistory(history);
}

function openConversation(chatId){
  const history = loadHistory();
  const chat = history.find(c => c.id === chatId);
  if(!chat) return;

  chatWindow.innerHTML = '';
  showChat();
  currentConversationId = chat.id;
  isFirstMessage = false;

  (chat.messages || []).forEach(msg => addMessage(msg.text, msg.sender));
  chatInputBottom.focus();
}

function addToHistory(title){
  const chat = createConversation(title);
  currentConversationId = chat.id;
  return chat;
}

newChatBtn.addEventListener('click', () => {
  chatWindow.innerHTML = '';
  currentConversationId = null;
  isFirstMessage = true;
  showHero();
  chatInput.value = '';
  chatInputBottom.value = '';
  chatInput.focus();
});

/* ------------------------------------------------------------
   View switching: hero (centered box) <-> chat thread
   ------------------------------------------------------------ */
function showHero(){
  heroView.classList.remove('hidden');
  chatView.classList.add('hidden');
}
function showChat(){
  heroView.classList.add('hidden');
  chatView.classList.remove('hidden');
}

/* ------------------------------------------------------------
   Chat messages
   ------------------------------------------------------------ */
function addMessage(text, sender){
  const row = document.createElement('div');
  row.className = 'msg ' + sender;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = sender === 'user' ? 'You' : 'AI';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

function addThinkingBubble(){
  const row = document.createElement('div');
  row.className = 'msg bot';
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = 'AI';
  const bubble = document.createElement('div');
  bubble.className = 'bubble thinking';
  bubble.textContent = 'Thinking…';
  row.appendChild(avatar);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return row;
}

let isFirstMessage = true;
let currentConversationId = null;

async function handleSend(question){
  if(!question.trim()) return;

  if(isFirstMessage){
    showChat();
    addToHistory(question);
    isFirstMessage = false;
  }

  addMessage(question, 'user');
  if(currentConversationId) updateConversation(currentConversationId, {sender:'user', text:question});
  const thinkingRow = addThinkingBubble();

  try{
    const answer = await getAIResponse(question);
    thinkingRow.remove();
    addMessage(answer, 'bot');
    if(currentConversationId) updateConversation(currentConversationId, {sender:'bot', text:answer});
  }catch(err){
    thinkingRow.remove();
    addMessage("Sorry, I couldn't reach the AI just now. Please try again.", 'bot');
    console.error(err);
  }
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = chatInput.value.trim();
  chatInput.value = '';
  handleSend(q);
});

chatFormBottom.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = chatInputBottom.value.trim();
  chatInputBottom.value = '';
  handleSend(q);
});

quickPills.forEach(pill => {
  pill.addEventListener('click', () => {
    const prompt = pill.getAttribute('data-prompt');
    chatInput.value = prompt;
    handleSend(prompt);
    chatInput.value = '';
  });
});

/* ------------------------------------------------------------
   Local knowledge base matcher
   ------------------------------------------------------------
   data.js contains 1,065 question variants. This matcher scores
   phrase and word overlap so users do not need to type an exact
   sentence.
   ------------------------------------------------------------ */

const STOP_WORDS = new Set([
  'a','an','and','are','can','could','do','does','for','from','how',
  'i','in','is','it','me','my','of','on','or','please','should','tell',
  'the','this','to','what','when','where','which','who','why','with',
  'you','your','about','help','give','explain','work','want','need'
]);

function normalizeText(text){
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function usefulWords(text){
  return normalizeText(text)
    .split(' ')
    .filter(word => word && !STOP_WORDS.has(word) && word.length > 1);
}

function scoreEntry(question, entry){
  const q = normalizeText(question);
  const qWords = new Set(usefulWords(question));
  let best = 0;

  for(const phrase of (entry.questions || [])){
    const p = normalizeText(phrase);
    if(!p) continue;
    if(q === p) best = Math.max(best, 100);
    else if(q.includes(p) || p.includes(q)) best = Math.max(best, 70);
  }

  for(const keyword of (entry.keywords || [])){
    const k = normalizeText(keyword);
    if(k && q.includes(k)) best += Math.min(12, k.split(' ').length * 4);
  }

  const entryWords = new Set();
  (entry.keywords || []).forEach(k => usefulWords(k).forEach(w => entryWords.add(w)));

  let overlap = 0;
  qWords.forEach(w => { if(entryWords.has(w)) overlap++; });

  if(qWords.size) best += (overlap / qWords.size) * 35;
  if(overlap >= 2) best += 8;

  return best;
}

async function getAIResponse(question){
  await new Promise(r => setTimeout(r, 180));

  // AP Assistant identity / creator facts. These are intentionally
  // handled first so they always receive the exact project identity.
  const q = normalizeText(question);
  if(/\b(who are you|what are you|tell me about yourself|what is your name|your name)\b/.test(q)) {
    return "I am AP Assistant, an AI assistant made by Ansh Prasad.";
  }
  if(/\b(who (is|was) your founder|who founded you|who is the founder|your founder)\b/.test(q)) {
    return "My founder is Ansh Prasad, Class 9. I am AP Assistant.";
  }
  if(/\b(who made you|who created you|who built you|who developed you|who is your creator|made by whom)\b/.test(q)) {
    return "I was made by Ansh Prasad, Class 9. I am AP Assistant.";
  }
  if(/\b(what is ap assistant|about ap assistant|tell me about ap assistant)\b/.test(q)) {
    return "AP Assistant is an AI assistant made by Ansh Prasad, Class 9. It is designed to help with questions, writing, learning, coding, planning, and everyday tasks.";
  }

  let bestEntry = null;
  let bestScore = 0;

  for(const entry of KNOWLEDGE_BASE){
    const score = scoreEntry(question, entry);
    if(score > bestScore){
      bestScore = score;
      bestEntry = entry;
    }
  }

  // Require a meaningful match so unrelated questions do not get
  // a random answer from the knowledge base.
  if(bestEntry && bestScore >= 28) return bestEntry.answer;
  return FALLBACK_ANSWER;
}

/* ============================================================
   CONNECTING A REAL AI
   ============================================================
   Replace the body of getAIResponse() with a call to your own
   backend, which calls an AI provider's API (Anthropic, OpenAI,
   etc.). Never put a real API key directly in this file — anyone
   who opens the page can view-source it and steal the key.

   1. Build a small backend (Node/Express, Python/Flask, or a
      serverless function) holding the API key as an environment
      variable.
   2. Send the question from this page to YOUR backend.
   3. Your backend calls the AI provider and returns the answer.

   Example once you have a backend endpoint (POST /api/ask):

   async function getAIResponse(question){
     const res = await fetch('/api/ask', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ question })
     });
     const data = await res.json();
     return data.answer;
   }

   To answer from your own large knowledge base ("huge data"), the
   usual approach is Retrieval Augmented Generation (RAG): store
   your documents in a database, search it for the most relevant
   chunks per question, then send those chunks + the question to
   the AI model so it answers from your specific data.
   ============================================================ */

/* ------------------------------------------------------------
   Init
   ------------------------------------------------------------ */
initOnboarding();
renderHistory();
showHero();

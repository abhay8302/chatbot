const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

function addMessage(text, role) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function getReply(userText) {
  const text = userText.trim().toLowerCase();

  if (!text) {
    return 'Please type a question about STUV.ai and I will help.';
  }

  if (/(hi|hello|hey|start|help|what can you do)/.test(text)) {
    return 'Hi! I can answer questions about STUV.ai, products, pricing, use cases, and company details. Try asking: “What does STUV.ai do?”';
  }

  if (/(what is stuv|what does stuv|stuv\.ai|product|platform|do you do|about stuv)/.test(text)) {
    return 'STUV.ai is an AI-powered platform that helps learners and teams turn information into faster, smarter learning and productivity workflows. It focuses on personalized support, content understanding, and guided assistance.';
  }

  if (/(feature|features|capabilities|tools|what can it do)/.test(text)) {
    return 'Key features include:\n• AI-guided learning assistance\n• Fast content summarization\n• Personalized study and workflow support\n• Structured answers for product, pricing, and FAQs';
  }

  if (/(pricing|price|cost|plan|subscription|free|pro|enterprise|business)/.test(text)) {
    return 'STUV.ai offers a simple setup for MVP use with a starter plan for evaluation and paid tiers for heavier usage. For exact current pricing, the best next step is to contact the STUV.ai team or check their latest pricing page.';
  }

  if (/(use case|who is it for|for whom|student|school|college|team|company|enterprise|educator|trainer)/.test(text)) {
    return 'STUV.ai is useful for students, educators, teams, and companies that want AI help for learning, knowledge access, and guided task support. It is especially strong for fast answers, structured explanations, and productivity workflows.';
  }

  if (/(company|about|mission|vision|team|founder|who are you)/.test(text)) {
    return 'STUV.ai is focused on making AI practical for everyday learning and work. The product is designed to be simple, useful, and reliable for real-world questions rather than only experimental demos.';
  }

  if (/(support|contact|demo|book|sales|reach|talk)/.test(text)) {
    return 'You can reach the STUV.ai team through their official channels for a demo, sales questions, or onboarding help. For an MVP-style prototype, this chat can also act as a guided assistant for common questions.';
  }

  return 'I can help with STUV.ai product details, features, pricing, use cases, and company info. Try asking one of these:\n• What does STUV.ai do?\n• What are the features?\n• How much does it cost?\n• Who is it for?';
}

function handleSend() {
  const value = inputEl.value;
  if (!value.trim()) return;

  addMessage(value, 'user');
  inputEl.value = '';

  const reply = getReply(value);
  window.setTimeout(() => addMessage(reply, 'bot'), 250);
}

sendButton.addEventListener('click', handleSend);
inputEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleSend();
  }
});

addMessage('Hello! I am the STUV.ai assistant. Ask me anything about the product, pricing, features, or use cases.', 'bot');

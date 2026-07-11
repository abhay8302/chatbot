const messages=document.getElementById("messages");

const input=document.getElementById("messageInput");

const send=document.getElementById("sendButton");

const typing=document.getElementById("typing");

const stopButton=document.getElementById("stopButton");

const themeToggle=document.getElementById("themeToggle");

const exportChat=document.getElementById("exportChat");

const clearChat=document.getElementById("clearChat");

const quickQuestions=document.getElementById("quickQuestions");

// AbortController for canceling requests
let abortController=null;

// Store conversation history
let conversationHistory = [];

// Load saved theme and conversation
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadConversation();
});

function addMessage(text,type,timestamp=null){

const div=document.createElement("div");

div.className=`message ${type}`;

// Parse markdown
text = parseMarkdown(text);

div.innerHTML=text;

// Add timestamp
const timeDiv=document.createElement("div");
timeDiv.className="message-timestamp";
timeDiv.innerText=timestamp || new Date().toLocaleTimeString();
div.appendChild(timeDiv);

// Add copy button for bot messages
if(type==="bot"){
    const actions=document.createElement("div");
    actions.className="message-actions";
    const copyBtn=document.createElement("button");
    copyBtn.innerText="📋";
    copyBtn.onclick=()=>copyToClipboard(text);
    actions.appendChild(copyBtn);
    div.appendChild(actions);
}

messages.appendChild(div);

messages.scrollTop=messages.scrollHeight;

}

async function sendMessage(){

const text=input.value.trim();

if(!text)return;

addMessage(text,"user");

// Add user message to history
conversationHistory.push({ role: "user", content: text });

input.value="";

typing.style.display="block";

// Create new AbortController for this request
abortController=new AbortController();

// Stop button handler
stopButton.onclick=()=>{
    if(abortController){
        abortController.abort();
        abortController=null;
        typing.style.display="none";
        addMessage("Request stopped by user","bot");
    }
};

try{

const res=await fetch("/api/chat",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

signal: abortController.signal,

body:JSON.stringify({

message:text,
history: conversationHistory

})

});

const data=await res.json();

typing.style.display="none";

// Filter out safety messages and other metadata
let reply = data.reply;
if (reply.includes("User Safety:")) {
  reply = reply.replace(/User Safety:.*?\n?/g, "").trim();
}
if (reply.includes("Safety:")) {
  reply = reply.replace(/Safety:.*?\n?/g, "").trim();
}

addMessage(reply,"bot");

// Add bot response to history
conversationHistory.push({ role: "assistant", content: reply });

// Save conversation to localStorage
saveConversation();

}
catch(e){

typing.style.display="none";

if(e.name==="AbortError"){
    addMessage("Request canceled","bot");
}else{
    addMessage("Unable to contact server.","bot");
}

}
finally{
    abortController=null;
    stopButton.onclick=null;
}

}

// Theme toggle
themeToggle.onclick=()=>{
    document.body.classList.toggle("dark-mode");
    const isDark=document.body.classList.contains("dark-mode");
    localStorage.setItem("theme",isDark?"dark":"light");
    themeToggle.innerText=isDark?"☀️":"🌙";
};

function loadTheme(){
    const savedTheme=localStorage.getItem("theme");
    if(savedTheme==="dark"){
        document.body.classList.add("dark-mode");
        themeToggle.innerText="☀️";
    }
}

// Clear chat
clearChat.onclick=()=>{
    if(confirm("Clear all messages?")){
        messages.innerHTML="";
        conversationHistory=[];
        localStorage.removeItem("conversation");
        addMessage("👋 Hello! I am the STUV.ai Assistant. Ask me anything about STUV.ai.","bot");
    }
};

// Export chat
exportChat.onclick=()=>{
    const chatText=conversationHistory.map(msg=>`${msg.role}: ${msg.content}`).join("\n\n");
    const blob=new Blob([chatText],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="stuv-chat-export.txt";
    a.click();
    URL.revokeObjectURL(url);
};

// Copy to clipboard
function copyToClipboard(text){
    navigator.clipboard.writeText(text).then(()=>{
        alert("Copied to clipboard!");
    });
}

// Parse markdown
function parseMarkdown(text){
    return text
        .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
        .replace(/\*(.*?)\*/g,"<em>$1</em>")
        .replace(/`(.*?)`/g,"<code>$1</code>")
        .replace(/\n/g,"<br>")
        .replace(/- (.*?)(<br>|$)/g,"<li>$1</li>")
        .replace(/(<li>.*<\/li>)/s,"<ul>$1</ul>");
}

// Quick questions
quickQuestions.addEventListener("click",(e)=>{
    if(e.target.classList.contains("quick-btn")){
        const question=e.target.dataset.question;
        input.value=question;
        sendMessage();
    }
});

// Save conversation to localStorage
function saveConversation(){
    localStorage.setItem("conversation",JSON.stringify(conversationHistory));
}

// Load conversation from localStorage
function loadConversation(){
    const saved=localStorage.getItem("conversation");
    if(saved){
        conversationHistory=JSON.parse(saved);
        conversationHistory.forEach(msg=>{
            addMessage(msg.content,msg.role==="user"?"user":"bot");
        });
    }
}

send.onclick=sendMessage;

input.addEventListener("keydown",e=>{

if(e.key==="Enter")

sendMessage();

});

addMessage(

"👋 Hello! I am the STUV.ai Assistant. Ask me anything about STUV.ai.",

"bot"

);
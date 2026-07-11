const messages=document.getElementById("messages");

const input=document.getElementById("messageInput");

const send=document.getElementById("sendButton");

const typing=document.getElementById("typing");

function addMessage(text,type){

const div=document.createElement("div");

div.className=`message ${type}`;

div.innerText=text;

messages.appendChild(div);

messages.scrollTop=messages.scrollHeight;

}

async function sendMessage(){

const text=input.value.trim();

if(!text)return;

addMessage(text,"user");

input.value="";

typing.style.display="block";

try{

const res=await fetch("/api/chat",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

message:text

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

}

catch(e){

typing.style.display="none";

addMessage("Unable to contact server.","bot");

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
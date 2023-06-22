import { Configuration, OpenAIApi } from 'openai'
import { process } from './env'

//Firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getDatabase, ref, push, get, remove } from 'firebase/database'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhZUjlmrrImAus_i6_bBkW_2GQeGU1VT4",
    authDomain: "bard-song.firebaseapp.com",
    projectId: "bard-song",
    storageBucket: "bard-song.appspot.com",
    messagingSenderId: "839686431997",
    appId: "1:839686431997:web:56a3ffd06a7eabb8664a94",
    measurementId: "G-KY8FN01JNM"
  };  

// Initialize Firebase
// const app = initializeApp(firebaseConfig);

const appSettings = {
    databaseURL: 'https://bard-song-default-rtdb.firebaseio.com/'
}

const app = initializeApp(appSettings);

const database = getDatabase(app)

const conversationInDb = ref(database)

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

const chatbotConversation = document.getElementById('chatbot-conversation')
 
const instructionObj = 
    {
        role: 'system',
        content: 'You are a poet or bard who gives whimsical answers that rhyme to any question'
    }
 
document.addEventListener('submit', (e) => {
    e.preventDefault()
    const userInput = document.getElementById('user-input')   
    renderTypewriterText("I need a moment to focus my mind, so the right words I can find.")
    push(conversationInDb, { 
        role: 'user',
        content: userInput.value
    })
    try {
    fetchReply()
    const newSpeechBubble = document.createElement('div')
    newSpeechBubble.classList.add('speech', 'speech-human')
    chatbotConversation.appendChild(newSpeechBubble)
    newSpeechBubble.textContent = userInput.value
    userInput.value = ''
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight
    }
    catch (error) {
        console.error(error)
        // alert('API request denied. Please try again later.')
        alert("Sorry, my muses have been drained. My voice is strained. I hate to send you away. Perhaps I can sing another day.")
        renderTypewriterText("Sorry, my muses have been drained. My voice is strained. I hate to send you away. Perhaps I can sing another day.")
      }
}) 

function fetchReply(){
    get(conversationInDb).then(async(snapshot)=>{
        if(snapshot.exists()){
            const conversationArr = Object.values(snapshot.val())
            conversationArr.unshift(instructionObj)
            const response = await openai.createChatCompletion({
                model: 'gpt-4',
                messages: conversationArr,
                presence_penalty: 0,
                frequency_penalty: 0.3
            }) 
            console.log(response)
            push(conversationInDb, response.data.choices[0].message)
            renderTypewriterText(response.data.choices[0].message.content)

        }
        else{
            console.log("No data available")
        }
    })
}

function renderTypewriterText(text) {
    const newSpeechBubble = document.createElement('div')
    newSpeechBubble.classList.add('speech', 'speech-ai', 'blinking-cursor')
    chatbotConversation.appendChild(newSpeechBubble)
    let i = 0
    const interval = setInterval(() => {
        newSpeechBubble.textContent += text.slice(i-1, i)
        if (text.length === i) {
            clearInterval(interval)
            newSpeechBubble.classList.remove('blinking-cursor')
        }
        i++
        chatbotConversation.scrollTop = chatbotConversation.scrollHeight
    }, 50)
}

document.getElementById('clear-btn').addEventListener('click', () => {
    remove(conversationInDb)
    chatbotConversation.innerHTML = '<div class="speech speech-ai">How can I help you?</div>'

})

function renderConversationFromDb(){
    get(conversationInDb).then(async (snapshot)=>{
        if(snapshot.exists()) {
            Object.values(snapshot.val()).forEach(dbObj => {
                const newSpeechBubble = document.createElement('div')
                newSpeechBubble.classList.add(
                    'speech',
                    `speech-${dbObj.role ==='user' ? 'human' : 'ai'}`
                    )
                chatbotConversation.appendChild(newSpeechBubble)
                newSpeechBubble.textContent = dbObj.content
            })
            chatbotConversation.scrollTop = chatbotConversation.scrollHeight
        }
    })
}

renderConversationFromDb()
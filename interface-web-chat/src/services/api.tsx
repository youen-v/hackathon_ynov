
const API_URL = '/api';

const mockResponse = [
    "Hello! How can I assist you today?",
    "Sure! I can help you with that.",
    "I'm here to answer any questions you have.",
    "Let me look that up for you.",
    "Here's what I found on that topic.",
    "Is there anything else you'd like to know?",
    "I'm glad I could help! If you have more questions, feel free to ask.",
    "Thank you for reaching out! I'm here to assist you with any information you need.",
    "If you have any more questions, don't hesitate to ask. I'm here to help!",
    "Have a great day! If you need anything else, just let me know.",
    "I'm sorry, but I don't have that information at the moment. Is there anything else I can assist you with?",
    "That's an interesting question! Let me see if I can find the answer for you.",
    "I'm here to provide you with accurate and helpful information. What would you like to know?",
    "Feel free to ask me anything! I'm here to assist you with any questions you may have.",
    "I'm glad you're interested in learning more! What specific information are you looking for?",
    "Thank you for your question! Let me gather the information you need.",
    "I'm here to help you with any questions you have. What can I assist you with today?",
    "That's a great question! Let me see if I can find the answer for you.",
    "I'm here to provide you with accurate and helpful information. What would you like to know?",
    "Feel free to ask me anything! I'm here to assist you with any questions you may have.",
    "I'm glad you're interested in learning more! What specific information are you looking for?",
]

async function sendMessage(message: string): Promise<string> {
    return new Promise<string>((resolve) => {
        const delay = Math.random() * 2000 + 500; // Simulate network delay

        setTimeout(() => {
            const randomResponse = mockResponse[Math.floor(Math.random() * mockResponse.length)];
            resolve(randomResponse);
        }, delay);
    });
}

// async function sendMessage(message: string): Promise<string> {
//     const response = await fetch(`${API_URL}/send-message`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             model: "phi3.5",
//             prompt: message,
//             stream: false
//         })
//     });

//     const data = await response.json();
//     return data.message;
// }

export { sendMessage };
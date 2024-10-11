// script.js

document.getElementById('submitButton').addEventListener('click', async () => {
    const userInput = document.getElementById('userInput').value.trim();
    if (!userInput) {
        alert('Please enter a message.');
        return;
    }

    // Disable the button to prevent multiple submissions
    document.getElementById('submitButton').disabled = true;

    // Clear the input field
    document.getElementById('userInput').value = '';

    // Append user's message to the conversation container
    appendMessage('user', userInput);

    try {
        // Step 1: Create a thread (only if not already created)
        if (!window.threadId) {
            const threadResponse = await fetch('/createThread', {
                method: 'POST'
            });
            const threadData = await threadResponse.json();
            window.threadId = threadData.id;
        }

        const threadId = window.threadId;

        // Step 2: Create a message with user's input
        await fetch(`/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: 'user',
                content: userInput
            })
        });

        // Step 3: Start a run
        await fetch(`/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Step 4: Poll for assistant's response
        const intervalId = setInterval(async () => {
            const messagesResponse = await fetch(`/threads/${threadId}/messages`);
            const messagesData = await messagesResponse.json();
            const messages = messagesData.data;

            // Filter messages to get the latest assistant reply
            const assistantMessages = messages.filter(msg => msg.role === 'assistant' && msg.content && msg.content[0].text.value);

            if (assistantMessages.length > 0) {
                // Display the assistant's responses
                updateConversation(messages);

                // Stop polling
                clearInterval(intervalId);

                // Re-enable the submit button
                document.getElementById('submitButton').disabled = false;
            }
        }, 3000);

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
        // Re-enable the submit button
        document.getElementById('submitButton').disabled = false;
    }
});

// Function to append a message to the conversation container
function appendMessage(role, content) {
    const conversationContainer = document.getElementById('conversationContainer');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);

    const messageContent = document.createElement('div');
    messageContent.classList.add('content');
    messageContent.innerText = content;

    const timestamp = document.createElement('div');
    timestamp.classList.add('timestamp');
    timestamp.innerText = new Date().toLocaleTimeString();

    if (role === 'user') {
        messageDiv.appendChild(timestamp);
        messageDiv.appendChild(messageContent);
    } else {
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(timestamp);
    }

    conversationContainer.appendChild(messageDiv);

    // Scroll to the bottom of the conversation container
    conversationContainer.scrollTop = conversationContainer.scrollHeight;
}

// Function to update the conversation with all messages
function updateConversation(messages) {
    const conversationContainer = document.getElementById('conversationContainer');
    conversationContainer.innerHTML = ''; // Clear existing messages

    messages.forEach(msg => {
        if (msg.content && msg.content[0].text.value) {
            const role = msg.role === 'assistant' ? 'assistant' : 'user';
            const content = msg.content[0].text.value;
            appendMessage(role, content);
        }
    });
}

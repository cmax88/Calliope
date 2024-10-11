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
function appendMessage(role, content, messageId) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);
    if (messageId) {
        messageDiv.id = messageId;
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('message-content-wrapper');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content');

    if (role === 'assistant') {
        // Parse Markdown to HTML
        const rawHtml = marked.parse(content);
        // Sanitize the HTML
        const sanitizedHtml = DOMPurify.sanitize(rawHtml);
        // Set the sanitized HTML
        contentDiv.innerHTML = sanitizedHtml;
    } else {
        // Escape HTML for user messages to prevent XSS if user inputs malicious code
        contentDiv.textContent = content;
    }

    // Timestamp
    const timestampDiv = document.createElement('div');
    timestampDiv.classList.add('timestamp');
    timestampDiv.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    contentWrapper.appendChild(contentDiv);
    contentWrapper.appendChild(timestampDiv);

    messageDiv.appendChild(contentWrapper);

    // Append to conversation
    const conversationContainer = document.getElementById('conversationContainer');
    conversationContainer.appendChild(messageDiv);

    // Scroll to the bottom smoothly
    conversationContainer.scrollTo({
        top: conversationContainer.scrollHeight,
        behavior: 'smooth'
    });
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

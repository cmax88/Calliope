// script.js

document.addEventListener('DOMContentLoaded', () => {
    const inputForm = document.getElementById('inputForm');
    const userInput = document.getElementById('userInput');
    const submitButton = document.getElementById('submitButton');
    const conversationContainer = document.getElementById('conversationContainer');
    const inputContainer = document.getElementById('inputContainer');
    const invalidFeedback = document.querySelector('.invalid-feedback');
    let isFirstMessage = true;

    // Global thread ID
    window.threadId = null;

    // Auto-expand textarea
    userInput.addEventListener('input', () => {
        // Auto-expand the textarea height
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';

        // Remove invalid class on input
        if (userInput.value.trim()) {
            userInput.classList.remove('is-invalid');
            invalidFeedback.style.display = 'none';
        }
    });

    // Handle form submission
    inputForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const message = userInput.value.trim();
        if (!message) {
            userInput.classList.add('is-invalid');
            invalidFeedback.style.display = 'block';
            return;
        } else {
            userInput.classList.remove('is-invalid');
            invalidFeedback.style.display = 'none';
        }

        // If it's the first message, perform the transition
        if (isFirstMessage) {
            isFirstMessage = false;
            performTransition();
        }

        // Disable input during processing
        submitButton.disabled = true;
        userInput.disabled = true;

        // Append user's message
        appendMessage('user', message);

        // Clear input
        userInput.value = '';
        userInput.style.height = 'auto';

        try {
            // Send message to assistant
            await sendMessageToAssistant(message);

            // Re-enable input
            submitButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();

        } catch (error) {
            console.error('Error:', error);
            appendMessage('assistant', 'An error occurred. Please try again.');
            submitButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    });

    // Function to perform the transition
    function performTransition() {
        // Move input container to bottom
        inputContainer.classList.add('moved');
        // Reveal conversation container
        conversationContainer.classList.remove('hidden');
    }

    // Function to send message to assistant
    async function sendMessageToAssistant(userMessage) {
        // Disable the button to prevent multiple submissions
        submitButton.disabled = true;

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
                    content: userMessage
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
                    submitButton.disabled = false;
                    userInput.disabled = false;
                }
            }, 3000);

        } catch (error) {
            console.error('Error:', error);
            appendMessage('assistant', 'An error occurred. Please try again.');

            // Re-enable the submit button
            submitButton.disabled = false;
            userInput.disabled = false;
        }
    }

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
        conversationContainer.appendChild(messageDiv);

        // Scroll to the bottom smoothly
        conversationContainer.scrollTo({
            top: conversationContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    // Function to update the conversation with all messages
    function updateConversation(messages) {
        conversationContainer.innerHTML = ''; // Clear existing messages

        messages.forEach(msg => {
            if (msg.content && msg.content[0].text.value) {
                const role = msg.role === 'assistant' ? 'assistant' : 'user';
                const content = msg.content[0].text.value;
                appendMessage(role, content);
            }
        });
    }

    // Handle new conversation button (if present)
    const newConversationButton = document.getElementById('newConversationButton');
    if (newConversationButton) {
        newConversationButton.addEventListener('click', async () => {
            // Clear conversation container
            conversationContainer.innerHTML = '';

            // Reset the input container position
            inputContainer.classList.remove('moved');
            isFirstMessage = true;
            window.threadId = null;

            // Hide conversation container
            conversationContainer.classList.add('hidden');

            // Reset conversation on the server (if applicable)
            await fetch('/reset', {
                method: 'POST'
            });
        });
    }

    // Dark mode toggle (if using dark mode)
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
        });
    }
});

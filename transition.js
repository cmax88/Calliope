// transition.js

document.addEventListener('DOMContentLoaded', () => {
    const inputContainer = document.getElementById('inputContainer');
    const conversationContainer = document.getElementById('conversationContainer');
    let isFirstMessage = true;

    // Expose the performTransition function to the global scope
    window.performTransition = function() {
        if (isFirstMessage) {
            isFirstMessage = false;
            // Move input container to bottom
            inputContainer.classList.add('moved');
            // Reveal conversation container
            conversationContainer.classList.remove('hidden');
        }
    };
});

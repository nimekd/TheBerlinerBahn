document.addEventListener("DOMContentLoaded", function () {
    const helpButton = document.getElementById("help-btn");
    const helpOverlay = document.getElementById("help-popup");
    const closeButton = document.getElementById("close-popup");

    // Show the modal when the help button is clicked
    helpButton.addEventListener("click", () => {
        helpOverlay.classList.add("active");
    });

    // Prevent form submission and close the modal
    closeButton.addEventListener("click", (event) => {
        event.preventDefault(); // Prevent form submission
        helpOverlay.classList.remove("active");
    });

    // Optional: Close modal if clicking outside the modal content
    helpOverlay.addEventListener("click", (e) => {
        if (e.target === helpOverlay) {
            helpOverlay.classList.remove("active");
        }
    });
});

function showLoading() {
    // Hide the button text and show the loading spinner
    document.getElementById("btn-text").classList.add("hidden");
    document.getElementById("loading-spinner").classList.remove("hidden");

    // Simulate a loading period (1 second in this example)
    setTimeout(function() {
        // Hide the loading spinner and show the button text after 1 second
        document.getElementById("loading-spinner").classList.add("hidden");
        document.getElementById("btn-text").classList.remove("hidden");
    }, 1000);
}


// Function to close all sections
        function closeAllSections() {
            document.getElementById('faq-content').classList.add('hidden');
            document.getElementById('about-us-content').classList.add('hidden');
            document.getElementById('top-staitons-content').classList.add('hidden');
        }
    
        // Menu Toggle
        document.getElementById('menu-toggle').addEventListener('click', function() {
            document.getElementById('menu').classList.add('menu-open');
        });
    
        document.getElementById('close-menu').addEventListener('click', function() {
            document.getElementById('menu').classList.remove('menu-open');
            closeAllSections(); // Ensure all sections are hidden when the menu is closed
        });
    
        // Handle FAQ section
        document.getElementById('menu-faq').addEventListener('click', function() {
            // Close all other sections
            closeAllSections();
            // Toggle the FAQ section visibility
            document.getElementById('faq-content').classList.toggle('hidden');
        });
    
        // Handle About Us section
        document.getElementById('menu-about-us').addEventListener('click', function() {
            // Close all other sections
            closeAllSections();
            // Toggle the About Us section visibility
            document.getElementById('about-us-content').classList.toggle('hidden');
        });
    
        // Handle Top Stations section
        document.getElementById('menu-top-staitons').addEventListener('click', function(event) {
            // Prevent default link behavior
            event.preventDefault();
            // Close all other sections
            closeAllSections();
            // Toggle the Top Stations section visibility
            document.getElementById('top-staitons-content').classList.toggle('hidden');
        });
    
        // FAQ Handling for Desktop
        document.querySelectorAll('.faq-question').forEach((question) => {
            question.addEventListener('click', function() {
                // Get the answer element related to the clicked question
                const answer = this.nextElementSibling;
    
                // Check if the answer is currently hidden
                const isHidden = answer.classList.contains('hidden');
    
                // Hide all other answers
                document.querySelectorAll('.faq-answer').forEach((item) => {
                    item.classList.add('hidden');
                });
    
                // Show the clicked answer if it was hidden
                if (isHidden) {
                    answer.classList.remove('hidden');
                }
            });
        });
    
        // FAQ Handling for Desktop (Alternate)
        document.querySelectorAll('.faq-question_d').forEach((question) => {
            question.addEventListener('click', function() {
                const faqItem = this.parentNode;
                const answer = faqItem.querySelector('.faq-answer_d');
        
                // Toggle visibility of the answer
                answer.classList.toggle('hidden');
            });
        });
    
        // Dropdown Functionality
        document.addEventListener('DOMContentLoaded', function () {
            const button = document.getElementById('topStationsButton');
            const dropdownMenu = document.getElementById('dropdownMenu');
    
            button.addEventListener('click', function () {
                dropdownMenu.classList.toggle('hidden');
                dropdownMenu.classList.toggle('opacity-0');
                dropdownMenu.classList.toggle('translate-y-[-10px]');
                dropdownMenu.classList.toggle('opacity-100');
                dropdownMenu.classList.toggle('translate-y-0');
            });
    
            document.addEventListener('click', function (event) {
                if (!button.contains(event.target) && !dropdownMenu.contains(event.target)) {
                    dropdownMenu.classList.add('hidden');
                    dropdownMenu.classList.remove('opacity-100', 'translate-y-0');
                    dropdownMenu.classList.add('opacity-0', 'translate-y-[-10px]');
                }
            });
        });

        const searchForm = document.getElementById('search-form');
        const resultsList = document.getElementById('results-list');
        const searchBtn = document.getElementById('search-btn');
        const btnText = document.getElementById('btn-text');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();  // Prevent form from reloading the page
        
            const formData = new FormData(searchForm);
            const searchParams = new URLSearchParams(formData);
        
            // Hide the button text and show the spinner
            btnText.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
        
            // Disable the button to prevent multiple clicks
            searchBtn.disabled = true;
        
            fetch('/api/search', {
                method: 'POST',
                body: searchParams,
            })
            .then(response => response.json())
            .then(data => {
                searchBtn.disabled = false;
                btnText.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');
        
                resultsList.innerHTML = '';  // Clear previous results
        
                if (data.station_names) {
                    // Update result list with new station names
                    data.station_names.forEach(station_name => {
                        const li = document.createElement('li');
                        const a = document.createElement('a');
                        a.href = `/departures/${data.station_info_map[station_name].extId}`;
                        a.textContent = station_name;
                        a.classList.add('hover:underline');
                        li.appendChild(a);
                        resultsList.appendChild(li);
                    });
                } else if (data.error_message) {
                    // Show error message
                    const li = document.createElement('li');
                    li.textContent = data.error_message;
                    li.classList.add('text-red-500');
                    resultsList.appendChild(li);
                }
            })
            .catch(error => {
                searchBtn.disabled = false;
                btnText.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');
        
                console.error('Error:', error);
        
                const li = document.createElement('li');
                li.textContent = 'An error occurred while fetching station data.';
                li.classList.add('text-red-500');
                resultsList.appendChild(li);
            });
        });
        

        document.getElementById('mobile-search-form').addEventListener('submit', function(event) {
            event.preventDefault();  // Prevent form from reloading the page
            
            const formData = new FormData(this);  // Get form data
            const searchBtn = document.getElementById('mobile-search-btn');
            const btnText = document.getElementById('mobile-btn-text');
            const loadingSpinner = document.getElementById('mobile-loading-spinner');
            
            // Hide the text and show the spinner while the request is being processed
            btnText.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            
            // Disable the button to prevent multiple clicks
            searchBtn.disabled = true;
        
            fetch('/api/search', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                searchBtn.disabled = false;
                btnText.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');
                
                const resultsList = document.getElementById('mobile-results-list');
                resultsList.innerHTML = '';  // Clear previous results
        
                if (data.station_names) {
                    // Update result list with new station names
                    data.station_names.forEach(stationName => {
                        const listItem = document.createElement('li');
                        listItem.innerHTML = `<a href="${window.location.origin}/departures/${data.station_info_map[stationName].extId}" class="hover:underline">${stationName}</a>`;
                        resultsList.appendChild(listItem);
                    });
                } else if (data.error_message) {
                    // Show error message
                    const errorItem = document.createElement('li');
                    errorItem.classList.add('text-red-500');
                    errorItem.textContent = data.error_message;
                    resultsList.appendChild(errorItem);
                }
            })
            .catch(error => {
                searchBtn.disabled = false;
                btnText.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');
                const resultsList = document.getElementById('mobile-results-list');
                const errorItem = document.createElement('li');
                errorItem.classList.add('text-red-500');
                errorItem.textContent = 'An error occurred while fetching station data.';
                resultsList.appendChild(errorItem);
            });
        });

        document.addEventListener("DOMContentLoaded", () => {
            const helpBtn = document.getElementById("mobile-help-btn");
            const helpPopup = document.getElementById("mobile-help-popup");
            const closePopupBtn = document.getElementById("mobile-close-popup");
        
            helpBtn.addEventListener("click", () => {
                helpPopup.classList.add("active");
            });
        
            closePopupBtn.addEventListener("click", () => {
                helpPopup.classList.remove("active");
            });
        
            // Optional: Close the modal when clicking outside of it
            window.addEventListener("click", (event) => {
                if (event.target === helpPopup) {
                    helpPopup.classList.remove("active");
                }
            });
        });

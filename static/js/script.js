document.addEventListener("DOMContentLoaded", () => {
    let activeFilters = []; // Array to store active filters
    
    function showError(message) {
        // Remove any existing error message to avoid duplicates
        const existingError = document.querySelector(".error-message");
        if (existingError) existingError.remove();
    
        const errorDiv = document.createElement("div");
        errorDiv.textContent = message;
        errorDiv.classList.add(
            "error-message",
            "fixed",
            "bottom-10",
            "left-1/2",
            "transform",
            "-translate-x-1/2",
            "bg-red-500",
            "text-white",
            "py-2",
            "px-4",
            "rounded",
            "shadow-lg",
            "text-center",
            "font-bold"
        );
        document.body.appendChild(errorDiv);
    
        // Remove the message after 2 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 2000);
    }
    

    // ========================== Mobile-Specific Functions ==========================
        function isMobile() {
        return window.innerWidth <= 768;  // You can adjust this breakpoint if necessary
    }

    function applyCardFilters() {
        const cards = document.querySelectorAll(".mobile-departure-card");
        let visibleCards = 0;
    
        cards.forEach(card => {
            const productType = card.getAttribute("data-type");
    
            // Check if the card matches any of the active filters
            const matchesFilter = activeFilters.length === 0 || activeFilters.some(filter => {
                const filterTypes = filter.split(","); // Split filters into an array
                return filterTypes.includes(productType); // Check if card type matches any filter type
            });
    
            if (matchesFilter) {
                card.style.display = "block";
                visibleCards++;
            } else {
                card.style.display = "none";
            }
        });
    
        // Show error if no visible cards
        const activeFilterWithoutResults = activeFilters.find(filter => {
            const filterTypes = filter.split(",");
            const matchingCards = Array.from(cards).filter(card => filterTypes.includes(card.getAttribute("data-type")));
            return matchingCards.length === 0;
        });
    
        if (activeFilterWithoutResults) {
            console.log(`No departures for filter: ${activeFilterWithoutResults}`); // Debug log
            showError(`No departures available for filter: ${activeFilterWithoutResults}`);
    
            // Remove the invalid filter from active filters
            activeFilters = activeFilters.filter(f => f !== activeFilterWithoutResults);
    
            // Update filter button state
            const filterButton = document.querySelector(`[data-filter="${activeFilterWithoutResults}"]`);
            if (filterButton) {
                filterButton.classList.remove("border-4", "border-green-500", "bg-green-500");
                filterButton.classList.add("border-transparent", "bg-purple-700");
            }
    
            applyCardFilters(); // Reapply filters
        }
    
        updateActiveFiltersDisplay();
    }
    
    
    function handleCardFilterButtonClick() {
        const filterValue = this.getAttribute("data-filter");
    
        // Check if the button is disabled
        if (this.classList.contains("disabled-filter")) {
            // Show the error message for disabled filters
            showError(`No departures available for filter: ${filterValue}`);
            return; // Exit the function without changing filter state
        }
    
        if (this.classList.contains("border-green-500")) {
            // Remove the filter
            this.classList.remove("border-4", "border-green-500", "bg-green-500");
            this.classList.add("border-transparent", "bg-purple-700");
            activeFilters = activeFilters.filter(f => f !== filterValue);
        } else {
            // Add the filter
            this.classList.add("border-4", "border-green-500", "bg-green-500");
            this.classList.remove("border-transparent", "bg-purple-700");
            activeFilters.push(filterValue);
    
            // Check if the filter has no departures
            const filterTypes = filterValue.split(",");
            const matchingCards = Array.from(document.querySelectorAll(".mobile-departure-card")).filter(card => {
                return filterTypes.includes(card.getAttribute("data-type"));
            });
    
            if (matchingCards.length === 0) {
                // No departures available
                showError(`No departures available for filter: ${filterValue}`);
    
                // Disable the button visually and functionally
                this.classList.remove("border-4", "border-green-500", "bg-green-500");
                this.classList.add("border-transparent", "bg-purple-700", "disabled-filter");
                return; // Exit without reapplying filters
            }
        }
    
        applyCardFilters(); // Apply the updated filters
    }
    
    

    function fetchMobileDepartures() {
        if (!isMobile()) return;
    
        fetch(`/api/departures/${stationId}`)
            .then(response => response.json())
            .then(data => {
                console.log("Fetched mobile data:", data);
    
                // Get the departure-cards-section container
                const cardSection = document.querySelector('.departure-cards-section');
    
                // Clear existing cards
                cardSection.innerHTML = ''; // Clears only the cards
    
                // Loop through new data and append new cards
                data.departures.forEach(departure => {
                    const time = departure.real_time ? departure.real_time.slice(0, 5) : departure.planned_time.slice(0, 5);
                    const timeLeftStr = departure.time_left_str || "Unknown";
    
                    const card = document.createElement('div');
                    card.classList.add('mobile-departure-card', 'mb-4', 'p-4', 'bg-black', 'bg-opacity-50', 'font-apple-ii', 'rounded-lg', 'shadow-md');
                    card.setAttribute('data-type', departure.product_type);
    
                    // Add 'cancelled' class if the departure is cancelled
                    if (departure.cancelled) {
                        card.classList.add('cancelled');
                    }
    
                    // Determine the appropriate class for the time left
                    const timeLeftClass = departure.cancelled || departure.time_left_str === 'Jetzt' ? 'text-sm' : 'text-lg';
    
                    card.innerHTML = `
                    <div class="flex items-center justify-between w-full">
                        <!-- Left Section: Train Name and Direction -->
                        <div class="flex items-center space-x-2 truncate">
                            <span class="text-yellow-500 text-lg">
                                ${departure.name.startsWith('T') || departure.name.startsWith('B')
                                    ? departure.name.slice(1)
                                    : departure.name}
                            </span>
                            <span class="text-white text-lg truncate">
                                ${departure.direction}
                            </span>
                        </div>
                
                        <!-- Right Section: Time Left -->
                        <div class="mobile-departure-time-left text-yellow-500 ${timeLeftClass} ml-4 flex-shrink-0 flex items-center">
                            ${departure.time_left_str}
                            ${departure.real_time && departure.real_date && !departure.cancelled ? `
                                <div class="rt-symbol-container ml-2">
                                    <img src="/static/img/rticon/haf_rt_stboard_grey.svg" alt="Real-time symbol" class="rt-symbol" data-tooltip="This data is real-time">
                                </div>
                            ` : ''}
                        </div>
                    </div>
                
                    <!-- Bottom Section: Platform and Time -->
                    <div class="mt-1 text-gray-400 text-xs flex justify-between">
                        <p class="mobile-departure-platform">
                            Gleis: ${departure.platform}
                        </p>
                        <p class="mobile-departure-time">
                            [ ${time} ]
                        </p>
                    </div>
                `;
                
                cardSection.appendChild(card);
                });
    
                applyCardFilters(); // Reapply filters to the new data
                addRtSymbolEventListeners(); // Add event listeners to new rt-symbol elements
            })
            .catch(error => console.error('Error fetching mobile departures:', error));
    }
    
    

// Function to add event listeners to rt-symbol elements
function addRtSymbolEventListeners() {
    const rtSymbols = document.querySelectorAll('.rt-symbol');
    rtSymbols.forEach(function(rtSymbol) {
        rtSymbol.addEventListener('click', function() {
            alert('This data is real-time');
        });

        rtSymbol.addEventListener('mouseover', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bg-gray-700 text-white text-xs rounded py-1 px-2';
            tooltip.style.top = `${rtSymbol.getBoundingClientRect().top - 30}px`;
            tooltip.style.left = `${rtSymbol.getBoundingClientRect().left}px`;
            tooltip.innerText = rtSymbol.getAttribute('data-tooltip');
            tooltip.id = 'tooltip';
            document.body.appendChild(tooltip);
        });

        rtSymbol.addEventListener('mouseout', function() {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
}

// ========================== Desktop-Specific Functions ==========================
function fetchDesktopDepartures() {
    if (isMobile()) return;  // Ensure desktop fetch logic runs only on desktop
    fetch(`/api/departures/${stationId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Fetched data:", data); // Debug: Log fetched data

            // Update table
            const tableBody = document.getElementById('departure-table-body');
            tableBody.innerHTML = ''; // Clear existing rows

            data.departures.forEach(departure => {
                const row = document.createElement('tr');
                row.className = departure.cancelled ? 'cancelled' : (departure.time_left_str === 'Jetzt' ? 'font-bold text-white' : '');
                row.setAttribute("data-product-type", departure.product_type); // Set product type for filtering

                // Determine icon color and displayed name
                let iconColor = '';
                let displayedName = departure.name;
                let iconPreviewClass = ''; // Default icon preview class

                // Check for RB, RE, FEX, ICE, IC, EC, EN
                if (
                    departure.name.startsWith('RB') ||
                    departure.name.startsWith('RE') ||
                    departure.name.startsWith('FEX') ||
                    departure.name.startsWith('ICE') ||
                    departure.name.startsWith('IC') ||
                    departure.name.startsWith('EC') ||
                    departure.name.startsWith('EN')
                ) {
                    iconColor = '#f71a19';
                    iconPreviewClass = 're-rb-ice-ic-icon-preview';

                    // Replace ICE/IC/EC/EN with 'I' and append the remaining text
                    if (['ICE', 'IC', 'EC', 'EN'].some((prefix) => departure.name.startsWith(prefix))) {
                        displayedName = 'I' + departure.name.split(' ').slice(1).join(' ');
                    }
                }

                // Check for names starting with B
                else if (departure.name.startsWith('B')) {
                    iconColor = '#A6017D';
                    iconPreviewClass = 'bus-icon-preview';
                    displayedName = departure.name.slice(1); // Remove 'B'
                }

                // Check for names starting with T
                else if (departure.name.startsWith('T')) {
                    iconColor = '#de3a3a';
                    iconPreviewClass = 'bus-icon-preview';
                    displayedName = departure.name.slice(1); // Remove 'T' 
                }

                // Check for names starting with FLX
                else if (departure.name.startsWith('FLX')) {
                    iconColor = '#73D700';
                    iconPreviewClass = 'rb-icon-preview';
                    displayedName = departure.name.slice(0, 3); // Remove 'FLX'
                }

                // Handle S-Bahn
                else if (departure.name.startsWith('S')) {
                    if (departure.name === 'S1') {
                        iconColor = '#DB6BA3';
                    } else if (['S2', 'S25', 'S26'].includes(departure.name)) {
                        iconColor = '#007830';
                    } else if (departure.name === 'S3') {
                        iconColor = '#0066AE';
                    } else if (departure.name === 'S41') {
                        iconColor = '#AE5834';
                    } else if (departure.name === 'S42') {
                        iconColor = '#CC6410';
                    } else if (['S45', 'S46', 'S47'].includes(departure.name)) {
                        iconColor = '#CF9D52';
                    } else if (departure.name === 'S5') {
                        iconColor = '#EB7401';
                    } else if (['S7', 'S75'].includes(departure.name)) {
                        iconColor = '#826DA7';
                    } else if (['S8', 'S85'].includes(departure.name)) {
                        iconColor = '#65AC1C';
                    } else if (departure.name === 'S9') {
                        iconColor = '#9A2244';
                    }
                }
                // Handle U-Bahn
                else if (departure.name.startsWith('U')) {
                    if (departure.name === 'U1') {
                        iconColor = '#55a822';
                    } else if (departure.name === 'U2') {
                        iconColor = '#DB4018';
                    } else if (departure.name === 'U3') {
                        iconColor = '#0E693B';
                    } else if (departure.name === 'U4') {
                        iconColor = '#F0D81E';
                    } else if (departure.name === 'U5') {
                        iconColor = '#7E522C';
                    } else if (departure.name === 'U6') {
                        iconColor = '#8D6EAC';
                    } else if (departure.name === 'U7') {
                        iconColor = '#009CD6';
                    } else if (departure.name === 'U8') {
                        iconColor = '#1C4E87';
                    } else if (departure.name === 'U9') {
                        iconColor = '#F37C1D';
                    }
                }

                row.innerHTML = `
                    <td class="py-2 px-4 text-center text-xs sm:text-sm md:text-base lg:text-lg">
                        ${departure.real_time ? departure.real_time.slice(0, 5) : departure.planned_time.slice(0, 5)}
                    </td>
                    <td class="py-2 px-4 w-1/6">
                        <div class="flex justify-end ml-16">
                            <div class="text-right icon-preview ${iconPreviewClass}" style="background-color: ${iconColor};">
                                <span>${displayedName}</span>
                            </div>
                        </div>
                    </td>
                    <td class="py-2 px-4 !text-left text-xs sm:text-sm md:text-base lg:text-lg">${departure.direction}</td>
                    <td class="py-2 px-4 text-left text-xs sm:text-sm md:text-base lg:text-lg">${departure.platform}</td>
                    <td class="py-2 px-4 text-center text-xs sm:text-sm md:text-base lg:text-lg">
    <div class="flex items-center justify-center">
        <span>${departure.time_left_str}</span>
        <div class="flex items-center justify-center" style="width: 24px; height: 24px;">
            ${departure.real_time && departure.real_date && !departure.cancelled ? `
                <img src="/static/img/rticon/haf_rt_stboard_grey.svg" alt="Real-time symbol" class="rt-symbol" data-tooltip="This data is real-time">
            ` : `
                <div style="width: 24px; height: 24px;"></div>
            `}
        </div>
    </div>
</td>
                `;
                tableBody.appendChild(row);
            });

            applyDesktopFilters(); // Apply filters to new rows after data is fetched
            addRtSymbolEventListeners(); // Add event listeners to new rows
        })
        .catch(error => console.error('Error fetching departures:', error));
}
    
    function applyDesktopFilters() {
        const rows = document.querySelectorAll("table tbody tr");
        let visibleRows = 0;
    
        rows.forEach(row => {
            const productType = row.getAttribute("data-product-type");
    
            // Show the row only if it matches one of the active filters
            const matchesFilter = activeFilters.length === 0 || activeFilters.some(filter => filter.split(",").includes(productType));
    
            if (matchesFilter) {
                row.style.display = ""; // Show the row
                visibleRows++;
            } else {
                row.style.display = "none"; // Hide the row
            }
        });
    
        // Check for any filter with no matching rows
        const activeFilterWithoutResults = activeFilters.find(filter => {
            const filterTypes = filter.split(",");
            const matchingRows = Array.from(rows).filter(row => {
                const productType = row.getAttribute("data-product-type");
                return filterTypes.includes(productType);
            });
            return matchingRows.length === 0;
        });
    
        if (activeFilterWithoutResults) {
            showError(`No departures available for filter: ${activeFilterWithoutResults}`);
    
            // Update the button state for this filter (disable it)
            const filterButton = document.querySelector(`[data-filter="${activeFilterWithoutResults}"]`);
            if (filterButton) {
                filterButton.classList.remove("active", "border-4", "border-white");
                filterButton.classList.add("disabled-filter");
                filterButton.disabled = true;
            }
        }
    }
    
    

    // ========================== Shared Functions ==========================
    function startDataFetch() {
        const now = new Date();
        const timeToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        setTimeout(() => {
            fetchMobileDepartures();
            fetchDesktopDepartures();
            setInterval(() => {
                fetchMobileDepartures();
                fetchDesktopDepartures();
            }, 60000);
        }, timeToNextMinute);
    }

    // ========================== Event Listeners ==========================
    // Mobile event listeners
    document.querySelectorAll(".mobile-filter-button").forEach(button => {
        button.addEventListener("click", handleCardFilterButtonClick);
    });

    document.querySelectorAll("[id^='filter']").forEach(button => {
        button.addEventListener("click", function () {
            const filterValue = this.getAttribute("data-filter");
    
            // Check if the button is disabled
            if (this.classList.contains("disabled-filter")) {
                // Show the error message for disabled filters and exit
                showError(`No departures available for filter: ${filterValue}`);
                return; // Exit the function without changing filter state
            }
    
            // Toggle the 'active' class for visual feedback
            this.classList.toggle("active");
    
            if (this.classList.contains("active")) {
                // Add filter to activeFilters array
                activeFilters.push(filterValue);
            } else {
                // Remove filter from activeFilters array
                activeFilters = activeFilters.filter(f => f !== filterValue);
            }
    
            // Apply the same border style for both active and non-active filters
            this.classList.add("transition-all", "duration-300");
    
            if (this.classList.contains("active")) {
                // Add green border and background when active
                this.classList.add("border-4", "border-green-500", "bg-green-500");
                this.classList.remove("border-transparent");
            } else {
                // Remove the border and background when inactive
                this.classList.remove("border-4", "border-green-500", "bg-green-500");
                this.classList.add("border-transparent");
            }
    
            // Check if the filter has no departures (for desktop)
            const matchingRows = Array.from(document.querySelectorAll("table tbody tr")).filter(row => {
                const productType = row.getAttribute("data-product-type");
                return filterValue.split(",").includes(productType);
            });
    
            if (matchingRows.length === 0) {
                // No departures available for this filter
                showError(`No departures available for filter: ${filterValue}`);
    
                // Disable the button visually and functionally
                this.classList.remove("border-green-500", "bg-green-500");
                this.classList.add("border-transparent", "bg-purple-700", "disabled-filter");
                this.disabled = true; // Prevent further clicks
                activeFilters = activeFilters.filter(f => f !== filterValue); // Remove filter from activeFilters
            }
    
            applyDesktopFilters(); // Apply the updated filters
        });
    });
    
    


    startDataFetch(); // Start the data fetch process after DOM is loaded
});

document.addEventListener("DOMContentLoaded", () => {
    const fullscreenButton = document.getElementById("fullscreenButton");
    const tableContainer = document.getElementById("departureTableContainer");

    fullscreenButton.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            // Request fullscreen for the table container
            if (tableContainer.requestFullscreen) {
                tableContainer.requestFullscreen();
            } else if (tableContainer.mozRequestFullScreen) { // Firefox
                tableContainer.mozRequestFullScreen();
            } else if (tableContainer.webkitRequestFullscreen) { // Chrome, Safari and Opera
                tableContainer.webkitRequestFullscreen();
            } else if (tableContainer.msRequestFullscreen) { // IE/Edge
                tableContainer.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
            }
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const rtSymbols = document.querySelectorAll('.rt-symbol');
    rtSymbols.forEach(function(rtSymbol) {
        rtSymbol.addEventListener('click', function() {
            alert('Real-time Data');
        });

        rtSymbol.addEventListener('mouseover', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bg-gray-700 text-white text-xs rounded py-1 px-2';
            tooltip.style.top = `${rtSymbol.getBoundingClientRect().top - 30}px`;
            tooltip.style.left = `${rtSymbol.getBoundingClientRect().left}px`;
            tooltip.innerText = rtSymbol.getAttribute('data-tooltip');
            tooltip.id = 'tooltip';
            document.body.appendChild(tooltip);
        });

        rtSymbol.addEventListener('mouseout', function() {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
});


// Function to add event listeners to rt-symbol elements
function addRtSymbolEventListeners() {
    const rtSymbols = document.querySelectorAll('.rt-symbol');
    rtSymbols.forEach(function(rtSymbol) {
        rtSymbol.addEventListener('click', function() {
            alert('This data is real-time');
        });

        rtSymbol.addEventListener('mouseover', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bg-gray-700 text-white text-xs rounded py-1 px-2';
            tooltip.style.top = `${rtSymbol.getBoundingClientRect().top - 30}px`;
            tooltip.style.left = `${rtSymbol.getBoundingClientRect().left}px`;
            tooltip.innerText = rtSymbol.getAttribute('data-tooltip');
            tooltip.id = 'tooltip';
            document.body.appendChild(tooltip);
        });

        rtSymbol.addEventListener('mouseout', function() {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
}

// public/assets/js/breadcrumb.js

/**
 * Updates the breadcrumb navigation.
 * For now, it shows "نقطه شروع" (Start Point) and the current person.
 * Full path traversal logic can be added later.
 * @param {object} currentPerson - The data object for the currently viewed person (or null to clear).
 */
export function updateBreadcrumb(currentPerson) {
    const breadcrumbNav = document.getElementById('breadcrumb-nav');

    // Robust null check for the main breadcrumb container
    if (!breadcrumbNav) {
        console.error('Error: #breadcrumb-nav element not found in the DOM.');
        return; // Exit if the container is missing
    }

    // Ensure the <ol> element for breadcrumb items exists inside breadcrumbNav
    let olElement = breadcrumbNav.querySelector('ol');
    if (!olElement) {
        olElement = document.createElement('ol');
        olElement.className = 'breadcrumb mb-0'; // Apply Bootstrap classes
        breadcrumbNav.appendChild(olElement);
    }

    olElement.innerHTML = ''; // Clear existing breadcrumb items

    // Always add the "Start Point" / "Home" breadcrumb
    const homeItem = document.createElement('li');
    homeItem.className = 'breadcrumb-item';
    const homeLink = document.createElement('a');
    homeLink.href = '#';
    homeLink.textContent = 'نقطه شروع'; // "Start Point"
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Placeholder for navigating to the tree's root view.
        // For now, it will simply reset the zoom and clear the breadcrumb.
        console.log('Go to root clicked. (Navigation to root view needs explicit implementation)');
        if (typeof window.resetZoom === 'function') {
            window.resetZoom(); // Reset zoom for visual clarity
        }
        updateBreadcrumb(null); // Clear breadcrumb when going "home"
    });
    homeItem.appendChild(homeLink);
    olElement.appendChild(homeItem);

    // Add the current person's name as an active breadcrumb item if provided
    if (currentPerson && currentPerson.FirstName && currentPerson.LastName) {
        const fullName = `${currentPerson.FirstName} ${currentPerson.LastName}`.trim();
        const currentItem = document.createElement('li');
        currentItem.className = 'breadcrumb-item active';
        currentItem.setAttribute('aria-current', 'page');
        currentItem.textContent = fullName;
        olElement.appendChild(currentItem);
    }
}

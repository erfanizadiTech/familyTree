// public/assets/js/app.js
import { fetchData, transformDataToTree } from './data-parser.js';
import { renderTree } from './tree-renderer.js';
import { initializePopup, showPersonDetailsPopup, hidePersonDetailsPopup } from './popup.js';
import { updateBreadcrumb } from './breadcrumb.js'; // Keep breadcrumb for navigation

let familyData = []; // This will hold our processed family data (Person array)
let allPeopleMap = new Map(); // Global map for quick lookup of all people by PersonId
let enums = {}; // Global object to hold enum data

/**
 * Initializes the entire application.
 */
export async function initializeApp() {
    console.log('Initializing Family Tree Application...');

    // Initialize Moment-Jalaali locale settings
    // This must run AFTER Moment.js and Moment-Jalaali are loaded (via CDN in index.html)
    if (typeof moment !== 'undefined' && typeof moment.j !== 'undefined') {
        // 'use:"en"' allows parsing Gregorian dates from JSON, then converting to Persian
        moment.loadPersian({dialect: 'persian-modern', use:"en"});
        moment.setLocale('fa'); // Set global locale to Farsi
        console.log("Moment-Jalaali locale initialized.");
    } else {
        console.warn("Moment.js or Moment-Jalaali not fully loaded. Date formatting might be incorrect.");
    }

    // 1. Load family data (entire JSON structure)
    try {
        const fullJsonData = await fetchData('assets/data/family.json');
        familyData = fullJsonData.Person || []; // Extract the Person array
        enums = fullJsonData.Enum || {}; // Extract the Enum object
        console.log('Family data loaded:', familyData);
        console.log('Enum data loaded:', enums);

        // Populate the global map for relationship lookups
        familyData.forEach(person => allPeopleMap.set(person.PersonId, person));

    } catch (error) {
        console.error('Failed to load family data:', error);
        document.getElementById('family-tree-container').innerHTML = '<p class="text-danger text-center">خطا در بارگذاری اطلاعات خانوادگی. لطفا بعدا امتحان کنید.</p>';
        return; // Stop initialization if data loading fails
    }

    // 2. Initialize the popup module with the global people map and enum data
    initializePopup(allPeopleMap, enums);

    // 3. Initialize the tree visualization
    // We'll pass the *raw* Person data and the click handler to renderTree
    renderTree(familyData, handleNodeClick, allPeopleMap);

    // 4. Set up event listeners for UI elements
    setupUIListeners();

    // 5. Initial breadcrumb state
    updateBreadcrumb(null); // Start with an empty breadcrumb
}

/**
 * Handles clicks on individual person nodes in the tree.
 * @param {object} personData - The data object for the clicked person.
 */
function handleNodeClick(personData) {
    console.log('Node clicked:', personData.FirstName, personData.LastName);
    showPersonDetailsPopup(personData); // Show the popup
    updateBreadcrumb(personData); // Update breadcrumb based on clicked person
}

/**
 * Sets up global UI event listeners.
 */
function setupUIListeners() {
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', () => {
            if (typeof window.resetZoom === 'function') {
                window.resetZoom();
                console.log('Zoom reset initiated.');
            } else {
                console.warn('resetZoom function not available on window.');
            }
        });
    }

    const zoomInBtn = document.getElementById('zoom-in-btn');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (typeof window.zoomIn === 'function') {
                window.zoomIn();
            }
        });
    }

    const zoomOutBtn = document.getElementById('zoom-out-btn');
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (typeof window.zoomOut === 'function') {
                window.zoomOut();
            }
        });
    }
}

// Ensure the app initializes once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

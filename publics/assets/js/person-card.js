// // public/assets/js/person-card.js

// // NO LONGER IMPORTING FROM LOCAL FILE: import { formatDateFarsi } from './date-formatter.js';
// // The moment and moment-jalaali libraries are expected to be loaded globally via CDN in index.html

// /**
//  * Formats an ISO date string to a Farsi (Shamsi) date using moment-jalaali.
//  * Assumes moment-jalaali is loaded globally via CDN.
//  * @param {string} isoDateString - The date string in ISO format (YYYY-MM-DD).
//  * @returns {string} - The formatted Shamsi date, or 'نامشخص' if invalid.
//  */
// function formatDateFarsi(isoDateString) {
//     if (!isoDateString) return 'نامشخص';
//     try {
//         // Use moment() to parse the Gregorian date
//         const momentDate = moment(isoDateString);
//         if (momentDate.isValid()) {
//              // Convert to Jalaali calendar and format
//              // 'jD jMMMM jYYYY' is more like '7 اردیبهشت 1403'
//              // If you prefer numeric, use 'jYYYY/jMM/jDD' (e.g., 1403/02/07)
//             return momentDate.format('jD jMMMM jYYYY');
//         }
//         return 'نامشخص';
//     } catch (e) {
//         console.error('Error formatting date to Farsi:', e);
//         return 'نامشخص'; // Return unknown if formatting fails
//     }
// }


// /**
//  * Updates the person details panel with data for a given person.
//  * @param {object} personData - The data object for the person.
//  */
// export function updatePersonDetails(personData) {
//     const detailsPanel = document.getElementById('person-details-panel');

//     // IMPORTANT FIX: Check if detailsPanel exists *before* trying to set its innerHTML
//     if (!detailsPanel) {
//         console.error('Error: #person-details-panel element not found in the DOM.');
//         // Optionally, display an alert to the user or log more info if critical
//         return; // Exit the function if the target element doesn't exist
//     }

//     if (!personData) {
//         detailsPanel.innerHTML = '<p class="text-center text-muted">روی یک فرد در درخت کلیک کنید تا جزئیات نمایش داده شود.</p>';
//         return;
//     }

//     // Determine if the person is deceased
//     const isDeceased = personData.deathDate && personData.deathDate !== "";
//     const deathRibbon = isDeceased ? '<span class="death-ribbon">🖤</span>' : '';

//     // Determine the image source: use personData.photo if available, otherwise dummy.jpg
//     const imgSrc = personData.photo && personData.photo !== "" ? personData.photo : 'assets/img/dummy.jpg';

//     detailsPanel.innerHTML = `
//         <div class="person-card text-center mb-4">
//             <div class="person-photo-wrapper position-relative mx-auto mb-3">
//                 <img src="${imgSrc}" class="img-fluid rounded-circle shadow-sm" alt="${personData.fullName}" onerror="this.src='assets/img/dummy.jpg';">
//                 ${deathRibbon}
//             </div>
//             <h4 class="mb-1">${personData.fullName}</h4>
//             <p class="text-muted small">${personData.occupation || 'بدون شغل'}</p>
//         </div>

//         <div class="person-details-list">
//             <ul class="list-group list-group-flush">
//                 <li class="list-group-item d-flex justify-content-between align-items-center">
//                     <span>تاریخ تولد:</span>
//                     <strong>${formatDateFarsi(personData.birthDate) || 'نامشخص'}</strong>
//                 </li>
//                 ${isDeceased ? `
//                 <li class="list-group-item d-flex justify-content-between align-items-center text-danger">
//                     <span>تاریخ فوت:</span>
//                     <strong>${formatDateFarsi(personData.deathDate)}</strong>
//                 </li>` : ''}
//                 <li class="list-group-item d-flex justify-content-between align-items-center">
//                     <span>تحصیلات:</span>
//                     <strong>${personData.education || 'نامشخص'}</strong>
//                 </li>
//                 <li class="list-group-item d-flex justify-content-between align-items-center">
//                     <span>وضعیت تأهل:</span>
//                     <strong>${formatMaritalStatus(personData.maritalStatus)}</strong>
//                 </li>
//                 ${personData.marriageDate ? `
//                 <li class="list-group-item d-flex justify-content-between align-items-center">
//                     <span>تاریخ ازدواج:</span>
//                     <strong>${formatDateFarsi(personData.marriageDate)}</strong>
//                 </li>` : ''}
//                 ${personData.divorceDate ? `
//                 <li class="list-group-item d-flex justify-content-between align-items-center text-warning">
//                     <span>تاریخ طلاق:</span>
//                     <strong>${formatDateFarsi(personData.divorceDate)}</strong>
//                 </li>` : ''}
//                 <li class="list-group-item d-flex justify-content-between align-items-center">
//                     <span>آدرس:</span>
//                     <strong>${personData.homeAddress || 'نامشخص'}</strong>
//                 </li>
//             </ul>
//         </div>
//     `;
// }

// /**
//  * Helper function to format marital status into Farsi.
//  * @param {string} status - The marital status string (e.g., 'married', 'single', 'divorced').
//  * @returns {string} - The Farsi equivalent.
//  */
// function formatMaritalStatus(status) {
//     switch (status) {
//         case 'married': return 'متأهل';
//         case 'single': return 'مجرد';
//         case 'divorced': return 'مطلقه';
//         case 'widowed': return 'بیوه';
//         default: return 'نامشخص';
//     }
// }
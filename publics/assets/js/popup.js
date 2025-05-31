// public/assets/js/popup.js

// Global map to hold all person data for relationship lookups
let allPeopleDataMap;
let enumData; // To store the Enum definitions from the JSON

/**
 * Initializes the popup module by setting the global people data map
 * and attaching event listeners.
 * @param {Map<string, object>} peopleMap - A map of all person data by ID.
 * @param {object} enums - The Enum definitions from the JSON.
 */
export function initializePopup(peopleMap, enums) {
    allPeopleDataMap = peopleMap;
    enumData = enums; // Store enum data
    const popupOverlay = document.getElementById('person-details-popup');
    if (popupOverlay) {
        popupOverlay.addEventListener('click', (event) => {
            // Close popup if clicking outside the content or on the close button
            if (event.target === popupOverlay || event.target.closest('.popup-close-btn')) {
                hidePersonDetailsPopup();
            }
        });
    }
}

/**
 * Displays the person details popup with the given data.
 * @param {object} personData - The data object for the person to display.
 */
export function showPersonDetailsPopup(personData) {
    const popupOverlay = document.getElementById('person-details-popup');
    const popupBody = popupOverlay ? popupOverlay.querySelector('.popup-body') : null;

    if (!popupOverlay || !popupBody || !personData) {
        console.error('Popup elements not found or personData is missing.', { popupOverlay, popupBody, personData });
        return;
    }

    const fullName = `${personData.FirstName || ''} ${personData.LastName || ''}`.trim();

    // Determine if the person is deceased
    const isDeceased = personData.DeathDate && personData.DeathDate !== "";
    const deathRibbon = isDeceased ? '<span class="death-ribbon">🖤</span>' : '';

    // Format dates using moment-jalaali
    const birthDate = personData.BirthDate ? moment(personData.BirthDate).format('jD jMMMM jYYYY') : 'نامشخص';
    const deathDate = isDeceased ? moment(personData.DeathDate).format('jD jMMMM jYYYY') : 'نامشخص';

    // Marriage Info
    let marriageInfoHtml = '';
    if (personData.Marriage && personData.Marriage.length > 0) {
        personData.Marriage.forEach(marriage => {
            const spouse = allPeopleDataMap.get(marriage.SpouseId);
            const spouseName = spouse ? `${spouse.FirstName} ${spouse.LastName}`.trim() : 'نامشخص';
            const marriageDate = marriage.MarriageDate ? moment(marriage.MarriageDate).format('jD jMMMM jYYYY') : 'نامشخص';
            const divorceDate = marriage.DivorceDate ? moment(marriage.DivorceDate).format('jD jMMMM jYYYY') : 'نامشخص';
            const status = enumData.Enum.MarriageStatus[marriage.Status] || marriage.Status || 'نامشخص';

            marriageInfoHtml += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>همسر:</span>
                    <strong>${spouseName}</strong>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>تاریخ ازدواج:</span>
                    <strong>${marriageDate}</strong>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>وضعیت تأهل:</span>
                    <strong>${status}</strong>
                </li>
                ${marriage.DivorceDate ? `
                <li class="list-group-item d-flex justify-content-between align-items-center text-warning">
                    <span>تاریخ طلاق:</span>
                    <strong>${divorceDate}</strong>
                </li>` : ''}
            `;
        });
    } else {
        marriageInfoHtml = `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>وضعیت تأهل:</span>
                <strong>مجرد</strong>
            </li>
        `;
    }

    // Education Info
    let educationInfoHtml = '';
    if (personData.Education && personData.Education.length > 0) {
        educationInfoHtml = '<h6 class="mt-3 text-center">تحصیلات:</h6><ul class="list-group list-group-flush">';
        personData.Education.forEach(edu => {
            const degree = enumData.Enum.Degree[edu.Degree] || edu.Degree || 'نامشخص';
            const startDate = edu.StartDate ? moment(edu.StartDate).format('jYYYY/jMM/jDD') : 'نامشخص';
            const endDate = edu.EndDate ? moment(edu.EndDate).format('jYYYY/jMM/jDD') : 'در حال تحصیل';
            educationInfoHtml += `
                <li class="list-group-item">
                    <strong>${degree}</strong> در ${edu.FieldOfStudy || 'نامشخص'} از ${edu.InstitutionName || 'نامشخص'}<br>
                    <small class="text-muted"> (${startDate} - ${endDate})</small>
                </li>
            `;
        });
        educationInfoHtml += '</ul>';
    }

    // Employment Info
    let employmentInfoHtml = '';
    if (personData.Employment && personData.Employment.length > 0) {
        employmentInfoHtml = '<h6 class="mt-3 text-center">شغل:</h6><ul class="list-group list-group-flush">';
        personData.Employment.forEach(emp => {
            const startDate = emp.StartDate ? moment(emp.StartDate).format('jYYYY/jMM/jDD') : 'نامشخص';
            const endDate = emp.EndDate ? moment(emp.EndDate).format('jYYYY/jMM/jDD') : 'در حال حاضر';
            const isCurrent = emp.IsCurrent ? '(در حال حاضر)' : '';
            employmentInfoHtml += `
                <li class="list-group-item">
                    <strong>${emp.Position || 'نامشخص'}</strong> در ${emp.Organization || 'نامشخص'}<br>
                    <small class="text-muted"> (${startDate} - ${endDate}) ${isCurrent}</small>
                </li>
            `;
        });
        employmentInfoHtml += '</ul>';
    }

    // Residence Info
    let residenceInfoHtml = '';
    if (personData.Residence && personData.Residence.length > 0) {
        residenceInfoHtml = '<h6 class="mt-3 text-center">محل زندگی:</h6><ul class="list-group list-group-flush">';
        personData.Residence.forEach(res => {
            const type = enumData.Enum.ResidenceType[res.Type] || res.Type || 'نامشخص';
            const startDate = res.StartDate ? moment(res.StartDate).format('jYYYY/jMM/jDD') : 'نامشخص';
            const endDate = res.EndDate ? moment(res.EndDate).format('jYYYY/jMM/jDD') : 'در حال حاضر';
            residenceInfoHtml += `
                <li class="list-group-item">
                    <strong>${res.Address || 'نامشخص'}</strong> (${type})<br>
                    <small class="text-muted"> (${startDate} - ${endDate})</small>
                </li>
            `;
        });
        residenceInfoHtml += '</ul>';
    }


    // Generate relationship labels
    const relationshipsHtml = generateRelationshipLabels(personData);

    popupBody.innerHTML = `
        <div class="popup-person-card text-center mb-4">
            <div class="popup-person-photo-wrapper position-relative mx-auto mb-3">
                <img src="${personData.photo || 'https://placehold.co/150x150/e0e0e0/333333?text=N/A'}" class="img-fluid rounded-circle shadow-sm" alt="${fullName}" onerror="this.src='https://placehold.co/150x150/e0e0e0/333333?text=N/A';">
                ${deathRibbon}
            </div>
            <h4 class="mb-1">${fullName}</h4>
            <p class="text-muted small">${personData.Notes || ''}</p>
        </div>

        <div class="popup-person-details-list">
            <ul class="list-group list-group-flush">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>تاریخ تولد:</span>
                    <strong>${birthDate}</strong>
                </li>
                ${isDeceased ? `
                <li class="list-group-item d-flex justify-content-between align-items-center text-danger">
                    <span>تاریخ فوت:</span>
                    <strong>${deathDate}</strong>
                </li>` : ''}
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>جنسیت:</span>
                    <strong>${enumData.Enum.Gender[personData.Gender] || personData.Gender || 'نامشخص'}</strong>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>شماره تماس:</span>
                    <strong>${personData.Tel || 'نامشخص'}</strong>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>پست الکترونیکی:</span>
                    <strong>${personData.eMail || 'نامشخص'}</strong>
                </li>
                ${marriageInfoHtml}
            </ul>
            ${educationInfoHtml}
            ${employmentInfoHtml}
            ${residenceInfoHtml}

            <div class="relationships-section mt-3">
                <h5>روابط خانوادگی:</h5>
                <ul class="list-group list-group-flush">
                    ${relationshipsHtml}
                </ul>
            </div>
        </div>
    `;

    popupOverlay.classList.add('show'); // Show the popup
}

/**
 * Hides the person details popup.
 */
export function hidePersonDetailsPopup() {
    const popupOverlay = document.getElementById('person-details-popup');
    if (popupOverlay) {
        popupOverlay.classList.remove('show');
    }
}

/**
 * Generates HTML for relationship labels (Father, Mother, Spouse, Children, Siblings).
 * @param {object} person - The current person's data.
 * @returns {string} HTML string of relationship list items.
 */
function generateRelationshipLabels(person) {
    let relationships = [];

    // Parents
    if (person.FatherId) {
        const father = allPeopleDataMap.get(person.FatherId);
        if (father) {
            relationships.push(`
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>پدر:</span>
                    <strong>${father.FirstName} ${father.LastName}</strong>
                </li>
            `);
        }
    }
    if (person.MotherId) {
        const mother = allPeopleDataMap.get(person.MotherId);
        if (mother) {
            relationships.push(`
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>مادر:</span>
                    <strong>${mother.FirstName} ${mother.LastName}</strong>
                </li>
            `);
        }
    }

    // Spouses (from person's Marriage array)
    if (person.Marriage && person.Marriage.length > 0) {
        person.Marriage.forEach(marriage => {
            const spouse = allPeopleDataMap.get(marriage.SpouseId);
            if (spouse) {
                relationships.push(`
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>همسر:</span>
                        <strong>${spouse.FirstName} ${spouse.LastName}</strong>
                    </li>
                `);
            }
        });
    }

    // Children (find all people whose FatherId or MotherId is this person's ID)
    const children = Array.from(allPeopleDataMap.values()).filter(p =>
        p.FatherId === person.PersonId || p.MotherId === person.PersonId
    );
    children.forEach(child => {
        const relationship = child.Gender === 'Male' ? 'پسر' : 'دختر'; // Son / Daughter
        relationships.push(`
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>${relationship}:</span>
                <strong>${child.FirstName} ${child.LastName}</strong>
            </li>
        `);
    });

    // Siblings (find people with common parents)
    if (person.FatherId || person.MotherId) {
        const siblings = Array.from(allPeopleDataMap.values()).filter(p =>
            p.PersonId !== person.PersonId && // Not the person themselves
            ((person.FatherId && p.FatherId === person.FatherId) || (person.MotherId && p.MotherId === person.MotherId)) // Common parent
        );
        // Deduplicate siblings if they have both parents in common
        const uniqueSiblings = new Map();
        siblings.forEach(s => uniqueSiblings.set(s.PersonId, s));

        uniqueSiblings.forEach(sibling => {
            const relationship = sibling.Gender === 'Male' ? 'برادر' : 'خواهر'; // Brother / Sister
            relationships.push(`
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${relationship}:</span>
                    <strong>${sibling.FirstName} ${sibling.LastName}</strong>
                </li>
            `);
        });
    }

    return relationships.length > 0 ? relationships.join('') : '<li class="list-group-item text-center text-muted">رابطه خانوادگی یافت نشد.</li>';
}

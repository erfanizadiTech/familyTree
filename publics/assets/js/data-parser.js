// public/assets/js/data-parser.js

/**
 * Fetches JSON data from a given URL.
 * @param {string} url - The URL of the JSON file.
 * @returns {Promise<object>} - A promise that resolves with the parsed JSON data (including Enums and Person array).
 */
export async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Re-throw to be caught by the caller
    }
}

/**
 * Transforms flat array data into a hierarchical structure suitable for D3.js tree layouts,
 * handling two parents and spouses by introducing 'marriage' nodes.
 *
 * @param {Array<object>} rawPeopleData - The raw array of person objects from the JSON.
 * @returns {object|null} - The root node of the transformed tree (can be a person or a marriage node).
 */
export function transformDataToTree(rawPeopleData) {
    if (!rawPeopleData || rawPeopleData.length === 0) {
        return null;
    }

    // Create a map for quick lookup by PersonId and to store processed nodes
    const peopleMap = new Map();
    rawPeopleData.forEach(p => {
        // Clone the person object and initialize D3-specific properties
        const personData = {
            ...p,
            id: p.PersonId, // Map PersonId to 'id' for D3 consistency
            fullName: `${p.FirstName || ''} ${p.LastName || ''}`.trim(), // Create fullName for display in nodes
            children: [], // This will hold D3 hierarchy children (person or marriage nodes)
            type: 'person' // Custom type for D3 rendering
        };
        peopleMap.set(p.PersonId, personData);
    });

    // Stores marriage nodes (key: sorted spouse IDs string, value: marriage node object)
    const marriageNodesMap = new Map();

    // Helper to get or create a marriage node
    function getOrCreateMarriageNode(person1Id, person2Id) {
        // Ensure consistent ID for marriage node by sorting spouse IDs
        const sortedIds = [person1Id, person2Id].sort();
        const marriageId = `marriage-${sortedIds[0]}-${sortedIds[1]}`;

        if (!marriageNodesMap.has(marriageId)) {
            const marriageNode = {
                id: marriageId,
                type: 'marriage', // Custom type to distinguish from person nodes
                data: { // Data associated with the marriage
                    id: marriageId,
                    members: sortedIds, // IDs of the two spouses
                    childrenIds: [], // Original children IDs from JSON
                    marriageDate: null // Can be populated from a person's Marriage array
                },
                children: [] // D3 hierarchy children (actual person children of this marriage)
            };
            marriageNodesMap.set(marriageId, marriageNode);
        }
        return marriageNodesMap.get(marriageId);
    }

    // Pass 1: Create marriage nodes and link spouses to them
    peopleMap.forEach(person => {
        if (person.Marriage && person.Marriage.length > 0) {
            person.Marriage.forEach(marriage => {
                const spouseId = marriage.SpouseId;
                if (peopleMap.has(spouseId)) {
                    // Create marriage node only once per couple (e.g., for the person with the "smaller" ID)
                    if (person.id < spouseId) { // Use person.id (mapped from PersonId)
                        const marriageNode = getOrCreateMarriageNode(person.id, spouseId);
                        // Optionally, set marriage date on the marriage node if relevant
                        if (marriage.MarriageDate && !marriageNode.data.marriageDate) {
                            marriageNode.data.marriageDate = marriage.MarriageDate;
                        }
                    }
                }
            });
        }
    });

    // Pass 2: Connect children to their parents (via marriage nodes if two parents)
    peopleMap.forEach(person => {
        if (person.FatherId && person.MotherId) {
            // Child has two parents, link to their marriage node
            const marriageNode = getOrCreateMarriageNode(person.FatherId, person.MotherId);
            // Add this person to the marriage node's children for D3 hierarchy
            marriageNode.children.push(person);
            // Also, update the marriage node's raw children IDs for reference
            if (!marriageNode.data.childrenIds.includes(person.id)) {
                marriageNode.data.childrenIds.push(person.id);
            }
        } else if (person.FatherId || person.MotherId) {
            // Child has one parent listed (e.g., single parent or data incomplete)
            const parentId = person.FatherId || person.MotherId;
            const parent = peopleMap.get(parentId);
            if (parent) {
                parent.children.push(person); // Link directly as a child of the single parent
            }
        }
    });

    // Determine root(s) for the D3 hierarchy: nodes that are not children of any other node.
    const allChildPersonIds = new Set(); // Stores IDs of all persons who are children in the D3 hierarchy

    // Collect children from person nodes
    peopleMap.forEach(person => {
        person.children.forEach(childNode => { // childNode here is a person object
            allChildPersonIds.add(childNode.id);
        });
    });

    // Collect children from marriage nodes
    marriageNodesMap.forEach(marriageNode => {
        marriageNode.children.forEach(childNode => { // childNode here is a person object
            allChildPersonIds.add(childNode.id);
        });
    });

    let finalRoots = [];
    // First, add all persons who are not children of anyone
    peopleMap.forEach(person => {
        if (!allChildPersonIds.has(person.id)) {
            finalRoots.push(person);
        }
    });

    // Then, integrate marriage nodes that are roots themselves
    const processedRootIds = new Set(); // To avoid duplicate roots
    const newFinalRoots = [];

    finalRoots.forEach(person => {
        if (!processedRootIds.has(person.id)) {
            let foundMarriageRoot = false;
            // Check if this person is part of a marriage node that should be a top-level root
            if (person.Marriage && person.Marriage.length > 0) {
                const spouseMarriage = person.Marriage.find(m => peopleMap.has(m.SpouseId));
                if (spouseMarriage) {
                    const spouseId = spouseMarriage.SpouseId;
                    const marriageNode = marriageNodesMap.get([person.id, spouseId].sort().join('-marriage-'));

                    // Check if the spouse is also a root (i.e., has no parents)
                    const spouse = peopleMap.get(spouseId);
                    const spouseIsRootCandidate = spouse && !spouse.FatherId && !spouse.MotherId;

                    if (marriageNode && spouseIsRootCandidate) {
                        newFinalRoots.push(marriageNode); // Use the marriage node as a top-level root
                        processedRootIds.add(person.id);
                        processedRootIds.add(spouseId);
                        foundMarriageRoot = true;
                    }
                }
            }
            if (!foundMarriageRoot) {
                newFinalRoots.push(person); // Add individual as a root if not part of a top-level marriage
                processedRootIds.add(person.id);
            }
        }
    });

    finalRoots = newFinalRoots; // Update finalRoots with the new set

    if (finalRoots.length === 0) {
        console.error('No root nodes found after processing. This might indicate a cyclic dependency or empty data.');
        return null;
    }

    // If there's more than one root, create a dummy overarching root node
    if (finalRoots.length > 1) {
        // Sort roots by birth date for consistent layout if a dummy root is needed
        finalRoots.sort((a, b) => {
            let birthDateA, birthDateB;
            if (a.type === 'person') {
                birthDateA = new Date(a.BirthDate);
            } else { // marriage node
                const spouse1 = peopleMap.get(a.data.members[0]);
                birthDateA = spouse1 ? new Date(spouse1.BirthDate) : new Date(); // Fallback
            }
            if (b.type === 'person') {
                birthDateB = new Date(b.BirthDate);
            } else { // marriage node
                const spouse1 = peopleMap.get(b.data.members[0]);
                birthDateB = spouse1 ? new Date(spouse1.BirthDate) : new Date(); // Fallback
            }
            return birthDateA - birthDateB;
        });

        const dummyRoot = {
            id: "family-root-dummy",
            fullName: "شجره‌نامه کامل", // "Complete Family Tree"
            type: "dummy", // A dummy node for D3 to have a single root
            children: finalRoots
        };
        console.log("Transformed Data (Dummy Root):", dummyRoot);
        return dummyRoot;
    } else {
        console.log("Transformed Data (Single Root):", finalRoots[0]);
        return finalRoots[0];
    }
}

// public/assets/js/tree-renderer.js
import { transformDataToTree } from './data-parser.js';

let svg, g, zoomBehavior;
let width, height;
let allPeopleDataMap; // Map to store all person data by ID for quick lookup

// This will store the current zoom transform for resetting
let currentTransform = d3.zoomIdentity;

// Constants for node dimensions
const personCardWidth = 180;
const personCardHeight = 120;
const marriageNodeWidth = 40; // Small circle/rectangle for marriage
const marriageNodeHeight = 40;

/**
 * Initializes and renders the family tree visualization.
 * @param {Array<object>} rawFamilyData - The flat array of family members.
 * @param {function} onNodeClickCallback - Callback function for when a node is clicked.
 * @param {Map<string, object>} peopleMap - A map of all person data by ID.
 */
export function renderTree(rawFamilyData, onNodeClickCallback, peopleMap) {
    allPeopleDataMap = peopleMap; // Store the map for internal use

    const container = document.getElementById('family-tree-container');
    if (!container) {
        console.error('Family tree container not found!');
        return;
    }

    // Update width/height dynamically based on container size
    width = container.clientWidth;
    height = container.clientHeight;

    // Clear previous SVG content if re-rendering
    const existingSvgElement = document.getElementById('family-tree-svg');
    if (existingSvgElement) {
        existingSvgElement.innerHTML = ''; // Clear all children
        svg = d3.select(existingSvgElement);
    } else {
        svg = d3.select(container).append("svg")
            .attr("id", "family-tree-svg")
            .attr("width", "100%")
            .attr("height", "100%");
    }

    // Create a group for the tree elements that can be transformed (panned/zoomed)
    g = svg.append("g");

    // Transform flat data into a D3-friendly hierarchical structure
    const rootNodeData = transformDataToTree(rawFamilyData);
    if (!rootNodeData) {
        console.error('Could not transform data into a tree structure. No root found or empty data.');
        return;
    }

    // Create a D3 hierarchy from the root node
    // D3.hierarchy will automatically pick up 'children' property
    const root = d3.hierarchy(rootNodeData);

    // --- Tree Layout Configuration ---
    // d3.tree() layout. nodeSize([y, x]) controls spacing between nodes.
    // 'y' is vertical space between levels, 'x' is horizontal space between siblings.
    // We will adjust these based on node types.
    const treeLayout = d3.tree()
        .nodeSize([personCardHeight + 100, personCardWidth + 80]); // Generous initial spacing

    // Compute the tree layout
    treeLayout(root);

    // Filter out dummy root if it exists, as it's not a real node to display
    const visibleNodes = root.descendants().filter(d => d.data.type !== 'dummy');

    // --- Rendering Links (Parent-Child Connections) ---
    // Links from persons to children (which might be marriage nodes)
    // and from marriage nodes to children.
    g.selectAll(".link")
        .data(root.links().filter(d => d.source.data.type !== 'dummy')) // Filter links from dummy root
        .join("path")
        .attr("class", "link")
        .attr("d", d => {
            let sourceY = d.source.y;
            if (d.source.data.type === 'person') sourceY += personCardHeight / 2; // Link from bottom of person card
            else if (d.source.data.type === 'marriage') sourceY += marriageNodeHeight / 2; // Link from bottom of marriage node

            let targetY = d.target.y;
            if (d.target.data.type === 'person') targetY -= personCardHeight / 2; // To top of person card
            else if (d.target.data.type === 'marriage') targetY -= marriageNodeHeight / 2; // To top of marriage symbol

            return d3.linkVertical()
                .x(node => node.x)
                .y(node => node.y)({
                    source: { x: d.source.x, y: sourceY },
                    target: { x: d.target.x, y: targetY }
                });
        })
        .attr("stroke", "var(--color-border-light)")
        .attr("stroke-width", 1.5)
        .attr("fill", "none");


    // --- Rendering Nodes (Person Cards and Marriage Nodes) ---
    const nodeGroups = g.selectAll(".node")
        .data(visibleNodes)
        .join("g")
        .attr("class", d => `node ${d.data.type === 'marriage' ? 'node--marriage' : 'node--person'}`)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .on("click", (event, d) => {
            if (d.data.type === 'person') {
                onNodeClickCallback(d.data); // Only fire click for person nodes
            } else if (d.data.type === 'marriage') {
                // Optionally handle click on marriage node (e.g., show marriage details)
                console.log("Clicked marriage node:", d.data);
                // Can display details for the first spouse in the marriage
                if (d.data.members && d.data.members.length > 0) {
                     const firstSpouse = allPeopleDataMap.get(d.data.members[0]);
                     if (firstSpouse) {
                         onNodeClickCallback(firstSpouse);
                     }
                }
            }
        });

    // Append foreignObject for HTML content (person cards)
    nodeGroups.filter(d => d.data.type === 'person')
        .append("foreignObject")
        .attr("width", personCardWidth)
        .attr("height", personCardHeight)
        .attr("x", -personCardWidth / 2) // Center horizontally
        .attr("y", -personCardHeight / 2) // Center vertically
        .html(d => {
            const person = d.data;
            const fullName = `${person.FirstName || ''} ${person.LastName || ''}`.trim();
            const isDeceased = person.DeathDate && person.DeathDate !== "";
            // Use a simple black ribbon emoji for now, styling in CSS
            const deathRibbon = isDeceased ? '<span class="death-ribbon">🖤</span>' : '';
            // Use placeholder image if photo is missing or null
            // Note: The provided JSON schema doesn't have a 'photo' field directly on Person.
            // Assuming we'll add it or use a default. For now, using a generic placeholder.
            const imgSrc = person.photo && person.photo !== "" ? person.photo : 'https://placehold.co/150x150/e0e0e0/333333?text=N/A';


            return `
                <div class="person-node-card">
                    <div class="person-node-photo-wrapper">
                        <img src="${imgSrc}" onerror="this.src='https://placehold.co/150x150/e0e0e0/333333?text=N/A';" alt="${fullName}">
                        ${deathRibbon}
                    </div>
                    <div class="person-node-name">${fullName}</div>
                </div>
            `;
        });

    // Append specific elements for marriage nodes
    nodeGroups.filter(d => d.data.type === 'marriage')
        .append("circle") // Using a circle for marriage symbol
        .attr("r", marriageNodeWidth / 2)
        .attr("fill", "var(--color-secondary)")
        .attr("stroke", "var(--color-primary)")
        .attr("stroke-width", 2);

    nodeGroups.filter(d => d.data.type === 'marriage')
        .append("text")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "var(--color-text-light)")
        .style("font-size", "1.5rem")
        .style("font-family", "var(--font-family-primary)")
        .text("⚭"); // Marriage symbol

    // --- Drawing Spouse Connections (Custom lines, not part of d3.tree layout) ---
    // We iterate through marriage nodes and draw lines to their members (spouses)
    nodeGroups.filter(d => d.data.type === 'marriage').each(function(d) {
        const marriageNode = d.data;
        // Position marriage node slightly above the spouses for cleaner connection
        const marriageYConnect = d.y - marriageNodeHeight / 2;

        if (marriageNode.members && marriageNode.members.length === 2) {
            const spouse1 = root.descendants().find(p => p.data.id === marriageNode.members[0] && p.data.type === 'person');
            const spouse2 = root.descendants().find(p => p.data.id === marriageNode.members[1] && p.data.type === 'person');

            if (spouse1 && spouse2) {
                // Draw horizontal line between spouses
                const spouseY = spouse1.y + personCardHeight / 2; // Bottom center of spouse card
                g.append("line")
                    .attr("class", "spouse-link")
                    .attr("x1", spouse1.x + personCardWidth / 2 - 20) // Start slightly inward from right edge of spouse1
                    .attr("y1", spouseY)
                    .attr("x2", spouse2.x - personCardWidth / 2 + 20) // End slightly inward from left edge of spouse2
                    .attr("y2", spouseY)
                    .attr("stroke", "var(--color-primary)")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "5,5");

                // Draw vertical lines from spouse card to marriage node
                g.append("line")
                    .attr("class", "marriage-connector")
                    .attr("x1", spouse1.x)
                    .attr("y1", spouseY)
                    .attr("x2", spouse1.x)
                    .attr("y2", marriageYConnect) // Connect to the marriage node's Y position
                    .attr("stroke", "var(--color-primary)")
                    .attr("stroke-width", 1.5);

                g.append("line")
                    .attr("class", "marriage-connector")
                    .attr("x1", spouse2.x)
                    .attr("y1", spouseY)
                    .attr("x2", spouse2.x)
                    .attr("y2", marriageYConnect) // Connect to the marriage node's Y position
                    .attr("stroke", "var(--color-primary)")
                    .attr("stroke-width", 1.5);

                // Re-center marriage node's position to be visually between its spouses
                // This adjusts the D3 tree's default positioning for marriage nodes
                d.x = (spouse1.x + spouse2.x) / 2;
                d3.select(this).attr("transform", `translate(${d.x},${d.y})`); // Update its position
            }
        }
    });


    // --- Implement D3 Zoom ---
    zoomBehavior = d3.zoom()
        .scaleExtent([0.1, 4]) // min zoom 0.1, max zoom 4x
        .on("zoom", (event) => {
            currentTransform = event.transform; // Store the current transform
            g.attr("transform", event.transform);
        });

    svg.call(zoomBehavior);

    // Initial view reset to fit the tree
    resetZoom();

    // Expose a reset zoom function
    window.resetZoom = resetZoom;
    window.zoomIn = () => {
        svg.transition().duration(200).call(zoomBehavior.scaleBy, 1.2);
    };
    window.zoomOut = () => {
        svg.transition().duration(200).call(zoomBehavior.scaleBy, 0.8);
    };

    function resetZoom() {
        // Get bounding box of all relevant elements in the main 'g' group
        const combinedElements = g.selectAll(".node,.link,.spouse-link,.marriage-connector").nodes();

        if (combinedElements.length === 0) {
            console.warn("No elements to calculate bounding box for. Defaulting zoom.");
            currentTransform = d3.zoomIdentity.translate(width / 2, 50);
            svg.transition().duration(750).call(zoomBehavior.transform, currentTransform);
            return;
        }

        const bbox = getCombinedBBox(combinedElements);
        const fullWidth = width;
        const fullHeight = height;

        if (bbox && bbox.width && bbox.height) {
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;
            const scale = Math.min(
                fullWidth / (bbox.width + 100), // Add padding
                fullHeight / (bbox.height + 100) // Add padding
            );
            const translateX = fullWidth / 2 - scale * centerX;
            const translateY = fullHeight / 2 - scale * centerY;

            currentTransform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
            svg.transition().duration(750).call(zoomBehavior.transform, currentTransform);
        } else {
            console.warn("Invalid bounding box calculation. Defaulting zoom.");
            currentTransform = d3.zoomIdentity.translate(width / 2, 50); // Default to center top
            svg.transition().duration(750).call(zoomBehavior.transform, currentTransform);
        }
    }

    // Helper to get combined bounding box of multiple SVG elements
    function getCombinedBBox(elements) {
        if (!elements || elements.length === 0) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        elements.forEach(el => {
            try {
                // getBBox returns a DOMRect object with x, y, width, height
                const bbox = el.getBBox();
                if (bbox.width === 0 || bbox.height === 0) return; // Skip invisible elements

                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.width);
                maxY = Math.max(maxY, bbox.y + bbox.height);
            } catch (e) {
                // getBBox can fail for elements not yet in the DOM or with display:none
                console.warn("Could not get BBox for element (might be hidden or not rendered):", el, e);
            }
        });

        if (minX === Infinity) return null; // No valid bboxes found

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}

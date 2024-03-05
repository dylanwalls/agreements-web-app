document.addEventListener('DOMContentLoaded', function() {
    loadPartners();
});

function generateTableHeaders(partners) {
    const thead = document.querySelector('#partnersTable thead');
    thead.innerHTML = ''; // Clear existing headers to avoid duplication
    const row = thead.insertRow();

    // Assuming all partner objects have the same structure,
    // use the keys of the first partner for header names.
    // If partners array is empty, you might want to handle it differently.
    if (partners.length > 0) {
        Object.keys(partners[0]).forEach(key => {
            // Skip PartnerDetails if it's not meant to be a header
            if (key !== 'PartnerDetails') {
                const headerCell = document.createElement('th');
                headerCell.textContent = key; // Customize as needed
                row.appendChild(headerCell);
            }
        });

        // Manually add a header for the Edit button column
        const editHeaderCell = document.createElement('th');
        editHeaderCell.textContent = 'Actions'; // Or any other title you prefer
        row.appendChild(editHeaderCell);
    }
}


async function loadPartners() {
    const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/agreementsFetchPartners?code=gTGTTHJubIADs6Hi5MQEqpO-ZHwvIb6vbBuFtFsPUA23AzFumpLSVg==');
    const partners = await response.json();
    globalPartners = partners;

    generateTableHeaders(partners);
    
    const tbody = document.querySelector('#partnersTable tbody');

    partners.forEach(partner => {
        const row = tbody.insertRow();
        Object.keys(partner).forEach(key => {
            if(key !== 'PartnerDetails') {
                const cell = row.insertCell();
                cell.textContent = partner[key];
            }
        });

        // Add an Edit button
        const editButtonCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.setAttribute('data-editing', 'false'); // Use this attribute to toggle between edit and save
        editButton.onclick = function(event) {
            event.stopPropagation(); // Stop event propagation
            const isEditing = editButton.getAttribute('data-editing') === 'true';
            if (!isEditing) {
                enableEditing(partner.ID, row, editButton); 
            } else {
                saveChanges(partner.ID, row, editButton);
            }
        };
        editButtonCell.appendChild(editButton);
    });
}

let globalPartners = []; // Assume this is filled by the loadPartners function

function enableEditing(partnerId, row, editButton) {
    // Convert cells to editable inputs
    const cells = row.querySelectorAll('td:not(:last-child)'); // Exclude the last cell containing the buttons
    cells.forEach((cell, index) => {
        if (index < cells.length - 0) { // Exclude the cell with the Edit/Save button and the Generate Partnership Agreement button
            const input = document.createElement('input');
            input.type = 'text';
            input.value = cell.textContent;
            cell.innerHTML = ''; // Clear the cell
            cell.appendChild(input);
        }
    });

    // Change the Edit button to Save
    editButton.textContent = 'Save';
    editButton.setAttribute('data-editing', 'true');


}

async function saveChanges(partnerId, row, editButton) {
    event.stopPropagation(); // Prevent the default action

    const updatedPartnerData = {};
    const cells = row.querySelectorAll('td:not(:last-child)'); // Exclude the cells with buttons

    // Define a mapping for special field names
    const fieldMappings = {
        // "ERFNumber": "erf",
        // "TitleDeedNumber": "titleNumber",
        // Add other mappings here as needed
    };

    cells.forEach((cell, index) => {
        if (cell.querySelector('input')) { // Check if cell contains an input element
            const input = cell.querySelector('input');
            let originalKey = Object.keys(globalPartners[0])[index];
            let key = fieldMappings[originalKey] || originalKey.charAt(0).toLowerCase() + originalKey.slice(1); // Use mapping or convert first character to lowercase to ensure camelCase
            let value = input.value;

            // Exclude ID field and use only partnershipId
            if (originalKey === "ID") return;

            // Special handling for certain fields
            switch (key) {
                case 'noUnits':
                case 'noMonths':
                    value = parseInt(value, 10); // Convert to integer
                    break;
                case 'totalInvestment':
                    value = parseFloat(value); // Convert to float
                    break;
                case 'dateAgreementSigned':
                    value = new Date(value).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                    break;
                default:
                    // Use the value as-is for other fields
            }

            updatedPartnerData[key] = value;
        }
    });

    // Ensure partnershipId is included correctly
    updatedPartnerData.partnerId = parseInt(partnerId, 10);

    console.log('Updated data to send:', updatedPartnerData);

    try {
        // Send updated data to your API endpoint for updating the partnership details
        const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/updatePartners?code=TTuoIe19q5agg0HRgE28kxWfcDdOPQ7n5ocFObMCszrMAzFuhhJ_zw==', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPartnerData),
        });

        if (!response.ok) {
            throw new Error('Failed to update partnership details');
        }

        // Update the globalPartnerships array to reflect changes
        const index = globalPartners.findIndex(partner => partner.ID === partnerId);
        if (index !== -1) {
            globalPartners[index] = { ...globalPartners[index], ...updatedPartnerData };
        }

        // Toggle back the edit button to 'Edit' mode
        editButton.textContent = 'Edit';
        editButton.setAttribute('data-editing', 'false');

        console.log('Partner details updated successfully');
    } catch (error) {
        console.error('Error updating partner details:', error);
        // Handle error (e.g., show an error message to the user)
    }
}

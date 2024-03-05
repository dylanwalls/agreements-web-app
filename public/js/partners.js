document.addEventListener('DOMContentLoaded', function() {
    loadPartners();
});

function loadTableHeaders() {
    const thead = document.querySelector('#partnersTable thead');
    const headerRow = thead.insertRow();

    // Assuming 'globalPartners' contains the data and using the keys from the first partner object as column names
    if (globalPartners.length > 0) {
        Object.keys(globalPartners[0]).forEach(key => {
            const headerCell = document.createElement('th');
            headerCell.textContent = key; // You might want to format or map these keys to more user-friendly names
            headerRow.appendChild(headerCell);
        });

        // Add an extra header cell for the actions column (e.g., for the edit buttons)
        const actionsHeaderCell = document.createElement('th');
        actionsHeaderCell.textContent = 'Actions';
        headerRow.appendChild(actionsHeaderCell);
    }
}

async function loadPartners() {
    const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/agreementsFetchPartners?code=gTGTTHJubIADs6Hi5MQEqpO-ZHwvIb6vbBuFtFsPUA23AzFumpLSVg==');
    const partners = await response.json();
    globalPartners = partners;

    loadTableHeaders();

    const tbody = document.querySelector('#partnersTable tbody');

    partners.forEach(partner => {
        const row = tbody.insertRow();
        Object.keys(partner).forEach(key => {
            const cell = row.insertCell();
            cell.textContent = partner[key];
        });

        // Edit button
        const editButtonCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.setAttribute('data-editing', 'false'); // Initialize data-editing attribute
        editButton.onclick = function() { enableEditing(partner.ID, row, this); }; // Pass `this` as the editButton
        editButtonCell.appendChild(editButton);
    });
}

let globalPartners = [];

function enableEditing(partnerId, row, editButton) {
    const isEditing = editButton.getAttribute('data-editing') === 'true';
    if (!isEditing) {
        // Convert cells to editable inputs
        const cells = row.querySelectorAll('td:not(:last-child)');
        cells.forEach(cell => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = cell.textContent;
            cell.innerHTML = '';
            cell.appendChild(input);
        });

        editButton.textContent = 'Save';
        editButton.setAttribute('data-editing', 'true');
    } else {
        saveChanges(partnerId, row, editButton);
    }
}

async function saveChanges(partnerId, row, editButton) {
    event.stopPropagation(); // Prevent the default action

    const updatedPartnerData = {};
    const cells = row.querySelectorAll('td:not(:last-child)'); // Exclude the cells with buttons

    // Assuming the order and fields from your Partners table schema
    // No fieldMappings required if the field names are directly used and no special case conversion is needed
    cells.forEach((cell, index) => {
        if (cell.querySelector('input')) { // Check if cell contains an input element
            const input = cell.querySelector('input');
            // Directly use the input's name attribute, assuming it matches your database schema
            let key = input.name; // This assumes the name attributes are correctly set to match your schema
            let value = input.value;

            // Handling specific fields, if necessary
            switch (key) {
                // Add specific field handling here if needed, similar to your partnership example
                default:
                    // No special handling needed; use value as-is
            }

            updatedPartnerData[key] = value;
        }
    });

    // Ensure partnerId is included correctly and formatted as an integer
    // Assuming partnerId is meant to be used similarly to partnershipId in your example
    updatedPartnerData['ID'] = parseInt(partnerId, 10); // Adjust based on actual ID handling

    console.log('Updated partner data to send:', updatedPartnerData);

    // try {
    //     // Send updated data to your API endpoint for updating the partner details
    //     const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/updatePartner?code=YourFunctionCodeHere', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(updatedPartnerData),
    //     });

    //     if (!response.ok) {
    //         throw new Error('Failed to update partner details');
    //     }

    //     // Update UI or global state as needed
    //     console.log('Partner details updated successfully');
    // } catch (error) {
    //     console.error('Error updating partner details:', error);
    //     // Optionally, handle UI feedback for error
    // }
}

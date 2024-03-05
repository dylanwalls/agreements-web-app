document.addEventListener('DOMContentLoaded', function() {
    function updateFormFields() {
        const numNamesInput = document.getElementById('numNames');
        const nameFieldsContainer = document.getElementById('nameFieldsContainer');

        const numNames = parseInt(numNamesInput.value);

        // Clear existing name fields
        nameFieldsContainer.innerHTML = '';

        // Add new name fields based on the number of names
        for (let i = 0; i < numNames; i++) {
        const nameFieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = `Name ${i + 1}`;
        nameFieldset.appendChild(legend);

        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Name:';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.name = `name_${i}`;
        nameInput.required = true;
        nameInput.classList.add('form-control');

        const surnameLabel = document.createElement('label');
        surnameLabel.textContent = 'Surname:';
        const surnameInput = document.createElement('input');
        surnameInput.type = 'text';
        surnameInput.name = `surname_${i}`;
        surnameInput.required = true;
        surnameInput.classList.add('form-control');

        const idNumberLabel = document.createElement('label');
        idNumberLabel.textContent = 'ID Number:';
        const idNumberInput = document.createElement('input');
        idNumberInput.type = 'text';
        idNumberInput.name = `idNumber_${i}`;
        idNumberInput.required = true;
        idNumberInput.classList.add('form-control');

        const emailLabel = document.createElement('label');
        emailLabel.textContent = 'Email:';
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.name = `email_${i}`;
        // Add the required attribute only if it's the first email field
        emailInput.required = i === 0;
        emailInput.classList.add('form-control');

        const contactLabel = document.createElement('label');
        contactLabel.textContent = 'Contact Number:';
        const contactInput = document.createElement('input');
        contactInput.type = 'text';
        contactInput.name = `contactNumber_${i}`;
        contactInput.required = false;
        contactInput.classList.add('form-control');

        nameFieldset.appendChild(nameLabel);
        nameFieldset.appendChild(nameInput);
        nameFieldset.appendChild(surnameLabel);
        nameFieldset.appendChild(surnameInput);
        nameFieldset.appendChild(idNumberLabel);
        nameFieldset.appendChild(idNumberInput);
        nameFieldset.appendChild(emailLabel);
        nameFieldset.appendChild(emailInput);
        nameFieldset.appendChild(contactLabel);
        nameFieldset.appendChild(contactInput);

        nameFieldsContainer.appendChild(nameFieldset);
        }
    }
    // Listen for changes on the 'numNames' input field
    document.getElementById('numNames').addEventListener('change', updateFormFields);

    // New code to handle form submission
    const form = document.querySelector('form'); // Make sure this selector matches your form
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        const formData = new FormData(form);
        const jsonData = {
            partners: []
        };

        // Extract partners' details from dynamically added form fields
        const numNames = formData.get('numNames');
        for (let i = 0; i < numNames; i++) {
            jsonData.partners.push({
                name: formData.get(`name_${i}`),
                surname: formData.get(`surname_${i}`),
                idNumber: formData.get(`idNumber_${i}`),
                email: formData.get(`email_${i}`),
                contactNumber: formData.get(`contactNumber_${i}`) || '', // Assuming contact number might be optional
            });
        }

        // Extract and add other partnership details to jsonData
        ['erf', 'address', 'titleNumber', 'noUnits', 'noYears', 'noMonths', 'dateAgreementSigned', 'totalInvestment', 'bank', 'accountHolder', 'accountNumber', 'accountType'].forEach(key => {
            let value = formData.get(key);
            if (key === 'noUnits' || key === 'noMonths') {
                value = parseInt(value, 10);
            } else if (key === 'totalInvestment') {
                value = parseFloat(value);
            } else if (key === 'dateAgreementSigned' && !value) {
                value = null; // Handle empty dateAgreementSigned
            }
            jsonData[key] = value;
        });

        console.log('JSON DATA:', jsonData);

        // Submit jsonData to your API endpoint
        fetch('https://dashboard-function-app-1.azurewebsites.net/api/agreementsInsertNew?code=OkkvkIoEQd6tDY6tGy_JZEKvVTnhAa-RMyNxZSxO40rbAzFuCch2CA==', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Check if the response has content and is of type JSON before parsing
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json(); // Parse JSON only if response is of type JSON
            }
            throw new Error('Response not JSON'); // Handle non-JSON responses
        })
        .then(data => {
            console.log('Success:', data);
            // Handle success (e.g., show a success message, redirect, etc.)
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error:', error);
            // Handle errors (e.g., show an error message)
        });
    });
});
document.addEventListener('DOMContentLoaded', function() {
    loadPartnerships();
});

function numberToWords(num) {
    if (num === 0) return 'zero';

    const belowTwenty = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const scales = ['thousand', 'million', 'billion']; // Extend with 'billion', 'trillion', etc., as needed.

    function toWords(s) {
        if (s < 20) return belowTwenty[s - 1];
        if (s < 100) return tens[Math.floor(s / 10)] + (s % 10 === 0 ? '' : ' ' + belowTwenty[s % 10 - 1]);
        if (s < 1000) return belowTwenty[Math.floor(s / 100) - 1] + ' hundred' + (s % 100 === 0 ? '' : ' ' + toWords(s % 100));
        for (let i = 0, p = 1; i < scales.length; i++, p *= 1000) {
            if (s < 1000 ** (i + 2)) return toWords(Math.floor(s / (1000 ** (i + 1)))) + ' ' + scales[i] + (s % (1000 ** (i + 1)) === 0 ? '' : ' ' + toWords(s % (1000 ** (i + 1))));
        }
    }

    return toWords(num);
}

function generatePartnershipTableHeaders(partnerships) {
    const thead = document.querySelector('#partnershipsTable thead');
    thead.innerHTML = ''; // Clear existing headers
    const row = thead.insertRow();

    // Use the keys of the first partnership for header names if partnerships array is not empty
    if (partnerships.length > 0) {
        Object.keys(partnerships[0]).forEach(key => {
            // Optionally skip certain keys if not needed as headers
            if (key !== 'PartnerDetails') {
                const headerCell = document.createElement('th');
                headerCell.textContent = key; // Customize as needed for user-friendly names
                row.appendChild(headerCell);
            }
        });

        // Manually add headers for additional columns not included in the partnership data
        ['PartnerDetails', 'Actions'].forEach(header => {
            const headerCell = document.createElement('th');
            headerCell.textContent = header; // These headers can be customized as needed
            row.appendChild(headerCell);
        });

        const signedAgreementHeaderCell = document.createElement('th');
        signedAgreementHeaderCell.textContent = 'Signed Agreement';
        row.appendChild(signedAgreementHeaderCell);

    }
}


async function loadPartnerships() {
    const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/agreementsFetchPartnerships?code=2Nt2CitSM4IjyGcu6dsOScIPxP_EUtrZ7UIjSFzoyPyOAzFul20FTA==');
    const partnerships = await response.json();
    globalPartnerships = partnerships;

    generatePartnershipTableHeaders(partnerships);

    const tbody = document.querySelector('#partnershipsTable tbody');

    partnerships.forEach(partnership => {
        const row = tbody.insertRow();
        Object.keys(partnership).forEach(key => {
            if(key !== 'PartnerDetails') {
                const cell = row.insertCell();
                cell.textContent = partnership[key];
            }
        });

        // Process and display PartnerDetails
        const partnersCell = row.insertCell();
        if(partnership.PartnerDetails) {
            const partnersDetails = partnership.PartnerDetails.split(';;').map(partner => {
                const details = partner.split('|');
                return `${details[0]} ${details[1]}, ID: ${details[2]}, Email: ${details[3]}, Contact: ${details[4]}`;
            }).join('<br>');
            partnersCell.innerHTML = partnersDetails;
        } else {
            partnersCell.textContent = 'No partners data';
        }

        // Add an Edit button
        const editButtonCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.setAttribute('data-editing', 'false'); // Use this attribute to toggle between edit and save
        editButton.onclick = function(event) {
            event.stopPropagation(); // Stop event propagation
            const isEditing = editButton.getAttribute('data-editing') === 'true';
            if (!isEditing) {
                enableEditing(partnership.ID, row, editButton); 
            } else {
                saveChanges(partnership.ID, row, editButton);
            }
        };
        editButtonCell.appendChild(editButton);

        // Generate Partnership Agreement Button
        const generateButtonCell = row.insertCell();
        const generateButton = document.createElement('button');
        generateButton.textContent = 'Generate Partnership Agreement';
        generateButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the row click event
            generatePartnershipAgreement(partnership.ID);
        });
        generateButtonCell.appendChild(generateButton);

        // Generate Cession Agreement Button
        const generateCessionButton = document.createElement('button');
        generateCessionButton.textContent = 'Generate Cession Agreement';
        generateCessionButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the row click event
            generateCessionAgreement(partnership.ID);
        });
        generateButtonCell.appendChild(generateCessionButton); // Assuming you want to add it in the same cell as the Partnership Agreement button

        // Generate Loan Agreement Button
        const generateLoanButton = document.createElement('button');
        generateLoanButton.textContent = 'Generate Loan Agreement';
        generateLoanButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the row click event
            generateLoanAgreement(partnership.ID);
        });
        generateButtonCell.appendChild(generateLoanButton);

        // Create an Upload Document button
        const uploadDocumentButton = document.createElement('button');
        uploadDocumentButton.textContent = 'Upload Document';
        uploadDocumentButton.style.marginLeft = '10px'; // Add some spacing if needed
        uploadDocumentButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the row click event
            document.getElementById(`fileInput-${partnership.ID}`).click(); // Trigger the hidden file input click
        });

        // Append the Upload Document button to the cell
        generateButtonCell.appendChild(uploadDocumentButton);

        // Create a hidden file input for document upload
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = `fileInput-${partnership.ID}`;
        fileInput.style.display = 'none'; // Hide the file input
        fileInput.addEventListener('change', function(event) {
            // Handle the file(s) selected by the user
            handleFileUpload(event, partnership.ID);
        });

        // Append the hidden file input to the cell
        generateButtonCell.appendChild(fileInput);



        const docsDiv = document.createElement('div');
        docsDiv.id = `docs-${partnership.ID}`;
        docsDiv.className = 'docs-div'; // Apply the CSS class here
        docsDiv.style.display = 'none';
        generateButtonCell.appendChild(docsDiv);

        // Create a dropdown cell for signed agreements
        const signedAgreementCell = row.insertCell();
        const signedAgreementDropdown = document.createElement('select');
        signedAgreementDropdown.id = `signedAgreementDropdown-${partnership.ID}`;
        signedAgreementDropdown.onfocus = async () => {
            // Only fetch documents if the dropdown is not already populated
            if (signedAgreementDropdown.length <= 1) {
                const documents = await fetchDocumentsForPartnership(partnership.ID);
                populateSignedAgreementDropdown(signedAgreementDropdown, documents);
            }
        };

        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Select Document';
        signedAgreementDropdown.appendChild(defaultOption);
        signedAgreementCell.appendChild(signedAgreementDropdown);
        
        // Add click event to the row for toggling documents
        row.addEventListener('click', function(event) {
            // Prevent triggering when clicking on the Generate button
            if (event.target !== generateButton) {
                toggleDocuments(partnership.ID);
            }
        });
    });
}

// This function could be similar to your existing fetchAndDisplayDocuments but instead returns the documents.
async function fetchDocumentsForPartnership(partnershipId) {
    const response = await fetch(`https://dashboard-function-app-1.azurewebsites.net/api/agreementsFetchPartnershipDocuments?code=tPbvNKW1_cEEECXarYViyzl8yKFIFEhc62wvgF5Fz2rOAzFuy4L4lg==&partnershipId=${partnershipId}`);
    if (!response.ok) {
        console.error('Failed to fetch documents');
        return [];
    }
    return await response.json();
}

function populateSignedAgreementDropdown(dropdown, documents) {
    // Remove the existing options except for the default one
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }

    // Populate the dropdown with fetched documents
    documents.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.DocumentURL; // Use URL as value; adjust as needed
        option.textContent = doc.FileName; // Adjust based on your document object structure
        dropdown.appendChild(option);
    });
}

async function fetchAndDisplayDocuments(partnershipId) {
    const response = await fetch(`https://dashboard-function-app-1.azurewebsites.net/api/agreementsFetchPartnershipDocuments?code=tPbvNKW1_cEEECXarYViyzl8yKFIFEhc62wvgF5Fz2rOAzFuy4L4lg==&partnershipId=${partnershipId}`);
    if (!response.ok) {
        console.error('Failed to fetch documents');
        return;
    }
    const documents = await response.json();

    // Select the document display section for this partnership
    const docsDiv = document.getElementById(`docs-${partnershipId}`);
    docsDiv.innerHTML = ''; // Clear previous content

    // Create a heading for the documents section
    const docsHeading = document.createElement('h4');
    docsHeading.textContent = 'Documents';
    docsDiv.appendChild(docsHeading);

    // Add each document as a link or list item to the docsDiv
    documents.forEach(doc => {
        const docLink = document.createElement('a');
        docLink.href = doc.DocumentURL;
        docLink.textContent = doc.FileName;
        docLink.target = '_blank'; // Open in new tab
        docsDiv.appendChild(docLink);
        docsDiv.appendChild(document.createElement('br')); // Line break between documents
    });

    // Show the documents section
    docsDiv.style.display = 'block';
}


function toggleDocuments(partnershipId) {
    const docsDiv = document.getElementById(`docs-${partnershipId}`);
    if (!docsDiv) {
        console.error('Document div not found');
        return;
    }
    // If documents are already fetched, simply toggle visibility
    if (docsDiv.innerHTML !== '') {
        docsDiv.style.display = docsDiv.style.display === 'none' ? 'block' : 'none';
        return;
    }
    // Otherwise, fetch and display the documents
    fetchAndDisplayDocuments(partnershipId);
}


let globalPartnerships = []; // Assume this is filled by the loadPartnerships function

async function generatePartnershipAgreement(partnershipId) {
    console.log(`Generating agreement for Partnership ID: ${partnershipId}`);

    // Find the specific partnership data based on partnershipId
    const partnershipData = globalPartnerships.find(p => p.ID === partnershipId);
    if (!partnershipData) {
        console.error('Partnership data not found');
        return;
    }
    console.log('Partnership data:', partnershipData);

    // Prepare the partners data
    const partners = partnershipData.PartnerDetails.split(';;').map(partnerStr => {
        const [name, surname, idNumber, email, contactNumber] = partnerStr.split('|');
        return { name, surname, idNumber, email, contactNumber };
    });
    console.log('Partners data:', partners);

    const dateAgreementSigned = new Date(partnershipData.DateAgreementSigned);
    // Format the date to exclude the timestamp, resulting in a YYYY-MM-DD format
    const dateWithoutTime = dateAgreementSigned.toISOString().split('T')[0];    

    // Extract month and year using toLocaleString for readability
    const month = dateAgreementSigned.toLocaleString('default', { month: 'long' }); // 'January'
    const year = dateAgreementSigned.getFullYear(); // 1970
    const agreementMonthAndYear = month + ' ' + year;
    // Concatenate names and emails, and prepare other required fields
    const fullNames = partners.map(partner => `${partner.name} ${partner.surname}`).join(' AND ');
    const idNumber = partners.map(partner => partner.idNumber).join(' / ');
    const emails = partners.map(partner => partner.email).join(' / ');
    const primaryContactNumber = partners.map(partner => partner.contactNumber).join(' AND ');
    const propertyDescription = `${partnershipData.ERFNumber} ${partnershipData.Address} ${partnershipData.TitleDeedNumber}`;
    const totalInWords = numberToWords(partnershipData.TotalInvestment) + ' rand';
    console.log('totalinwords', totalInWords);

    // Prepare the JSON data for the Azure Function
    const jsonData = {
        templateFileName: "notarial_lease_template.docx",
        jsonData: {
            erf: partnershipData.ERFNumber,
            address: partnershipData.Address,
            titleNumber: partnershipData.TitleDeedNumber,
            noUnits: partnershipData.NoUnits,
            noYears: partnershipData.NoYears,
            noMonths: partnershipData.NoMonths,
            dateAgreementSigned: dateWithoutTime,
            agreementMonthAndYear: agreementMonthAndYear,
            totalInvestment: partnershipData.TotalInvestment,
            totalInWords: totalInWords,
            bank: partnershipData.Bank,
            accountHolder: partnershipData.AccountHolder,
            accountNumber: partnershipData.AccountNumber,
            accountType: partnershipData.AccountType,
            fullNames: fullNames,
            idNumber: idNumber,
            emails: emails,
            propertyDescription: propertyDescription,
            primaryContactNumber: primaryContactNumber
        },
        PartnershipID: partnershipId
    };

    try {
        const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/agreementsGeneratePDF?code=0S0wTTFDBFs2r4nbeR0xfVP2SY5rlJwivAJPltw1cXaVAzFuUAMY_A==', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        console.log('Agreement generated successfully:', responseData);
        // Here, you could do something with the response, like showing a link or a message to the user
    } catch (error) {
        console.error('Error generating partnership agreement:', error);
    }
}

async function generateCessionAgreement(partnershipId) {
    console.log(`Generating cession agreement for Partnership ID: ${partnershipId}`);

    // Find the specific partnership data based on partnershipId
    const partnershipData = globalPartnerships.find(p => p.ID === partnershipId);
    if (!partnershipData) {
        console.error('Partnership data not found');
        return;
    }
    console.log('Partnership data:', partnershipData);

    // Prepare the partners data
    const partners = partnershipData.PartnerDetails.split(';;').map(partnerStr => {
        const [name, surname, idNumber, email, contactNumber] = partnerStr.split('|');
        return { name, surname, idNumber, email, contactNumber };
    });
    console.log('Partners data:', partners);

    const dateAgreementSigned = new Date(partnershipData.DateAgreementSigned);
    // Format the date to exclude the timestamp, resulting in a YYYY-MM-DD format
    const dateWithoutTime = dateAgreementSigned.toISOString().split('T')[0];    

    // Extract month and year using toLocaleString for readability
    const month = dateAgreementSigned.toLocaleString('default', { month: 'long' }); // 'January'
    const year = dateAgreementSigned.getFullYear(); // 1970
    const agreementMonthAndYear = month + ' ' + year;

    const fullNames = partners.map(partner => `${partner.name} ${partner.surname}`).join(' AND ');
    const idNumber = partners.map(partner => partner.idNumber).join(' / ');
    const emails = partners.map(partner => partner.email).join(' / ');
    const primaryContactNumber = partners.map(partner => partner.contactNumber).join(' AND ');
    const propertyDescription = `${partnershipData.erf} ${partnershipData.address} ${partnershipData.titleNumber}`;
    const totalInWords = numberToWords(partnershipData.TotalInvestment) + ' rand';

    // Prepare the JSON data for the Azure Function
    const jsonData = {
        templateFileName: "cession_agreement_bitprop_mpdf_template.docx",
        jsonData: {
            erf: partnershipData.ERFNumber,
            address: partnershipData.Address,
            titleNumber: partnershipData.TitleDeedNumber,
            noUnits: partnershipData.NoUnits,
            noYears: partnershipData.NoYears,
            noMonths: partnershipData.NoMonths,
            dateAgreementSigned: dateWithoutTime,
            agreementMonthAndYear: agreementMonthAndYear,
            totalInvestment: partnershipData.TotalInvestment,
            totalInWords: totalInWords,
            bank: partnershipData.Bank,
            accountHolder: partnershipData.AccountHolder,
            accountNumber: partnershipData.AccountNumber,
            accountType: partnershipData.AccountType,
            fullNames: fullNames,
            idNumber: idNumber,
            emails: emails,
            propertyDescription: propertyDescription,
            primaryContactNumber: primaryContactNumber
        },
        PartnershipID: partnershipId
    };

    try {
        const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/agreementsGeneratePDF?code=0S0wTTFDBFs2r4nbeR0xfVP2SY5rlJwivAJPltw1cXaVAzFuUAMY_A==', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        const cessionAgreementUrl = responseData.pdfUrl; // Assuming responseData contains the URL of the generated PDF
        console.log('Cession agreement generated successfully:', cessionAgreementUrl);

        // Now generate the repayment schedule and get its URL
        const repaymentScheduleUrl = await generateRepaymentSchedule(partnershipId);

        // Correctly select the dropdown based on the partnershipId
        const signedAgreementDropdown = document.querySelector(`#signedAgreementDropdown-${partnershipId}`);
        const signedDocumentUrl = signedAgreementDropdown.value;

        // Ensure a signed document was selected
        if (!signedDocumentUrl || signedDocumentUrl === "Select Document") {
            console.error("No signed document selected.");
            return; // Exit if no document selected
        }

        // Current date and time
        const now = new Date();

        // Format date and time
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');

        // Combine to form a filename
        const dateTimeFormatted = `${year}-${month}-${day} ${hours}:${minutes}`;
        const fileName = `Cession Agreement ${dateTimeFormatted}.pdf`;

        // Combine the Cession Agreement with the selected Signed Document
        const combinedPdfResponse = await combinePdfs([cessionAgreementUrl, signedDocumentUrl, repaymentScheduleUrl], fileName, partnershipId);

        console.log('Combined PDF generated successfully:', combinedPdfResponse.pdfUrl);
        // Optionally, show the combined PDF URL to the user or handle as needed


        // Here, you could do something with the response, like showing a link or a message to the user
    } catch (error) {
        console.error('Error generating cession agreement:', error);
    }
}

async function generateLoanAgreement(partnershipId) {
    console.log(`Generating loan agreement for Partnership ID: ${partnershipId}`);

    // Find the specific partnership data based on partnershipId
    const partnershipData = globalPartnerships.find(p => p.ID === partnershipId);
    if (!partnershipData) {
        console.error('Partnership data not found');
        return;
    }
    console.log('Partnership data:', partnershipData);

    // Prepare the partners data
    const partners = partnershipData.PartnerDetails.split(';;').map(partnerStr => {
        const [name, surname, idNumber, email, contactNumber] = partnerStr.split('|');
        return { name, surname, idNumber, email, contactNumber };
    });
    console.log('Partners data:', partners);

    const dateAgreementSigned = new Date(partnershipData.DateAgreementSigned);
    // Format the date to exclude the timestamp, resulting in a YYYY-MM-DD format
    const dateWithoutTime = dateAgreementSigned.toISOString().split('T')[0];    

    // Extract month and year using toLocaleString for readability
    const month = dateAgreementSigned.toLocaleString('default', { month: 'long' }); // 'January'
    const year = dateAgreementSigned.getFullYear(); // 1970
    const agreementMonthAndYear = month + ' ' + year;
    // Concatenate names and emails, and prepare other required fields
    const fullNames = partners.map(partner => `${partner.name} ${partner.surname}`).join(' AND ');
    const idNumber = partners.map(partner => partner.idNumber).join(' / ');
    const emails = partners.map(partner => partner.email).join(' / ');
    const primaryContactNumber = partners.map(partner => partner.contactNumber).join(' AND ');
    const propertyDescription = `${partnershipData.erf} ${partnershipData.address} ${partnershipData.titleNumber}`;
    const totalInWords = numberToWords(partnershipData.TotalInvestment) + ' rand';

    // Prepare the JSON data for the Azure Function
    const jsonData = {
        templateFileName: "loan_agreement_mpdf_bitprop_template.docx",
        jsonData: {
            erf: partnershipData.ERFNumber,
            address: partnershipData.Address,
            titleNumber: partnershipData.TitleDeedNumber,
            noUnits: partnershipData.NoUnits,
            noYears: partnershipData.NoYears,
            noMonths: partnershipData.NoMonths,
            dateAgreementSigned: dateWithoutTime,
            agreementMonthAndYear: agreementMonthAndYear,
            totalInvestment: partnershipData.TotalInvestment,
            totalInWords: totalInWords,
            bank: partnershipData.Bank,
            accountHolder: partnershipData.AccountHolder,
            accountNumber: partnershipData.AccountNumber,
            accountType: partnershipData.AccountType,
            fullNames: fullNames,
            idNumber: idNumber,
            emails: emails,
            propertyDescription: propertyDescription,
            primaryContactNumber: primaryContactNumber
        },
        PartnershipID: partnershipId
    };

    try {
        const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/agreementsGeneratePDF?code=0S0wTTFDBFs2r4nbeR0xfVP2SY5rlJwivAJPltw1cXaVAzFuUAMY_A==', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        const loanAgreementUrl = responseData.pdfUrl; // Assuming responseData contains the URL of the generated PDF
        console.log('Loan agreement generated successfully:', loanAgreementUrl);

        // Now generate the repayment schedule and get its URL
        const repaymentScheduleUrl = await generateRepaymentSchedule(partnershipId);

        // Correctly select the dropdown based on the partnershipId
        const signedAgreementDropdown = document.querySelector(`#signedAgreementDropdown-${partnershipId}`);
        const signedDocumentUrl = signedAgreementDropdown.value;

        // Ensure a signed document was selected
        if (!signedDocumentUrl || signedDocumentUrl === "Select Document") {
            console.error("No signed document selected.");
            return; // Exit if no document selected
        }

        // Current date and time
        const now = new Date();

        // Format date and time
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');

        // Combine to form a filename
        const dateTimeFormatted = `${year}-${month}-${day} ${hours}:${minutes}`;
        const fileName = `Loan Agreement ${dateTimeFormatted}.pdf`;

        // Combine the Cession Agreement with the selected Signed Document
        const combinedPdfResponse = await combinePdfs([loanAgreementUrl, repaymentScheduleUrl, signedDocumentUrl], fileName, partnershipId);

        console.log('Combined PDF generated successfully:', combinedPdfResponse.pdfUrl);
        // Optionally, show the combined PDF URL to the user or handle as needed



    } catch (error) {
        console.error('Error generating loan agreement:', error);
    }
}

async function generateRepaymentSchedule(partnershipId) {
    console.log(`Generating repayment schedule for Partnership ID: ${partnershipId}`);

    // Find the specific partnership data based on partnershipId
    const partnershipData = globalPartnerships.find(p => p.ID === partnershipId);
    if (!partnershipData) {
        console.error('Partnership data not found');
        return;
    }
    console.log('Partnership data:', partnershipData);

    // Prepare the partners data
    const partners = partnershipData.PartnerDetails.split(';;').map(partnerStr => {
        const [name, surname, idNumber, email, contactNumber] = partnerStr.split('|');
        return { name, surname, idNumber, email, contactNumber };
    });
    console.log('Partners data:', partners);

    const dateAgreementSigned = new Date(partnershipData.DateAgreementSigned);
    // Format the date to exclude the timestamp, resulting in a YYYY-MM-DD format
    const dateWithoutTime = dateAgreementSigned.toISOString().split('T')[0];    

    const dateAgreementStarts = new Date(partnershipData.DateAgreementStarts);

    // Format the date to exclude the timestamp, resulting in a YYYY-MM-DD format
    const dateAgreementStartsWithoutTime = dateAgreementStarts.toISOString().split('T')[0]; 
    console.log('Date Agreement Starts:', dateAgreementStartsWithoutTime);
    // Extract month and year using toLocaleString for readability
    const month = dateAgreementSigned.toLocaleString('default', { month: 'long' }); // 'January'
    const year = dateAgreementSigned.getFullYear(); // 1970
    const agreementMonthAndYear = month + ' ' + year;
    // Concatenate names and emails, and prepare other required fields
    const fullNames = partners.map(partner => `${partner.name} ${partner.surname}`).join(' AND ');
    const idNumber = partners.map(partner => partner.idNumber).join(' / ');
    const emails = partners.map(partner => partner.email).join(' / ');
    const primaryContactNumber = partners.map(partner => partner.contactNumber).join(' AND ');
    const propertyDescription = `${partnershipData.erf} ${partnershipData.address} ${partnershipData.titleNumber}`;
    const totalInWords = numberToWords(partnershipData.TotalInvestment) + ' rand';

    // Prepare the JSON data for the Azure Function
    const jsonData = {
        dateAgreementStarts: dateAgreementStartsWithoutTime,
        noMonths: partnershipData.NoMonths,
        totalInvestment: partnershipData.TotalInvestment,
        PartnershipID: partnershipId
    };
    console.log('json body', jsonData);
    try {
        const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/agreementsGeneratePDFFromHTML?code=QPd2KpVegAB4po_FG7gwaywcvnUifum4xFmEBJJNTFGwAzFutfSfyw==', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        console.log('Repayment Schedule generated successfully:', responseData);
        return responseData.pdfUrl;
        // Here, you could do something with the response, like showing a link or a message to the user
    } catch (error) {
        console.error('Error generating repayment schedule:', error);
    }
}

function enableEditing(partnershipId, row, editButton) {
    // Convert cells to editable inputs
    const cells = Array.from(row.cells).slice(0, -3);
    cells.forEach((cell, index) => {
        if (index < cells.length - 3) { // Exclude the cell with the Edit/Save button and the Generate Partnership Agreement button
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

    // Hide the Generate Partnership Agreement button
    const generateButtonCell = row.cells[row.cells.length - 2];
    const generateButton = generateButtonCell.querySelector('button');
    if (generateButton) {
        generateButton.style.display = 'none';
    }
}

async function saveChanges(partnershipId, row, editButton) {
    event.stopPropagation(); // Prevent the default action

    const updatedPartnershipData = {};
    const cells = Array.from(row.querySelectorAll('td')).slice(0, -3); // Exclude the cells with buttons

    // Define a mapping for special field names
    const fieldMappings = {
        "ERFNumber": "erf",
        "TitleDeedNumber": "titleNumber",
        // Add other mappings here as needed
    };

    cells.forEach((cell, index) => {
        if (cell.querySelector('input')) { // Check if cell contains an input element
            const input = cell.querySelector('input');
            let originalKey = Object.keys(globalPartnerships[0])[index];
            let key = fieldMappings[originalKey] || originalKey.charAt(0).toLowerCase() + originalKey.slice(1); // Use mapping or convert first character to lowercase to ensure camelCase
            let value = input.value;

            // Exclude ID field and use only partnershipId
            if (originalKey === "ID") return;

            // Special handling for certain fields
            switch (key) {
                case 'noUnits':
                case 'noMonths':
                    value = parseInt(value, 10);
                    break;
                case 'totalInvestment':
                    value = parseFloat(value);
                    break;
                case 'dateAgreementSigned':
                case 'dateAgreementStarts': // Assuming you might have another date field like this
                    if (value) { // Only proceed if value is not empty
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) { // Check if date is valid
                            value = date.toISOString().split('T')[0];
                        } else {
                            // If date is invalid or empty, skip this field
                            return; // Skip this iteration, effectively not adding this field to the data
                        }
                    } else {
                        return; // Skip this iteration if date is empty
                    }
                    break;
                default:
                    // Use the value as-is for other fields
            }

            updatedPartnershipData[key] = value;
        }
    });

    // Ensure partnershipId is included correctly
    updatedPartnershipData.partnershipId = parseInt(partnershipId, 10);

    console.log('Updated data to send:', updatedPartnershipData);

    try {
        // Send updated data to your API endpoint for updating the partnership details
        const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/updatePartnershipDetails?code=zq4y0qtunyPm_suWxdfrcPDHZlKsEqc0QRUPpaL1UyEiAzFu4epgiw==', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPartnershipData),
        });

        if (!response.ok) {
            throw new Error('Failed to update partnership details');
        }

        // Update the globalPartnerships array to reflect changes
        const index = globalPartnerships.findIndex(partnership => partnership.ID === partnershipId);
        if (index !== -1) {
            globalPartnerships[index] = { ...globalPartnerships[index], ...updatedPartnershipData };
        }

        // Toggle back the edit button to 'Edit' mode
        editButton.textContent = 'Edit';
        editButton.setAttribute('data-editing', 'false');

        // Optionally, toggle back the visibility of the Generate Partnership Agreement button
        const generateButton = row.querySelector('.generate-partnership-agreement');
        if (generateButton) {
            generateButton.style.display = ''; // Make it visible again
        }

        console.log('Partnership details updated successfully');
    } catch (error) {
        console.error('Error updating partnership details:', error);
        // Handle error (e.g., show an error message to the user)
    }
}

async function combinePdfs(pdfUrls, outputFileName, partnershipId) {
    const combinePdfData = {
        pdfUrls: pdfUrls,
        outputFileName: outputFileName,
        PartnershipId: partnershipId // Ensure this matches with your backend expectations
    };

    try {
        const combineResponse = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/combinePDFs?code=d8DYY2Tcfmvj_Qw1AnCNrsfDIA6swwkMrO1djc1bzWN9AzFuZ8AVwQ==', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(combinePdfData)
        });

        if (!combineResponse.ok) {
            throw new Error('Network response was not ok while combining PDFs');
        }

        return await combineResponse.json(); // Assuming this response includes the combined PDF URL
    } catch (error) {
        console.error('Error combining PDFs:', error);
        throw error;
    }
}

// This function is triggered by the file input's onchange event
async function handleFileUpload(event, partnershipId) {
    console.log('handleFileUpload');
    const file = event.target.files[0];
    if (!file) {
        console.log('No file selected.');
        return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        console.log('FileReader onload event triggered.');
        // Extract the base64 content from the reader result
        const fileContent = reader.result.split(',')[1]; // Remove the prefix `data:application/pdf;base64,`
        const fileName = file.name;
        console.log('FileName in FileReader:', fileName);

        // Now, call your function to upload the document
        await uploadDocument(partnershipId, fileContent, fileName);
    };
    reader.onerror = function (error) {
        console.log('Error in FileReader: ', error);
    };
}

async function uploadDocument(partnershipId, fileContent, fileName) {
    // Prepare the request body
    const body = {
        fileName,
        fileContent,
        PartnershipID: partnershipId
    };
    console.log('Body:', body)
    // Call your Azure Function to upload the document
    try {
        const response = await fetch('https://dashboard-function-app-1.azurewebsites.net/api/agreementsUploadPartnershipDocument?code=8kvY3jkmkaI7-pGv0Fmj6wMSL3WxoI0uI_xxaE2k6du6AzFuJpCvSw==', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to upload document.');
        }
        const responseData = await response.json();
        console.log('Document uploaded successfully. URL:', responseData.url);
    } catch (error) {
        console.error('Error uploading document:', error);
    }
}

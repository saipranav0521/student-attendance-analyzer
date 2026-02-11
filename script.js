/* ================================
   STUDENT ATTENDANCE ANALYZER V2
   Dynamic Form-Based Logic
   ================================ */




// Configuration Constants
const MINIMUM_ATTENDANCE = 75; // Percentage
const STATUS_SAFE = 'SAFE';
const STATUS_DANGER = 'DANGER';

// DOM Elements
const subjectsInputContainer = document.getElementById('subjectsInputContainer');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');

// Subject counter for unique IDs
let subjectCount = 0;

// Event Listeners
addSubjectBtn.addEventListener('click', addSubjectRow);
analyzeBtn.addEventListener('click', analyzeAttendance);
resetBtn.addEventListener('click', resetForm);

/**
 * Add a new subject input row
 */
function addSubjectRow() {
    subjectCount++;
    const rowId = `subject-row-${subjectCount}`;

    const row = document.createElement('div');
    row.className = 'subject-row';
    row.id = rowId;

    row.innerHTML = `
        <div class="form-group">
            <label for="subject-${subjectCount}">Subject Name</label>
            <input 
                type="text" 
                id="subject-${subjectCount}" 
                class="subject-input" 
                placeholder="e.g., Data Structures"
                autocomplete="off"
            />
        </div>
        
        <div class="form-group">
            <label for="held-${subjectCount}">Classes Held</label>
            <input 
                type="number" 
                id="held-${subjectCount}" 
                class="held-input" 
                placeholder="0"
                min="0"
            />
        </div>
        
        <div class="form-group">
            <label for="attended-${subjectCount}">Attended</label>
            <input 
                type="number" 
                id="attended-${subjectCount}" 
                class="attended-input" 
                placeholder="0"
                min="0"
            />
        </div>
        
        <button class="btn-remove" onclick="removeSubjectRow('${rowId}')">
            ❌
        </button>
    `;

    subjectsInputContainer.appendChild(row);

    // Focus on the subject name input
    document.getElementById(`subject-${subjectCount}`).focus();

    // Allow adding new row by pressing Tab on the last input
    document.getElementById(`attended-${subjectCount}`).addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addSubjectRow();
        }
    });
}

/**
 * Remove a subject row
 * @param {string} rowId - ID of the row to remove
 */
function removeSubjectRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => row.remove(), 300);
    }
}

/**
 * Get all subject data from input fields
 * @returns {Array} Array of subject objects
 */
function getSubjectData() {
    const subjects = [];
    const rows = subjectsInputContainer.querySelectorAll('.subject-row');

    rows.forEach((row) => {
        const subjectInput = row.querySelector('.subject-input');
        const heldInput = row.querySelector('.held-input');
        const attendedInput = row.querySelector('.attended-input');

        const subjectName = subjectInput.value.trim();
        const held = parseInt(heldInput.value) || 0;
        const attended = parseInt(attendedInput.value) || 0;

        // Skip empty rows
        if (!subjectName && held === 0 && attended === 0) {
            return;
        }

        // Validate subject name
        if (!subjectName) {
            throw new Error('Subject name is required for all entries');
        }

        // Validate numbers
        if (held < 0 || attended < 0) {
            throw new Error(`Negative values not allowed for "${subjectName}"`);
        }

        if (attended > held) {
            throw new Error(`Attended classes cannot exceed held classes for "${subjectName}"`);
        }

        if (held === 0) {
            throw new Error(`Classes held must be greater than 0 for "${subjectName}"`);
        }

        subjects.push({
            name: subjectName.toUpperCase(),
            held: held,
            attended: attended,
            percentage: (attended / held) * 100
        });
    });

    return subjects;
}

/**
 * Validate input data
 */
function validateInputData(subjects) {
    if (subjects.length === 0) {
        throw new Error('Please add at least one subject before analyzing. ➕');
    }

    return true;
}

/**
 * Main function to analyze attendance data
 */
function analyzeAttendance() {
    try {
        // Get subject data from form
        const subjects = getSubjectData();

        // Validate
        validateInputData(subjects);

        // Calculate statistics
        const stats = calculateStatistics(subjects);

        // Display results
        displayResults(stats, subjects);

        // Hide error section
        errorSection.classList.add('hidden');

    } catch (error) {
        showError(error.message);
        console.error(error);
    }
}

/**
 * Calculate overall statistics from subjects
 * @param {Array} subjects - Array of subject objects
 * @returns {Object} Statistics object
 */
function calculateStatistics(subjects) {
    // Sum up all attended and held classes
    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalHeld = subjects.reduce((sum, s) => sum + s.held, 0);

    // Calculate overall percentage
    const overallPercentage = (totalAttended / totalHeld) * 100;

    // Determine status
    const status = overallPercentage >= MINIMUM_ATTENDANCE ? STATUS_SAFE : STATUS_DANGER;

    // Calculate action (bunkable or required classes)
    let actionNumber = 0;
    let actionLabel = '';
    let actionMessage = '';

    if (status === STATUS_SAFE) {
        // Student is SAFE - calculate how many classes can be bunked
        // Formula: floor((attended / 0.75) - held)
        actionNumber = Math.floor((totalAttended / 0.75) - totalHeld);
        actionLabel = 'Classes You Can Bunk';
        actionMessage = `
            💚 You're <strong>SAFE!</strong><br>
            You have attended <strong>${totalAttended}</strong> out of <strong>${totalHeld}</strong> classes.<br>
            <br>
            You can bunk up to <strong>${Math.max(0, actionNumber)}</strong> class(es) and still maintain 75% attendance!<br>
            <br>
            ⚠️ But be careful! Missing too many classes might get you in trouble.
        `;
    } else {
        // Student is in DANGER - calculate how many classes need to attend
        // Formula: ceil((0.75 * held) - attended)
        actionNumber = Math.ceil((0.75 * totalHeld) - totalAttended);
        actionLabel = 'Classes You MUST Attend';
        actionMessage = `
            🔴 You're in <strong>DANGER!</strong><br>
            You have attended <strong>${totalAttended}</strong> out of <strong>${totalHeld}</strong> classes.<br>
            <br>
            You need to attend <strong>${actionNumber}</strong> more consecutive class(es) to reach 75% attendance!<br>
            <br>
            ⏰ Act fast! Attend all upcoming classes without miss.
        `;
    }

    return {
        status: status,
        overallPercentage: overallPercentage.toFixed(2),
        totalAttended: totalAttended,
        totalHeld: totalHeld,
        actionNumber: Math.max(0, actionNumber),
        actionLabel: actionLabel,
        actionMessage: actionMessage,
        subjects: subjects
    };
}

/**
 * Display results on the page
 * @param {Object} stats - Statistics object from calculateStatistics
 * @param {Array} subjects - Array of subject objects
 */
function displayResults(stats, subjects) {
    // Show results section
    resultsSection.classList.remove('hidden');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update status card
    const statusCard = document.getElementById('statusCard');
    const statusEmoji = document.getElementById('statusEmoji');
    const statusMessage = document.getElementById('statusMessage');
    const statusSubtext = document.getElementById('statusSubtext');

    if (stats.status === STATUS_SAFE) {
        statusCard.classList.remove('danger');
        statusCard.classList.add('safe');
        statusEmoji.textContent = '✅';
        statusMessage.textContent = 'You\'re SAFE!';
        statusSubtext.textContent = `${stats.overallPercentage}% Attendance - Keep it up! 🎉`;
    } else {
        statusCard.classList.remove('safe');
        statusCard.classList.add('danger');
        statusEmoji.textContent = '⚠️';
        statusMessage.textContent = 'You\'re in DANGER!';
        statusSubtext.textContent = `${stats.overallPercentage}% Attendance - Time to act! 🚨`;
    }

    // Update metrics
    document.getElementById('overallPercentage').textContent = stats.overallPercentage + '%';
    document.getElementById('totalClasses').textContent = stats.totalHeld;
    document.getElementById('totalAttended').textContent = stats.totalAttended;
    document.getElementById('actionLabel').textContent = stats.actionLabel;
    
    const actionNumberElement = document.getElementById('actionNumber');
    actionNumberElement.textContent = stats.actionNumber;
    
    // Apply danger class to metric card if needed
    const metricCard = actionNumberElement.closest('.metric-card');
    if (stats.status === STATUS_DANGER) {
        metricCard.classList.add('danger');
    } else {
        metricCard.classList.remove('danger');
    }

    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = `${Math.min(100, stats.overallPercentage)}%`;
    if (stats.status === STATUS_DANGER) {
        progressFill.classList.add('danger');
    } else {
        progressFill.classList.remove('danger');
    }

    // Update action message
    const actionMessageElement = document.getElementById('actionMessage');
    actionMessageElement.innerHTML = stats.actionMessage;
    actionMessageElement.classList.remove('safe', 'danger');
    actionMessageElement.classList.add(stats.status === STATUS_SAFE ? 'safe' : 'danger');

    // Display subject-wise breakdown
    displaySubjectsList(subjects);

    // Display tips
    displayTips(stats);
}

/**
 * Display subject-wise breakdown
 * @param {Array} subjects - Array of subject objects
 */
function displaySubjectsList(subjects) {
    const container = document.getElementById('subjectsContainer');
    container.innerHTML = '';

    // Sort subjects by name
    const sortedSubjects = [...subjects].sort((a, b) => a.name.localeCompare(b.name));

    sortedSubjects.forEach(subject => {
        const isSafe = subject.percentage >= MINIMUM_ATTENDANCE;
        
        const subjectItem = document.createElement('div');
        subjectItem.className = `subject-item ${isSafe ? 'safe' : 'danger'}`;

        subjectItem.innerHTML = `
            <div class="subject-name">
                ${isSafe ? '✅' : '⚠️'} ${subject.name}
            </div>
            <div class="subject-stats">
                <div class="subject-bar">
                    <div class="subject-fill ${isSafe ? '' : 'danger'}" style="width: ${Math.min(100, subject.percentage)}%"></div>
                </div>
                <div class="subject-percentage">${subject.percentage.toFixed(1)}%</div>
                <div class="subject-status ${isSafe ? '' : 'danger'}">
                    ${isSafe ? 'SAFE' : 'RISK'}
                </div>
            </div>
        `;

        container.appendChild(subjectItem);
    });
}

/**
 * Display tips based on statistics
 * @param {Object} stats - Statistics object
 */
function displayTips(stats) {
    const container = document.getElementById('tipsContainer');
    container.innerHTML = '';

    const tips = [];

    if (stats.status === STATUS_SAFE) {
        tips.push({
            title: '✅ You\'re Doing Great!',
            text: 'Your attendance is above the minimum requirement. Keep attending classes regularly.'
        });

        if (stats.actionNumber > 0) {
            tips.push({
                title: '🎯 Strategic Bunking',
                text: `You can afford to miss ${stats.actionNumber} class(es), but don't use all at once. Save them for emergencies!`
            });
        } else {
            tips.push({
                title: '⚠️ Limited Buffer',
                text: 'You have very little room to bunk. It\'s risky! Attend all upcoming classes.'
            });
        }

        tips.push({
            title: '💡 Pro Tip',
            text: 'Don\'t skip classes unnecessarily. A sudden illness or emergency could push you below 75%!'
        });

    } else {
        // DANGER status
        tips.push({
            title: '🚨 Action Required!',
            text: `You MUST attend ${stats.actionNumber} more consecutive class(es) to reach 75% attendance.`
        });

        const missingSubjects = stats.subjects.filter(s => s.percentage < MINIMUM_ATTENDANCE);
        if (missingSubjects.length > 0) {
            const subjectNames = missingSubjects.map(s => s.name).join(', ');
            tips.push({
                title: '📌 Priority Subjects',
                text: `Focus on attending: <strong>${subjectNames}</strong>. These are pulling your attendance down!`
            });
        }

        tips.push({
            title: '⏰ Don\'t Delay!',
            text: 'Start attending classes immediately. Every class counts now. Missing more classes will make it even harder to recover!'
        });

        tips.push({
            title: '📞 Talk to Your Instructor',
            text: 'Consider informing your instructor about your attendance concerns. They might be able to help!'
        });
    }

    tips.forEach(tip => {
        const tipElement = document.createElement('div');
        tipElement.className = 'tip-item';
        tipElement.innerHTML = `
            <strong>${tip.title}</strong><br>
            ${tip.text}
        `;
        container.appendChild(tipElement);
    });
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const errorMessageElement = document.getElementById('errorMessage');
    errorMessageElement.textContent = '❌ ' + message;
    errorSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Hide error message
 */
function hideError() {
    errorSection.classList.add('hidden');
}

/**
 * Reset the form
 */
function resetForm() {
    // Clear all rows
    subjectsInputContainer.innerHTML = '';
    
    // Reset counter
    subjectCount = 0;
    
    // Add one empty row to start
    addSubjectRow();
    
    // Hide results and errors
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    
    // Focus on first input
    setTimeout(() => {
        const firstInput = document.querySelector('.subject-input');
        if (firstInput) firstInput.focus();
    }, 100);
}

// Initialize with one empty row on page load
window.addEventListener('load', () => {
    addSubjectRow();
});




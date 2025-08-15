class ArithmeticGame {
    constructor() {
        this.currentProblem = null;
        this.score = 0;
        this.timeLeft = 0;
        this.timer = null;
        this.gameActive = false;
        this.operations = [];
        this.settings = {};
        
        this.loadSavedSettings();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('gameSetup').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startGame();
        });

        // Times table toggle functionality
        document.getElementById('timesTableToggle').addEventListener('change', (e) => {
            const controls = document.getElementById('timesTableControls');
            controls.style.display = e.target.checked ? 'block' : 'none';
            
            // Uncheck other operations when times table is selected
            if (e.target.checked) {
                const otherOps = document.querySelectorAll('input[name="operations"]:not(#timesTableToggle)');
                otherOps.forEach(op => op.checked = false);
            }
        });

        // Uncheck times table when other operations are selected
        document.querySelectorAll('input[name="operations"]:not(#timesTableToggle)').forEach(op => {
            op.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.getElementById('timesTableToggle').checked = false;
                    document.getElementById('timesTableControls').style.display = 'none';
                }
            });
        });
    }

    loadSavedSettings() {
        try {
            const savedSettings = sessionStorage.getItem('zetamacSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.applySavedSettings(settings);
            }
        } catch (error) {
            console.log('No saved settings found or error loading settings');
        }
    }

    applySavedSettings(settings) {
        // Apply duration
        if (settings.duration) {
            const durationSelect = document.getElementById('duration');
            if (durationSelect) durationSelect.value = settings.duration;
        }

        // Apply operation settings
        if (settings.operations) {
            // Clear all checkboxes first
            document.querySelectorAll('input[name="operations"]').forEach(cb => cb.checked = false);
            
            if (settings.timesTable) {
                // Times table mode
                document.getElementById('timesTableToggle').checked = true;
                document.getElementById('timesTableControls').style.display = 'block';
                
                // Set times table number
                document.getElementById('timesTableNumber').value = settings.timesTable.number;
                
                // Set times table range
                document.querySelector('input[name="timesTableRange"]').value = settings.timesTable.range;
                
                // Set times table directions
                document.querySelectorAll('input[name="timesTableDirection"]').forEach(cb => cb.checked = false);
                settings.timesTable.directions.forEach(direction => {
                    const checkbox = document.querySelector(`input[name="timesTableDirection"][value="${direction}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            } else {
                // Regular operations mode
                settings.operations.forEach(op => {
                    const checkbox = document.querySelector(`input[name="operations"][value="${op.type}"]`);
                    if (checkbox) checkbox.checked = true;
                    
                    // Apply ranges for addition/multiplication
                    if (op.type === 'addition') {
                        document.querySelector('input[name="additionMin1"]').value = op.min1;
                        document.querySelector('input[name="additionMax1"]').value = op.max1;
                        document.querySelector('input[name="additionMin2"]').value = op.min2;
                        document.querySelector('input[name="additionMax2"]').value = op.max2;
                    } else if (op.type === 'multiplication') {
                        document.querySelector('input[name="multiplicationMin1"]').value = op.min1;
                        document.querySelector('input[name="multiplicationMax1"]').value = op.max1;
                        document.querySelector('input[name="multiplicationMin2"]').value = op.min2;
                        document.querySelector('input[name="multiplicationMax2"]').value = op.max2;
                    }
                });
            }
        }
    }

    saveSettings() {
        try {
            const settingsToSave = {
                duration: this.settings.duration,
                operations: this.settings.operations,
                timesTable: this.settings.timesTable
            };
            sessionStorage.setItem('zetamacSettings', JSON.stringify(settingsToSave));
        } catch (error) {
            console.log('Error saving settings:', error);
        }
    }

    startGame() {
        if (!this.validateSettings()) {
            alert('Please select at least one operation and ensure all settings are valid.');
            return;
        }

        this.collectSettings();
        this.saveSettings(); // Save settings when starting game
        this.setupGameUI();
        this.score = 0;
        this.timeLeft = this.settings.duration;
        this.gameActive = true;
        
        this.updateDisplay();
        this.generateNewProblem();
        this.startTimer();
        
        // Focus on answer input
        document.getElementById('answerInput').focus();
    }

    validateSettings() {
        const checkedOps = document.querySelectorAll('input[name="operations"]:checked');
        if (checkedOps.length === 0) return false;

        // If times table is selected, validate times table settings
        const timesTableChecked = document.getElementById('timesTableToggle').checked;
        if (timesTableChecked) {
            const directions = document.querySelectorAll('input[name="timesTableDirection"]:checked');
            if (directions.length === 0) {
                alert('Please select at least one direction for times table practice.');
                return false;
            }
        }

        return true;
    }

    collectSettings() {
        const formData = new FormData(document.getElementById('gameSetup'));
        
        this.settings = {
            duration: parseInt(formData.get('duration')),
            operations: []
        };

        // Check if times table mode is selected
        if (formData.get('operations') && formData.getAll('operations').includes('timesTable')) {
            this.settings.timesTable = {
                number: parseInt(formData.get('timesTableNumber')),
                range: parseInt(formData.get('timesTableRange')),
                directions: formData.getAll('timesTableDirection')
            };
            this.settings.operations = ['timesTable'];
        } else {
            // Regular operations
            const selectedOps = formData.getAll('operations').filter(op => op !== 'timesTable');
            
            selectedOps.forEach(op => {
                switch(op) {
                    case 'addition':
                        this.settings.operations.push({
                            type: 'addition',
                            min1: parseInt(formData.get('additionMin1')),
                            max1: parseInt(formData.get('additionMax1')),
                            min2: parseInt(formData.get('additionMin2')),
                            max2: parseInt(formData.get('additionMax2'))
                        });
                        break;
                    case 'subtraction':
                        this.settings.operations.push({
                            type: 'subtraction',
                            min1: parseInt(formData.get('additionMin1')),
                            max1: parseInt(formData.get('additionMax1')),
                            min2: parseInt(formData.get('additionMin2')),
                            max2: parseInt(formData.get('additionMax2'))
                        });
                        break;
                    case 'multiplication':
                        this.settings.operations.push({
                            type: 'multiplication',
                            min1: parseInt(formData.get('multiplicationMin1')),
                            max1: parseInt(formData.get('multiplicationMax1')),
                            min2: parseInt(formData.get('multiplicationMin2')),
                            max2: parseInt(formData.get('multiplicationMax2'))
                        });
                        break;
                    case 'division':
                        this.settings.operations.push({
                            type: 'division',
                            min1: parseInt(formData.get('multiplicationMin1')),
                            max1: parseInt(formData.get('multiplicationMax1')),
                            min2: parseInt(formData.get('multiplicationMin2')),
                            max2: parseInt(formData.get('multiplicationMax2'))
                        });
                        break;
                }
            });
        }
    }

    setupGameUI() {
        document.body.innerHTML = `
            <div class="container game-container">
                <div class="game-header">
                    <button class="exit-btn" id="exitBtn">← Exit to Menu</button>
                </div>
                
                <div class="game-stats">
                    <div class="stat">
                        <strong>Score: <span id="score">0</span></strong>
                    </div>
                    <div class="stat">
                        <strong>Seconds left: <span id="timeLeft">0</span></strong>
                    </div>
                </div>
                
                <div class="problem" id="problem">Loading...</div>
                
                <div>
                    <input type="number" id="answerInput" class="answer-input" placeholder="?" autofocus>
                </div>
                
                <div id="gameOver" class="game-over" style="display: none;">
                    <p>Time's up!</p>
                    <p>Final Score: <span id="finalScore">0</span></p>
                    <button class="try-again-btn" onclick="location.reload()">Try again</button>
                    <button class="change-settings-btn" onclick="location.reload()">Change settings</button>
                </div>
            </div>
        `;

        // Add exit button functionality
        document.getElementById('exitBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to exit? Your current game will end.')) {
                this.exitToMenu();
            }
        });

        // Add event listener for answer input - auto-advance on correct answer
        document.getElementById('answerInput').addEventListener('input', (e) => {
            // Check answer on every input change without visual feedback
            this.checkAnswerLive();
        });

        // Keep Enter key functionality as backup
        document.getElementById('answerInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswerLive();
            }
        });
    }

    generateNewProblem() {
        if (!this.gameActive) return;

        if (this.settings.operations.includes('timesTable')) {
            this.generateTimesTableProblem();
        } else {
            this.generateRegularProblem();
        }
    }

    generateTimesTableProblem() {
        const { number, range, directions } = this.settings.timesTable;
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const otherNumber = Math.floor(Math.random() * range) + 1;

        let problem, answer;

        switch (direction) {
            case 'forward':
                // e.g., 3 × 5
                problem = `${number} × ${otherNumber}`;
                answer = number * otherNumber;
                break;
            case 'reverse':
                // e.g., 5 × 3
                problem = `${otherNumber} × ${number}`;
                answer = otherNumber * number;
                break;
            case 'division':
                // e.g., 15 ÷ 3 or 15 ÷ 5
                const product = number * otherNumber;
                if (Math.random() < 0.5) {
                    problem = `${product} ÷ ${number}`;
                    answer = otherNumber;
                } else {
                    problem = `${product} ÷ ${otherNumber}`;
                    answer = number;
                }
                break;
        }

        this.currentProblem = { problem, answer };
        document.getElementById('problem').textContent = `${problem} =`;
    }

    generateRegularProblem() {
        const operation = this.settings.operations[Math.floor(Math.random() * this.settings.operations.length)];
        let problem, answer;

        switch (operation.type) {
            case 'addition':
                const a1 = Math.floor(Math.random() * (operation.max1 - operation.min1 + 1)) + operation.min1;
                const a2 = Math.floor(Math.random() * (operation.max2 - operation.min2 + 1)) + operation.min2;
                problem = `${a1} + ${a2}`;
                answer = a1 + a2;
                break;

            case 'subtraction':
                const s1 = Math.floor(Math.random() * (operation.max1 - operation.min1 + 1)) + operation.min1;
                const s2 = Math.floor(Math.random() * (operation.max2 - operation.min2 + 1)) + operation.min2;
                const larger = Math.max(s1, s2);
                const smaller = Math.min(s1, s2);
                problem = `${larger} - ${smaller}`;
                answer = larger - smaller;
                break;

            case 'multiplication':
                const m1 = Math.floor(Math.random() * (operation.max1 - operation.min1 + 1)) + operation.min1;
                const m2 = Math.floor(Math.random() * (operation.max2 - operation.min2 + 1)) + operation.min2;
                problem = `${m1} × ${m2}`;
                answer = m1 * m2;
                break;

            case 'division':
                const d1 = Math.floor(Math.random() * (operation.max1 - operation.min1 + 1)) + operation.min1;
                const d2 = Math.floor(Math.random() * (operation.max2 - operation.min2 + 1)) + operation.min2;
                const dividend = d1 * d2;
                problem = `${dividend} ÷ ${d1}`;
                answer = d2;
                break;
        }

        this.currentProblem = { problem, answer };
        document.getElementById('problem').textContent = `${problem} =`;
    }

    checkAnswerLive() {
        const userAnswer = parseInt(document.getElementById('answerInput').value);
        const input = document.getElementById('answerInput');

        if (isNaN(userAnswer) || !this.gameActive || !this.currentProblem) return;

        if (userAnswer === this.currentProblem.answer) {
            this.score++;
            
            // Auto-advance immediately without visual feedback
            setTimeout(() => {
                input.value = '';
                this.generateNewProblem();
                this.updateDisplay();
            }, 50); // Very quick transition
        }
        // No visual feedback for incorrect answers - just don't advance
    }

    // Helper method to check if partial input could still lead to correct answer
    couldBeCorrect(partialAnswer, correctAnswer) {
        const correctStr = correctAnswer.toString();
        const partialStr = partialAnswer.toString();
        
        // Check if the partial answer matches the beginning of the correct answer
        return correctStr.startsWith(partialStr);
    }

    // Keep the old method as backup (for Enter key)
    checkAnswer() {
        this.checkAnswerLive();
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('timeLeft').textContent = this.timeLeft;
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);
        
        document.getElementById('answerInput').disabled = true;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
    }

    exitToMenu() {
        this.gameActive = false;
        if (this.timer) {
            clearInterval(this.timer);
        }
        location.reload(); // Reload to return to main menu with saved settings
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ArithmeticGame();
});

document.addEventListener('DOMContentLoaded', function () {
    const cellGrid = document.querySelector('.cell-grid');
    const totalCountDisplay = document.getElementById('total-count-display');
    const progressBar = document.getElementById('progress-bar');
    const completionMessage = document.getElementById('completion-message');
    const resetButton = document.getElementById('reset-button');
    const copyButton = document.getElementById('copy-button');
    const themeToggle = document.getElementById('theme-toggle');
    const modalOverlay = document.getElementById('modal-overlay');
    const cancelButton = document.getElementById('cancel-button');
    const calculateButton = document.getElementById('calculate-button');
    const leukocyteInput = document.getElementById('leukocyte-input');
    const correctedResultDisplay = document.getElementById('corrected-result-display');
    const nrbcInfo = document.getElementById('nrbc-info');
    const calculationDetails = document.getElementById('calculation-details');

    const cellData = {
        '4': { name: 'Neutrófilo', count: 0, image: 'assets/Neutrofilo.png' },
        '5': { name: 'Linfócito', count: 0, image: 'assets/Linfocitos.png' },
        '6': { name: 'Monócito', count: 0, image: 'assets/Monocito.png' },
        '1': { name: 'Eosinófilo', count: 0, image: 'assets/Eosinofilo.png' },
        '3': { name: 'Basófilo', count: 0, image: 'assets/Basofilo.png' },
        '2': { name: 'Outras', count: 0, image: 'assets/Outras.png' },
        '0': { name: 'NRBC', count: 0, image: 'assets/Eritroblasto.png' } 
    };
    
    let clickSound;
    try {
        clickSound = new Audio('click.mp3'); 
        clickSound.volume = 0.5;
    } catch (e) {}
    
    const COUNT_GOAL = 100;
    let state = {
        totalCount: 0,
        isCounting: true,
    };

    function initialize() {
        copyButton.classList.add('hidden');
        modalOverlay.classList.add('hidden');
        renderButtons();
        addEventListeners();
        loadTheme();
        updateDisplay();
    }

    function renderButtons() {
        cellGrid.innerHTML = '';
        for (const key in cellData) {
            const cell = cellData[key];
            const buttonHTML = `
                <div class="cell-button" data-key="${key}">
                    <kbd>${key}</kbd>
                    <img src="${cell.image}" alt="${cell.name}">
                    <span class="cell-name">${cell.name}</span>
                    <span class="cell-count" id="count-${key}">${cell.count}</span>
                </div>
            `;
            cellGrid.innerHTML += buttonHTML;
        }
    }
    
    function handleCount(key) {
        if (!state.isCounting) {
            return;
        }
        
        if (!cellData[key]) return;

        cellData[key].count++;

        if (key !== '0') {
            state.totalCount++;
        }

        updateDisplay();
        showFeedback(key);

        if (state.totalCount >= COUNT_GOAL) {
            finalizeCount();
        }
    }
    
    function finalizeCount() {
        state.isCounting = false; 
        
        completionMessage.innerText = `Contagem de 100 leucócitos finalizada!`;
        copyButton.classList.remove('hidden');

        if (cellData['0'].count > 0) {
            openCorrectionModal();
        }
    }

    function resetCounter() {
        state.totalCount = 0;
        state.isCounting = true; 
        for (const key in cellData) {
            cellData[key].count = 0;
        }
        completionMessage.innerText = '';
        copyButton.classList.add('hidden');
        closeCorrectionModal();
        updateDisplay();
        progressBar.style.backgroundColor = 'var(--progress-bar-color)';
    }

    function openCorrectionModal() {
        const nrbcCount = cellData['0'].count;
        if (nrbcCount === 0) return;
        
        nrbcInfo.innerText = nrbcCount;
        calculationDetails.innerHTML = `Fórmula: (Leucócitos × 100) / (100 + ${nrbcCount})`;
        
        // Remove a classe 'hidden' para mostrar a janela.
        modalOverlay.classList.remove('hidden');
    }

    function closeCorrectionModal() {
        modalOverlay.classList.add('hidden');
        leukocyteInput.value = '';
        correctedResultDisplay.innerText = '';
        calculationDetails.innerText = '';
    }

    function calculateCorrectedLeukocytes() {
        const nrbcCount = cellData['0'].count;
        const uncorrectedLeukocytes = parseFloat(leukocyteInput.value);

        if (isNaN(uncorrectedLeukocytes) || uncorrectedLeukocytes <= 0) {
            correctedResultDisplay.innerText = "Por favor, insira um valor válido de leucócitos.";
            return;
        }

        const correctedValue = (uncorrectedLeukocytes * 100) / (100 + nrbcCount);
        const formattedResult = Math.round(correctedValue).toLocaleString('pt-BR');
        
        correctedResultDisplay.innerHTML = `Contagem Corrigida: <strong>${formattedResult} leucócitos</strong>`;
    }
    
    function updateDisplay() {
        totalCountDisplay.innerText = state.totalCount;
        progressBar.style.width = `${(state.totalCount / COUNT_GOAL) * 100}%`;
        for (const key in cellData) {
            document.getElementById(`count-${key}`).innerText = cellData[key].count;
        }
    }

    function showFeedback(key) {
        const button = document.querySelector(`.cell-button[data-key="${key}"]`);
        if (button) {
            button.classList.add('active');
            setTimeout(() => button.classList.remove('active'), 150);
        }
        if (clickSound && clickSound.HAVE_ENOUGH_DATA) {
            clickSound.currentTime = 0;
            clickSound.play();
        }
    }

    function copyResults() {
        let report = `Relatório de Contagem (${new Date().toLocaleString('pt-BR')}):\n`;
        report += `Total de Leucócitos Contados: ${state.totalCount}\n`;
        report += '--------------------------------------\n';
        for (const key in cellData) {
            if(key !== '0') {
                const cell = cellData[key];
                const percentage = state.totalCount > 0 ? ((cell.count / state.totalCount) * 100).toFixed(1) : 0;
                report += `${cell.name}: ${cell.count} (${percentage}%)\n`;
            }
        }
        report += '--------------------------------------\n';
        report += `NRBC (Eritroblastos) por 100 Leucócitos: ${cellData['0'].count}\n`;
        if (correctedResultDisplay.innerText && correctedResultDisplay.innerText.includes('Contagem Corrigida')) {
             report += `Leucócitos Corrigidos: ${correctedResultDisplay.innerText.split(': ')[1]}\n`;
        }
        navigator.clipboard.writeText(report).then(() => {
            copyButton.innerText = 'Copiado!';
            setTimeout(() => { copyButton.innerText = 'Copiar Resultados'; }, 2000);
        });
    }

    function addEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'r') {
                resetCounter();
            } else {
                handleCount(event.key);
            }
        });

        cellGrid.addEventListener('click', (event) => {
            const button = event.target.closest('.cell-button');
            if (button) {
                handleCount(button.dataset.key);
            }
        });

        resetButton.addEventListener('click', resetCounter);
        copyButton.addEventListener('click', copyResults);
        themeToggle.addEventListener('change', toggleTheme);
        
        cancelButton.addEventListener('click', closeCorrectionModal);
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeCorrectionModal();
            }
        });
        calculateButton.addEventListener('click', calculateCorrectedLeukocytes);
        leukocyteInput.addEventListener('keydown', (event) => {
            if(event.key === 'Enter') {
                calculateCorrectedLeukocytes();
            }
        });
    }

    function toggleTheme() {
        const isDark = themeToggle.checked;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            themeToggle.checked = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            themeToggle.checked = false;
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
    
    initialize();
});
const app = document.getElementById('app');
const closeBtn = document.getElementById('closeBtn');
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const amountInput = document.getElementById('amount');
const cashValue = document.getElementById('cashValue');
const bankValue = document.getElementById('bankValue');
const playerName = document.getElementById('playerName');
const playerId = document.getElementById('playerId');
const statusFeed = document.getElementById('statusFeed');
const noteText = document.getElementById('noteText');

const cardSection = document.getElementById('cardSection');
const cardPinInput = document.getElementById('cardPin');
const createCardBtn = document.getElementById('createCardBtn');

const pinModal = document.getElementById('pinModal');
const pinInput = document.getElementById('pinInput');
const pinSubmit = document.getElementById('pinSubmit');
const pinCancel = document.getElementById('pinCancel');

const localeTargets = {
    close: document.getElementById('closeBtn'),
    eyebrow: document.getElementById('eyebrowText'),
    headline: document.getElementById('headlineText'),
    subtext: document.getElementById('subtextText'),
    clientLabel: document.getElementById('clientLabel'),
    cashLabel: document.getElementById('cashLabel'),
    bankLabel: document.getElementById('bankLabel'),
    amountLabel: document.getElementById('amountLabel'),
    deposit: document.getElementById('depositBtn'),
    withdraw: document.getElementById('withdrawBtn'),
    note: document.getElementById('noteText'),
    activity: document.getElementById('activityLabel'),
    cardTitle: document.getElementById('cardTitle'),
    cardSubtext: document.getElementById('cardSubtext'),
    pinLabel: document.getElementById('pinLabel'),
    createCard: document.getElementById('createCardBtn'),
    pinTitle: document.getElementById('pinTitle'),
    pinPrompt: document.getElementById('pinPrompt'),
    pinSubmit: document.getElementById('pinSubmit')
};

let uiStrings = {};
let currentMode = 'bank';

const formatMoney = (value) => {
    const number = Number(value || 0);
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
};

const setBalances = (cash, bank) => {
    cashValue.textContent = formatMoney(cash);
    bankValue.textContent = formatMoney(bank);
};

const pushStatus = (message, type) => {
    const item = document.createElement('p');
    item.className = `status-item ${type || ''}`.trim();
    item.textContent = message;
    statusFeed.prepend(item);
    const items = statusFeed.querySelectorAll('.status-item');
    if (items.length > 4) {
        items[items.length - 1].remove();
    }
};

const applyLocale = (ui = {}) => {
    uiStrings = ui;
    Object.entries(localeTargets).forEach(([key, element]) => {
        if (ui[key] && element) {
            element.textContent = ui[key];
        }
    });
    if (ui.amountPlaceholder) {
        amountInput.placeholder = ui.amountPlaceholder;
    }
    if (ui.pinPlaceholder) {
        cardPinInput.placeholder = ui.pinPlaceholder;
        pinInput.placeholder = ui.pinPlaceholder;
    }
};

const t = (key, fallback) => uiStrings[key] || fallback;

const setMode = (mode) => {
    currentMode = mode || 'bank';
    const isAtm = currentMode === 'atm';
    cardSection.style.display = isAtm ? 'none' : 'grid';

    depositBtn.disabled = isAtm;
    withdrawBtn.disabled = isAtm;
    depositBtn.classList.toggle('disabled', isAtm);
    withdrawBtn.classList.toggle('disabled', isAtm);

    if (isAtm) {
        noteText.textContent = t('atmNote', 'ATM mode: enter your PIN to continue.');
        pinModal.classList.add('show');
        pinModal.setAttribute('aria-hidden', 'false');
        pinInput.value = '';
        setTimeout(() => pinInput.focus(), 120);
    } else {
        noteText.textContent = t('note', 'Transactions update instantly with an encrypted handoff.');
        pinModal.classList.remove('show');
        pinModal.setAttribute('aria-hidden', 'true');
    }
};

const unlockAtm = () => {
    depositBtn.disabled = false;
    withdrawBtn.disabled = false;
    depositBtn.classList.remove('disabled');
    withdrawBtn.classList.remove('disabled');
    pinModal.classList.remove('show');
    pinModal.setAttribute('aria-hidden', 'true');
    pinInput.value = '';
    pushStatus(t('pinSuccess', 'PIN accepted.'), 'success');
};

const closeApp = () => {
    if (typeof GetParentResourceName === 'function') {
        fetch(`https://${GetParentResourceName()}/close`, { method: 'POST' });
    }
    app.classList.remove('show');
    app.setAttribute('aria-hidden', 'true');
    pinModal.classList.remove('show');
    pinModal.setAttribute('aria-hidden', 'true');
};

const handleTransaction = async (type) => {
    if (currentMode === 'atm' && (depositBtn.disabled || withdrawBtn.disabled)) {
        pushStatus(t('pinPrompt', 'Enter your PIN to unlock ATM access.'), 'error');
        return;
    }

    const amount = Number(amountInput.value);
    if (!amount || amount <= 0) {
        pushStatus(t('invalidAmount', 'Enter a valid amount.'), 'error');
        return;
    }

    if (typeof GetParentResourceName !== 'function') {
        const currentCash = Number(cashValue.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        const currentBank = Number(bankValue.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        const nextCash = type === 'deposit' ? currentCash - amount : currentCash + amount;
        const nextBank = type === 'deposit' ? currentBank + amount : currentBank - amount;
        setBalances(nextCash, nextBank);
        amountInput.value = '';
        pushStatus(t('previewUpdate', 'Preview mode update.'), 'success');
        return;
    }

    const response = await fetch(`https://${GetParentResourceName()}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ amount })
    });

    const result = await response.json();
    if (result.success) {
        setBalances(result.cash, result.bank);
        amountInput.value = '';
        pushStatus(result.message || t('success', 'Success.'), 'success');
    } else {
        pushStatus(result.message || t('failed', 'Transaction failed.'), 'error');
    }
};

const createCard = async () => {
    const pin = Number(cardPinInput.value);
    if (!pin || pin < 1000 || pin > 9999) {
        pushStatus(t('invalidAmount', 'Enter a valid amount.'), 'error');
        return;
    }

    if (typeof GetParentResourceName !== 'function') {
        pushStatus(t('pinSuccess', 'PIN accepted.'), 'success');
        cardPinInput.value = '';
        return;
    }

    const response = await fetch(`https://${GetParentResourceName()}/orderCard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ pin })
    });

    const result = await response.json();
    if (result.success) {
        cardPinInput.value = '';
        pushStatus(result.message || t('success', 'Success.'), 'success');
    } else {
        pushStatus(result.message || t('failed', 'Transaction failed.'), 'error');
    }
};

const verifyPin = async () => {
    const pin = Number(pinInput.value);
    if (!pin || pin < 1000 || pin > 9999) {
        pushStatus(t('invalidAmount', 'Enter a valid amount.'), 'error');
        return;
    }

    if (typeof GetParentResourceName !== 'function') {
        unlockAtm();
        return;
    }

    const response = await fetch(`https://${GetParentResourceName()}/verifyPin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ pin })
    });

    const result = await response.json();
    if (result.success) {
        unlockAtm();
    } else {
        pushStatus(result.message || t('failed', 'Transaction failed.'), 'error');
    }
};

window.addEventListener('message', (event) => {
    const { action, data, locale, mode } = event.data;
    if (action === 'open') {
        if (locale) {
            applyLocale(locale);
        }
        setMode(mode);
        playerName.textContent = data.name || 'Player';
        playerId.textContent = data.citizenid || '--';
        setBalances(data.cash, data.bank);
        statusFeed.innerHTML = `<p class="status-item">${t('awaiting', 'Awaiting action...')}</p>`;
        app.classList.add('show');
        app.setAttribute('aria-hidden', 'false');
        amountInput.focus();
    }
});

closeBtn.addEventListener('click', closeApp);

depositBtn.addEventListener('click', () => handleTransaction('deposit'));
withdrawBtn.addEventListener('click', () => handleTransaction('withdraw'));

createCardBtn.addEventListener('click', createCard);

pinSubmit.addEventListener('click', verifyPin);
pinCancel.addEventListener('click', closeApp);

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeApp();
    }
    if (event.key === 'Enter' && pinModal.classList.contains('show')) {
        verifyPin();
    }
});

if (typeof GetParentResourceName !== 'function') {
    applyLocale({});
    setMode('bank');
    playerName.textContent = 'Preview User';
    playerId.textContent = 'LOCAL-PREVIEW';
    setBalances(2450, 18250);
    statusFeed.innerHTML = `<p class="status-item">${t('preview', 'Preview mode loaded.')}</p>`;
    app.classList.add('show');
    app.setAttribute('aria-hidden', 'false');
}

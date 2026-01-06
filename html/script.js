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

const closeApp = () => {
    if (typeof GetParentResourceName === 'function') {
        fetch(`https://${GetParentResourceName()}/close`, { method: 'POST' });
    }
    app.classList.remove('show');
    app.setAttribute('aria-hidden', 'true');
};

const handleTransaction = async (type) => {
    const amount = Number(amountInput.value);
    if (!amount || amount <= 0) {
        pushStatus('Enter a valid amount.', 'error');
        return;
    }

    if (typeof GetParentResourceName !== 'function') {
        const currentCash = Number(cashValue.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        const currentBank = Number(bankValue.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        const nextCash = type === 'deposit' ? currentCash - amount : currentCash + amount;
        const nextBank = type === 'deposit' ? currentBank + amount : currentBank - amount;
        setBalances(nextCash, nextBank);
        amountInput.value = '';
        pushStatus('Preview mode update.', 'success');
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
        pushStatus(result.message || 'Success.', 'success');
    } else {
        pushStatus(result.message || 'Transaction failed.', 'error');
    }
};

window.addEventListener('message', (event) => {
    const { action, data } = event.data;
    if (action === 'open') {
        playerName.textContent = data.name || 'Player';
        playerId.textContent = data.citizenid || '--';
        setBalances(data.cash, data.bank);
        statusFeed.innerHTML = '<p class="status-item">Awaiting action...</p>';
        app.classList.add('show');
        app.setAttribute('aria-hidden', 'false');
        amountInput.focus();
    }
});

closeBtn.addEventListener('click', closeApp);

depositBtn.addEventListener('click', () => handleTransaction('deposit'));
withdrawBtn.addEventListener('click', () => handleTransaction('withdraw'));

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeApp();
    }
});

if (typeof GetParentResourceName !== 'function') {
    playerName.textContent = 'Preview User';
    playerId.textContent = 'LOCAL-PREVIEW';
    setBalances(2450, 18250);
    statusFeed.innerHTML = '<p class="status-item">Preview mode loaded.</p>';
    app.classList.add('show');
    app.setAttribute('aria-hidden', 'false');
}

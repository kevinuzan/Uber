let currentUser = JSON.parse(localStorage.getItem('user')) || null;
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('filter-period').value = currentMonth;
    
    if (currentUser) showApp();
});

function handleCredentialResponse(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    currentUser = { id: payload.sub, name: payload.name };
    localStorage.setItem('user', JSON.stringify(currentUser));
    showApp();
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('user-name').textContent = currentUser.name;
    loadData();
}

function logout() {
    localStorage.removeItem('user');
    location.reload();
}

async function loadData() {
    const period = document.getElementById('filter-period').value;
    const [year, month] = period.split('-');
    
    const res = await fetch(`${API_URL}/api/transactions?userId=${currentUser.id}&month=${month}&year=${year}`);
    const data = await res.json();
    render(data);
}

function render(transactions) {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';
    
    let saldo = 0;
    let rec = 0;
    let desp = 0;

    transactions.forEach(t => {
        const val = parseFloat(t.value);
        if (t.type === 'RECEITA') { saldo += val; rec += val; }
        else { saldo -= val; desp += val; }

        const row = `
            <tr class="border-b">
                <td class="p-4 text-sm">${new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td class="p-4 text-sm font-medium">${t.description}</td>
                <td class="p-4 text-sm ${t.type === 'RECEITA' ? 'text-green-600' : 'text-red-600'}">
                    R$ ${val.toFixed(2)}
                </td>
                <td class="p-4 text-sm text-right font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}">
                    R$ ${saldo.toFixed(2)}
                </td>
            </tr>
        `;
        list.innerHTML += row;
    });

    document.getElementById('total-receitas').textContent = `R$ ${rec.toFixed(2)}`;
    document.getElementById('total-despesas').textContent = `R$ ${desp.toFixed(2)}`;
    document.getElementById('total-lucro').textContent = `R$ ${(rec - desp).toFixed(2)}`;
}

document.getElementById('transaction-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
        userId: currentUser.id,
        description: document.getElementById('desc').value,
        value: document.getElementById('val').value,
        type: document.getElementById('type').value,
        date: document.getElementById('date').value
    };

    await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    e.target.reset();
    loadData();
};

document.getElementById('filter-period').onchange = loadData;
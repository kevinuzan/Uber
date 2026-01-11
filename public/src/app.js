// Função Global para o Google
window.handleCredentialResponse = (response) => {
    try {
        const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        localStorage.setItem('driver_user', JSON.stringify({ id: payload.sub, name: payload.name }));
        location.reload(); // Recarrega para iniciar o app
    } catch (e) {
        console.error("Erro ao decodificar login:", e);
    }
};

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
let currentUser = JSON.parse(localStorage.getItem('driver_user'));

document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        document.getElementById('user-name').textContent = currentUser.name.split(' ')[0];

        // Configurar data atual no filtro e no campo de data
        const filter = document.getElementById('filter-period');
        const d = new Date();
        filter.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        document.getElementById('date').valueAsDate = new Date();

        loadData();

        // Eventos
        filter.addEventListener('change', loadData);
        document.getElementById('transaction-form').addEventListener('submit', saveData);
    }
});

async function loadData() {
    const [year, month] = document.getElementById('filter-period').value.split('-');
    const res = await fetch(`${API_URL}/api/transactions?userId=${currentUser.id}&month=${month}&year=${year}`);
    const data = await res.json();
    render(data);
}

function render(transactions) {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';
    let saldo = 0, rec = 0, desp = 0;

    transactions.forEach(t => {
        const v = parseFloat(t.value);
        t.type === 'RECEITA' ? (saldo += v, rec += v) : (saldo -= v, desp += v);
        const date = new Date(t.date);
        const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(date);
        list.innerHTML += `
            <tr class="border-b">
                <td class="p-4 text-sm text-gray-500">${formattedDate}</td>
                <td class="p-4 text-sm font-bold text-gray-700">${t.description}</td>
                <td class="p-4 text-sm font-bold ${t.type === 'RECEITA' ? 'text-green-600' : 'text-red-600'} text-right">
                    R$ ${v.toFixed(2)}
                </td>
                <td class="p-4 text-sm text-right font-black ${saldo >= 0 ? 'text-blue-600' : 'text-orange-500'}">
                    R$ ${saldo.toFixed(2)}
                </td>
            </tr>
        `;
    });

    document.getElementById('total-receitas').textContent = `R$ ${rec.toFixed(2)}`;
    document.getElementById('total-despesas').textContent = `R$ ${desp.toFixed(2)}`;
    document.getElementById('total-lucro').textContent = `R$ ${(rec - desp).toFixed(2)}`;
}

async function saveData(e) {
    e.preventDefault();
    const payload = {
        userId: currentUser.id,
        description: document.getElementById('desc').value,
        value: document.getElementById('val').value,
        type: document.getElementById('type').value,
        date: document.getElementById('date').value
    };

    await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    e.target.reset();
    document.getElementById('date').valueAsDate = new Date();
    loadData();
}

function logout() {
    localStorage.removeItem('driver_user');
    location.reload();
}
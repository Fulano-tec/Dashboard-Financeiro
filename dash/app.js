let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

let chart = null;
let categoryChart = null;
let stackedBarChart = null;
let lineChart = null;

let editingTransactionId = null;

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function formatCurrency(value) {
    return `R$ ${value.toFixed(2)}`;
}

function getCategoryLabel(category) {

    const labels = {
        alimentacao: "Alimentação",
        transporte: "Transporte",
        lazer: "Lazer",
        outros: "Outros"
    };

    return labels[category] || category;
}

function setSubmitButtonLabel(label) {

    const button = document.getElementById("submitBtn");

    if (!button) return;

    button.innerText = label;
}

function resetForm() {

    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("categoria").selectedIndex = 0;
    document.getElementById("tipo").selectedIndex = 0;
}

function getSelectedFilter() {

    const filterElement = document.getElementById("filter");

    return filterElement ? filterElement.value : "all";
}

function getFilteredTransactions() {

    const filter = getSelectedFilter();

    const monthFilter =
        document.getElementById("monthFilter").value;

    return transactions.filter(transaction => {

        const matchesType =
            filter === "all" ||
            transaction.type === filter;

        const transactionMonth =
            new Date(transaction.date).getMonth();

        const matchesMonth =
            monthFilter === "all" ||
            transactionMonth == monthFilter;

        return matchesType && matchesMonth;
    });
}

function refreshUI() {

    renderTransactions();

    updateBalance();

    updateChart();

    updateLineChart();

    updateStackedChart();

    updateCategoryChart();

    updateMonthlySummary();

    updateLastUpdate();
}

function exportCSV() {

    if (transactions.length === 0) {
        alert("Nenhuma transação para exportar");
        return;
    }

    let csv = "Descrição,Valor,Tipo,Categoria,Data\n";

    transactions.forEach(t => {

        csv +=
`${t.description},${t.amount},${t.type},${t.category},${t.date}\n`;

    });

    const blob =
        new Blob([csv], { type: "text/csv" });

    const url =
        window.URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download = "transacoes.csv";

    a.click();

    window.URL.revokeObjectURL(url);
}

function addTransaction() {

    const description =
        document.getElementById("descricao")
        .value
        .trim();

    const amount =
        parseFloat(
            document.getElementById("valor").value
        );

    const type =
        document.getElementById("tipo").value;

    let category =
        document.getElementById("categoria")
        .value
        .trim()
        .toLowerCase();

    const validCategories = [
        "alimentacao",
        "transporte",
        "lazer"
    ];

    if (!validCategories.includes(category)) {
        category = "outros";
    }

    if (!description || Number.isNaN(amount)) {

        alert("Preencha todos os campos");

        return;
    }

    if (amount <= 0) {

        alert("Digite um valor válido");

        return;
    }

    const now = new Date().toISOString();

    if (editingTransactionId !== null) {

        const index =
            transactions.findIndex(
                t => t.id === editingTransactionId
            );

        if (index !== -1) {

            transactions[index] = {
                ...transactions[index],
                description,
                amount,
                type,
                category,
                date: now
            };
        }

        editingTransactionId = null;

        setSubmitButtonLabel("Adicionar");

    } else {

        const transaction = {
            id: Date.now(),
            description,
            amount,
            type,
            category,
            date: now
        };

        transactions.push(transaction);
    }

    saveTransactions();

    resetForm();

    refreshUI();
}

function editTransaction(id) {

    const transaction =
        transactions.find(t => t.id === id);

    if (!transaction) return;

    document.getElementById("descricao").value =
        transaction.description;

    document.getElementById("valor").value =
        transaction.amount;

    document.getElementById("tipo").value =
        transaction.type;

    document.getElementById("categoria").value =
        transaction.category;

    editingTransactionId = id;

    setSubmitButtonLabel("Atualizar");
}

function removeTransaction(id) {

    transactions =
        transactions.filter(
            transaction => transaction.id !== id
        );

    if (editingTransactionId === id) {

        editingTransactionId = null;

        setSubmitButtonLabel("Adicionar");

        resetForm();
    }

    saveTransactions();

    refreshUI();
}

function renderTransactions() {

    const transactionList =
        document.getElementById("lista-transacoes");

    const filteredTransactions =
        getFilteredTransactions();

    const transactionCount =
        document.getElementById("transactionCount");

    if (!transactionList) return;

    transactionList.innerHTML = "";

    if (transactionCount) {

        transactionCount.innerText =
            transactions.length;
    }

    if (transactions.length === 0) {

        transactionList.innerHTML = `
            <li style="text-align:center; color:#94a3b8;">
                Nenhuma transação registrada ainda
            </li>
        `;

        return;
    }

    if (filteredTransactions.length === 0) {

        transactionList.innerHTML = `
            <li style="text-align:center; color:#94a3b8;">
                Nenhuma transação encontrada para este filtro
            </li>
        `;

        return;
    }

    filteredTransactions.forEach(transaction => {

        const li = document.createElement("li");

        const transactionDate =
            new Date(transaction.date);

        const isRecent =
            Date.now() - transactionDate.getTime()
            <= 60000;

        li.classList.add("new-item");

        li.classList.add(
            transaction.type === "income"
                ? "income"
                : "expense"
        );

        if (isRecent) {
            li.classList.add("recent");
        }

        li.innerHTML = `
            <strong>
                ${transaction.type === "income" ? "⬆️" : "⬇️"}
                ${transaction.description}
            </strong><br>

            ${formatCurrency(transaction.amount)} |

            <span class="category ${transaction.category}">
                ${getCategoryLabel(transaction.category)}
            </span><br>

            <small>
                ${transactionDate.toLocaleString("pt-BR")}
            </small><br>

            <button onclick="editTransaction(${transaction.id})">
                Editar
            </button>

            <button onclick="removeTransaction(${transaction.id})">
                Remover
            </button>
        `;

        transactionList.appendChild(li);
    });
}

function updateBalance() {

    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expense += transaction.amount;
        }
    });

    const total = income - expense;

    const incomeElement =
        document.getElementById("income");

    const expenseElement =
        document.getElementById("expense");

    const saldoElement =
        document.getElementById("saldo");

    if (incomeElement) {
        incomeElement.innerText =
            formatCurrency(income);
    }

    if (expenseElement) {
        expenseElement.innerText =
            formatCurrency(expense);
    }

    if (saldoElement) {

        saldoElement.innerText =
            formatCurrency(total);

        if (total > 0) {

            saldoElement.style.color =
                "#22c55e";

        } else if (total < 0) {

            saldoElement.style.color =
                "#ef4444";

        } else {

            saldoElement.style.color =
                "#38bdf8";
        }
    }
}

function updateChart() {

    const canvas =
        document.getElementById("chart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expense += transaction.amount;
        }
    });

    const ctx = canvas.getContext("2d");

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "doughnut",

        data: {
            labels: ["Receitas", "Despesas"],

            datasets: [{
                data: [income, expense],

                backgroundColor: [
                    "#22c55e",
                    "#ef4444"
                ],

                borderColor: [
                    "#0f172a",
                    "#0f172a"
                ],

                borderWidth: 2
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: {
                        color: "#e2e8f0"
                    }
                }
            }
        }
    });
}

function updateLineChart() {

    const lineCanvas =
        document.getElementById("lineChart");

    if (!lineCanvas) return;

    let sorted =
        [...transactions].sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

    let balance = 0;

    let history = [];

    sorted.forEach(t => {

        balance +=
            t.type === "income"
                ? t.amount
                : -t.amount;

        history.push({
            date: t.date,
            balance: balance
        });
    });

    const ctx =
        lineCanvas.getContext("2d");

    if (lineChart) {
        lineChart.destroy();
    }

    lineChart = new Chart(ctx, {

        type: "line",

        data: {

            labels:
                history.map(
                    h =>
                        new Date(h.date)
                        .toLocaleDateString()
                ),

            datasets: [{
                label: "Saldo acumulado",

                data:
                    history.map(h => h.balance),

                borderColor: "#38bdf8",

                fill: false,

                tension: 0.3
            }]
        },

        options: {
            responsive: true
        }
    });
}

function updateStackedChart() {

    const canvas =
        document.getElementById("stackedBarChart");

    if (!canvas) return;

    let incomeByMonth =
        new Array(12).fill(0);

    let expenseByMonth =
        new Array(12).fill(0);

    transactions.forEach(t => {

        const month =
            new Date(t.date).getMonth();

        if (t.type === "income") {

            incomeByMonth[month] += t.amount;

        } else {

            expenseByMonth[month] += t.amount;
        }
    });

    const ctx =
        canvas.getContext("2d");

    if (stackedBarChart) {
        stackedBarChart.destroy();
    }

    stackedBarChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: [
                "Jan","Fev","Mar","Abr",
                "Mai","Jun","Jul","Ago",
                "Set","Out","Nov","Dez"
            ],

            datasets: [
                {
                    label: "Receitas",

                    data: incomeByMonth,

                    backgroundColor: "#22c55e"
                },

                {
                    label: "Despesas",

                    data: expenseByMonth,

                    backgroundColor: "#ef4444"
                }
            ]
        },

        options: {
            responsive: true,

            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });
}

function updateCategoryChart() {

    const categoryCanvas =
        document.getElementById("categoryChart");

    if (!categoryCanvas) return;

    let alimentacao = 0;
    let transporte = 0;
    let lazer = 0;
    let outros = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "expense") {

            if (transaction.category === "alimentacao") {

                alimentacao += transaction.amount;

            } else if (
                transaction.category === "transporte"
            ) {

                transporte += transaction.amount;

            } else if (
                transaction.category === "lazer"
            ) {

                lazer += transaction.amount;

            } else {

                outros += transaction.amount;
            }
        }
    });

    const ctx =
        categoryCanvas.getContext("2d");

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {

        type: "pie",

        data: {

            labels: [
                "Alimentação",
                "Transporte",
                "Lazer",
                "Outros"
            ],

            datasets: [{
                data: [
                    alimentacao,
                    transporte,
                    lazer,
                    outros
                ],

                backgroundColor: [
                    "#22c55e",
                    "#38bdf8",
                    "#a855f7",
                    "#f59e0b"
                ]
            }]
        },

        options: {

            responsive: true,

            plugins: {
                legend: {
                    labels: {
                        color: "#e2e8f0"
                    }
                }
            }
        }
    });
}

function updateMonthlySummary() {

    const currentMonth =
        new Date().getMonth();

    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {

        const transactionMonth =
            new Date(transaction.date).getMonth();

        if (transactionMonth === currentMonth) {

            if (transaction.type === "income") {

                income += transaction.amount;

            } else {

                expense += transaction.amount;
            }
        }
    });

    const balance = income - expense;

    document.getElementById("monthlyIncome")
        .innerText =
        `R$ ${income.toFixed(2)}`;

    document.getElementById("monthlyExpense")
        .innerText =
        `R$ ${expense.toFixed(2)}`;

    document.getElementById("monthlyBalance")
        .innerText =
        `R$ ${balance.toFixed(2)}`;
}

function updateLastUpdate() {

    const lastUpdateElement =
        document.getElementById("lastUpdate");

    if (!lastUpdateElement) return;

    lastUpdateElement.innerText =
        `Última atualização: ${
            new Date().toLocaleString("pt-BR")
        }`;
}

function resetDashboard() {

    const confirmReset =
        confirm(
            "Deseja realmente apagar todas as transações?"
        );

    if (!confirmReset) return;

    transactions = [];

    editingTransactionId = null;

    localStorage.removeItem("transactions");

    setSubmitButtonLabel("Adicionar");

    resetForm();

    refreshUI();
}

function initApp() {

    refreshUI();
}

initApp();
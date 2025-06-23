function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

function postContract() {
  const contractData = {
    serial: document.getElementById('serial').value,
    name: document.getElementById('name').value,
    value: document.getElementById('value').value,
    status: document.getElementById('status').value,
    type: document.getElementById('type').value,
    expiry_date: document.getElementById('expiry_date').value,
  };

  fetch('/contracts/add/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')  // Optional if @csrf_exempt is used
    },
    body: JSON.stringify(contractData)
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message || '✅ Contract added successfully!');
    document.querySelector('form').reset(); // Optional: reset form
  })
  .catch(error => {
    console.error('Error:', error);
    alert('❌ Failed to add contract.');
  });
}


function loadRecentContracts() {
  fetch('/contracts/get/')  // Adjust URL if different
    .then(response => response.json())
    .then(data => {
      const tableBody = document.getElementById('contract-table-body');
      tableBody.innerHTML = ''; // Clear old rows

      data.forEach(contract => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${contract.serial}</td>
          <td>${contract.name}</td>
          <td>${contract.value}</td>
          <td>${contract.status}</td>
        `;
        tableBody.appendChild(row); // Adds in top-down order
      });
    })
    .catch(error => {
      console.error('Error loading contracts:', error);
      alert('Failed to load contract data.');
    });
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadRecentContracts);


// GET contract list
fetch('/contracts/')
  .then(res => res.json())
  .then(data => {
    let accepted = 0, inContract = 0, inApproval = 0;
    const tbody = document.getElementById('contract-table-body');

    data.forEach(c => {
      if (c.status === 'Accepted') accepted++;
      if (c.status === 'In Contract') inContract++;
      if (c.status === 'In Approval') inApproval++;

      tbody.innerHTML += `
        <tr>
          <td>${c.serial}</td>
          <td>${c.name}</td>
          <td>$${c.value}</td>
          <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
        </tr>`;
    });

    document.getElementById('accepted-count').textContent = accepted;
    document.getElementById('in-contract-count').textContent = inContract;
    document.getElementById('in-approval-count').textContent = inApproval;
  });

// GET cycle times
fetch('/cycle-times/')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('cycle-time-container');
    data.forEach(item => {
      container.innerHTML += `<div><strong>${item.contract_type}:</strong> ${item.average_days} days</div>`;
    });
  });

// GET chart data
function loadBarChart() {
  fetch('/contracts/stage-data/')
    .then(res => res.json())
    .then(data => {
      const labels = Object.keys(data);
      const values = Object.values(data);

      const colors = labels.map(label => {
        switch (label) {
          case 'Active': return '#2ecc71';     // Green
          case 'Draft': return '#f1c40f';      // Yellow
          case 'Cancel': return '#e74c3c';     // Red
          case 'Expired': return '#9b59b6';    // Purple
          default: return '#95a5a6';           // Gray
        }
      });

      const ctx = document.getElementById('barChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Contracts by Stage',
            data: values,
            backgroundColor: colors,
            borderRadius: 5
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Contracts by Stage (Including Expired)'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    })
    .catch(err => console.error('Error loading chart:', err));
}

document.addEventListener('DOMContentLoaded', loadBarChart);



function loadExpiryPieChart() {
  fetch('/contracts/expiry-summary/')
    .then(res => res.json())
    .then(data => {
      const labels = Object.keys(data);
      const values = Object.values(data);

      const ctx = document.getElementById('expiryPieChart').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: [
              '#c0392b',  // Expired - dark red
              '#f39c12',  // ≤15 Days - orange
              '#e67e22',  // 15–30 Days - amber
              '#27ae60'   // >30 Days - green
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Contract Expiring (Time Ranges)'
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    })
    .catch(err => console.error('Error loading expiry pie chart:', err));
}

document.addEventListener('DOMContentLoaded', loadExpiryPieChart);


function loadTypeChart() {
  fetch('/contracts/type-percentage/')
    .then(res => res.json())
    .then(data => {
      const labels = Object.keys(data);
      const values = Object.values(data);

      const colors = labels.map(label => {
        switch (label) {
          case 'NDA': return '#1abc9c';
          case 'Insurance': return '#3498db';
          case 'Lease': return '#9b59b6';
          case 'Maintenance': return '#f39c12';
          case 'Purchase Agreement': return '#e74c3c';
          case 'Sale': return '#2ecc71';
          default: return '#bdc3c7';
        }
      });

      const ctx = document.getElementById('typeChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Contract Type (%)',
            data: values,
            backgroundColor: colors,
            borderRadius: 5
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.label}: ${ctx.raw}%`
              }
            },
            title: {
              display: true,
              text: 'Contract Distribution by Type'
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: value => value + '%'
              }
            }
          }
        }
      });
    })
    .catch(err => console.error('Error loading type chart:', err));
}

document.addEventListener('DOMContentLoaded', loadTypeChart);

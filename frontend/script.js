// Fetch fighters from backend (or JSON fallback for GitHub Pages)
async function fetchFighters() {
  try {
    const response = await fetch('http://localhost:5000/api/fighters');
    if (!response.ok) throw new Error('API fetch failed');
    const fighters = await response.json();
    renderFighters(fighters);
    renderWinRatioChart(fighters);
  } catch (error) {
    console.error('Error:', error);
    // Fallback to static JSON
    const response = await fetch('data/fighters.json');
    const fighters = await response.json();
    renderFighters(fighters);
    renderWinRatioChart(fighters);
  }
}

// Render fighter cards
function renderFighters(fighters) {
  const container = document.getElementById('fighters');
  container.innerHTML = fighters.map(fighter => `
    <div class="fighter-card">
      <h3>${fighter.name}</h3>
      <p>Record: ${fighter.wins}-${fighter.losses} | Height: ${fighter.height || 'N/A'} | Accuracy: ${(fighter.strikeAccuracy * 100).toFixed(0)}%</p>
      <button onclick="predictFight(${fighter.id})">Predict Fight</button>
    </div>
  `).join('');
}

// Win ratio chart
function renderWinRatioChart(fighters) {
  const ctx = document.getElementById('winRatioChart')?.getContext('2d');
  if (!ctx) return;

  const labels = fighters.slice(0, 5).map(f => f.name);
  const data = fighters.slice(0, 5).map(f => f.wins / (f.wins + f.losses || 1));

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Win Ratio',
        data,
        backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        borderColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        borderWidth: 1
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 1 } },
      responsive: true
    }
  });
}

// Fight predictor
async function predictFight(fighterId) {
  try {
    const fighter = await fetch(`http://localhost:5000/api/fighter/${fighterId}`).then(r => r.json());
    const opponentId = prompt('Enter opponent ID (e.g., 2):');
    const opponent = await fetch(`http://localhost:5000/api/fighter/${opponentId}`).then(r => r.json());
    
    const fighterWinProb = (fighter.wins / (fighter.wins + fighter.losses) + fighter.strikeAccuracy) / 2;
    const opponentWinProb = (opponent.wins / (opponent.wins + opponent.losses) + opponent.strikeAccuracy) / 2;
    
    alert(`${fighter.name} win prob: ${(fighterWinProb * 100).toFixed(0)}% vs ${opponent.name}: ${(opponentWinProb * 100).toFixed(0)}%`);
  } catch (error) {
    alert('Error predicting fight. Try again.');
  }
}

// Newsletter form submission
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.querySelector('input').value;
  if (/^\S+@\S+\.\S+$/.test(email)) {
    try {
      await fetch('http://localhost:5000/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      alert('Subscribed!');
    } catch (error) {
      alert('Subscription failed. Try again.');
    }
  } else {
    alert('Invalid email');
  }
});

// Init
document.addEventListener('DOMContentLoaded', fetchFighters);

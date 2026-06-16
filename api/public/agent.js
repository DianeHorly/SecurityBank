const headersAgent = {
  'x-user-email': 'agent1@bank.local',
  'Content-Type': 'application/json',
};

const btnCharger = document.getElementById('btnCharger');
const btnApprove = document.getElementById('btnApprove');
const btnReject = document.getElementById('btnReject');

const messageBox = document.getElementById('message');
const resultatBox = document.getElementById('resultat');

function afficherMessage(message, type = 'info') {
  messageBox.className = `message ${type}`;
  messageBox.textContent = message;
}

function afficherResultat(data) {
  resultatBox.textContent = JSON.stringify(data, null, 2);
}

btnCharger.addEventListener('click', async () => {
  try {
    afficherMessage('Chargement des transactions en attente...', 'info');

    const response = await fetch('/api/agent/transactions/pending', {
      headers: headersAgent,
    });

    const data = await response.json();

    if (!response.ok) {
      afficherMessage(data.message || 'Erreur lors du chargement.', 'error');
      afficherResultat(data);
      return;
    }

    afficherMessage(data.message, 'success');
    afficherResultat(data);
  } catch (erreur) {
    afficherMessage(
      'Une erreur réseau est survenue lors du chargement des transactions.',
      'error'
    );
    afficherResultat({ erreur: erreur.message });
  }
});

btnApprove.addEventListener('click', async () => {
  try {
    const id = document.getElementById('approveId').value.trim();

    if (!id) {
      afficherMessage('Veuillez saisir l’ID de la transaction à approuver.', 'error');
      return;
    }

    afficherMessage('Approbation de la transaction en cours...', 'info');

    const response = await fetch(`/api/agent/transactions/${id}/approve`, {
      method: 'PATCH',
      headers: headersAgent,
    });

    const data = await response.json();

    if (!response.ok) {
      afficherMessage(data.message || 'Erreur lors de l’approbation.', 'error');
      afficherResultat(data);
      return;
    }

    afficherMessage(data.message, 'success');
    afficherResultat(data);
  } catch (erreur) {
    afficherMessage(
      'Une erreur réseau est survenue lors de l’approbation.',
      'error'
    );
    afficherResultat({ erreur: erreur.message });
  }
});

btnReject.addEventListener('click', async () => {
  try {
    const id = document.getElementById('rejectId').value.trim();
    const reason = document.getElementById('rejectReason').value.trim();

    if (!id) {
      afficherMessage('Veuillez saisir l’ID de la transaction à rejeter.', 'error');
      return;
    }

    if (!reason) {
      afficherMessage('Le motif du rejet est obligatoire.', 'error');
      return;
    }

    afficherMessage('Rejet de la transaction en cours...', 'info');

    const response = await fetch(`/api/agent/transactions/${id}/reject`, {
      method: 'PATCH',
      headers: headersAgent,
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();

    if (!response.ok) {
      afficherMessage(data.message || 'Erreur lors du rejet.', 'error');
      afficherResultat(data);
      return;
    }

    afficherMessage(data.message, 'success');
    afficherResultat(data);
  } catch (erreur) {
    afficherMessage('Une erreur réseau est survenue lors du rejet.', 'error');
    afficherResultat({ erreur: erreur.message });
  }
});
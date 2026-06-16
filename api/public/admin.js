const headersAdmin = {
  'x-user-email': 'admin1@bank.local',
  'Content-Type': 'application/json',
};

const btnChargerUsers = document.getElementById('btnChargerUsers');
const btnUpdateRole = document.getElementById('btnUpdateRole');
const btnUpdateStatus = document.getElementById('btnUpdateStatus');

const messageBox = document.getElementById('message');
const resultatBox = document.getElementById('resultat');
const btnAuditLogs = document.getElementById('btnAuditLogs');


function afficherMessage(message, type = 'info') {
  messageBox.className = `message ${type}`;
  messageBox.textContent = message;
}

function afficherResultat(data) {
  resultatBox.textContent = JSON.stringify(data, null, 2);
}

btnChargerUsers.addEventListener('click', async () => {
  try {
    afficherMessage('Chargement des utilisateurs...', 'info');

    const response = await fetch('/api/admin/users', {
      headers: headersAdmin,
    });

    const data = await response.json();

    if (!response.ok) {
      afficherMessage(data.message || 'Erreur lors du chargement des utilisateurs.', 'error');
      afficherResultat(data);
      return;
    }

    afficherMessage(data.message, 'success');
    afficherResultat(data);
  } catch (erreur) {
    afficherMessage('Une erreur réseau est survenue lors du chargement des utilisateurs.', 'error');
    afficherResultat({ erreur: erreur.message });
  }
});

btnUpdateRole.addEventListener('click', async () => {
  try {
    const id = document.getElementById('roleUserId').value.trim();
    const role = document.getElementById('newRole').value;

    if (!id) {
      afficherMessage('Veuillez saisir l’ID de l’utilisateur.', 'error');
      return;
    }

    afficherMessage('Mise à jour du rôle en cours...', 'info');

    const response = await fetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: headersAdmin,
      body: JSON.stringify({ role }),
    });

    const data = await response.json();

    if (!response.ok) {
      afficherMessage(data.message || 'Erreur lors de la mise à jour du rôle.', 'error');
      afficherResultat(data);
      return;
    }

    afficherMessage(data.message, 'success');
    afficherResultat(data);
  } catch (erreur) {
    afficherMessage('Une erreur réseau est survenue lors de la mise à jour du rôle.', 'error');
    afficherResultat({ erreur: erreur.message });
  }
});

btnAuditLogs.addEventListener('click', async () => {
  try {
    afficherMessage('Chargement des logs d’audit...', 'info');

    const response = await fetch('/api/admin/audit-logs', {
      headers: headersAdmin,
    });

    const data = await response.json();

    if (!response.ok) {
      afficherMessage(data.message || 'Erreur lors du chargement des logs d’audit.', 'error');
      afficherResultat(data);
      return;
    }

    afficherMessage(data.message, 'success');
    afficherResultat(data);
  } catch (erreur) {
    afficherMessage('Une erreur réseau est survenue lors du chargement des logs d’audit.', 'error');
    afficherResultat({ erreur: erreur.message });
  }
});

btnUpdateStatus.addEventListener('click', async () => {
  try {
    const id = document.getElementById('statusUserId').value.trim();
    const status = document.getElementById('newStatus').value;

    if (!id) {
      afficherMessage('Veuillez saisir l’ID de l’utilisateur.', 'error');
      return;
    }

    afficherMessage('Mise à jour du statut en cours...', 'info');

    const response = await fetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: headersAdmin,
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      afficherMessage(data.message || 'Erreur lors de la mise à jour du statut.', 'error');
      afficherResultat(data);
      return;
    }

    afficherMessage(data.message, 'success');
    afficherResultat(data);
  } catch (erreur) {
    afficherMessage('Une erreur réseau est survenue lors de la mise à jour du statut.', 'error');
    afficherResultat({ erreur: erreur.message });
  }
});
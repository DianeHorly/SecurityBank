const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const publicRoutes = require('./routes/public.routes');
const accountRoutes = require('./routes/account.routes');
const userRoutes = require('./routes/user.routes');
const mockAuth = require('./middlewares/mockAuth.middleware');
const keycloakAuth = require('./middlewares/keycloakAuth.middleware');

const authorizeRoles = require('./middlewares/role.middleware');
const transactionRoutes = require('./routes/transaction.routes');
const routesAgent = require('./routes/agent.routes'); 

const path = require('path');

const app = express();

const routesAdmin = require('./routes/admin.routes');

// Protection HTTP
app.use(helmet());

// permet d'autoriser les requetes entre client et le serveurs
app.use(cors());

// permet de lire les fichiers json dans les requetes 
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/public', publicRoutes);
//app.use('/api/accounts', accountRoutes);

/*app.use('/api/id', mockAuth, userRoutes);
app.use('/api/accounts', mockAuth, authorizeRoles('client'), accountRoutes);

app.use('/api/transactions', mockAuth, authorizeRoles('client'), transactionRoutes);

app.use('/api/agent', mockAuth, authorizeRoles('agent'), routesAgent);
*/

app.use('/api/id', keycloakAuth, userRoutes);
app.use('/api/accounts', keycloakAuth, authorizeRoles('client'), accountRoutes);
app.use('/api/transactions', keycloakAuth, authorizeRoles('client'), transactionRoutes);
app.use('/api/agent', keycloakAuth, authorizeRoles('agent'), routesAgent);
app.use('/api/admin', keycloakAuth, authorizeRoles('admin'), routesAdmin);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/agent.html'));
});

/*
app.get('/agent.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/agent.html'));
});*/

// Gestion d'admin
//app.use('/api/admin', mockAuth, authorizeRoles('admin'), routesAdmin);

module.exports = app;
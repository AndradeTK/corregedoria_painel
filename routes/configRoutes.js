const express = require("express");
const router = express.Router();

const { userHasRole } = require('../src/config/bot'); // Importa a função do bot
const db = require("../src/config/database"); // Importa o db configurado

const ensureAuthenticated = require('../middlewares/authMiddleware');

const moment = require("moment");
require("moment/locale/pt-br");


router.get('/', ensureAuthenticated, async function (req, res) {
  
const GUILD_ID = process.env.GUILD_ID; // ID do servidor
  const ROLE_ID2 = process.env.ROLE_ID2;
  const userId = req.session.user.id
  const hasRole2 = await userHasRole(GUILD_ID, userId, ROLE_ID2);

  // Salvar os dados do usuário na sessão
  req.session.perm = hasRole2

  const [nomepm] = await db.promise().query("SELECT nome FROM oficiais WHERE id_discord = ?", [req.session.user.id]);
  const [patentepm] = await db.promise().query("SELECT patente FROM oficiais WHERE id_discord = ?", [req.session.user.id]);
 if (nomepm == "") {
  req.session.user.nomepm = null
  req.session.user.patentepm = null
 } else {
  req.session.user.nomepm = nomepm[0].nome
  req.session.user.patentepm = patentepm[0].patente
 }
  
    res.render('configuracao/configuracoes', { user: req.session.user, perm: req.session.perm,});
  });

  module.exports = router;


async function ensureAuthenticated(req, res, next) {

    if (req.session && req.session.user) {
      // O usuário está logado
      return next();
    }
  
    // Redireciona para a página de login se não estiver logado
    res.redirect('/');
  }
  
  module.exports = ensureAuthenticated;
  
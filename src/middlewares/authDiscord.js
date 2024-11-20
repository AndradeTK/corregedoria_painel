function authMiddleware(req, res, next) {
    // Verifica se o token de login existe na sessão
    if (!req.session || !req.session.login || !req.session.login.token) {
        // Redireciona para a página de login
        return res.redirect('/login');
    }
    // Se o token existir, permite acessar a rota
    next();
}

module.exports = authMiddleware;

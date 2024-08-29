
const express = require("express");
const router = express.Router();
const Cliente = require("../src/model/Cliente");
const DAO = require("../src/controller/ClienteDAO");
const path = require('path');


router.get('/', function (req, res) {
   res.sendFile(path.join(__dirname, "..")+'/index.html');
});


router.get('/home', function (req, res) {
  res.sendFile(path.join(__dirname, "..")+'/public/html/home.html');
})


router.get('/inqueritos', function (req, res) {
   res.sendFile(path.join(__dirname, "..")+'/public/html/inqueritos.html')
})
router.get('/criar_inquerito', function (req, res) {
 res.sendFile(path.join(__dirname, "..")+'/public/html/criar_inquerito.html')
})


router.get('/oficiais', function (req, res) {
   res.sendFile(path.join(__dirname, "..")+'/public/html/oficiais.html')
})
router.get('/criar_oficial', function (req, res) {
  res.sendFile(path.join(__dirname, "..")+'/public/html/criar_oficial.html')
})



router.get('/blitz', function (req, res) {
 res.sendFile(path.join(__dirname, "..")+'/public/html/blitz.html')
})
router.get('/registrar_blitz', function (req, res) {
 res.sendFile(path.join(__dirname, "..")+'/public/html/criar_blitz.html')
})

router.get('/imagens', function (req, res) {
 res.sendFile(path.join(__dirname, "..")+'/public/html/imagens.html')
})

router.get('/logs', function (req, res) {
 res.sendFile(path.join(__dirname, "..")+'/public/html/logs.html')
})

router.get('/configuracoes', function (req, res) {
 res.sendFile(path.join(__dirname, "..")+'/public/html/configs.html')
})






/*
router.post('/cad', async function (req, res) {
  const cliente = new Cliente();
  const dao = new DAO();
  const botao = req.body.b1;

  var tabela;
  var s = "";
  let qtde=0
  try {
    switch (botao.toLowerCase()) {
      case 'gravar':
        cliente.nome = req.body.txtNome;
        cliente.idade = req.body.txtIdade;

        let codigo = await dao.gravar(cliente);
        cliente.codigo = codigo;
        res.render("mostrar", { codigo: cliente.codigo, nome: cliente.nome, idade: cliente.idade, msg: s });
        break;
      case 'alterar':
        cliente.codigo = req.body.txtCodigo;
        cliente.nome = req.body.txtNome;
        cliente.idade = req.body.txtIdade;
        qtde = await dao.alterar(cliente);
        res.render("mostrar", { codigo: cliente.codigo, nome: cliente.nome, idade: cliente.idade, msg: s });
        console.log("Quantidade alterada = "+qtde)
        break;
      case 'remover':
        cliente.codigo = req.body.txtCodigo;
        qtde = await dao.remover(cliente);
        res.render("mostrar", { codigo: cliente.codigo, nome: cliente.nome, idade: cliente.idade, msg: s });
        console.log("Quantidade removida = "+qtde)
        break;
      case 'listar':
        let n =String(req.body.txtNome)
        resp = await dao.listar(n);
        res.render("mostrarTabela", { tabela: resp });
        break;
      }
      
    }
    
    catch (erro) {
      console.log(erro);
    }
    
  });
  */

module.exports = router;
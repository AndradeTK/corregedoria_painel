// ------------------ Bibliotecas --------------------- //
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = new express();

// ------------------ Porta e Data --------------------- //
const port = 3000
now = new Date

// ------------------ Express e EJS --------------------- //

app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname+"/public/scripts/"));


// ------------------ Variaveis Globais --------------------- //

// const Carrinho = require('./src/model/Carrinho.js') 



// ------------------Principais--------------------- //

app.get('/', function (req, res) {
    res.sendFile(__dirname+'/public/scripts/inqueritos.html')
})


// ------------------Iniciar Servidor--------------------- //

app.use((req, res, next) => {
    res.status(404).send("Desculpe, não conseguimos encontrar essa página.");
  }) // Erro 404


  app.listen(port, function(erro) {
    if(erro){
        console.log("❌ » Erro :" + erro)
    }
    else{
        console.clear()
        console.log("✅ » Servidor Online atualizado ás " + now.getHours() + ":" + now.getMinutes() + " na porta 3000...") 
    }
})


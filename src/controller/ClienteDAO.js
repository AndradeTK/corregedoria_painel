const Banco = require('../model/Banco');
//const banco = new Banco();


class ClienteDAO {

  async gravar(obj) {
    try {
      Banco.init();
     // const res = await Banco.conexao.query('INSERT INTO cliente(nome,idade) VALUES($1,$2) RETURNING *', [obj.nome, obj.idade]);
      const res = await Banco.conexao.query('INSERT INTO cliente(nome,idade) VALUES($1,$2) RETURNING codigo', [obj.nome, obj.idade]);
      Banco.conexao.end();
      return res.rows[0].codigo
    }
    catch (erro) {
      console.log(erro);
    }
  }

  async alterar(obj) {
    try {
      Banco.init();
      let res = await Banco.conexao.query('Update cliente set nome=$1,idade=$2 where codigo=$3', [obj.nome, obj.idade, obj.codigo]);
      Banco.conexao.end();
      return res.rowCount
    }
    catch (erro) {
      console.log(erro);
    }

  }

  async remover(obj) {
    try {
      Banco.init();
      let res = await Banco.conexao.query('Delete from cliente where codigo = $1', [obj.codigo]);
      Banco.conexao.end();
      return res.rowCount
    }
    catch (erro) {
      console.log(erro);
    }

  }
  async listar(nome) {
    try {
      Banco.init();
       let tabela = await Banco.conexao.query('Select codigo,nome, idade from cliente where nome ilike $1 order by codigo',["%"+nome+"%"]);
      Banco.conexao.end();
      return tabela
    }
    catch (erro) {
      console.log(erro);
    }

  }
}
module.exports = ClienteDAO;
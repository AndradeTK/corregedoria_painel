-- Server version:               10.4.24-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for corregedoria_painel



/*CREATE TABLE IF NOT EXISTS  inqueritos (
    id SERIAL PRIMARY KEY, -- Identificador único para o inquérito
    inquirido_id INT NOT NULL, -- ID do inquirido (pode ser uma chave estrangeira se houver uma tabela de inquiridos)
    data_criacao DATE NOT NULL, -- Data de criação do inquérito
    hora_criacao TIME NOT NULL, -- Hora de criação do inquérito
    titulo VARCHAR(255) NOT NULL, -- Título do inquérito
    delator VARCHAR(255) NOT NULL, -- Nome do delator
    reu VARCHAR(255) NOT NULL, -- Nome do réu
    requerente VARCHAR(255) NOT NULL, -- Nome do requerente
    data_ocorrencia DATE NOT NULL, -- Data da ocorrência relacionada ao inquérito
    envolvidos_secundarios TEXT, -- Lista de nomes dos envolvidos secundários (separados por vírgula)
    links_anexados TEXT, -- Links anexados ao inquérito (pode ser uma lista separada por vírgula)
    descricao TEXT NOT NULL -- Descrição detalhada do ocorrido
);
*/

DROP DATABASE IF EXISTS corregedoria_painel;
CREATE DATABASE IF NOT EXISTS `corregedoria_painel` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `corregedoria_painel`;


DROP TABLE IF EXISTS inqueritos;
CREATE TABLE IF NOT EXISTS inqueritos (
    id SERIAL PRIMARY KEY,  -- Identificador único para o inquérito
    titulo VARCHAR(255) NOT NULL,  -- Título do inquérito
    tipo VARCHAR(100) NOT NULL,  -- Tipo do inquérito (e.g., Denúncia)
    delator VARCHAR(255) NOT NULL,  -- Nome do delator
    reu VARCHAR(255) NOT NULL,  -- Nome do réu
    requerente VARCHAR(255) NOT NULL,  -- Nome do requerente
    data_ocorrencia DATE NOT NULL,  -- Data e hora da ocorrência relacionada ao inquérito
    data_atualizacao DATETIME NOT NULL,  -- Data e hora da ocorrência relacionada ao inquérito
    autor_atualizacao VARCHAR(50) NOT NULL,  -- Data e hora da ocorrência relacionada ao inquérito
    status VARCHAR(100) NOT NULL,  -- Status do inquérito (e.g., Finalizado, Aberto)
    envolvidos_secundarios TEXT,  -- Lista de nomes dos envolvidos secundários (separados por vírgula)
    /*links_anexados TEXT,  */
    descricao TEXT NOT NULL  -- Descrição detalhada do ocorrido
);

ALTER TABLE inqueritos
MODIFY id BIGINT AUTO_INCREMENT;

-- Primeiro, remova a tabela se ela já existir
DROP TABLE IF EXISTS inquerito_links;

-- Agora, crie a tabela novamente com a definição correta
CREATE TABLE inquerito_links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inquerito_id BIGINT NOT NULL,
    nome_link VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    FOREIGN KEY (inquerito_id) REFERENCES inqueritos(id)
);

CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    acao VARCHAR(100),
    discord_author VARCHAR(30),
    discord_id VARCHAR(50),
    ip TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Primeiro, remova a tabela se ela já existir
DROP TABLE IF EXISTS oficiais;

-- Criação da tabela de oficiais
CREATE TABLE IF NOT EXISTS oficiais (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,  -- Identificador único para o registro na base de dados
    id_ingame BIGINT NOT NULL,  -- Identificador único do oficial no sistema do jogo (não auto-incrementado)
    id_discord BIGINT NOT NULL,  -- Identificador único do oficial no sistema do jogo (não auto-incrementado)
    nome VARCHAR(255) NOT NULL,  -- Nome completo do oficial
    rg VARCHAR(50) NOT NULL,  -- Registro Geral (RG) do oficial
    patente VARCHAR(100) NOT NULL,  -- Patente do oficial (e.g., Soldado, Cabo, Capitão)
    unidade VARCHAR(100) NOT NULL,  -- Unidade do oficial
    data_registro DATE DEFAULT NULL,  -- Data de registro do oficial no sistema
    data_atualizacao DATETIME NOT NULL,  -- Data e hora da última atualização do registro
     autor_atualizacao VARCHAR(50) NOT NULL,  -- Data e hora da ocorrência relacionada ao inquérito
    status VARCHAR(50) NOT NULL,  -- Status do oficial (e.g., Ativo, Inativo)
    observacoes TEXT,  -- Observações adicionais sobre o oficial
    UNIQUE (id_ingame),  -- Garante que o id_ingame seja único
    UNIQUE (id_discord)  -- Garante que o id_ingame seja único
);

DROP TABLE IF EXISTS oficial_links;

-- Criação da tabela de links relacionados aos oficiais
CREATE TABLE oficial_links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    oficial_id BIGINT NOT NULL,  -- Relaciona o link ao oficial pelo id de registro na DB
    id_registro BIGINT NOT NULL,
    nome_link VARCHAR(255) NOT NULL,  -- Nome/descrição do link
    url VARCHAR(255) NOT NULL,  -- URL do link
    FOREIGN KEY (oficial_id) REFERENCES oficiais(id_ingame),  -- Chave estrangeira referenciando a coluna id (chave primária) de oficiais
   FOREIGN KEY (id_registro) REFERENCES oficiais(id)  -- Chave estrangeira referenciando a coluna id (chave primária) de oficiais
);

-- Remova a tabela blitz se ela já existir
DROP TABLE IF EXISTS blitz;

-- Criação da tabela blitz
CREATE TABLE blitz (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,  -- Identificador único para cada blitz
    local VARCHAR(255) NOT NULL,  -- Local da blitz
    corregedor_responsavel VARCHAR(255) NOT NULL,  -- Nome do corregedor responsável
    corregedores_presentes TEXT NOT NULL,  -- Lista dos corregedores presentes (separados por vírgula)
    oficiais_fiscalizados INT NOT NULL,  -- Quantidade de oficiais fiscalizados
    realizada_em DATETIME NOT NULL,  -- Data e hora em que a blitz foi realizada
    status VARCHAR(100) NOT NULL,  -- Status da blitz (e.g., Em Andamento, Concluída)
    descricao TEXT NOT NULL,  -- Descrição detalhada da blitz
    data_atualizacao DATETIME NOT NULL,  -- Data e hora da última atualização
     autor_atualizacao VARCHAR(50) NOT NULL  -- Data e hora da ocorrência relacionada ao inquérito
);

DROP TABLE IF EXISTS blitz_links;

-- Criação da tabela de links relacionados aos oficiais
CREATE TABLE blitz_links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    blitz_id BIGINT NOT NULL,  -- Relaciona o link ao oficial pelo id de registro na DB
    nome_link VARCHAR(255) NOT NULL,  -- Nome/descrição do link
    url VARCHAR(255) NOT NULL,  -- URL do link
    FOREIGN KEY (blitz_id) REFERENCES blitz(id)  -- Chave estrangeira referenciando a tabela oficiais
);






-- Remova a tabela se ela já existir
DROP TABLE IF EXISTS avisos;

-- Criação da tabela de links relacionados aos oficiais
CREATE TABLE avisos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    autor VARCHAR(255) NOT NULL,  -- Nome/descrição do link
    data_aviso DATETIME NOT NULL,
    aviso TEXT
);


/*
-- Inserindo dados na tabela inqueritos
INSERT INTO inqueritos (titulo, tipo, delator, reu, requerente, data_ocorrencia, data_atualizacao, status, envolvidos_secundarios, descricao)
VALUES 
('Uso Indevido de Veículo Oficial', 'Denúncia', 'Carlos Silva', 'João Souza', 'Maria Fernandes', '2024-09-01 14:30:00', '2024-09-02 10:00:00', 'Aberto', 'Paulo Lima, Ana Costa', 'Foi identificado que o réu utilizou um veículo oficial fora do horário de serviço.'),
('Agressão Física', 'Denúncia', 'Pedro Santos', 'Lucas Almeida', 'Rafael Oliveira', '2024-09-03 09:00:00', '2024-09-03 15:30:00', 'Aberto', 'Cláudia Pereira', 'O réu foi acusado de agredir fisicamente outro oficial durante uma operação.'),
('Falsificação de Documentos', 'Investigação', 'João Ferreira', 'Marcos Lima', 'Fernanda Rocha', '2024-09-05 11:15:00', '2024-09-05 17:45:00', 'Finalizado', 'Gabriel Souza', 'Foi comprovado que o réu falsificou documentos para obtenção de benefícios pessoais.');

-- Inserindo dados na tabela inquerito_links para o inquérito de ID 1
INSERT INTO inquerito_links (inquerito_id, nome_link, url)
VALUES 
(1, 'Vídeo da ocorrência', 'https://youtube.com/exemplo1'),
(1, 'Relatório de uso do veículo', 'https://docs.com/exemplo2');

-- Inserindo dados na tabela inquerito_links para o inquérito de ID 2
INSERT INTO inquerito_links (inquerito_id, nome_link, url)
VALUES 
(2, 'Câmeras de segurança', 'https://youtube.com/exemplo3');

-- Inserindo dados na tabela inquerito_links para o inquérito de ID 3
INSERT INTO inquerito_links (inquerito_id, nome_link, url)
VALUES 
(3, 'Cópia dos documentos falsificados', 'https://docs.com/exemplo4');

*/

-- Criar chaves estrangeiras se necessário, exemplo:
-- ALTER TABLE inqueritos ADD CONSTRAINT fk_inquirido FOREIGN KEY (inquirido_id) REFERENCES inquiridos(id);
    
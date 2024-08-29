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
CREATE DATABASE IF NOT EXISTS `corregedoria_painel` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `corregedoria_painel`;



CREATE TABLE IF NOT EXISTS  inqueritos (
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

-- Criar chaves estrangeiras se necessário, exemplo:
-- ALTER TABLE inqueritos ADD CONSTRAINT fk_inquirido FOREIGN KEY (inquirido_id) REFERENCES inquiridos(id);

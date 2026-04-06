-- Adicionar Thainá como diretora para receber notificações de exceção
-- Executar no Supabase SQL Editor do projeto GIA (dxuoppekxgvdqnytftho)

INSERT INTO diretores_notificacao (nome, telefone, email, ativo)
VALUES ('Thainá', '+5500000000000', 'thaina@objetivo.com.br', true)
ON CONFLICT (nome) DO UPDATE SET ativo = true;

-- IMPORTANTE: Alex precisa preencher o telefone real da Thainá no campo acima
-- O telefone deve estar no formato +55XXXXXXXXXXX para receber SMS via ClickSend

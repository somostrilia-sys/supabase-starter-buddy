-- Migration: Insert pricing data from Power CRM (15 tables)
-- Date: 2026-04-01
-- Source: Precos_Planos_Power_CRM.md

-- Clear existing data
DELETE FROM tabela_precos;

-- =====================================================
-- 39865 - Básico Leves (Regional Sao Paulo)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
('39865', 'Básico (Leves)', 'São Paulo Capital', 0.00, 10000.00, 113.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 10000.01, 20000.00, 127.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 20000.01, 25000.00, 134.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 25000.01, 30000.00, 147.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 30000.01, 35000.00, 155.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 35000.01, 40000.00, 173.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 40000.01, 50000.00, 197.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 50000.01, 60000.00, 212.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 60000.01, 70000.00, 235.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 70000.01, 80000.00, 246.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 80000.01, 90000.00, 298.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 90000.01, 100000.00, 313.00),
('39865', 'Básico (Leves)', 'São Paulo Capital', 100000.01, 150000.00, 345.00);

-- =====================================================
-- 39866 - Utilitários leves (Regional Sao Paulo)
-- Completo (Leves), Objetivo (Leves), Premium (Leves)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
-- Completo (Leves)
('39866', 'Completo (Leves)', 'São Paulo Capital', 10000.00, 20000.00, 155.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 20000.01, 25000.00, 162.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 25000.01, 30000.00, 175.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 30000.01, 35000.00, 183.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 35000.01, 40000.00, 201.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 40000.01, 50000.00, 225.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 50000.01, 60000.00, 240.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 60000.01, 70000.00, 264.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 70000.01, 80000.00, 295.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 80000.01, 90000.00, 326.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 90000.01, 100000.00, 342.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 100000.01, 110000.00, 378.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 110000.01, 120000.00, 435.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 120000.01, 135000.00, 455.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 135000.01, 150000.00, 462.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 150000.01, 170000.00, 509.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 170000.01, 200000.00, 584.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 200000.01, 250000.00, 653.00),
('39866', 'Completo (Leves)', 'São Paulo Capital', 250000.01, 300000.00, 745.00),
-- Objetivo (Leves)
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 10000.00, 20000.00, 202.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 20000.01, 25000.00, 210.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 25000.01, 30000.00, 221.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 30000.01, 35000.00, 231.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 35000.01, 40000.00, 253.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 40000.01, 50000.00, 276.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 50000.01, 60000.00, 288.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 60000.01, 70000.00, 324.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 70000.01, 80000.00, 354.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 80000.01, 90000.00, 383.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 90000.01, 100000.00, 402.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 100000.01, 110000.00, 451.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 110000.01, 120000.00, 485.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 120000.01, 135000.00, 518.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 135000.01, 150000.00, 560.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 150000.01, 170000.00, 624.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 170000.01, 200000.00, 632.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 200000.01, 250000.00, 700.00),
('39866', 'Objetivo (Leves)', 'São Paulo Capital', 250000.01, 300000.00, 805.00),
-- Premium (Leves)
('39866', 'Premium (Leves)', 'São Paulo Capital', 10000.00, 20000.00, 262.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 20000.01, 25000.00, 270.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 25000.01, 30000.00, 281.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 30000.01, 35000.00, 291.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 35000.01, 40000.00, 313.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 40000.01, 50000.00, 336.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 50000.01, 60000.00, 358.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 60000.01, 70000.00, 384.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 70000.01, 80000.00, 424.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 80000.01, 90000.00, 353.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 90000.01, 100000.00, 462.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 100000.01, 110000.00, 511.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 110000.01, 120000.00, 445.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 120000.01, 135000.00, 578.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 135000.01, 150000.00, 620.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 150000.01, 170000.00, 684.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 170000.01, 200000.00, 692.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 200000.01, 250000.00, 760.00),
('39866', 'Premium (Leves)', 'São Paulo Capital', 250000.01, 300000.00, 865.00);

-- =====================================================
-- 39869 - Completo leves (Regional Sao Paulo)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
('39869', 'Completo (Leves)', 'São Paulo Capital', 0.00, 10000.00, 135.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 10000.01, 20000.00, 148.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 20000.01, 25000.00, 155.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 25000.01, 30000.00, 167.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 30000.01, 35000.00, 175.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 35000.01, 40000.00, 192.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 40000.01, 50000.00, 215.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 50000.01, 60000.00, 229.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 60000.01, 70000.00, 252.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 70000.01, 80000.00, 281.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 80000.01, 90000.00, 311.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 90000.01, 100000.00, 326.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 100000.01, 110000.00, 360.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 110000.01, 120000.00, 415.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 120000.01, 135000.00, 440.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 135000.01, 150000.00, 485.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 150000.01, 170000.00, 540.00),
('39869', 'Completo (Leves)', 'São Paulo Capital', 170000.01, 200000.00, 590.00);

-- =====================================================
-- 39870 - Objetivo leves (Regional Sao Paulo)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 0.00, 10000.00, 170.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 10000.01, 20000.00, 183.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 20000.01, 25000.00, 190.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 25000.01, 30000.00, 202.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 30000.01, 35000.00, 210.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 35000.01, 40000.00, 227.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 40000.01, 50000.00, 250.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 50000.01, 60000.00, 274.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 60000.01, 70000.00, 297.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 70000.01, 80000.00, 326.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 80000.01, 90000.00, 356.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 90000.01, 100000.00, 371.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 100000.01, 110000.00, 388.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 110000.01, 120000.00, 460.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 120000.01, 135000.00, 485.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 135000.01, 150000.00, 530.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 150000.01, 170000.00, 585.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 170000.01, 200000.00, 635.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 200000.01, 250000.00, 680.00),
('39870', 'Objetivo (Leves)', 'São Paulo Capital', 250000.01, 300000.00, 710.00);

-- =====================================================
-- 39871 - Padrão motos (Regional Interior São Paulo)
-- Objetivo (Motos), Básico (Motos)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
-- Objetivo (Motos)
('39871', 'Objetivo (Motos)', 'Interior São Paulo', 0.00, 8000.00, 90.00),
('39871', 'Objetivo (Motos)', 'Interior São Paulo', 8000.01, 16000.00, 140.00),
('39871', 'Objetivo (Motos)', 'Interior São Paulo', 16000.01, 25000.00, 200.00),
('39871', 'Objetivo (Motos)', 'Interior São Paulo', 25000.01, 30000.00, 230.00),
('39871', 'Objetivo (Motos)', 'Interior São Paulo', 30000.01, 35000.00, 263.00),
('39871', 'Objetivo (Motos)', 'Interior São Paulo', 35000.01, 45000.00, 353.00),
('39871', 'Objetivo (Motos)', 'Interior São Paulo', 45000.01, 60000.00, 445.00),
('39871', 'Objetivo (Motos)', 'Interior São Paulo', 60000.01, 80000.00, 525.00),
('39871', 'Objetivo (Motos)', 'Interior São Paulo', 80000.01, 100000.00, 580.00),
('39871', 'Objetivo (Motos)', 'Interior São Paulo', 100000.01, 120000.00, 680.00),
-- Básico (Motos)
('39871', 'Básico (Motos)', 'Interior São Paulo', 0.00, 8000.00, 80.00),
('39871', 'Básico (Motos)', 'Interior São Paulo', 8000.01, 16000.00, 100.00),
('39871', 'Básico (Motos)', 'Interior São Paulo', 16000.01, 25000.00, 130.00),
('39871', 'Básico (Motos)', 'Interior São Paulo', 25000.01, 30000.00, 170.00),
('39871', 'Básico (Motos)', 'Interior São Paulo', 30000.01, 35000.00, 200.00),
('39871', 'Básico (Motos)', 'Interior São Paulo', 35000.01, 45000.00, 245.00),
('39871', 'Básico (Motos)', 'Interior São Paulo', 45000.01, 60000.00, 335.00),
('39871', 'Básico (Motos)', 'Interior São Paulo', 60000.01, 80000.00, 395.00),
('39871', 'Básico (Motos)', 'Interior São Paulo', 80000.01, 100000.00, 410.00),
('39871', 'Básico (Motos)', 'Interior São Paulo', 100000.01, 120000.00, 480.00);

-- =====================================================
-- 40449 - Completo leves (Regional Norte/Minas/Sul)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 0.00, 10000.00, 98.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 10000.01, 20000.00, 102.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 20000.01, 25000.00, 115.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 25000.01, 30000.00, 125.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 30000.01, 35000.00, 130.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 35000.01, 40000.00, 143.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 40000.01, 50000.00, 159.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 50000.01, 60000.00, 210.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 60000.01, 70000.00, 236.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 70000.01, 80000.00, 264.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 80000.01, 90000.00, 294.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 90000.01, 100000.00, 310.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 100000.01, 110000.00, 336.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 110000.01, 120000.00, 355.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 120000.01, 135000.00, 373.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 135000.01, 150000.00, 410.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 150000.01, 170000.00, 441.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 170000.01, 200000.00, 473.00),
('40449', 'Completo (Leves)', 'Norte/Minas/Sul', 200000.01, 250000.00, 580.00);

-- =====================================================
-- 40454 - Utilitários leves (Regional Natal)
-- Completo (Leves), Objetivo (Leves)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
-- Completo (Leves)
('40454', 'Completo (Leves)', 'Natal', 10000.00, 20000.00, 98.00),
('40454', 'Completo (Leves)', 'Natal', 20000.01, 25000.00, 105.00),
('40454', 'Completo (Leves)', 'Natal', 25000.01, 30000.00, 117.00),
('40454', 'Completo (Leves)', 'Natal', 30000.01, 35000.00, 125.00),
('40454', 'Completo (Leves)', 'Natal', 35000.01, 40000.00, 137.00),
('40454', 'Completo (Leves)', 'Natal', 40000.01, 50000.00, 152.00),
('40454', 'Completo (Leves)', 'Natal', 50000.01, 60000.00, 200.00),
('40454', 'Completo (Leves)', 'Natal', 60000.01, 70000.00, 225.00),
('40454', 'Completo (Leves)', 'Natal', 70000.01, 80000.00, 252.00),
('40454', 'Completo (Leves)', 'Natal', 80000.01, 90000.00, 280.00),
('40454', 'Completo (Leves)', 'Natal', 90000.01, 100000.00, 300.00),
('40454', 'Completo (Leves)', 'Natal', 100000.01, 110000.00, 320.00),
('40454', 'Completo (Leves)', 'Natal', 110000.01, 120000.00, 340.00),
('40454', 'Completo (Leves)', 'Natal', 120000.01, 135000.00, 380.00),
('40454', 'Completo (Leves)', 'Natal', 135000.01, 150000.00, 430.00),
('40454', 'Completo (Leves)', 'Natal', 150000.01, 170000.00, 500.00),
('40454', 'Completo (Leves)', 'Natal', 170000.01, 200000.00, 560.00),
('40454', 'Completo (Leves)', 'Natal', 200000.01, 250000.00, 625.00),
('40454', 'Completo (Leves)', 'Natal', 350000.00, 400000.00, 740.00),
-- Objetivo (Leves)
('40454', 'Objetivo (Leves)', 'Natal', 10000.00, 20000.00, 133.00),
('40454', 'Objetivo (Leves)', 'Natal', 20000.01, 25000.00, 140.00),
('40454', 'Objetivo (Leves)', 'Natal', 25000.01, 30000.00, 152.00),
('40454', 'Objetivo (Leves)', 'Natal', 30000.01, 35000.00, 160.00),
('40454', 'Objetivo (Leves)', 'Natal', 35000.01, 40000.00, 182.00),
('40454', 'Objetivo (Leves)', 'Natal', 40000.01, 50000.00, 197.00),
('40454', 'Objetivo (Leves)', 'Natal', 50000.01, 60000.00, 220.00),
('40454', 'Objetivo (Leves)', 'Natal', 60000.01, 70000.00, 245.00),
('40454', 'Objetivo (Leves)', 'Natal', 70000.01, 80000.00, 267.00),
('40454', 'Objetivo (Leves)', 'Natal', 80000.01, 90000.00, 300.00),
('40454', 'Objetivo (Leves)', 'Natal', 90000.01, 100000.00, 320.00),
('40454', 'Objetivo (Leves)', 'Natal', 100000.01, 110000.00, 340.00),
('40454', 'Objetivo (Leves)', 'Natal', 110000.01, 120000.00, 360.00),
('40454', 'Objetivo (Leves)', 'Natal', 120000.01, 135000.00, 400.00),
('40454', 'Objetivo (Leves)', 'Natal', 135000.01, 150000.00, 455.00),
('40454', 'Objetivo (Leves)', 'Natal', 150000.01, 170000.00, 520.00),
('40454', 'Objetivo (Leves)', 'Natal', 170000.01, 200000.00, 585.00),
('40454', 'Objetivo (Leves)', 'Natal', 200000.01, 250000.00, 725.00),
('40454', 'Objetivo (Leves)', 'Natal', 350000.00, 400000.00, 896.00);

-- =====================================================
-- 41505 - Completo leves (Regional Espírito Santo)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
('41505', 'Completo (Leves)', 'Espírito Santo', 0.00, 10000.00, 90.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 10000.01, 20000.00, 100.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 20000.01, 25000.00, 125.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 25000.01, 30000.00, 137.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 30000.01, 35000.00, 145.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 35000.01, 40000.00, 160.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 40000.01, 50000.00, 210.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 50000.01, 60000.00, 217.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 60000.01, 70000.00, 237.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 70000.01, 80000.00, 264.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 80000.01, 90000.00, 289.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 90000.01, 100000.00, 331.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 100000.01, 110000.00, 344.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 110000.01, 120000.00, 395.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 120000.01, 135000.00, 430.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 135000.01, 150000.00, 475.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 150000.01, 170000.00, 505.00),
('41505', 'Completo (Leves)', 'Espírito Santo', 170000.01, 200000.00, 575.00);

-- =====================================================
-- 41507 - Objetivo leves (Regional Espírito Santo)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
('41507', 'Objetivo (Leves)', 'Espírito Santo', 0.00, 10000.00, 100.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 10000.01, 20000.00, 130.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 20000.01, 25000.00, 149.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 25000.01, 30000.00, 159.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 30000.01, 35000.00, 165.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 35000.01, 40000.00, 175.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 40000.01, 50000.00, 220.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 50000.01, 60000.00, 262.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 60000.01, 70000.00, 282.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 70000.01, 80000.00, 309.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 80000.01, 90000.00, 334.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 90000.01, 100000.00, 376.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 100000.01, 110000.00, 389.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 110000.01, 120000.00, 440.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 120000.01, 135000.00, 475.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 135000.01, 150000.00, 520.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 150000.01, 170000.00, 550.00),
('41507', 'Objetivo (Leves)', 'Espírito Santo', 170000.01, 200000.00, 620.00);

-- =====================================================
-- 41511 - Utilitários leves (Regional Espírito Santo)
-- Completo (Leves), Objetivo (Leves), Premium (Leves)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
-- Completo (Leves)
('41511', 'Completo (Leves)', 'Espírito Santo', 10000.00, 20000.00, 118.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 20000.01, 25000.00, 125.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 25000.01, 30000.00, 137.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 30000.01, 35000.00, 162.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 35000.01, 40000.00, 145.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 40000.01, 50000.00, 210.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 50000.01, 60000.00, 217.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 60000.01, 70000.00, 237.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 70000.01, 80000.00, 264.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 80000.01, 90000.00, 289.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 90000.01, 100000.00, 331.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 100000.01, 110000.00, 344.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 110000.01, 120000.00, 395.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 120000.01, 135000.00, 430.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 135000.01, 150000.00, 475.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 150000.01, 170000.00, 505.00),
('41511', 'Completo (Leves)', 'Espírito Santo', 170000.01, 200000.00, 575.00),
-- Objetivo (Leves)
('41511', 'Objetivo (Leves)', 'Espírito Santo', 10000.00, 20000.00, 130.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 20000.01, 25000.00, 149.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 25000.01, 30000.00, 159.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 30000.01, 35000.00, 165.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 35000.01, 40000.00, 175.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 40000.01, 50000.00, 220.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 50000.01, 60000.00, 262.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 60000.01, 70000.00, 282.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 70000.01, 80000.00, 309.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 80000.01, 90000.00, 334.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 90000.01, 100000.00, 376.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 100000.01, 110000.00, 389.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 110000.01, 120000.00, 440.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 120000.01, 135000.00, 475.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 135000.01, 150000.00, 520.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 150000.01, 170000.00, 550.00),
('41511', 'Objetivo (Leves)', 'Espírito Santo', 170000.01, 200000.00, 620.00),
-- Premium (Leves)
('41511', 'Premium (Leves)', 'Espírito Santo', 10000.00, 20000.00, 190.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 20000.01, 25000.00, 209.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 25000.01, 30000.00, 219.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 30000.01, 35000.00, 225.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 35000.01, 40000.00, 235.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 40000.01, 50000.00, 280.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 50000.01, 60000.00, 322.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 60000.01, 70000.00, 342.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 70000.01, 80000.00, 369.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 80000.01, 90000.00, 394.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 90000.01, 100000.00, 436.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 100000.01, 110000.00, 449.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 110000.01, 120000.00, 500.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 120000.01, 135000.00, 535.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 135000.01, 150000.00, 580.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 150000.01, 170000.00, 610.00),
('41511', 'Premium (Leves)', 'Espírito Santo', 170000.01, 200000.00, 680.00);

-- =====================================================
-- 43501 - Objetivo leves (REGIONAL RIO GRANDE DO SUL)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 0.00, 10000.00, 100.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 10000.01, 20000.00, 108.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 20000.01, 25000.00, 120.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 25000.01, 30000.00, 130.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 30000.01, 35000.00, 140.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 35000.01, 40000.00, 145.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 40000.01, 50000.00, 160.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 50000.01, 60000.00, 185.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 60000.01, 70000.00, 210.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 70000.01, 80000.00, 260.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 80000.01, 90000.00, 285.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 90000.01, 100000.00, 320.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 100000.01, 110000.00, 355.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 110000.01, 120000.00, 400.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 120000.01, 135000.00, 450.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 135000.01, 150000.00, 505.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 150000.01, 170000.00, 550.00),
('43501', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 170000.01, 200000.00, 620.00);

-- =====================================================
-- 43503 - Ultilitarios leves (REGIONAL RIO GRANDE DO SUL)
-- OBJETIVO (LEVES) SUL, Premium (Sul)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
-- OBJETIVO (LEVES) SUL
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 0.00, 10000.00, 100.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 10000.01, 20000.00, 108.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 20000.01, 25000.00, 120.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 25000.01, 30000.00, 130.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 30000.01, 35000.00, 140.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 35000.01, 40000.00, 145.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 40000.01, 50000.00, 160.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 50000.01, 60000.00, 185.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 60000.01, 70000.00, 210.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 70000.01, 80000.00, 260.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 80000.01, 90000.00, 285.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 90000.01, 100000.00, 320.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 100000.01, 110000.00, 355.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 110000.01, 120000.00, 400.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 120000.01, 135000.00, 450.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 135000.01, 150000.00, 505.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 150000.01, 170000.00, 550.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 170000.01, 210000.00, 620.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 210000.01, 300000.00, 750.00),
('43503', 'OBJETIVO (LEVES) SUL', 'Rio Grande do Sul', 300000.01, 400000.00, 790.00),
-- Premium (Sul)
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 0.00, 10000.00, 150.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 10000.01, 20000.00, 158.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 20000.01, 25000.00, 170.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 25000.01, 30000.00, 180.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 30000.01, 35000.00, 190.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 35000.01, 40000.00, 200.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 40000.01, 50000.00, 210.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 50000.01, 60000.00, 235.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 60000.01, 70000.00, 260.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 70000.01, 80000.00, 310.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 80000.01, 90000.00, 335.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 90000.01, 100000.00, 370.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 100000.01, 110000.00, 405.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 110000.01, 120000.00, 450.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 120000.01, 135000.00, 500.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 135000.01, 150000.00, 555.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 150000.01, 170000.00, 600.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 170000.01, 210000.00, 670.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 210000.01, 300000.00, 800.00),
('43503', 'Premium (Sul)', 'Rio Grande do Sul', 300000.01, 400000.00, 890.00);

-- =====================================================
-- 43652 - Padrão motos (REGIONAL RIO GRANDE DO SUL)
-- Objetivo (Motos), Premium (Motocicleta)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
-- Objetivo (Motos)
('43652', 'Objetivo (Motos)', 'Rio Grande do Sul', 0.00, 8000.00, 65.00),
('43652', 'Objetivo (Motos)', 'Rio Grande do Sul', 8000.01, 16000.00, 100.00),
('43652', 'Objetivo (Motos)', 'Rio Grande do Sul', 16000.01, 20000.00, 120.00),
('43652', 'Objetivo (Motos)', 'Rio Grande do Sul', 20000.01, 30000.00, 160.00),
('43652', 'Objetivo (Motos)', 'Rio Grande do Sul', 30000.01, 35000.00, 230.00),
('43652', 'Objetivo (Motos)', 'Rio Grande do Sul', 35000.01, 45000.00, 290.00),
('43652', 'Objetivo (Motos)', 'Rio Grande do Sul', 45000.01, 60000.00, 320.00),
('43652', 'Objetivo (Motos)', 'Rio Grande do Sul', 60000.01, 80000.00, 380.00),
('43652', 'Objetivo (Motos)', 'Rio Grande do Sul', 80000.01, 100000.00, 440.00),
('43652', 'Objetivo (Motos)', 'Rio Grande do Sul', 100000.01, 120000.00, 550.00),
-- Premium (Motocicleta)
('43652', 'Premium (Motocicleta)', 'Rio Grande do Sul', 0.00, 8000.00, 105.00),
('43652', 'Premium (Motocicleta)', 'Rio Grande do Sul', 8000.01, 16000.00, 159.00),
('43652', 'Premium (Motocicleta)', 'Rio Grande do Sul', 16000.01, 20000.00, 178.00),
('43652', 'Premium (Motocicleta)', 'Rio Grande do Sul', 20000.01, 30000.00, 220.00),
('43652', 'Premium (Motocicleta)', 'Rio Grande do Sul', 30000.01, 35000.00, 290.00),
('43652', 'Premium (Motocicleta)', 'Rio Grande do Sul', 35000.01, 45000.00, 350.00),
('43652', 'Premium (Motocicleta)', 'Rio Grande do Sul', 45000.01, 60000.00, 380.00),
('43652', 'Premium (Motocicleta)', 'Rio Grande do Sul', 60000.01, 80000.00, 440.00),
('43652', 'Premium (Motocicleta)', 'Rio Grande do Sul', 80000.01, 100000.00, 510.00),
('43652', 'Premium (Motocicleta)', 'Rio Grande do Sul', 100000.01, 120000.00, 610.00);

-- =====================================================
-- 43654 - Utilitários leves (Regional Alagoas)
-- Completo (Leves), Objetivo (Leves), Premium (Leves)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
-- Completo (Leves)
('43654', 'Completo (Leves)', 'Alagoas', 0.00, 10000.00, 79.00),
('43654', 'Completo (Leves)', 'Alagoas', 10000.01, 20000.00, 89.00),
('43654', 'Completo (Leves)', 'Alagoas', 20000.01, 25000.00, 100.00),
('43654', 'Completo (Leves)', 'Alagoas', 25000.01, 30000.00, 115.00),
('43654', 'Completo (Leves)', 'Alagoas', 30000.01, 35000.00, 120.00),
('43654', 'Completo (Leves)', 'Alagoas', 35000.01, 40000.00, 130.00),
('43654', 'Completo (Leves)', 'Alagoas', 40000.01, 50000.00, 165.00),
('43654', 'Completo (Leves)', 'Alagoas', 50000.01, 60000.00, 190.00),
('43654', 'Completo (Leves)', 'Alagoas', 60000.01, 70000.00, 210.00),
('43654', 'Completo (Leves)', 'Alagoas', 70000.01, 80000.00, 240.00),
('43654', 'Completo (Leves)', 'Alagoas', 80000.01, 90000.00, 260.00),
('43654', 'Completo (Leves)', 'Alagoas', 90000.01, 100000.00, 289.00),
('43654', 'Completo (Leves)', 'Alagoas', 100000.01, 110000.00, 320.00),
('43654', 'Completo (Leves)', 'Alagoas', 110000.01, 120000.00, 365.00),
('43654', 'Completo (Leves)', 'Alagoas', 120000.01, 135000.00, 410.00),
('43654', 'Completo (Leves)', 'Alagoas', 135000.01, 150000.00, 455.00),
('43654', 'Completo (Leves)', 'Alagoas', 150000.01, 170000.00, 555.00),
('43654', 'Completo (Leves)', 'Alagoas', 170000.01, 250000.00, 625.00),
('43654', 'Completo (Leves)', 'Alagoas', 350000.00, 400000.00, 790.00),
-- Objetivo (Leves)
('43654', 'Objetivo (Leves)', 'Alagoas', 0.00, 10000.00, 138.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 10000.01, 20000.00, 149.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 20000.01, 25000.00, 160.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 25000.01, 30000.00, 175.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 30000.01, 35000.00, 190.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 35000.01, 40000.00, 210.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 40000.01, 50000.00, 230.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 50000.01, 60000.00, 242.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 60000.01, 70000.00, 262.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 70000.01, 80000.00, 289.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 80000.01, 90000.00, 314.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 90000.01, 100000.00, 356.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 100000.01, 110000.00, 369.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 110000.01, 120000.00, 420.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 120000.01, 135000.00, 455.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 135000.01, 150000.00, 500.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 150000.01, 170000.00, 530.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 170000.01, 250000.00, 600.00),
('43654', 'Objetivo (Leves)', 'Alagoas', 350000.00, 400000.00, 890.00),
-- Premium (Leves)
('43654', 'Premium (Leves)', 'Alagoas', 0.00, 10000.00, 198.00),
('43654', 'Premium (Leves)', 'Alagoas', 10000.01, 20000.00, 209.00),
('43654', 'Premium (Leves)', 'Alagoas', 20000.01, 25000.00, 220.00),
('43654', 'Premium (Leves)', 'Alagoas', 25000.01, 30000.00, 235.00),
('43654', 'Premium (Leves)', 'Alagoas', 30000.01, 35000.00, 250.00),
('43654', 'Premium (Leves)', 'Alagoas', 35000.01, 40000.00, 270.00),
('43654', 'Premium (Leves)', 'Alagoas', 40000.01, 50000.00, 290.00),
('43654', 'Premium (Leves)', 'Alagoas', 50000.01, 60000.00, 302.00),
('43654', 'Premium (Leves)', 'Alagoas', 60000.01, 70000.00, 322.00),
('43654', 'Premium (Leves)', 'Alagoas', 70000.01, 80000.00, 349.00),
('43654', 'Premium (Leves)', 'Alagoas', 80000.01, 90000.00, 374.00),
('43654', 'Premium (Leves)', 'Alagoas', 90000.01, 100000.00, 416.00),
('43654', 'Premium (Leves)', 'Alagoas', 100000.01, 110000.00, 429.00),
('43654', 'Premium (Leves)', 'Alagoas', 110000.01, 120000.00, 480.00),
('43654', 'Premium (Leves)', 'Alagoas', 120000.01, 135000.00, 515.00),
('43654', 'Premium (Leves)', 'Alagoas', 135000.01, 150000.00, 560.00),
('43654', 'Premium (Leves)', 'Alagoas', 150000.01, 170000.00, 590.00),
('43654', 'Premium (Leves)', 'Alagoas', 170000.01, 250000.00, 660.00),
('43654', 'Premium (Leves)', 'Alagoas', 350000.00, 400000.00, 950.00);

-- =====================================================
-- 45364 - Básico Leves (Regional Norte/Minas/Sul)
-- =====================================================
INSERT INTO tabela_precos (tabela_id, plano, regional, valor_menor, valor_maior, cota) VALUES
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 0.00, 10000.00, 89.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 10000.01, 20000.00, 98.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 20000.01, 25000.00, 105.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 25000.01, 30000.00, 110.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 30000.01, 35000.00, 120.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 35000.01, 40000.00, 130.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 40000.01, 50000.00, 138.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 50000.01, 60000.00, 145.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 60000.01, 70000.00, 175.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 70000.01, 80000.00, 190.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 80000.01, 90000.00, 200.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 90000.01, 100000.00, 210.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 100000.01, 150000.00, 240.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 150000.01, 200000.00, 420.00),
('45364', 'Básico (Leves)', 'Norte/Minas/Sul', 200000.01, 300000.00, 450.00);

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Package, MapPin, Palette, FileText, Plug, Car, Users, Shield, ListChecks } from "lucide-react";
import TabelasPrecosTab from "./minha-empresa/TabelasPrecosTab";
import VeiculosAceitosTab from "./minha-empresa/VeiculosAceitosTab";
import UsuariosTab from "./minha-empresa/UsuariosTab";
import GrupoPermissoes from "./minha-empresa/GrupoPermissoes";
import PlanosTab from "./minha-empresa/PlanosTab";
import RegionaisCooperativasTab from "./minha-empresa/RegionaisCooperativasTab";
import PersonalizacaoTab from "./minha-empresa/PersonalizacaoTab";
import ContratoAdesaoTab from "./minha-empresa/ContratoAdesaoTab";
import IntegracoesTab from "./minha-empresa/IntegracoesTab";
import OpcionaisCatalogoTab from "./minha-empresa/OpcionaisCatalogoTab";

export default function MinhaEmpresa() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Empresa</h1>
        <p className="text-muted-foreground text-sm">Configurações gerais da empresa, tabelas, planos e integrações</p>
      </div>

      <Tabs defaultValue="tabelas-precos">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="tabelas-precos" className="gap-2"><DollarSign className="h-4 w-4" /> Tabelas de Preços</TabsTrigger>
          <TabsTrigger value="planos" className="gap-2"><Package className="h-4 w-4" /> Planos</TabsTrigger>
          <TabsTrigger value="regionais-cooperativas" className="gap-2"><MapPin className="h-4 w-4" /> Regionais e Cooperativas</TabsTrigger>
          <TabsTrigger value="veiculos" className="gap-2"><Car className="h-4 w-4" /> Veículos Aceitos</TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2"><Users className="h-4 w-4" /> Usuários</TabsTrigger>
          <TabsTrigger value="permissoes" className="gap-2"><Shield className="h-4 w-4" /> Permissões</TabsTrigger>
          <TabsTrigger value="personalizacao" className="gap-2"><Palette className="h-4 w-4" /> Personalização</TabsTrigger>
          <TabsTrigger value="contrato" className="gap-2"><FileText className="h-4 w-4" /> Contrato de Adesão</TabsTrigger>
          <TabsTrigger value="opcionais" className="gap-2"><ListChecks className="h-4 w-4" /> Opcionais</TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-2"><Plug className="h-4 w-4" /> Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="tabelas-precos" className="mt-6"><TabelasPrecosTab /></TabsContent>
        <TabsContent value="planos" className="mt-6"><PlanosTab /></TabsContent>
        <TabsContent value="regionais-cooperativas" className="mt-6"><RegionaisCooperativasTab /></TabsContent>
        <TabsContent value="veiculos" className="mt-6"><VeiculosAceitosTab /></TabsContent>
        <TabsContent value="usuarios" className="mt-6"><UsuariosTab /></TabsContent>
        <TabsContent value="permissoes" className="mt-6"><GrupoPermissoes /></TabsContent>
        <TabsContent value="personalizacao" className="mt-6"><PersonalizacaoTab /></TabsContent>
        <TabsContent value="contrato" className="mt-6"><ContratoAdesaoTab /></TabsContent>
        <TabsContent value="opcionais" className="mt-6"><OpcionaisCatalogoTab /></TabsContent>
        <TabsContent value="integracoes" className="mt-6"><IntegracoesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

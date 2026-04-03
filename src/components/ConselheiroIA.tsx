import { useState, useEffect } from 'react'
import { supabase, callEdge } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface Props { consultorId: string }

export default function ConselheiroIA({ consultorId }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (consultorId) fetchIA() }, [consultorId])

  async function fetchIA() {
    setLoading(true); setError('')
    const res = await callEdge('gia-conselheiro-ia', { consultor_id: consultorId, modo: 'agenda' })
    if (res.sucesso === false) setError(res.error || 'Erro')
    else setData(res)
    setLoading(false)
  }

  async function marcarExecutada(id: string) {
    await supabase.from('atividades_sugeridas' as any).update({ executada: true, executada_em: new Date().toISOString() }).eq('id', id)
    fetchIA()
  }

  const canalCor: Record<string, string> = { WhatsApp: 'bg-green-100 text-green-700', Ligação: 'bg-blue-100 text-blue-700', Email: 'bg-gray-100 text-gray-700', 'Reunião presencial': 'bg-purple-100 text-purple-700' }
  const prioCor: Record<string, string> = { urgente: 'bg-red-100 text-red-700', alta: 'bg-orange-100 text-orange-700', media: 'bg-blue-100 text-blue-700', baixa: 'bg-gray-100 text-gray-600' }

  if (loading) return (
    <div className="py-8 text-center space-y-2">
      <Loader2 className="h-8 w-8 animate-spin text-[#1A3A5C] mx-auto" />
      <p className="text-sm text-gray-500">Consultando IA...</p>
    </div>
  )
  if (error) return <div className="py-8 text-center"><p className="text-red-500 text-sm mb-2">{error}</p><p className="text-xs text-gray-400">Configure GEMINI_API_KEY nas secrets do Supabase</p></div>
  if (!data) return <div className="py-8 text-center text-gray-400 text-sm">Nenhum dado ainda</div>

  const pma = data.proxima_melhor_acao
  const analise = data.analise_pipeline
  const agenda = data.agenda_sugerida || []
  const scoreConsultor = data.score_consultor
  const conselhoExcecoes = data.conselho_excecoes

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Conselheiro de IA</span>
          <Badge variant="outline" className="text-xs rounded-none">BETA</Badge>
        </div>
        <Button size="sm" variant="outline" className="rounded-none" onClick={fetchIA}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />Atualizar
        </Button>
      </div>

      {/* Score do Consultor */}
      {scoreConsultor !== undefined && (
        <Card className="rounded-none border-[#1A3A5C]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Seu Score</p>
                <p className="text-3xl font-bold text-[#1A3A5C]">{scoreConsultor}<span className="text-sm font-normal text-gray-400">/200</span></p>
              </div>
              <div className="text-right">
                {scoreConsultor >= 120 ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-semibold">IA mais flexível</span>
                  </div>
                ) : scoreConsultor < 80 ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs font-semibold">IA mais restritiva</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Score normal</span>
                )}
              </div>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  scoreConsultor >= 120 ? 'bg-green-500' : scoreConsultor >= 80 ? 'bg-blue-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (scoreConsultor / 200) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conselho sobre excecoes */}
      {conselhoExcecoes && (
        <Card className="rounded-none border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Dica do Conselheiro</p>
              <p className="text-xs text-amber-700 mt-1">{conselhoExcecoes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {pma && (
        <Card className="rounded-none border-blue-200 bg-blue-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Próxima Melhor Ação</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{pma.nome_lead}</p>
            <p className="text-xs text-gray-500">etapa {pma.stage}</p>
            <p className="text-xs">Canal: <strong>{pma.canal_sugerido}</strong></p>
            <p className="text-sm text-gray-700 italic">{pma.mensagem_sugerida}</p>
            <Button size="sm" className="w-full rounded-none bg-[#1A3A5C]">Executar Agora</Button>
          </CardContent>
        </Card>
      )}
      {analise && (
        <Card className="rounded-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Análise do Pipeline</CardTitle></CardHeader>
          <CardContent><div className="grid grid-cols-2 gap-3">
            <div><span className="text-2xl font-bold text-red-600">{analise.leads_parados}</span><p className="text-xs text-gray-500">Leads Parados</p></div>
            <div><span className="text-2xl font-bold text-green-600">{analise.leads_quentes}</span><p className="text-xs text-gray-500">Leads Quentes</p></div>
            <div><span className="text-2xl font-bold">{analise.taxa_conversao}%</span><p className="text-xs text-gray-500">Taxa Conversão</p></div>
            <div><span className="text-2xl font-bold text-blue-600">R$ {Number(analise.oportunidade_valor || 0).toLocaleString('pt-BR')}</span><p className="text-xs text-gray-500">Oportunidade</p></div>
          </div></CardContent>
        </Card>
      )}
      {agenda.length > 0 && (
        <Card className="rounded-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Agenda Sugerida para Hoje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {agenda.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3 border-l-2 border-gray-200 pl-3">
                <span className="text-sm font-mono font-medium text-gray-600 w-12 shrink-0">{a.horario}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.descricao}</p>
                  <div className="flex gap-1 mt-1">
                    <Badge className={`text-xs rounded-none ${canalCor[a.canal] || 'bg-gray-100'}`}>{a.canal}</Badge>
                    <Badge className={`text-xs rounded-none ${prioCor[a.prioridade] || 'bg-gray-100'}`}>{a.prioridade}</Badge>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-xs shrink-0 rounded-none" onClick={() => a.id && marcarExecutada(a.id)}>Executar</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

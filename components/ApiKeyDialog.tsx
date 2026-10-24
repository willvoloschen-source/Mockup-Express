/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';
import { Button } from './Button';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center flex flex-col items-center">
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-6">
          <KeyRound className="w-10 h-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Chave de API do Gemini</h2>
        <p className="text-slate-600 mb-4 leading-relaxed text-sm">
          Este aplicativo utiliza o modelo de geração multimodal de imagens do Google Gemini.
          <br />
          Para renderizar mockups fotorrealistas e gerar novos ativos, selecione uma chave de API válida com faturamento ativo.
        </p>
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left flex items-start gap-2.5">
          <span className="font-bold">Aviso:</span>
          <span>Projetos gratuitos do Google Cloud podem ter limitações de cota para geração de imagens.</span>
        </div>
        <div className="flex flex-col w-full gap-3">
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full"
          >
            Configurar Chave de API
          </Button>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-indigo-600 font-medium inline-flex items-center justify-center gap-1 transition-colors py-1"
          >
            Documentação de cobrança e cotas do Gemini <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyDialog;
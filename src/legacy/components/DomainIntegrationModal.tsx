import React, { useState } from 'react';
import { 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  Server, 
  ShieldCheck, 
  Smartphone, 
  Code2, 
  X,
  Sparkles,
  ArrowUpRight,
  Settings
} from 'lucide-react';

interface DomainIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DomainIntegrationModal: React.FC<DomainIntegrationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'embed' | 'dns' | 'build' | 'pwa'>('embed');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tennisconde2.com';

  const embedCodeFull = `<!-- Incorporação do App Tennis Conde 2 em Tela Cheia -->
<div style="width: 100%; height: 100vh; overflow: hidden; margin: 0; padding: 0;">
  <iframe 
    src="${currentAppUrl}" 
    title="Tennis Conde 2 - Torneios, Rankings e Quadras"
    style="width: 100%; height: 100%; border: none; min-height: 100vh;" 
    allow="clipboard-write; fullscreen; geolocation"
    loading="lazy">
  </iframe>
</div>`;

  const embedCodeResponsive = `<!-- Incorporação Responsiva para WordPress / Elementor / Wix -->
<iframe 
  src="${currentAppUrl}" 
  width="100%" 
  height="900px" 
  frameborder="0" 
  style="border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;"
  allow="clipboard-write; fullscreen"
  loading="lazy">
</iframe>`;

  const htaccessCode = `# Configuração Apache / cPanel para SPA (Single Page Application)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`;

  const netlifyRedirects = `/*    /index.html   200`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  Publicação & Integração Web
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                  tennisconde2.com
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Instruções e códigos prontos para disponibilizar o app no seu domínio oficial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('embed')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'embed'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Incorporar no Site (Iframe)
          </button>

          <button
            onClick={() => setActiveTab('dns')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dns'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" />
            Apontamento DNS (Domínio Próprio)
          </button>

          <button
            onClick={() => setActiveTab('build')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'build'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Build de Produção & Hospedagem
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Instalação App Mobile (PWA)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          {/* TAB 1: EMBED */}
          {activeTab === 'embed' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
                <h3 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Método Mais Rápido: Incorporar em Página Existente do tennisconde2.com
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                  Se você já possui um site em WordPress, Wix, Webflow ou HTML no domínio <strong>https://tennisconde2.com/</strong>, basta colar um dos blocos HTML abaixo na página desejada (ex: <code>/torneios</code> ou na home).
                </p>
              </div>

              {/* Snippet 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Opção A: Tela Cheia 100% Responsiva (Recomendado para páginas dedicadas)
                  </span>
                  <button
                    onClick={() => handleCopy(embedCodeFull, 'full')}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'full' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Código
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto border border-slate-800">
                  {embedCodeFull}
                </pre>
              </div>

              {/* Snippet 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Opção B: Bloco Embutido com Altura Fixa (Ideal para posts e blogs)
                  </span>
                  <button
                    onClick={() => handleCopy(embedCodeResponsive, 'resp')}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'resp' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Código
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto border border-slate-800">
                  {embedCodeResponsive}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: DNS */}
          {activeTab === 'dns' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl">
                <h3 className="font-extrabold text-blue-900 dark:text-blue-200 text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  Apontamento Direto de DNS para tennisconde2.com
                </h3>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-1 leading-relaxed">
                  Para apontar o domínio próprio diretamente para o servidor onde o aplicativo será executado (ex: Vercel, Cloud Run, Netlify ou VPS), configure os registros DNS no seu registrador (Registro.br, Cloudflare, GoDaddy, Hostinger):
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Nome / Host</th>
                      <th className="p-3">Destino / Valor</th>
                      <th className="p-3">TTL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    <tr className="bg-white dark:bg-slate-900">
                      <td className="p-3 font-bold text-emerald-600">A</td>
                      <td className="p-3 text-slate-800 dark:text-slate-200">@</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">76.76.21.21 (ou IP da sua hospedagem)</td>
                      <td className="p-3 text-slate-500">Automático / 3600</td>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <td className="p-3 font-bold text-emerald-600">CNAME</td>
                      <td className="p-3 text-slate-800 dark:text-slate-200">www</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">tennisconde2.com (ou cname.vercel-dns.com)</td>
                      <td className="p-3 text-slate-500">Automático / 3600</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Certificado SSL (HTTPS):
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  O certificado SSL é gerado automaticamente e gratuitamente por plataformas modernas (Vercel, Cloudflare, Netlify) assim que o apontamento DNS propagar (normalmente entre 5 minutos a 2 horas).
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: BUILD & HOSTING */}
          {activeTab === 'build' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  1. Gerando o Pacote de Produção (Dist)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  No terminal do seu projeto, execute o comando de compilação:
                </p>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl text-emerald-400 font-mono text-xs">
                  <span>npm run build</span>
                  <button
                    onClick={() => handleCopy('npm run build', 'npmbuild')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'npmbuild' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Isso gerará a pasta <code>/dist</code> contendo todos os arquivos estáticos minificados e prontos para qualquer servidor web.
                </p>
              </div>

              {/* Apache / cPanel */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Arquivo .htaccess para Hospedagens Apache / cPanel / HostGator / Hostinger:
                  </span>
                  <button
                    onClick={() => handleCopy(htaccessCode, 'htaccess')}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                  >
                    {copiedKey === 'htaccess' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-slate-300 text-xs font-mono rounded-xl overflow-x-auto border border-slate-800">
                  {htaccessCode}
                </pre>
              </div>

              {/* Netlify / Cloudflare */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Arquivo _redirects para Netlify e Cloudflare Pages:
                  </span>
                  <button
                    onClick={() => handleCopy(netlifyRedirects, 'redirects')}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                  >
                    {copiedKey === 'redirects' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-slate-300 text-xs font-mono rounded-xl overflow-x-auto border border-slate-800">
                  {netlifyRedirects}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: PWA */}
          {activeTab === 'pwa' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-800/60 rounded-2xl">
                <h3 className="font-extrabold text-lime-950 dark:text-lime-200 text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-lime-600" />
                  Instalação Direta no Celular dos Tenistas (PWA)
                </h3>
                <p className="text-xs text-lime-900 dark:text-lime-300 mt-1 leading-relaxed">
                  O aplicativo já está configurado com <strong>Web App Manifest</strong> e ícones vetoriais. Ao acessar <strong>https://tennisconde2.com/</strong> no celular:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    📱 No iPhone (Safari iOS):
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>Abra o site <strong>tennisconde2.com</strong> no Safari</li>
                    <li>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima)</li>
                    <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong></li>
                    <li>O ícone do Tennis Conde 2 aparecerá como um app nativo no celular!</li>
                  </ol>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    🤖 No Android (Chrome):
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>Abra o site <strong>tennisconde2.com</strong> no Chrome</li>
                    <li>Toque no menu (3 pontinhos no canto superior direito)</li>
                    <li>Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong></li>
                    <li>Pronto! O app abrirá em tela cheia sem a barra de endereços do navegador.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Meta tags, Canonical URL e Open Graph prontos para tennisconde2.com
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://tennisconde2.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              Visitar tennisconde2.com
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

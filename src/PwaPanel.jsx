import React from 'react';
import {Download,Check,WifiOff,RefreshCw,Smartphone} from 'lucide-react';

export function PwaNotice({pwa,editing}){
  if(!pwa.waiting&&!pwa.error&&pwa.online)return null;
  return <div className="pwa-notices" aria-live="polite">
    {!pwa.online&&<div className="pwa-notice"><WifiOff size={18}/><span><strong>Você está sem internet.</strong> Os registros continuam sendo salvos neste aparelho.{!pwa.offlineReady?' Reabra com internet para preparar o acesso offline.':''}</span></div>}
    {pwa.waiting&&<div className="pwa-notice"><RefreshCw size={18}/><span><strong>Atualização pronta.</strong> {editing?'Feche a ficha antes de atualizar.':'Atualize o Rancho para carregar a versão nova.'}</span><button aria-label="Atualizar aplicativo" disabled={editing} className="secondary" onClick={pwa.update}>Atualizar</button></div>}
    {pwa.error&&<div className="pwa-notice">{pwa.error}</div>}
  </div>;
}

export default function PwaPanel({pwa,cloud}){
  return <section className="card pwa-panel"><div className="pwa-panel-heading"><img src="/icons/rancho-192.png" width="56" height="56" alt="Ícone do aplicativo Rancho"/><div><h2>Rancho no seu aparelho</h2><p>Abra direto pela tela inicial, como um aplicativo.</p></div></div>
    <div className="pwa-state"><span><Check size={16}/>{pwa.installed?'Aberto como aplicativo':'Disponível pelo navegador'}</span><span>{pwa.offlineReady?<Check size={16}/>:<Smartphone size={16}/>} {pwa.offlineReady?'Preparado para uso sem internet':'Preparando acesso offline no site publicado'}</span></div>
    {pwa.canInstall&&!pwa.installed&&<button className="primary" disabled={pwa.installing} onClick={pwa.install}><Download size={17}/>{pwa.installing?'Aguardando navegador…':'Instalar aplicativo'}</button>}
    {pwa.installed?<p>O Rancho já está aberto em modo aplicativo. As novas versões serão oferecidas aqui quando estiver conectado.</p>:<div className="install-instructions"><h3>Como instalar</h3><ul><li><strong>Android (Chrome):</strong> abra o menu ⋮ e procure “Instalar aplicativo” ou “Adicionar à tela inicial”.</li><li><strong>iPhone ou iPad (Safari):</strong> Compartilhar → Adicionar à Tela de Início. Ative “Abrir como App”, se aparecer.</li><li><strong>Computador (Chrome ou Edge):</strong> procure o ícone de instalação na barra de endereço ou a opção de instalar no menu.</li></ul><p>Quando o navegador permitir, o botão de instalação aparecerá acima. Não é necessário baixar um APK.</p></div>}
    <div className="pwa-offline-info"><h3>Trabalhar sem internet</h3><p>Abra o site com internet e aguarde a indicação “Preparado para uso sem internet”. Depois, consulte os animais e registre produção, cuidados e movimentações mesmo sem conexão.</p><p>{cloud?.account?<><strong>Conta conectada.</strong> Registros feitos offline ficam neste aparelho até a próxima sincronização. Confira a indicação “Dados sincronizados” antes de limpar dados ou trocar de dispositivo.</>:<><strong>Modo local.</strong> Para sincronizar e ter backups automáticos, entre ou crie uma conta nesta tela. Instalar o aplicativo, sozinho, não ativa a conta.</>} Use também o backup manual regularmente.</p></div>
    <button className="secondary" disabled={!pwa.online} onClick={pwa.checkUpdate}><RefreshCw size={16}/>Verificar atualizações</button><small className="pwa-version">Rancho 0.3 · Aplicativo instalável</small>
  </section>;
}

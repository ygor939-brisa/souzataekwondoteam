/* =========================================================
   Souza Taekwondo Team — site + área do aluno + gestão
   Dados e login: Supabase (banco de dados + autenticação).
   As regras de quem vê o quê ficam NO BANCO (Row Level Security),
   então ninguém consegue ver ou alterar o que não pode, mesmo
   mexendo no navegador.
   ========================================================= */

/* ---------- 1. CONFIGURAÇÃO (edite aqui) ---------- */
const CONFIG = {
  nome: 'Souza Taekwondo Team',
  lema: 'Leadership and Respect',
  logo: 'img/logo.png',
  site: 'https://souza-taekwondo-team.pages.dev/',
  whatsapp: '5511941646831',       // só números, com DDI 55 + DDD
  whatsappTexto: '(11) 94164-6831',
  telefone: '(11) 94164-6831',
  email: 'escola.souzataekwondoteam@gmail.com',
  endereco: 'Av. Netuto, 588 — Novo Horizonte, Carapicuíba/SP',
  cep: '06341-420',
  cidade: 'Carapicuíba', uf: 'SP',
  mapa: 'https://www.google.com/maps/search/?api=1&query=Av.+Netuto,+588+Novo+Horizonte+Carapicu%C3%ADba+SP',
  horarios: [],                     // ex.: ['Seg e Qua — 18h às 19h (infantil)']; vazio = "consulte pelo WhatsApp"
  pix: '',                          // chave Pix para as cobranças (opcional)
  redes: [
    { nome: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61577495603375' },
  ],
  // Fotos usadas enquanto a galeria (painel → Site) estiver vazia
  fotos: [
    { arquivo: 'img/foto1.jpg', legenda: 'Nosso tatame' },
    { arquivo: 'img/foto2.jpg', legenda: 'Turma infantil' },
    { arquivo: 'img/foto3.jpg', legenda: 'Treino de chutes' },
    { arquivo: 'img/foto4.jpg', legenda: 'Exame de faixa' },
    { arquivo: 'img/foto5.jpg', legenda: 'Competições' },
    { arquivo: 'img/foto6.jpg', legenda: 'Estrutura' },
  ],
  // Supabase (a chave "publishable" é pública por natureza; a segurança está nas regras do banco)
  supabaseUrl: 'https://lbmtleuaombybcwurhhl.supabase.co',
  supabaseKey: 'sb_publishable_PqY4oSjaQR1blqF9HjRaTw_0n3NcOR-',
  dominioLogin: 'souzataekwondo.app', // usuário "joao" vira joao@souzataekwondo.app por baixo
};

const FAIXAS = [
  { id: 'branca',   nome: 'Branca',   cor: '#f4f4f4' },
  { id: 'amarela',  nome: 'Amarela',  cor: '#f3c613' },
  { id: 'verde',    nome: 'Verde',    cor: '#2e9e4f' },
  { id: 'azul',     nome: 'Azul',     cor: '#2266c4' },
  { id: 'vermelha', nome: 'Vermelha', cor: '#c8102e' },
  { id: 'preta',    nome: 'Preta',    cor: '#111111' },
];
const PAPEIS = { aluno: 'Aluno', responsavel: 'Responsável', admin: 'Administração', mestre: 'Mestre', instrutor: 'Instrutor', instrutora: 'Instrutora' };
const isStaff = u => !!u && ['admin', 'mestre', 'instrutor', 'instrutora'].includes(u.papel);
const isGestor = u => !!u && ['admin', 'mestre'].includes(u.papel);
const TIPOS_COB = { mensalidade: 'Mensalidade', exame: 'Taxa de exame', evento: 'Evento', uniforme: 'Uniforme', outro: 'Outro' };

/* ---------- 2. UTILITÁRIOS ---------- */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => isoDate(new Date());
const diasAtras = n => { const d = new Date(); d.setDate(d.getDate() - n); return isoDate(d); };
const mesAtual = () => today().slice(0, 7);
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fmtDate = s => { if (!s) return '—'; const [y, m, d] = String(s).slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
const fmtMes = ym => { const [y, m] = ym.split('-'); return `${MESES_LONGOS[+m - 1]} de ${y}`; };
const fmtDataHora = s => { const d = new Date(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const reais = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const faixa = id => FAIXAS.find(f => f.id === id) || FAIXAS[0];
const faixaIdx = id => FAIXAS.findIndex(f => f.id === id);
const beltHTML = (id, big) => { const f = faixa(id); return `<span class="belt${big ? ' big' : ''}"><i style="background:${f.cor};${f.id === 'branca' ? 'outline:1px solid #bbb;' : ''}"></i>Faixa ${esc(f.nome)}</span>`; };
const safeUrl = u => /^https?:/i.test(String(u || '').trim()) ? String(u).trim() : '';
const nul = v => (v === '' || v == null ? null : v);
const primeiroNome = n => String(n || '').split(' ')[0];
const idade = nasc => { if (!nasc) return null; const n = new Date(nasc + 'T12:00'), h = new Date(); let i = h.getFullYear() - n.getFullYear(); if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) i--; return i; };
// Telefone brasileiro → número para wa.me (com 55)
const foneWa = t => { let d = String(t || '').replace(/\D/g, ''); if (!d) return ''; if (d.length <= 11) d = '55' + d; return d; };
const waPara = (tel, txt) => { const n = foneWa(tel); return n ? `https://wa.me/${n}?text=${encodeURIComponent(txt)}` : ''; };
const gerarSenha = () => { const c = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; const r = crypto.getRandomValues(new Uint32Array(8)); for (const x of r) s += c[x % c.length]; return s; };
const avatar = (u, cls = '') => u.foto ? `<img class="avatar ${cls}" src="${esc(u.foto)}" alt="Foto de ${esc(u.nome)}">` : `<span class="avatar ${cls} vazio">${esc(primeiroNome(u.nome).slice(0, 1).toUpperCase())}</span>`;

function toast(msg, err) {
  const t = $('#toast'); t.textContent = msg; t.className = 'show' + (err ? ' err' : '');
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = ''), 3500);
}
function confirmar(el, texto = 'Clique de novo p/ confirmar') {
  if (el.dataset.armed) return true;
  const orig = el.textContent; el.dataset.armed = '1'; el.textContent = texto;
  setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = orig; } }, 3500);
  return false;
}
// Trava o botão enquanto salva, para evitar clique duplo
async function ocupado(f, fn) {
  const btn = f.querySelector('button:not([type=button])'); if (btn) btn.disabled = true;
  try { await fn(); } catch (e) { toast(e.message || 'Algo deu errado. Tente de novo.', true); }
  finally { if (btn && btn.isConnected) btn.disabled = false; }
}
const ok = ({ error, data }) => { if (error) throw new Error(traduz(error.message)); return data; };
function traduz(m = '') {
  if (/Invalid login credentials/i.test(m)) return 'Usuário ou senha incorretos.';
  if (/banned/i.test(m)) return 'Este acesso está desativado. Fale com a academia.';
  if (/row-level security|permission denied/i.test(m)) return 'Você não tem permissão para isso.';
  if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/same.*password|different from the old/i.test(m)) return 'A nova senha precisa ser diferente da atual.';
  if (/duplicate key/i.test(m)) return 'Esse registro já existe.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com o servidor. Verifique a internet.';
  return m;
}
function baixarArquivo(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function baixarCsv(nome, cols, rows) {
  const cel = v => { v = String(v ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  baixarArquivo(nome, '﻿' + [cols, ...rows].map(r => r.map(cel).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
}
function carregarScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = Object.assign(document.createElement('script'), { src, onload: res, onerror: () => rej(new Error('Não foi possível carregar um componente. Verifique a internet.')) });
    document.head.appendChild(s);
  });
}
// Diminui a foto antes de enviar (até 900px, JPEG)
function reduzirImagem(file, max = 900) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob(b => b ? res(b) : rej(new Error('Não foi possível ler a imagem.')), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Arquivo de imagem inválido.')); };
    img.src = url;
  });
}

/* ---------- 3. BANCO (Supabase) ---------- */
const sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
const vazioDb = () => ({ users: [], conteudos: [], videos: [], eventos: [], turmas: [], vinculos: [], presencas: [], inscricoes: [], cobrancas: [] });
let db = vazioDb();
let publico = { galeria: [], depoimentos: [] };
let auditoria = null;
let meuId = null;
let carregando = true;
let demoAtivo = false;

const DEMO_ACESSOS = {
  'demo.mestre': { senha: 'MestreDemo2026!', id: 'demo-mestre' },
  'demo.aluno': { senha: 'AlunoDemo2026!', id: 'demo-aluno' },
};

function carregarDemo(id) {
  demoAtivo = true;
  meuId = id;
  db = vazioDb();
  const baseCadastro = { matricula: 'DEMO-001', nascimento: '2012-04-15', responsavel: 'Responsável demonstração', telefone: '(11) 94164-6831', email: 'demo@souzataekwondoteam.com', endereco: 'Carapicuíba/SP', inicio: today() };
  db.users = [
    { id: 'demo-mestre', login: 'demo.mestre', nome: 'Mestre Souza — Demonstração', papel: 'mestre', faixa: 'preta', ativo: true, cadastro: { ...baseCadastro, matricula: 'MESTRE-DEMO' }, historico: [], apresentados: [] },
    { id: 'demo-aluno', login: 'demo.aluno', nome: 'Aluno Demonstração', papel: 'aluno', faixa: 'amarela', ativo: true, turmaId: 'demo-turma', cadastro: baseCadastro, historico: [{ id: 'demo-historico', data: today(), faixa: 'amarela', observacao: 'Conta temporária para demonstração.' }], apresentados: [] },
  ];
  db.turmas = [{ id: 'demo-turma', nome: 'Turma demonstração', dias: 'Segunda e quarta', horario: '19h' }];
  db.eventos = [{ id: 'demo-evento', titulo: 'Seminário GTMA', tipo: 'evento', data: isoDate(new Date(Date.now() + 14 * 86400000)), local: 'Souza Taekwondo Team', hora: '10:00', descricao: 'Evento ilustrativo para a gravação da demonstração.', materiais: [] }];
}

// Busca todas as linhas (o banco entrega no máximo 1000 por vez)
async function todas(montar) {
  const out = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await montar().range(i, i + 999);
    if (error) throw new Error(traduz(error.message));
    out.push(...data); if (data.length < 1000) return out;
  }
}
async function carregar() {
  const { data: { session } } = await sb.auth.getSession();
  meuId = session?.user?.id || null;
  if (!meuId) { db = vazioDb(); return; }
  const [p, h, a, c, v, e, t, r, pr, i, cb] = await Promise.all([
    todas(() => sb.from('perfis').select('*').order('nome')),
    todas(() => sb.from('historico').select('*').order('data')),
    todas(() => sb.from('apresentados').select('aluno_id, conteudo_id')),
    todas(() => sb.from('conteudos').select('*').order('criado_em')),
    todas(() => sb.from('videos').select('*').order('criado_em')),
    todas(() => sb.from('eventos').select('*').order('data')),
    todas(() => sb.from('turmas').select('*').order('nome')),
    todas(() => sb.from('responsaveis').select('*')),
    todas(() => sb.from('presencas').select('aluno_id, data, turma_id').gte('data', diasAtras(400))),
    todas(() => sb.from('inscricoes').select('*')),
    todas(() => sb.from('cobrancas').select('*').order('vencimento')),
  ]);
  db.users = p.map(u => ({
    id: u.id, login: u.login, nome: u.nome, papel: u.papel, faixa: u.faixa || 'branca', ativo: u.ativo !== false, inativoDesde: u.inativo_desde,
    foto: u.foto_url, turmaId: u.turma_id, valorMensalidade: u.valor_mensalidade, diaVencimento: u.dia_vencimento,
    cadastro: { matricula: u.matricula, nascimento: u.nascimento, responsavel: u.responsavel, telefone: u.telefone, email: u.email, endereco: u.endereco, inicio: u.inicio },
    historico: h.filter(x => x.aluno_id === u.id),
    apresentados: a.filter(x => x.aluno_id === u.id).map(x => x.conteudo_id),
  }));
  db.conteudos = c; db.videos = v; db.turmas = t; db.vinculos = r; db.presencas = pr; db.inscricoes = i; db.cobrancas = cb;
  db.eventos = e.map(x => ({ ...x, materiais: Array.isArray(x.materiais) ? x.materiais : [] }));
}
async function carregarPublico() {
  const [g, d] = await Promise.all([
    sb.from('galeria').select('*').order('criado_em', { ascending: false }).limit(60),
    sb.from('depoimentos').select('*').order('criado_em', { ascending: false }),
  ]);
  publico = { galeria: g.data || [], depoimentos: d.data || [] };
}
const currentUser = () => db.users.find(u => u.id === meuId) || null;
const userById = id => db.users.find(u => u.id === id);
const alunos = (soAtivos = true) => db.users.filter(x => x.papel === 'aluno' && (!soAtivos || x.ativo));
const turmaNome = id => db.turmas.find(t => t.id === id)?.nome || '';
// Alunos que a pessoa logada acompanha (ela mesma, ou os filhos se for responsável)
const meusAlunos = u => u.papel === 'responsavel' ? db.vinculos.filter(v => v.responsavel_id === u.id).map(v => userById(v.aluno_id)).filter(Boolean) : [u];
async function recarregar() { await carregar(); render(); }

async function subirArquivo(file, bucket = 'eventos', pasta = crypto.randomUUID()) {
  if (!file || !file.size) return '';
  if (file.size > 10 * 1024 * 1024) throw new Error(`"${file.name || 'arquivo'}" passa de 10 MB.`);
  const nome = String(file.name || 'foto.jpg').normalize('NFD').replace(/[^\w.-]+/g, '_');
  const path = `${pasta}/${crypto.randomUUID().slice(0, 8)}-${nome}`;
  ok(await sb.storage.from(bucket).upload(path, file, { contentType: file.type || 'image/jpeg' }));
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
function caminhoDoArquivo(url, bucket) {
  const marca = `/object/public/${bucket}/`;
  return url && url.includes(marca) ? decodeURIComponent(url.split(marca)[1]) : null;
}
async function funcaoAluno(body) {
  const { data, error } = await sb.functions.invoke('gerenciar-aluno', { body });
  if (error) {
    let msg = error.message;
    try { msg = (await error.context.json()).error || msg; } catch (e) {}
    throw new Error(msg);
  }
  return data;
}

/* ---------- Cálculos usados em várias telas ---------- */
function progresso(a) {
  const doExame = db.conteudos.filter(c => c.faixa === a.faixa);
  const feitos = doExame.filter(c => a.apresentados.includes(c.id)).length;
  return { total: doExame.length, feitos, pct: doExame.length ? Math.round(feitos / doExame.length * 100) : 0, apto: doExame.length > 0 && feitos === doExame.length };
}
const presencasDe = (id, desde) => db.presencas.filter(p => p.aluno_id === id && (!desde || p.data >= desde));
const statusCob = c => c.pago_em ? 'pago' : c.vencimento < today() ? 'atrasado' : 'aberto';
const STATUS_COB = { pago: 'Pago', atrasado: 'Atrasado', aberto: 'Em aberto' };

/* ---------- 4. NAVEGAÇÃO ---------- */
let rota = location.hash.startsWith('#/') ? location.hash : '#/login/aluno';
// replace=true para redirecionamentos (não cria entrada no "voltar" do navegador)
const go = (h, replace) => {
  if (h !== rota) history[replace ? 'replaceState' : 'pushState'](null, '', h === '#/' ? location.pathname : h);
  rota = h; render();
};
const inicioDe = u => isStaff(u) ? '#/painel/alunos' : '#/aluno';

/* ---------- 5. PEDAÇOS DE TELA ---------- */
const logoHTML = (cls = '') => {
  const u = currentUser();
  const destino = u ? inicioDe(u) : rota.includes('/instrutor') ? '#/login/instrutor' : '#/login/aluno';
  return `<a class="brand ${cls}" href="${destino}" data-action="inicio"><img src="${CONFIG.logo}" alt="${esc(CONFIG.nome)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'logo-mark',textContent:'S'}))"><span>${esc(CONFIG.nome)}</span></a>`;
};
const waLink = (txt = 'Olá! Gostaria de agendar uma aula experimental.') => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(txt)}`;

function appBar(u) {
  const sub = isStaff(u) ? PAPEIS[u.papel] : u.papel === 'responsavel' ? 'Responsável' : 'Faixa ' + faixa(u.faixa).nome;
  return `<header class="app-bar no-print"><div class="wrap">${logoHTML()}
    <div class="who">${esc(u.nome)}<small>${esc(sub)}</small></div>
    <a class="btn btn-ghost btn-sm" href="#/senha">Senha</a>
    <button class="btn btn-ghost btn-sm" data-action="logout">Sair</button></div></header>`;
}

function eventItem(e) {
  const [, m, d] = e.data.split('-');
  const passado = e.data < today();
  const n = db.inscricoes.filter(i => i.evento_id === e.id).length;
  return `<button class="event-item" data-action="open-event" data-id="${e.id}">
    <span class="datebox"><b>${d}</b><small>${MESES[+m - 1]}</small></span>
    <span class="grow"><h4>${esc(e.titulo)}</h4><span class="muted small">${esc(e.local)}${e.hora ? ' · ' + esc(e.hora) : ''}${n ? ` · ${n} inscrito${n > 1 ? 's' : ''}` : ''}</span></span>
    <span class="tag ${passado ? 'passado' : e.tipo}">${passado ? 'Realizado' : e.tipo === 'exame' ? 'Exame' : 'Evento'}</span></button>`;
}
function eventLists() {
  const t = today();
  const byDate = (a, b) => a.data.localeCompare(b.data);
  const exames = db.eventos.filter(e => e.tipo === 'exame' && e.data >= t).sort(byDate);
  const eventos = db.eventos.filter(e => e.tipo === 'evento' && e.data >= t).sort(byDate);
  const recentes = db.eventos.filter(e => e.data < t).sort(byDate).reverse().slice(0, 6);
  const box = (titulo, ico, arr, vazio) => `<div class="card"><h3>${ico} ${titulo}</h3><div class="events">${arr.length ? arr.map(eventItem).join('') : `<p class="empty">${vazio}</p>`}</div></div>`;
  return `<div class="grid grid-2" style="margin-top:18px">
    ${box('Próximos exames', '🥋', exames, 'Nenhum exame marcado.')}
    ${box('Próximos eventos', '📅', eventos, 'Nenhum evento marcado.')}
    ${box('Eventos recentes', '🏅', recentes, 'Nada por aqui ainda.')}</div>`;
}

function videoEmbed(url) {
  const u = safeUrl(url);
  if (!u) return `<div class="frame">🎬<br>Vídeo em breve</div>`;
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `<div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Vídeo" allowfullscreen loading="lazy"></iframe></div>`;
  const vm = u.match(/vimeo\.com\/(\d+)/);
  if (vm) return `<div class="frame"><iframe src="https://player.vimeo.com/video/${vm[1]}" title="Vídeo" allowfullscreen loading="lazy"></iframe></div>`;
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return `<div class="frame"><video src="${esc(u)}" controls preload="metadata"></video></div>`;
  return `<div class="frame"><a class="btn btn-red btn-sm" href="${esc(u)}" target="_blank" rel="noopener">▶ Assistir</a></div>`;
}
const videoCard = v => `<div class="video">${videoEmbed(v.url)}<div class="body"><h4>${esc(v.titulo)}</h4><p class="muted small" style="margin:0">${esc(v.descricao)}</p></div></div>`;

/* ---------- 6. PÁGINA PÚBLICA ---------- */
// Fundo do topo: equipamentos girando devagar em volta do círculo dourado + faíscas subindo
function heroAnimado() {
  const pecas = EQUIPAMENTOS.map(([nome, contorno, detalhe], i) =>
    `<span class="orb-item" style="--a:${i * 60}deg"><svg viewBox="0 0 100 100" aria-label="${nome}"><path d="${contorno}"></path><path d="${detalhe}" class="ab-det"></path></svg></span>`).join('');
  const faiscas = Array.from({ length: 14 }, (_, i) =>
    `<i style="--x:${(i * 37) % 100}%;--t:${6 + (i * 7) % 7}s;--d:-${(i * 1.3).toFixed(1)}s;--s:${2 + (i % 3)}px"></i>`).join('');
  return `<div class="hero-orbita" aria-hidden="true"><div class="orb-anel"></div><div class="orb-giro">${pecas}</div></div><div class="hero-faiscas" aria-hidden="true">${faiscas}</div>`;
}
function heroBastoes() {
  return `<img class="hero-dojang" src="img/dojang.jpg" alt="" aria-hidden="true">
    <div class="hero-bastoes" aria-hidden="true">
      <img class="hero-staff hero-staff-a" src="img/combat-staff-cutout.png" alt="">
      <img class="hero-staff hero-staff-b" src="img/combat-staff-cutout.png" alt="">
    </div>`;
}
function viewHome() {
  const beneficios = [
    ['🙇', 'Respeito', 'A cumprimentar, ouvir e respeitar professores, colegas e a família.'],
    ['🎯', 'Disciplina e foco', 'A ter rotina, concentração e compromisso com os próprios objetivos.'],
    ['💪', 'Autoconfiança', 'A acreditar em si, perder a timidez e lidar com desafios.'],
    ['🤸', 'Coordenação motora', 'Equilíbrio, flexibilidade, agilidade e consciência do próprio corpo.'],
    ['🛡️', 'Defesa pessoal', 'A se proteger com responsabilidade, e a evitar conflitos.'],
    ['🤝', 'Amizade e trabalho em equipe', 'A conviver, ajudar os colegas e fazer novos amigos.'],
    ['🏆', 'Superação', 'A cada faixa, uma conquista: aprende que esforço gera resultado.'],
    ['🥗', 'Vida saudável', 'Gasta energia, dorme melhor e troca as telas pelo movimento.'],
  ];
  const fotos = publico.galeria.length
    ? publico.galeria.slice(0, 8).map(g => ({ arquivo: g.url, legenda: g.legenda || '' }))
    : CONFIG.fotos;
  const deps = publico.depoimentos.filter(d => d.publicado);
  return `
  <div id="progresso" aria-hidden="true"></div>
  <header class="topbar"><div class="wrap">${logoHTML()}
    <nav class="nav"><a href="#metodo">Método</a><a href="#pais">Para os pais</a><a href="#gtma">GTMA</a><a href="#matricula">Matrícula</a><a href="#contato">Contato</a></nav>
    <a class="btn btn-gold" href="#/login">Login</a></div></header>

  <section class="hero hero-front-ygor">${heroBastoes()}<div class="wrap">
    <span class="kicker">${esc(CONFIG.nome)} · ${esc(CONFIG.cidade)}</span>
    <h1 class="hero-titulo">Venha treinar <span>conosco</span></h1>
    <p>Taekwondo tradicional com técnica, disciplina, liderança e respeito. Para crianças, jovens e adultos — a primeira aula experimental é por nossa conta.</p>
    <div class="hero-actions">
      <a class="btn btn-red brilho-mouse" href="#experimental"><span>Agendar aula experimental</span></a>
      <a class="btn btn-ghost" href="#metodo">Conhecer o método</a>
    </div>
    <div class="hero-meta"><span><b>Método tradicional</b>Formação completa</span><span><b>Filiada à GTMA</b>Padrão internacional</span></div>
    </div><span class="rolar" aria-hidden="true">Role para explorar</span></section>

  <section class="block" id="metodo"><div class="wrap">
    <div class="section-head revelar"><span class="kicker">Nosso método</span><h2>Formação além do tatame</h2>
      <p class="muted">Uma metodologia que desenvolve técnica, caráter e constância em cada etapa da jornada.</p></div>
    <div class="metodo">${[['01 · Precisão', 'Técnica', 'Fundamentos sólidos, movimentos conscientes e evolução acompanhada.'],
      ['02 · Consistência', 'Disciplina', 'Foco, respeito e compromisso aplicados dentro e fora da academia.'],
      ['03 · Progresso', 'Evolução', 'Cada treino constrói confiança e prepara para o próximo desafio.']]
      .map(([n, t, d]) => `<article class="metodo-card inclinar revelar"><span class="metodo-num">${n}</span><div><h3>${t}</h3><p>${d}</p></div></article>`).join('')}</div>
  </div></section>

  <section class="block light" id="pais"><div class="wrap">
    <div class="section-head revelar"><span class="kicker">Para os pais</span>
      <h2>O que seu filho aprende aqui</h2>
      <p class="muted">No Taekwondo, o tatame é uma escola de valores. Aqui seu filho aprende muito mais que chutes:</p></div>
    <div class="benefits">${beneficios.map(([i, t, d]) => `<div class="benefit revelar"><div class="ico">${i}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
  </div></section>

  <section class="block" id="fotos"><div class="wrap">
    <div class="section-head revelar"><span class="kicker">A academia</span><h2>Conheça nosso espaço</h2>
      <p class="muted">Estrutura, treinos, exames e eventos da nossa equipe.</p></div>
    <div class="gallery">${fotos.map(f => `<figure><span class="ph">🥋</span><img src="${esc(f.arquivo)}" alt="${esc(f.legenda || 'Foto da academia')}" loading="lazy" onerror="this.remove()">${f.legenda ? `<figcaption>${esc(f.legenda)}</figcaption>` : ''}</figure>`).join('')}</div>
  </div></section>

  ${deps.length ? `<section class="block light" id="depoimentos"><div class="wrap">
    <div class="section-head"><span class="kicker">Depoimentos</span><h2>Quem treina, recomenda</h2></div>
    <div class="depoimentos">${deps.slice(0, 6).map(d => `<blockquote class="depoimento"><p>“${esc(d.texto)}”</p><footer><b>${esc(d.nome)}</b>${d.relacao ? ` · ${esc(d.relacao)}` : ''}</footer></blockquote>`).join('')}</div>
  </div></section>` : ''}

  <section class="block alt gtma" id="gtma"><div class="wrap split">
    <div class="revelar"><span class="kicker">Conexão internacional</span><h2>Global Traditional Martial Arts</h2>
      <p>A <b>GTMA</b> é uma organização internacional sediada em Little Rock, Arkansas (EUA), focada no ensino do Taekwondo tradicional e na gestão de academias licenciadas.</p>
      <p>Fundada pelo Grão-Mestre G.K. Lee e pela Mestre Chefe Kathy Lee, une a tradição marcial coreana a metodologias modernas de ensino.</p>
      <div class="gtma-pontos"><div><b>Padrão internacional</b><span>Ensino estruturado</span></div><div><b>Formação contínua</b><span>Mestres e instrutores</span></div></div></div>
    <div class="revelar gtma-logo"><img src="img/gtma-logo.jpg" alt="Logo da Global Traditional Martial Arts (GTMA)" loading="lazy"></div>
  </div></section>

  <section class="block" id="matricula"><div class="wrap">
    <div class="section-head revelar"><span class="kicker">Matrícula</span><h2>Comece sua jornada</h2>
      <p class="muted">Consulte turmas, horários e condições diretamente com a equipe.</p></div>
    <div class="planos">
      <article class="plano inclinar revelar"><span class="metodo-num">Primeiro contato</span><h3>Aula experimental</h3><p>Conheça a metodologia e encontre a turma adequada.</p><a class="link-seta" href="#experimental">Agendar agora →</a></article>
      <article class="plano destaque inclinar revelar"><span class="selo">Recomendado</span><h3>Plano de treinamento</h3>
        <ul><li>✓ Turmas por idade e nível</li><li>✓ Progressão técnica acompanhada</li><li>✓ Preparação para graduação</li><li>✓ Comunidade GTMA</li></ul>
        <a class="btn btn-red brilho-mouse" href="${waLink('Olá! Gostaria de conhecer os planos de treinamento.')}" target="_blank" rel="noopener"><span>Consultar condições</span></a></article>
    </div>
  </div></section>

  <section class="block cta" id="experimental"><div class="wrap">
    <h2>Sua primeira aula é grátis</h2><p>Preencha e a gente continua a conversa no WhatsApp.</p>
    <form class="exp-form" data-form="experimental">
      <input name="nome" required placeholder="Nome de quem vai treinar" aria-label="Nome de quem vai treinar">
      <input name="idade" type="number" min="3" max="99" placeholder="Idade" aria-label="Idade">
      ${CONFIG.horarios.length ? `<select name="horario" aria-label="Horário de interesse"><option value="">Horário de interesse</option>${CONFIG.horarios.map(h => `<option>${esc(h)}</option>`).join('')}</select>` : ''}
      <button class="btn" style="background:#111;color:#fff">Agendar pelo WhatsApp</button>
    </form>
  </div></section>

  <footer class="footer" id="contato"><div class="wrap">
    <div class="footer-grid">
      <div>${logoHTML()}<p style="margin-top:12px">${esc(CONFIG.lema)}</p></div>
      <div><h3>Contato</h3>
        <p><a href="${waLink('Olá!')}" target="_blank" rel="noopener">WhatsApp: ${esc(CONFIG.whatsappTexto)}</a></p>
        <p><a href="tel:+${CONFIG.whatsapp}">Telefone: ${esc(CONFIG.telefone)}</a></p><p><a href="mailto:${esc(CONFIG.email)}">${esc(CONFIG.email)}</a></p></div>
      <div><h3>Endereço</h3><p><a href="${esc(CONFIG.mapa)}" target="_blank" rel="noopener">${esc(CONFIG.endereco)}<br>CEP ${esc(CONFIG.cep)}</a></p>
        ${CONFIG.horarios.length ? CONFIG.horarios.map(h => `<p>${esc(h)}</p>`).join('') : `<p><a href="${waLink('Olá! Quais são os horários das turmas?')}" target="_blank" rel="noopener">Horários: consulte pelo WhatsApp</a></p>`}</div>
      <div><h3>Redes sociais</h3><div class="socials">${CONFIG.redes.map(r => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.nome)}</a>`).join('')}</div>
        <p style="margin-top:16px"><a class="btn btn-gold btn-sm" href="#/login">Login</a></p></div>
    </div>
    <div class="copy">© ${new Date().getFullYear()} ${esc(CONFIG.nome)} · Filiada à GTMA</div>
  </div></footer>`;
}
// Dados para o Google entender que é uma academia (preenchidos a partir do CONFIG)
function dadosParaGoogle() {
  if (document.getElementById('ld-academia')) return;
  const ld = {
    '@context': 'https://schema.org', '@type': 'SportsActivityLocation', name: CONFIG.nome, slogan: CONFIG.lema,
    url: CONFIG.site, logo: CONFIG.site + 'img/logo.png', image: CONFIG.site + 'img/logo.png',
    telephone: CONFIG.telefone, email: CONFIG.email, sport: 'Taekwondo',
    address: { '@type': 'PostalAddress', streetAddress: 'Av. Netuto, 588 — Novo Horizonte', addressLocality: CONFIG.cidade, addressRegion: CONFIG.uf, postalCode: CONFIG.cep, addressCountry: 'BR' },
    sameAs: CONFIG.redes.map(r => r.url),
  };
  document.head.appendChild(Object.assign(document.createElement('script'), { id: 'ld-academia', type: 'application/ld+json', textContent: JSON.stringify(ld) }));
}

/* ---------- 7. LOGIN / SENHA ---------- */
// Faixa que entra pelos lados e dá o nó; ao entrar, ganha a cor da graduação
function faixaAnimada() {
  const costura = (x1, x2) => `<line x1="${x1}" x2="${x2}" y1="37" y2="37" class="fx-costura"></line><line x1="${x1}" x2="${x2}" y1="47" y2="47" class="fx-costura"></line>`;
  return `<div class="faixa-anim" aria-hidden="true"><svg viewBox="0 0 320 112" class="faixa-svg">
    <g class="fx-esq"><rect x="-8" y="30" width="152" height="24" rx="5" class="fx-tecido"></rect>${costura(0, 136)}</g>
    <g class="fx-dir"><rect x="176" y="30" width="152" height="24" rx="5" class="fx-tecido"></rect>${costura(184, 320)}</g>
    <g class="fx-no">
      <path class="fx-tecido fx-ponta-e" d="M150 50 L116 100 Q114 104 118 106 L132 109 Q136 110 138 106 L166 58 Z"></path>
      <path class="fx-tecido fx-ponta-d" d="M170 50 L204 100 Q206 104 202 106 L188 109 Q184 110 182 106 L154 58 Z"></path>
      <rect x="136" y="24" width="48" height="36" rx="10" class="fx-tecido fx-centro"></rect>
      <path d="M145 31 Q160 42 175 31 M145 53 Q160 42 175 53" class="fx-dobra"></path>
    </g></svg><p class="fx-legenda" id="fx-leg"></p></div>`;
}
const semMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function viewLogin(tipo = 'aluno') {
  const instrutor = tipo === 'instrutor';
  const titulo = instrutor ? 'Área do instrutor' : 'Área do aluno';
  const descricao = instrutor ? 'Acesse a gestão de turmas, alunos e evolução.' : 'Acompanhe sua faixa, frequência e próximas conquistas.';
  const alternativa = instrutor ? ['Aluno', '#/login/aluno'] : ['Instrutor', '#/login/instrutor'];
  return `<div class="center-page login-${instrutor ? 'instrutor' : 'aluno'}"><form class="login-card" data-form="login" autocomplete="on">
    ${logoHTML()}
    ${faixaAnimada()}
    <span class="login-role">${instrutor ? 'Gestão da academia' : 'Portal do praticante'}</span>
    <h2 class="login-title">${titulo}</h2>
    <p class="login-intro">${descricao}</p>
    <input type="hidden" name="perfil" value="${instrutor ? 'instrutor' : 'aluno'}">
    <div class="field"><label for="lg">Usuário</label><input id="lg" name="login" required autocomplete="username" autocapitalize="none"></div>
    <div class="field"><label for="pw">Senha</label><input id="pw" name="senha" type="password" required autocomplete="current-password"></div>
    <p class="error" id="login-err"></p>
    <button class="btn btn-red" style="width:100%">Entrar</button>
    <p class="login-switch">É ${alternativa[0].toLowerCase()}? <a href="${alternativa[1]}">Entrar na área do ${alternativa[0].toLowerCase()}</a></p>
    <p style="text-align:center;margin:16px 0 10px"><a href="../index.html" class="muted small">← Voltar à página principal</a></p>
    <p class="muted small" style="text-align:center;margin:0">Esqueceu a senha? <a href="${waLink('Olá! Esqueci minha senha do site. Meu usuário é: ')}" target="_blank" rel="noopener">Peça uma nova no WhatsApp</a>.</p>
  </form></div>`;
}
function viewSenha(u) {
  return `${appBar(u)}<main class="page"><div class="wrap" style="max-width:520px">
    <a class="back" href="${inicioDe(u)}">← Voltar</a>
    <form class="card" data-form="minha-senha"><h3>🔑 Alterar minha senha</h3>
      <div class="field"><label for="ns1">Nova senha (mínimo 6 caracteres)</label><input id="ns1" name="s1" type="password" minlength="6" required autocomplete="new-password"></div>
      <div class="field"><label for="ns2">Repita a nova senha</label><input id="ns2" name="s2" type="password" minlength="6" required autocomplete="new-password"></div>
      <button class="btn btn-red">Salvar nova senha</button></form></div></main>`;
}
const viewCarregando = () => `<div class="center-page"><p class="muted">Carregando…</p></div>`;

/* ---------- 8. ÁREA DO ALUNO (e do responsável) ---------- */
const CHAVE_VISTO = 'stt-ultima-visita';
function novidades(u, a) {
  // Lê a última visita uma vez por sessão (para os avisos não sumirem a cada atualização da tela)
  novidades.visto ??= {};
  if (!(u.id in novidades.visto)) {
    let v = null; try { v = localStorage.getItem(CHAVE_VISTO + u.id); localStorage.setItem(CHAVE_VISTO + u.id, new Date().toISOString()); } catch (e) {}
    novidades.visto[u.id] = v;
  }
  const visto = novidades.visto[u.id];
  const itens = [];
  if (visto) {
    const novosV = db.videos.filter(v => v.criado_em > visto && faixaIdx(v.faixa) <= faixaIdx(a.faixa)).length;
    const novosE = db.eventos.filter(e => e.criado_em > visto && e.data >= today()).length;
    const novosC = db.conteudos.filter(c => c.criado_em > visto && c.faixa === a.faixa).length;
    if (novosV) itens.push(`🎬 ${novosV} vídeo${novosV > 1 ? 's novos' : ' novo'}`);
    if (novosE) itens.push(`📅 ${novosE} evento${novosE > 1 ? 's novos' : ' novo'} ou exame`);
    if (novosC) itens.push(`📋 ${novosC} conteúdo${novosC > 1 ? 's novos' : ' novo'} para o exame`);
  }
  const prox = db.eventos.filter(e => e.tipo === 'exame' && e.data >= today()).sort((x, y) => x.data.localeCompare(y.data))[0];
  if (prox) { const dias = Math.round((new Date(prox.data + 'T12:00') - new Date(today() + 'T12:00')) / 864e5); if (dias <= 30) itens.push(`🥋 Exame ${dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`} (${fmtDate(prox.data)})`); }
  const atrasadas = db.cobrancas.filter(c => c.aluno_id === a.id && statusCob(c) === 'atrasado').length;
  if (atrasadas) itens.push(`💰 ${atrasadas} pagamento${atrasadas > 1 ? 's' : ''} em atraso`);
  return itens.length ? `<div class="card avisos"><h3>🔔 Avisos</h3><ul>${itens.map(i => `<li>${i}</li>`).join('')}</ul></div>` : '';
}

function viewAluno(u, alvoId) {
  const lista = meusAlunos(u);
  if (u.papel === 'responsavel' && !lista.length) return `${appBar(u)}<main class="page"><div class="wrap"><div class="card"><h2>Nenhum aluno vinculado</h2><p class="muted">Peça à academia para vincular seu(s) filho(s) à sua conta.</p></div></div></main>`;
  const a = lista.find(x => x.id === alvoId) || lista[0];
  const seletor = lista.length > 1 || u.papel === 'responsavel'
    ? `<nav class="tabs filhos">${lista.map(x => `<a href="#/aluno/${x.id}" class="${x.id === a.id ? 'on' : ''}">${esc(primeiroNome(x.nome))}</a>`).join('')}</nav>` : '';
  if (!a.ativo) return `${appBar(u)}<main class="page"><div class="wrap">${seletor}<div class="card"><h2>Acesso desativado</h2><p class="muted">O acesso de ${esc(primeiroNome(a.nome))} à área do aluno está desativado. Fale com a academia.</p></div></div></main>`;
  const fi = faixaIdx(a.faixa);
  const prog = progresso(a);
  const pend = db.conteudos.filter(c => c.faixa === a.faixa && !a.apresentados.includes(c.id));
  const feitos = db.conteudos.filter(c => a.apresentados.includes(c.id) && faixaIdx(c.faixa) <= fi);
  const prox = FAIXAS[fi + 1];
  const vidAtual = db.videos.filter(v => v.faixa === a.faixa);
  const vidAnt = db.videos.filter(v => faixaIdx(v.faixa) < fi);
  const cad = a.cadastro || {};
  const linhas = [['Matrícula', cad.matricula], ['Nome', a.nome], ['Nascimento', fmtDate(cad.nascimento)], ['Turma', turmaNome(a.turmaId)], ['Responsável', cad.responsavel],
    ['Telefone', cad.telefone], ['E-mail', cad.email], ['Endereço', cad.endereco], ['Treina desde', fmtDate(cad.inicio)]];
  const p30 = presencasDe(a.id, diasAtras(30)).length;
  const pAno = presencasDe(a.id, today().slice(0, 4) + '-01-01').length;
  const ultimas = presencasDe(a.id).sort((x, y) => y.data.localeCompare(x.data)).slice(0, 8);
  const cobs = db.cobrancas.filter(c => c.aluno_id === a.id).sort((x, y) => y.vencimento.localeCompare(x.vencimento));
  const podeFoto = u.id === a.id;

  return `${appBar(u)}<main class="page"><div class="wrap">
    ${seletor}
    <div class="card welcome">${avatar(a, 'grande')}
      <div style="flex:1;min-width:200px"><p class="muted" style="margin:0">${u.id === a.id ? 'Bem-vindo(a) de volta,' : 'Acompanhando'}</p><h1>${esc(a.nome)}</h1>
        <div class="row" style="margin-top:10px">
          <a class="btn btn-ghost btn-sm" href="#/carteirinha/${a.id}">🪪 Carteirinha</a>
          ${podeFoto ? `<label class="btn btn-ghost btn-sm">📷 ${a.foto ? 'Trocar foto' : 'Colocar foto'}<input type="file" accept="image/*" hidden data-foto="eu"></label>` : ''}
        </div></div>
      <div>${beltHTML(a.faixa, true)}${prog.apto ? '<p class="apto">✅ Pronto(a) para o exame</p>' : ''}</div></div>

    ${novidades(u, a)}

    <div class="grid grid-2" style="margin-top:18px">
      <div class="card"><h3>🪪 Cadastro</h3><dl class="dl">${linhas.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v || '—')}</dd>`).join('')}</dl></div>
      <div class="card"><h3>🥋 Graduação</h3>
        <p style="margin:0 0 4px">Atual: ${beltHTML(a.faixa)}</p>
        ${prox ? `<p class="muted small" style="margin:0">Próxima: Faixa ${esc(prox.nome)}</p>
        <div class="progress"><b style="width:${prog.pct}%"></b></div><p class="small muted" style="margin:0 0 16px">${prog.pct}% dos conteúdos do exame já apresentados</p>` : '<p class="muted">Graduação máxima do sistema.</p>'}
        <h4 style="margin:0 0 10px">Histórico de graduações</h4>
        <ul class="timeline">${[...a.historico].reverse().map(h => `<li>${beltHTML(h.faixa)}<br><span class="muted small">${fmtDate(h.data)}${h.obs ? ' · ' + esc(h.obs) : ''}</span>${h.obs !== 'Cadastro no sistema' ? ` <a class="small" href="#/certificado/${h.id}">📜 Certificado</a>` : ''}</li>`).join('') || '<li class="muted">—</li>'}</ul></div>
    </div>

    <div class="grid grid-2" style="margin-top:18px">
      <div class="card"><h3>📋 Para apresentar no exame</h3><p class="muted small" style="margin-top:-6px">Conteúdos da faixa ${esc(faixa(a.faixa).nome.toLowerCase())} que ainda faltam. Quem marca é o mestre ou o instrutor, quando você apresentar na aula.</p>
        <ul class="list">${pend.length ? pend.map(c => `<li><span class="chk pend" title="Aguardando apresentação">⏳</span><div class="grow"><b>${esc(c.titulo)}</b><p>${esc(c.descricao)}${c.descricao ? ' · ' : ''}<i>aguardando apresentação</i></p></div></li>`).join('') : '<li class="empty">Tudo apresentado! Pronto(a) para o exame. 🎉</li>'}</ul></div>
      <div class="card"><h3>✅ Já apresentados</h3>
        <ul class="list">${feitos.length ? feitos.map(c => `<li><span class="chk done">✓</span><div class="grow"><b>${esc(c.titulo)}</b><p>Faixa ${esc(faixa(c.faixa).nome)}</p></div></li>`).join('') : '<li class="empty">Nenhum conteúdo apresentado ainda.</li>'}</ul></div>
    </div>

    <div class="grid grid-2" style="margin-top:18px">
      <div class="card"><h3>📆 Frequência</h3>
        <div class="stats stats-2"><div><b>${p30}</b><span>aulas nos últimos 30 dias</span></div><div><b>${pAno}</b><span>aulas em ${today().slice(0, 4)}</span></div></div>
        <p class="muted small" style="margin:0">Últimas presenças: ${ultimas.length ? ultimas.map(p => fmtDate(p.data).slice(0, 5)).join(', ') : 'nenhuma registrada ainda.'}</p></div>
      <div class="card"><h3>💰 Pagamentos</h3>
        ${cobs.length ? `<ul class="list">${cobs.slice(0, 8).map(c => { const s = statusCob(c); return `<li><div class="grow"><b>${esc(TIPOS_COB[c.tipo])}${c.referencia ? ' · ' + esc(fmtMes(c.referencia)) : ''}${c.descricao ? ' · ' + esc(c.descricao) : ''}</b><p>${reais(c.valor)} · vence ${fmtDate(c.vencimento)}${c.pago_em ? ' · pago em ' + fmtDate(c.pago_em) : ''}</p></div><span class="st st-${s}">${STATUS_COB[s]}</span></li>`; }).join('')}</ul>
          ${CONFIG.pix && cobs.some(c => !c.pago_em) ? `<p class="small muted">Chave Pix: <b>${esc(CONFIG.pix)}</b></p>` : ''}` : '<p class="empty">Nenhuma cobrança registrada.</p>'}</div>
    </div>

    <div class="card" style="margin-top:18px"><h3>🎬 Vídeos da faixa ${esc(faixa(a.faixa).nome.toLowerCase())}</h3>
      ${vidAtual.length ? `<div class="videos">${vidAtual.map(videoCard).join('')}</div>` : '<p class="empty">Nenhum vídeo para esta faixa ainda.</p>'}
      ${vidAnt.length ? `<details style="margin-top:18px"><summary class="muted" style="cursor:pointer">Revisar vídeos das faixas anteriores (${vidAnt.length})</summary><div class="videos" style="margin-top:14px">${vidAnt.map(videoCard).join('')}</div></details>` : ''}
    </div>

    ${eventLists()}
  </div></main>`;
}

/* ---------- 9. CARTEIRINHA E CERTIFICADO ---------- */
function podeVerAluno(u, a) { return a && (isStaff(u) || meusAlunos(u).some(x => x.id === a.id)); }
function viewCarteirinha(u, id) {
  const a = userById(id);
  if (!podeVerAluno(u, a) || a.papel !== 'aluno') return `${appBar(u)}<main class="page"><div class="wrap"><p>Aluno não encontrado.</p></div></main>`;
  const voltar = isStaff(u) ? `#/painel/aluno/${a.id}` : `#/aluno/${a.id}`;
  setTimeout(() => desenharQR(a), 0);
  return `${appBar(u)}<main class="page"><div class="wrap" style="max-width:560px">
    <a class="back no-print" href="${voltar}">← Voltar</a>
    <div class="carteirinha">
      <div class="ct-topo"><img src="${CONFIG.logo}" alt=""><div><b>${esc(CONFIG.nome)}</b><small>${esc(CONFIG.lema)}</small></div></div>
      <div class="ct-corpo">${avatar(a, 'ct-foto')}
        <div class="ct-dados"><small>Nome</small><b>${esc(a.nome)}</b>
          <small>Matrícula</small><b>${esc(a.cadastro.matricula || '—')}</b>
          <small>Graduação</small><b>${beltHTML(a.faixa)}</b>
          ${a.turmaId ? `<small>Turma</small><b>${esc(turmaNome(a.turmaId))}</b>` : ''}</div>
        <div class="ct-qr" id="qr" aria-label="QR code da carteirinha"></div></div>
      <div class="ct-rodape">${a.ativo ? 'Aluno(a) ativo(a)' : 'INATIVO'} · Filiada à GTMA · desde ${fmtDate(a.cadastro.inicio)}</div>
    </div>
    <div class="row no-print" style="margin-top:16px;justify-content:center"><button class="btn btn-red" data-action="imprimir">🖨 Imprimir / salvar PDF</button></div>
    <p class="muted small no-print" style="text-align:center">Dica: no celular, tire um print desta tela para ter a carteirinha sempre à mão.</p>
  </div></main>`;
}
async function desenharQR(a) {
  const alvo = document.getElementById('qr'); if (!alvo) return;
  try {
    await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js');
    const qr = window.qrcode(0, 'M');
    qr.addData(`${CONFIG.nome} | Matrícula ${a.cadastro.matricula || '-'} | ${a.nome} | Faixa ${faixa(a.faixa).nome} | ${a.ativo ? 'Ativo' : 'Inativo'}`);
    qr.make(); alvo.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 2, scalable: true });
  } catch (e) { alvo.textContent = ''; }
}
function viewCertificado(u, hid) {
  const h = db.users.flatMap(x => x.historico).find(x => x.id === hid);
  const a = h && userById(h.aluno_id);
  if (!podeVerAluno(u, a)) return `${appBar(u)}<main class="page"><div class="wrap"><p>Certificado não encontrado.</p></div></main>`;
  const voltar = isStaff(u) ? `#/painel/aluno/${a.id}` : `#/aluno/${a.id}`;
  const [y, m, d] = h.data.split('-');
  return `${appBar(u)}<main class="page"><div class="wrap">
    <a class="back no-print" href="${voltar}">← Voltar</a>
    <div class="certificado">
      <img src="${CONFIG.logo}" alt="" class="cert-logo">
      <p class="cert-kicker">${esc(CONFIG.nome)} · Filiada à GTMA</p>
      <h1>Certificado de Graduação</h1>
      <p class="cert-texto">Certificamos que <b>${esc(a.nome)}</b>${a.cadastro.matricula ? `, matrícula <b>${esc(a.cadastro.matricula)}</b>,` : ''} foi aprovado(a) e promovido(a) à</p>
      <p class="cert-faixa">${beltHTML(h.faixa, true)}</p>
      <p class="cert-texto">em ${+d} de ${MESES_LONGOS[+m - 1]} de ${y}${h.obs ? ` — ${esc(h.obs)}` : ''}.</p>
      <div class="cert-assin"><div><span></span>Mestre responsável</div><div><span></span>${esc(CONFIG.nome)}</div></div>
      <p class="cert-lema">${esc(CONFIG.lema)}</p>
    </div>
    <div class="row no-print" style="margin-top:16px;justify-content:center"><button class="btn btn-red" data-action="imprimir">🖨 Imprimir / salvar PDF</button></div>
    <p class="muted small no-print" style="text-align:center">Na janela de impressão, escolha "Salvar como PDF" e orientação "Paisagem".</p>
  </div></main>`;
}

/* ---------- 10. DETALHE DO EVENTO ---------- */
function viewEvento(u, id) {
  const e = db.eventos.find(x => x.id === id);
  const voltar = isStaff(u) ? '#/painel/eventos' : '#/aluno';
  if (!e) return `${appBar(u)}<main class="page"><div class="wrap"><a class="back" href="${voltar}">← Voltar</a><p>Evento não encontrado.</p></div></main>`;
  const passado = e.data < today();
  const cartaz = safeUrl(e.cartaz_url);
  const insc = db.inscricoes.filter(i => i.evento_id === e.id);
  let blocoInsc = '';
  if (isStaff(u)) {
    const nomes = insc.map(i => userById(i.aluno_id)).filter(Boolean).sort((x, y) => x.nome.localeCompare(y.nome));
    const txt = `🥋 *${e.titulo}*\n📅 ${fmtDate(e.data)}${e.hora ? ' às ' + e.hora : ''}\n📍 ${e.local}\n${e.descricao ? '\n' + e.descricao + '\n' : ''}\nInscrições e detalhes no site (faça login): ${CONFIG.site}`;
    blocoInsc = `<div class="card" style="margin-top:14px"><h3>🙋 Inscritos (${nomes.length})</h3>
      ${nomes.length ? `<ul class="list">${nomes.map(a => `<li><div class="grow"><b>${esc(a.nome)}</b><p>${esc(a.cadastro.matricula || '')} · Faixa ${esc(faixa(a.faixa).nome)}</p></div></li>`).join('')}</ul>` : '<p class="empty">Ninguém se inscreveu ainda.</p>'}
      <div class="row" style="margin-top:12px">
        <a class="btn btn-ghost btn-sm" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">📣 Divulgar no WhatsApp</a>
        ${nomes.length ? `<button class="btn btn-ghost btn-sm" data-action="csv-inscritos" data-id="${e.id}">⬇ Lista (Excel)</button>` : ''}
      </div>
      ${isGestor(u) && nomes.length && !passado ? `<form data-form="cobrar-inscritos" data-id="${e.id}" class="inline-form"><label class="small muted" for="ci-valor">Cobrar taxa de todos os inscritos:</label>
        <input id="ci-valor" name="valor" type="number" min="0" step="0.01" placeholder="R$" required style="max-width:120px">
        <button class="btn btn-red btn-sm">Gerar cobranças</button></form>` : ''}
    </div>`;
  } else {
    const meus = meusAlunos(u).filter(a => a.papel === 'aluno' && a.ativo);
    if (meus.length && !passado) blocoInsc = `<div class="card" style="margin-top:14px"><h3>🙋 Inscrição</h3>
      ${meus.map(a => { const inscrito = insc.some(i => i.aluno_id === a.id); return `<div class="row" style="justify-content:space-between;padding:6px 0"><span>${esc(a.nome)}${inscrito ? ' — <b class="ok-txt">inscrito(a) ✓</b>' : ''}</span>
        <button class="btn ${inscrito ? 'btn-ghost' : 'btn-red'} btn-sm" data-action="inscrever" data-evento="${e.id}" data-aluno="${a.id}" data-on="${inscrito ? '1' : ''}">${inscrito ? 'Cancelar inscrição' : 'Vou participar'}</button></div>`; }).join('')}</div>`;
  }
  return `${appBar(u)}<main class="page"><div class="wrap"><a class="back" href="${voltar}">← Voltar</a>
    <div class="event-detail">
      <div class="poster">${cartaz ? `<img src="${esc(cartaz)}" alt="Cartaz: ${esc(e.titulo)}">` : `<div class="poster-ph"><small>${e.tipo === 'exame' ? 'Exame' : 'Evento'}</small>${esc(e.titulo)}</div>`}</div>
      <div><span class="tag ${passado ? 'passado' : e.tipo}">${passado ? 'Realizado' : e.tipo === 'exame' ? 'Exame' : 'Evento'}</span>
        <h1 style="font-size:clamp(1.8rem,4vw,2.6rem);margin-top:10px">${esc(e.titulo)}</h1>
        <dl class="dl" style="margin:16px 0 22px"><dt>📅 Data</dt><dd>${fmtDate(e.data)}${e.hora ? ' às ' + esc(e.hora) : ''}</dd><dt>📍 Local</dt><dd>${esc(e.local)}</dd></dl>
        <div class="card"><h3>Descrição</h3><p class="desc" style="margin:0">${esc(e.descricao) || '—'}</p></div>
        <div class="card" style="margin-top:14px"><h3>📎 Materiais</h3>
          ${e.materiais.length ? `<ul class="list">${e.materiais.map(m => { const h = safeUrl(m.url); return `<li><div class="grow"><b>${esc(m.nome)}</b></div>${h ? `<a class="btn btn-ghost btn-sm" href="${esc(h)}" target="_blank" rel="noopener">Abrir</a>` : ''}</li>`; }).join('')}</ul>` : '<p class="empty">Nenhum material enviado.</p>'}</div>
        ${blocoInsc}
      </div></div></div></main>`;
}

/* ---------- 11. PAINEL DA EQUIPE ---------- */
const faixaOptions = sel => FAIXAS.map(f => `<option value="${f.id}" ${f.id === sel ? 'selected' : ''}>${f.nome}</option>`).join('');
const turmaOptions = (sel, vazio = 'Sem turma') => `<option value="">${vazio}</option>` + db.turmas.map(t => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${esc(t.nome)}</option>`).join('');
const ABAS = [
  ['alunos', '👥 Alunos'], ['presenca', '✅ Presença'], ['conteudos', '📋 Conteúdos'], ['videos', '🎬 Vídeos'],
  ['eventos', '📅 Exames e eventos'], ['financeiro', '💰 Financeiro', 'gestor'], ['site', '🖼️ Site'],
  ['equipe', '🧑‍🏫 Equipe', 'gestor'], ['relatorios', '📊 Relatórios'], ['historico', '🕓 Histórico', 'gestor'],
];

function viewPainel(u, tab, sub) {
  const abas = ABAS.filter(([, , g]) => !g || isGestor(u));
  if (tab !== 'aluno' && !abas.some(([k]) => k === tab)) tab = 'alunos';
  const views = { aluno: () => painelAluno(u, sub), presenca: painelPresenca, conteudos: painelConteudos, videos: painelVideos, eventos: painelEventos,
    financeiro: painelFinanceiro, site: painelSite, equipe: () => painelEquipe(u), relatorios: () => painelRelatorios(u), historico: painelHistorico };
  const body = (views[tab] || (() => painelAlunos(u)))();
  const active = tab === 'aluno' ? 'alunos' : tab;
  return `${appBar(u)}<main class="page"><div class="wrap">
    <h1 style="font-size:2rem" class="no-print">Painel ${u.papel === 'admin' ? 'da administração' : 'do ' + esc(PAPEIS[u.papel].toLowerCase())}</h1>
    <nav class="tabs no-print">${abas.map(([k, l]) => `<a href="#/painel/${k}" class="${k === active ? 'on' : ''}">${l}</a>`).join('')}</nav>
    ${body}</div></main>`;
}

let buscaAluno = '';
function painelAlunos(u) {
  const todos = alunos(false);
  const q = buscaAluno.trim().toLowerCase();
  const filtra = x => !q || [x.nome, x.login, x.cadastro.matricula].some(v => String(v || '').toLowerCase().includes(q));
  const ativos = todos.filter(x => x.ativo && filtra(x)), inativos = todos.filter(x => !x.ativo && filtra(x));
  const linha = a => { const p = progresso(a); return `<tr class="click" data-action="nav" data-href="#/painel/aluno/${a.id}"><td><div class="row" style="flex-wrap:nowrap">${avatar(a, 'mini')}<div><b>${esc(a.nome)}</b><br><span class="muted small">${esc(a.login)}${a.cadastro.matricula ? ' · ' + esc(a.cadastro.matricula) : ''}${a.turmaId ? ' · ' + esc(turmaNome(a.turmaId)) : ''}</span></div></div></td><td>${beltHTML(a.faixa)}</td><td>${p.feitos}/${p.total}${p.apto ? ' <span class="st st-pago">Apto</span>' : ''}</td><td><span class="muted">Abrir →</span></td></tr>`; };
  return `<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Alunos ativos (${ativos.length})</h3>
      <input class="busca" type="search" placeholder="Buscar por nome, usuário ou matrícula" value="${esc(buscaAluno)}" data-busca="aluno" aria-label="Buscar aluno"></div>
    <div class="table-wrap"><table><thead><tr><th>Aluno</th><th>Faixa</th><th>Conteúdos</th><th></th></tr></thead><tbody>${ativos.map(linha).join('') || '<tr><td colspan="4" class="empty">Nenhum aluno.</td></tr>'}</tbody></table></div></div>
  ${inativos.length ? `<div class="card inativos" style="margin-top:18px"><h3>Alunos inativos (${inativos.length})</h3><p class="muted small">Não acessam o site. O histórico fica guardado e dá para reativar.</p><div class="table-wrap"><table><tbody>${inativos.map(a => `<tr class="click" data-action="nav" data-href="#/painel/aluno/${a.id}"><td><b>${esc(a.nome)}</b><br><span class="muted small">${esc(a.login)}${a.cadastro.matricula ? ' · ' + esc(a.cadastro.matricula) : ''}</span></td><td>${beltHTML(a.faixa)}</td><td><span class="tag-inativo">Inativo${a.inativoDesde ? ' desde ' + fmtDate(a.inativoDesde) : ''}</span></td><td><span class="muted">Abrir →</span></td></tr>`).join('')}</tbody></table></div></div>` : ''}
  <div class="card" style="margin-top:18px"><h3>➕ Cadastrar aluno</h3>
    <form data-form="novo-aluno"><div class="form-grid">
      <div class="field"><label for="na-nome">Nome completo*</label><input id="na-nome" name="nome" required></div>
      <div class="field"><label for="na-faixa">Faixa atual*</label><select id="na-faixa" name="faixa">${faixaOptions('branca')}</select></div>
      <div class="field"><label for="na-login">Usuário de acesso* (ex.: joao.silva)</label><input id="na-login" name="login" required pattern="[a-zA-Z0-9._\\-]{3,30}" autocomplete="off" autocapitalize="none"></div>
      <div class="field"><label for="na-senha">Senha inicial* (mín. 6)</label><input id="na-senha" name="senha" required minlength="6" autocomplete="new-password" value="${gerarSenha()}"></div>
      <div class="field"><label for="na-turma">Turma</label><select id="na-turma" name="turma_id">${turmaOptions('')}</select></div>
      ${isGestor(u) ? camposMensalidade({}, 'na') : ''}
      ${cadastroFields({}, 'na')}
    </div><button class="btn btn-red">Cadastrar aluno</button>
    <p class="muted small">Depois de cadastrar, aparece um botão para mandar o usuário e a senha pelo WhatsApp.</p></form></div>`;
}
function camposMensalidade(a, p) {
  return `<div class="field"><label for="${p}-valor">Mensalidade (R$)</label><input id="${p}-valor" name="valor_mensalidade" type="number" min="0" step="0.01" value="${esc(a.valorMensalidade ?? '')}" placeholder="Ex.: 150"></div>
    <div class="field"><label for="${p}-venc">Dia do vencimento</label><input id="${p}-venc" name="dia_vencimento" type="number" min="1" max="28" value="${esc(a.diaVencimento ?? '')}" placeholder="Ex.: 10"></div>`;
}
function cadastroFields(c, p) {
  const f = (name, label, type = 'text', full) => `<div class="field${full ? ' full' : ''}"><label for="${p}-${name}">${label}</label><input id="${p}-${name}" type="${type}" name="${name}" value="${esc(c[name] ?? (name === 'inicio' ? today() : ''))}"></div>`;
  const mat = c.matricula
    ? `<div class="field"><label for="${p}-matricula">Matrícula (automática)</label><input id="${p}-matricula" value="${esc(c.matricula)}" readonly></div>`
    : `<div class="field"><label>Matrícula</label><p class="muted small">Gerada automaticamente ao cadastrar (ano de início + número).</p></div>`;
  return mat + f('nascimento', 'Data de nascimento', 'date') + f('responsavel', 'Responsável') +
    f('telefone', 'Telefone / WhatsApp') + f('email', 'E-mail', 'email') + f('inicio', 'Treina desde', 'date') + f('endereco', 'Endereço', 'text', true);
}
const cadastroFrom = fd => Object.fromEntries(['nascimento', 'responsavel', 'telefone', 'email', 'inicio', 'endereco'].map(k => [k, nul(String(fd.get(k) || '').trim())]));
let ultimoAcesso = null; // { nome, login, senha, telefone } para mandar pelo WhatsApp
function cartaoAcesso() {
  if (!ultimoAcesso || ultimoAcesso.onde !== rota) return '';
  const { nome, login, senha, telefone } = ultimoAcesso;
  const txt = `Olá! Seguem os dados de login de ${nome} no site da ${CONFIG.nome}:\n\n🌐 ${CONFIG.site}\n👤 Usuário: ${login}\n🔑 Senha: ${senha}\n\nDepois de entrar, dá para trocar a senha no botão "Senha".`;
  const link = waPara(telefone, txt) || `https://wa.me/?text=${encodeURIComponent(txt)}`;
  return `<div class="card acesso" style="margin-bottom:18px"><h3>🔑 Dados de acesso de ${esc(nome)}</h3>
    <p style="margin:0">Usuário: <b>${esc(login)}</b> · Senha: <b>${esc(senha)}</b></p>
    <div class="row" style="margin-top:12px"><a class="btn btn-red btn-sm" href="${esc(link)}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a>
    <button class="btn btn-ghost btn-sm" data-action="fechar-acesso">Fechar</button></div>
    <p class="muted small" style="margin:8px 0 0">Esta senha só aparece agora. Se perder, gere outra.</p></div>`;
}

function painelAluno(u, id) {
  const a = db.users.find(x => x.id === id && x.papel === 'aluno');
  if (!a) return '<a class="back" href="#/painel/alunos">← Alunos</a><p>Aluno não encontrado.</p>';
  const fi = faixaIdx(a.faixa), prox = FAIXAS[fi + 1];
  const doExame = db.conteudos.filter(c => c.faixa === a.faixa);
  const gestor = isGestor(u);
  const resps = db.vinculos.filter(v => v.aluno_id === a.id).map(v => userById(v.responsavel_id)).filter(Boolean);
  const outrosResps = db.users.filter(x => x.papel === 'responsavel' && !resps.some(r => r.id === x.id));
  const p30 = presencasDe(a.id, diasAtras(30)).length;
  const cobs = db.cobrancas.filter(c => c.aluno_id === a.id).sort((x, y) => y.vencimento.localeCompare(x.vencimento));
  const prog = progresso(a);
  return `<a class="back" href="#/painel/alunos">← Alunos</a>
  ${cartaoAcesso()}
  <div class="card welcome">${avatar(a, 'grande')}<div style="flex:1;min-width:200px"><h1>${esc(a.nome)}</h1><span class="muted">Usuário: ${esc(a.login)}${a.cadastro.matricula ? ' · Matrícula ' + esc(a.cadastro.matricula) : ''}${a.cadastro.nascimento ? ' · ' + idade(a.cadastro.nascimento) + ' anos' : ''}</span>${a.ativo ? '' : '<br><span class="tag-inativo">Inativo — sem acesso ao site</span>'}
    <div class="row" style="margin-top:10px">
      <a class="btn btn-ghost btn-sm" href="#/carteirinha/${a.id}">🪪 Carteirinha</a>
      <label class="btn btn-ghost btn-sm">📷 ${a.foto ? 'Trocar foto' : 'Colocar foto'}<input type="file" accept="image/*" hidden data-foto="${a.id}"></label>
      ${a.cadastro.telefone ? `<a class="btn btn-ghost btn-sm" href="${esc(waPara(a.cadastro.telefone, `Olá, ${primeiroNome(a.cadastro.responsavel || a.nome)}! `))}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ''}
      <button class="btn btn-ghost btn-sm" data-action="nova-senha" data-id="${a.id}">🔑 Gerar nova senha</button>
    </div></div>
    <div>${beltHTML(a.faixa, true)}${prog.apto ? '<p class="apto">✅ Apto para o exame</p>' : ''}<p class="muted small" style="margin:6px 0 0">${p30} aula${p30 === 1 ? '' : 's'} nos últimos 30 dias</p></div></div>
  <div class="grid grid-2" style="margin-top:18px">
    <div class="card"><h3>📋 Conteúdos apresentados — faixa ${esc(faixa(a.faixa).nome.toLowerCase())}</h3>
      <p class="muted small">Marque o que o aluno já apresentou. Ele vê isso na hora.</p>
      ${doExame.length ? doExame.map(c => `<label class="toggle"><input type="checkbox" data-action="toggle-cont" data-aluno="${a.id}" data-id="${c.id}" ${a.apresentados.includes(c.id) ? 'checked' : ''}> ${esc(c.titulo)}</label>`).join('') : '<p class="empty">Nenhum conteúdo cadastrado para esta faixa.</p>'}
    </div>
    <div class="card"><h3>🥋 Graduação</h3>
      ${!prox ? '<p class="muted">Já está na faixa máxima.</p>' : gestor ? `<form data-form="promover" data-id="${a.id}"><div class="form-grid">
        <div class="field"><label for="pr-faixa">Nova faixa</label><select id="pr-faixa" name="faixa">${FAIXAS.slice(fi + 1).map(f => `<option value="${f.id}">${f.nome}</option>`).join('')}</select></div>
        <div class="field"><label for="pr-data">Data</label><input id="pr-data" type="date" name="data" value="${today()}" required></div>
        <div class="field full"><label for="pr-obs">Observação</label><input id="pr-obs" name="obs" value="Aprovado(a) no exame de faixa"></div></div>
        <button class="btn btn-red">Registrar nova graduação</button></form>` : '<p class="muted small">A troca de faixa é feita pelo mestre ou pela administração.</p>'}
      <h4 style="margin:20px 0 10px">Histórico</h4>
      <ul class="timeline">${[...a.historico].reverse().map(h => `<li>${beltHTML(h.faixa)}<br><span class="muted small">${fmtDate(h.data)}${h.obs ? ' · ' + esc(h.obs) : ''}</span>${h.obs !== 'Cadastro no sistema' ? ` <a class="small" href="#/certificado/${h.id}">📜 Certificado</a>` : ''}</li>`).join('') || '<li class="muted">—</li>'}</ul>
    </div>
  </div>
  <div class="card" style="margin-top:18px"><h3>🪪 Cadastro</h3>
    <form data-form="editar-aluno" data-id="${a.id}"><div class="form-grid">
      <div class="field"><label for="ea-nome">Nome completo</label><input id="ea-nome" name="nome" value="${esc(a.nome)}" required></div>
      <div class="field"><label for="ea-turma">Turma</label><select id="ea-turma" name="turma_id">${turmaOptions(a.turmaId)}</select></div>
      ${gestor ? camposMensalidade(a, 'ea') : ''}
      ${cadastroFields(a.cadastro, 'ea')}
    </div><div class="row"><button class="btn btn-red">Salvar cadastro</button></div></form></div>
  <div class="grid grid-2" style="margin-top:18px">
    <div class="card"><h3>👪 Responsáveis com acesso</h3>
      <p class="muted small">Pais ou responsáveis entram com a própria conta e acompanham este aluno (e irmãos).</p>
      ${resps.length ? `<ul class="list">${resps.map(r => `<li><div class="grow"><b>${esc(r.nome)}</b><p>Usuário: ${esc(r.login)}${r.cadastro.telefone ? ' · ' + esc(r.cadastro.telefone) : ''}</p></div><button class="btn btn-danger btn-sm" data-action="desvincular" data-resp="${r.id}" data-aluno="${a.id}">Remover</button></li>`).join('')}</ul>` : '<p class="empty">Nenhum responsável com acesso.</p>'}
      ${outrosResps.length ? `<form data-form="vincular" data-aluno="${a.id}" class="inline-form"><select name="resp" aria-label="Responsável já cadastrado">${outrosResps.map(r => `<option value="${r.id}">${esc(r.nome)} (${esc(r.login)})</option>`).join('')}</select><button class="btn btn-ghost btn-sm">Vincular existente</button></form>` : ''}
      <details class="add-cont"><summary class="btn btn-ghost btn-sm">+ Criar acesso para responsável</summary>
        <form data-form="novo-responsavel" data-aluno="${a.id}"><div class="form-grid">
          <div class="field"><label for="nr-nome">Nome*</label><input id="nr-nome" name="nome" required value="${esc(a.cadastro.responsavel || '')}"></div>
          <div class="field"><label for="nr-tel">WhatsApp</label><input id="nr-tel" name="telefone" value="${esc(a.cadastro.telefone || '')}"></div>
          <div class="field"><label for="nr-login">Usuário*</label><input id="nr-login" name="login" required pattern="[a-zA-Z0-9._\\-]{3,30}" autocapitalize="none"></div>
          <div class="field"><label for="nr-senha">Senha*</label><input id="nr-senha" name="senha" required minlength="6" value="${gerarSenha()}"></div>
        </div><button class="btn btn-red btn-sm">Criar acesso</button></form></details>
    </div>
    <div class="card"><h3>💰 Pagamentos</h3>
      ${!gestor ? '<p class="muted small">O financeiro é visto pelo mestre e pela administração.</p>' : cobs.length ? `<ul class="list">${cobs.slice(0, 10).map(c => linhaCobranca(c, false)).join('')}</ul>` : '<p class="empty">Nenhuma cobrança.</p>'}
      ${gestor ? `<p class="small muted" style="margin-top:10px">Mensalidade: ${a.valorMensalidade ? reais(a.valorMensalidade) + (a.diaVencimento ? ' · vence dia ' + a.diaVencimento : '') : 'não definida (preencha no cadastro acima)'}</p>` : ''}
    </div>
  </div>
  ${gestor ? `<div class="card" style="margin-top:18px"><h3>${a.ativo ? '🚪 Aluno saiu da academia?' : '↩️ Aluno voltou a treinar?'}</h3>
    <p class="muted small">${a.ativo ? '<b>Desativar</b> bloqueia o acesso ao site, mas guarda matrícula, faixas e histórico. Dá para reativar depois.' : '<b>Reativar</b> libera o acesso de novo, com a mesma matrícula e o mesmo histórico.'}</p>
    <div class="row"><button type="button" class="btn ${a.ativo ? 'btn-ghost' : 'btn-red'}" data-action="ativo-conta" data-id="${a.id}">${a.ativo ? 'Desativar aluno' : 'Reativar aluno'}</button>
    <button type="button" class="btn btn-danger" data-action="excluir-conta" data-id="${a.id}" data-volta="#/painel/alunos">Excluir de vez</button></div>
    <p class="muted small" style="margin-top:8px">Use <b>Excluir de vez</b> só para cadastro errado ou duplicado: apaga tudo e não tem volta. A matrícula excluída não é reaproveitada.</p></div>` : ''}`;
}

/* ---------- Presença ---------- */
let presencaData = today(), presencaTurma = '';
function painelPresenca() {
  const lista = alunos().filter(a => !presencaTurma || a.turmaId === presencaTurma);
  const marcados = new Set(db.presencas.filter(p => p.data === presencaData).map(p => p.aluno_id));
  const n = lista.filter(a => marcados.has(a.id)).length;
  return `<div class="card"><h3>✅ Chamada</h3>
    <div class="form-grid filtros">
      <div class="field"><label for="pp-data">Data da aula</label><input id="pp-data" type="date" value="${presencaData}" max="${today()}" data-pres="data"></div>
      <div class="field"><label for="pp-turma">Turma</label><select id="pp-turma" data-pres="turma">${turmaOptions(presencaTurma, 'Todas as turmas')}</select></div>
    </div>
    <p class="muted small">Toque no nome para marcar presença. Salva na hora. <b>${n}</b> de ${lista.length} presentes em ${fmtDate(presencaData)}.</p>
    <div class="chamada">${lista.map(a => `<label class="chamada-item ${marcados.has(a.id) ? 'on' : ''}"><input type="checkbox" data-action="presenca" data-aluno="${a.id}" ${marcados.has(a.id) ? 'checked' : ''}>${avatar(a, 'mini')}<span><b>${esc(a.nome)}</b><small>${esc(faixa(a.faixa).nome)}${a.turmaId ? ' · ' + esc(turmaNome(a.turmaId)) : ''}</small></span></label>`).join('') || '<p class="empty">Nenhum aluno nesta turma.</p>'}</div>
    ${lista.length ? `<div class="row" style="margin-top:12px"><button class="btn btn-ghost btn-sm" data-action="presenca-todos" data-on="1">Marcar todos</button><button class="btn btn-ghost btn-sm" data-action="presenca-todos" data-on="">Desmarcar todos</button></div>` : ''}
  </div>
  <div class="card" style="margin-top:18px"><h3>🏷️ Turmas</h3>
    <ul class="list">${db.turmas.map(t => `<li><div class="grow"><b>${esc(t.nome)}</b><p>${esc(t.horario || '')} · ${alunos().filter(a => a.turmaId === t.id).length} alunos</p></div><button class="btn btn-danger btn-sm" data-action="del" data-col="turmas" data-id="${t.id}">Excluir</button></li>`).join('') || '<li class="empty">Nenhuma turma criada. Crie abaixo e escolha a turma no cadastro de cada aluno.</li>'}</ul>
    <form data-form="nova-turma" class="inline-form"><input name="nome" required placeholder="Nome (ex.: Infantil)" aria-label="Nome da turma"><input name="horario" placeholder="Dias e horário (ex.: Seg e Qua 18h)" aria-label="Horário da turma"><button class="btn btn-red btn-sm">Criar turma</button></form>
  </div>`;
}

/* ---------- Conteúdos ---------- */
let faixaAberta = '';
function painelConteudos() {
  return `<div class="card"><h3>📋 Conteúdos de exame por faixa</h3>
    <p class="muted small">O que o aluno precisa apresentar para passar para a próxima faixa. Clique em <b>+ Adicionar</b> na faixa desejada.</p>
    ${FAIXAS.map(f => { const l = db.conteudos.filter(c => c.faixa === f.id); return `<div class="faixa-bloco">
      <div class="group-title faixa-topo"><span>${beltHTML(f.id)} · ${l.length} ${l.length === 1 ? 'conteúdo' : 'conteúdos'}</span></div>
      <ul class="list">${l.map(c => `<li><div class="grow"><b>${esc(c.titulo)}</b><p>${esc(c.descricao)}</p></div><button class="btn btn-danger btn-sm" data-action="del" data-col="conteudos" data-id="${c.id}">Excluir</button></li>`).join('') || '<li class="empty">Nenhum conteúdo nesta faixa ainda.</li>'}</ul>
      <details class="add-cont" ${faixaAberta === f.id ? 'open' : ''}><summary class="btn btn-ghost btn-sm">+ Adicionar na ${esc(f.nome.toLowerCase())}</summary>
        <form data-form="novo-conteudo"><input type="hidden" name="faixa" value="${f.id}"><div class="form-grid">
          <div class="field"><label for="nc-titulo-${f.id}">Título*</label><input id="nc-titulo-${f.id}" name="titulo" required placeholder="Ex.: Poomsae Taegeuk Il Jang"></div>
          <div class="field"><label for="nc-desc-${f.id}">Descrição</label><input id="nc-desc-${f.id}" name="descricao" placeholder="Opcional"></div></div>
          <button class="btn btn-red btn-sm">Salvar na ${esc(f.nome.toLowerCase())}</button></form></details>
    </div>`; }).join('')}
  </div>`;
}

function painelVideos() {
  return `<div class="card"><h3>➕ Novo vídeo</h3>
    <form data-form="novo-video"><div class="form-grid">
      <div class="field"><label for="nv-faixa">Faixa*</label><select id="nv-faixa" name="faixa">${faixaOptions()}</select></div>
      <div class="field"><label for="nv-titulo">Título*</label><input id="nv-titulo" name="titulo" required></div>
      <div class="field full"><label for="nv-url">Link do vídeo (YouTube "não listado", Vimeo ou .mp4)*</label><input id="nv-url" name="url" type="url" required placeholder="https://youtu.be/..."></div>
      <div class="field full"><label for="nv-desc">Descrição</label><textarea id="nv-desc" name="descricao"></textarea></div></div>
      <p class="muted small">Dica: suba no YouTube como <b>não listado</b> e cole o link aqui. Só alunos da faixa escolhida (ou superiores) verão.</p>
      <button class="btn btn-red">Publicar vídeo</button></form></div>
  <div class="card" style="margin-top:18px"><h3>Vídeos por faixa</h3>
    ${FAIXAS.map(f => { const l = db.videos.filter(v => v.faixa === f.id); return `<div class="group-title">${beltHTML(f.id)} · ${l.length}</div>
      <ul class="list">${l.map(v => `<li><div class="grow"><b>${esc(v.titulo)}</b><p>${v.url ? esc(v.url) : 'sem link'}</p></div><button class="btn btn-danger btn-sm" data-action="del" data-col="videos" data-id="${v.id}">Excluir</button></li>`).join('') || '<li class="empty">—</li>'}</ul>`; }).join('')}
  </div>`;
}

function painelEventos() {
  const lista = [...db.eventos].sort((a, b) => b.data.localeCompare(a.data));
  return `<div class="card"><h3>➕ Novo exame ou evento</h3>
    <form data-form="novo-evento"><div class="form-grid">
      <div class="field"><label for="ne-tipo">Tipo*</label><select id="ne-tipo" name="tipo"><option value="exame">Exame de faixa</option><option value="evento">Evento</option></select></div>
      <div class="field"><label for="ne-titulo">Título*</label><input id="ne-titulo" name="titulo" required></div>
      <div class="field"><label for="ne-data">Data*</label><input id="ne-data" type="date" name="data" required></div>
      <div class="field"><label for="ne-hora">Horário</label><input id="ne-hora" type="time" name="hora"></div>
      <div class="field full"><label for="ne-local">Local*</label><input id="ne-local" name="local" required></div>
      <div class="field full"><label for="ne-desc">Descrição</label><textarea id="ne-desc" name="descricao"></textarea></div>
      <div class="field"><label for="ne-cartaz">Cartaz (imagem, até 10 MB)</label><input id="ne-cartaz" type="file" name="cartaz" accept="image/*"></div>
      <div class="field"><label for="ne-arq">Arquivos de material (até 10 MB cada)</label><input id="ne-arq" type="file" name="arquivos" multiple></div>
      <div class="field full"><label for="ne-links">Links de material (um por linha: Nome | https://...)</label><textarea id="ne-links" name="links" placeholder="Regulamento | https://drive.google.com/..."></textarea></div>
    </div><button class="btn btn-red">Publicar</button></form></div>
  <div class="card" style="margin-top:18px"><h3>Todos os exames e eventos</h3>
    <ul class="list">${lista.map(e => { const n = db.inscricoes.filter(i => i.evento_id === e.id).length; return `<li><div class="grow" style="cursor:pointer" data-action="open-event" data-id="${e.id}"><b>${esc(e.titulo)}</b><p>${fmtDate(e.data)} · ${esc(e.local)} · ${e.tipo === 'exame' ? 'Exame' : 'Evento'} · ${n} inscrito${n === 1 ? '' : 's'}</p></div>
      <button class="btn btn-danger btn-sm" data-action="del" data-col="eventos" data-id="${e.id}">Excluir</button></li>`; }).join('') || '<li class="empty">—</li>'}</ul></div>`;
}

/* ---------- Financeiro ---------- */
let mesFin = mesAtual();
function linhaCobranca(c, comAluno = true) {
  const a = userById(c.aluno_id); const s = statusCob(c);
  const txt = `Olá${a ? ', ' + primeiroNome(a.cadastro.responsavel || a.nome) : ''}! Lembrete da ${CONFIG.nome}: ${TIPOS_COB[c.tipo].toLowerCase()}${c.referencia ? ' de ' + fmtMes(c.referencia) : ''}${c.descricao ? ' (' + c.descricao + ')' : ''} de ${a ? a.nome : ''} no valor de ${reais(c.valor)}, vencimento ${fmtDate(c.vencimento)}.${CONFIG.pix ? ' Chave Pix: ' + CONFIG.pix + '.' : ''} Obrigado!`;
  const link = a && waPara(a.cadastro.telefone, txt);
  return `<li><div class="grow"><b>${comAluno && a ? esc(a.nome) + ' · ' : ''}${esc(TIPOS_COB[c.tipo])}${c.referencia ? ' ' + esc(c.referencia.split('-').reverse().join('/')) : ''}${c.descricao ? ' · ' + esc(c.descricao) : ''}</b>
    <p>${reais(c.valor)} · vence ${fmtDate(c.vencimento)}${c.pago_em ? ` · pago em ${fmtDate(c.pago_em)}${c.forma ? ' (' + esc(c.forma) + ')' : ''}` : ''}</p></div>
    <span class="st st-${s}">${STATUS_COB[s]}</span>
    <span class="row acoes">${c.pago_em ? `<button class="btn btn-ghost btn-sm" data-action="desfazer-pago" data-id="${c.id}">Desfazer</button>`
      : `<select class="forma" data-forma="${c.id}" aria-label="Forma de pagamento"><option>Pix</option><option>Dinheiro</option><option>Cartão</option><option>Transferência</option></select><button class="btn btn-red btn-sm" data-action="pagar" data-id="${c.id}">Recebido</button>${link ? `<a class="btn btn-ghost btn-sm" href="${esc(link)}" target="_blank" rel="noopener">Cobrar</a>` : ''}`}
    <button class="btn btn-danger btn-sm" data-action="del" data-col="cobrancas" data-id="${c.id}">✕</button></span></li>`;
}
function painelFinanceiro() {
  const doMes = db.cobrancas.filter(c => c.vencimento.slice(0, 7) === mesFin).sort((x, y) => (userById(x.aluno_id)?.nome || '').localeCompare(userById(y.aluno_id)?.nome || ''));
  const atrasadas = db.cobrancas.filter(c => statusCob(c) === 'atrasado' && c.vencimento.slice(0, 7) !== mesFin).sort((x, y) => x.vencimento.localeCompare(y.vencimento));
  const soma = arr => arr.reduce((t, c) => t + Number(c.valor), 0);
  const recebido = soma(doMes.filter(c => c.pago_em)), aberto = soma(doMes.filter(c => statusCob(c) === 'aberto')), atrasado = soma(doMes.filter(c => statusCob(c) === 'atrasado'));
  const semMensalidade = alunos().filter(a => !a.valorMensalidade).length;
  const faltaGerar = alunos().filter(a => a.valorMensalidade > 0 && !db.cobrancas.some(c => c.aluno_id === a.id && c.tipo === 'mensalidade' && c.referencia === mesFin)).length;
  return `<div class="card"><h3>💰 Financeiro de ${esc(fmtMes(mesFin))}</h3>
    <div class="form-grid filtros"><div class="field"><label for="fin-mes">Mês</label><input id="fin-mes" type="month" value="${mesFin}" data-fin="mes"></div></div>
    <div class="stats"><div><b>${reais(recebido)}</b><span>recebido</span></div><div><b>${reais(aberto)}</b><span>em aberto</span></div><div><b>${reais(atrasado)}</b><span>atrasado</span></div></div>
    <div class="row no-print">
      <button class="btn btn-red" data-action="gerar-mensalidades" ${faltaGerar ? '' : 'disabled'}>Gerar mensalidades do mês (${faltaGerar})</button>
      <button class="btn btn-ghost" data-action="csv-financeiro">⬇ Planilha do mês</button></div>
    <p class="muted small">${semMensalidade ? `${semMensalidade} aluno(s) ativo(s) sem valor de mensalidade definido — defina no cadastro de cada aluno. ` : ''}"Gerar mensalidades" cria a cobrança do mês para cada aluno ativo com valor definido (não duplica).</p></div>
  <div class="card" style="margin-top:18px"><h3>Cobranças com vencimento em ${esc(fmtMes(mesFin))} (${doMes.length})</h3>
    <ul class="list cobrancas">${doMes.map(c => linhaCobranca(c)).join('') || '<li class="empty">Nenhuma cobrança neste mês.</li>'}</ul></div>
  ${atrasadas.length ? `<div class="card" style="margin-top:18px"><h3>⚠️ Atrasadas de outros meses (${atrasadas.length})</h3><ul class="list cobrancas">${atrasadas.map(c => linhaCobranca(c)).join('')}</ul></div>` : ''}
  <div class="card" style="margin-top:18px"><h3>➕ Cobrança avulsa</h3>
    <form data-form="nova-cobranca"><div class="form-grid">
      <div class="field"><label for="nc-aluno">Aluno*</label><select id="nc-aluno" name="aluno_id" required>${alunos().map(a => `<option value="${a.id}">${esc(a.nome)}</option>`).join('')}</select></div>
      <div class="field"><label for="nc-tipo">Tipo*</label><select id="nc-tipo" name="tipo">${Object.entries(TIPOS_COB).filter(([k]) => k !== 'mensalidade').map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
      <div class="field"><label for="nc-valor">Valor (R$)*</label><input id="nc-valor" name="valor" type="number" min="0" step="0.01" required></div>
      <div class="field"><label for="nc-venc">Vencimento*</label><input id="nc-venc" name="vencimento" type="date" value="${today()}" required></div>
      <div class="field full"><label for="nc-desc">Descrição</label><input id="nc-desc" name="descricao" placeholder="Ex.: Dobok tamanho 3"></div>
    </div><button class="btn btn-red">Criar cobrança</button></form></div>`;
}

/* ---------- Site: galeria e depoimentos ---------- */
function painelSite() {
  return `<div class="card"><h3>🖼️ Galeria de fotos do site</h3>
    <p class="muted small">As fotos aparecem na página inicial, em "Conheça nosso espaço" (as 8 mais recentes). Atenção: o site é público — só publique fotos de alunos com autorização dos pais.</p>
    <form data-form="nova-foto"><div class="form-grid">
      <div class="field"><label for="gf-arq">Fotos* (pode escolher várias)</label><input id="gf-arq" type="file" name="fotos" accept="image/*" multiple required></div>
      <div class="field"><label for="gf-leg">Legenda</label><input id="gf-leg" name="legenda" placeholder="Ex.: Exame de faixa — nov/2026"></div>
    </div><button class="btn btn-red">Enviar fotos</button></form>
    <div class="galeria-adm">${publico.galeria.map(g => `<figure><img src="${esc(g.url)}" alt="${esc(g.legenda || '')}" loading="lazy"><figcaption>${esc(g.legenda || '')}</figcaption><button class="btn btn-danger btn-sm" data-action="del-foto" data-id="${g.id}">Excluir</button></figure>`).join('') || '<p class="empty">Nenhuma foto ainda. Enquanto isso, o site mostra as fotos padrão.</p>'}</div>
  </div>
  <div class="card" style="margin-top:18px"><h3>💬 Depoimentos</h3>
    <form data-form="novo-depoimento"><div class="form-grid">
      <div class="field"><label for="dp-nome">Nome*</label><input id="dp-nome" name="nome" required placeholder="Ex.: Mariana"></div>
      <div class="field"><label for="dp-rel">Quem é</label><input id="dp-rel" name="relacao" placeholder="Ex.: mãe do Pedro, faixa amarela"></div>
      <div class="field full"><label for="dp-txt">Depoimento*</label><textarea id="dp-txt" name="texto" required></textarea></div>
    </div><button class="btn btn-red">Publicar depoimento</button></form>
    <ul class="list" style="margin-top:12px">${publico.depoimentos.map(d => `<li><div class="grow"><b>${esc(d.nome)}${d.relacao ? ' · ' + esc(d.relacao) : ''}</b><p>${esc(d.texto)}</p></div>
      <button class="btn btn-ghost btn-sm" data-action="publicar-dep" data-id="${d.id}" data-on="${d.publicado ? '' : '1'}">${d.publicado ? 'Ocultar' : 'Publicar'}</button>
      <button class="btn btn-danger btn-sm" data-action="del" data-col="depoimentos" data-id="${d.id}">Excluir</button></li>`).join('') || '<li class="empty">Nenhum depoimento ainda.</li>'}</ul>
  </div>`;
}

/* ---------- Equipe ---------- */
function painelEquipe(u) {
  const equipe = db.users.filter(isStaff).sort((x, y) => x.nome.localeCompare(y.nome));
  const resps = db.users.filter(x => x.papel === 'responsavel').sort((x, y) => x.nome.localeCompare(y.nome));
  const pode = x => x.id !== u.id && (x.papel !== 'admin' || u.papel === 'admin');
  const linha = x => { const filhos = db.vinculos.filter(v => v.responsavel_id === x.id).map(v => userById(v.aluno_id)?.nome).filter(Boolean); return `<li><div class="grow"><b>${esc(x.nome)}${x.id === u.id ? ' (você)' : ''}</b><p>${esc(PAPEIS[x.papel])} · usuário ${esc(x.login)}${filhos.length ? ' · ' + esc(filhos.join(', ')) : ''}${x.ativo ? '' : ' · <span class="tag-inativo">Inativo</span>'}</p></div>
    ${pode(x) ? `<span class="row acoes"><button class="btn btn-ghost btn-sm" data-action="nova-senha" data-id="${x.id}">Nova senha</button>
      <button class="btn btn-ghost btn-sm" data-action="ativo-conta" data-id="${x.id}">${x.ativo ? 'Desativar' : 'Reativar'}</button>
      <button class="btn btn-danger btn-sm" data-action="excluir-conta" data-id="${x.id}" data-volta="#/painel/equipe">Excluir</button></span>` : ''}</li>`; };
  return `${cartaoAcesso()}<div class="card"><h3>🧑‍🏫 Equipe (${equipe.length})</h3>
    <p class="muted small"><b>Administração</b> e <b>Mestre</b> podem tudo (inclusive trocar faixa, financeiro e equipe). <b>Instrutor(a)</b> faz o dia a dia: chamada, conteúdos, cadastro de alunos, vídeos, eventos e site — mas não troca faixa, não exclui alunos e não vê o financeiro.</p>
    <ul class="list">${equipe.map(linha).join('')}</ul></div>
  <div class="card" style="margin-top:18px"><h3>➕ Nova conta da equipe</h3>
    <form data-form="nova-equipe"><div class="form-grid">
      <div class="field"><label for="eq-nome">Nome*</label><input id="eq-nome" name="nome" required></div>
      <div class="field"><label for="eq-papel">Função*</label><select id="eq-papel" name="papel"><option value="instrutor">Instrutor</option><option value="instrutora">Instrutora</option><option value="mestre">Mestre</option>${u.papel === 'admin' ? '<option value="admin">Administração</option>' : ''}</select></div>
      <div class="field"><label for="eq-login">Usuário*</label><input id="eq-login" name="login" required pattern="[a-zA-Z0-9._\\-]{3,30}" autocapitalize="none"></div>
      <div class="field"><label for="eq-senha">Senha inicial*</label><input id="eq-senha" name="senha" required minlength="6" value="${gerarSenha()}"></div>
      <div class="field"><label for="eq-tel">WhatsApp</label><input id="eq-tel" name="telefone"></div>
    </div><button class="btn btn-red">Criar conta</button></form></div>
  <div class="card" style="margin-top:18px"><h3>👪 Responsáveis (${resps.length})</h3>
    <p class="muted small">Para criar o acesso de um responsável, abra o aluno e use "Criar acesso para responsável".</p>
    <ul class="list">${resps.map(linha).join('') || '<li class="empty">Nenhum responsável com acesso.</li>'}</ul></div>`;
}

/* ---------- Histórico (auditoria) ---------- */
let filtroHist = '';
function painelHistorico() {
  if (!auditoria) { carregarAuditoria(); return '<div class="card"><p class="muted">Carregando histórico…</p></div>'; }
  const q = filtroHist.trim().toLowerCase();
  const lista = auditoria.filter(x => !q || [x.quem_nome, x.acao, x.detalhe].some(v => String(v || '').toLowerCase().includes(q)));
  return `<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">🕓 Quem fez o quê</h3>
      <input class="busca" type="search" placeholder="Filtrar (nome, ação, aluno…)" value="${esc(filtroHist)}" data-busca="hist" aria-label="Filtrar histórico"></div>
    <p class="muted small">As 500 ações mais recentes: cadastros, trocas de faixa, conteúdos marcados, pagamentos, senhas, desativações e exclusões.</p>
    <div class="table-wrap"><table><thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>Detalhe</th></tr></thead><tbody>
    ${lista.map(x => `<tr><td class="nowrap">${fmtDataHora(x.quando)}</td><td>${esc(x.quem_nome || '—')}</td><td><b>${esc(x.acao)}</b></td><td>${esc(x.detalhe || '')}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">Nada registrado ainda.</td></tr>'}
    </tbody></table></div></div>`;
}
async function carregarAuditoria() {
  const { data, error } = await sb.from('auditoria').select('*').order('quando', { ascending: false }).limit(500);
  auditoria = error ? [] : data; if (error) toast(traduz(error.message), true);
  if (rota.startsWith('#/painel/historico')) render();
}

/* ---------- Relatórios ---------- */
let filtroRel = { ano: '', situacao: '', faixa: '' };
let mesAniv = new Date().getMonth() + 1;
const anoEntrada = a => (a.cadastro.matricula || '').slice(0, 4) || (a.cadastro.inicio || '').slice(0, 4) || '—';
function alunosFiltrados() {
  return alunos(false).filter(x => (!filtroRel.ano || anoEntrada(x) === filtroRel.ano)
    && (!filtroRel.situacao || (filtroRel.situacao === 'ativo') === x.ativo)
    && (!filtroRel.faixa || x.faixa === filtroRel.faixa))
    .sort((a, b) => String(a.cadastro.matricula || '').localeCompare(String(b.cadastro.matricula || '')));
}
// Alunos ativos no fim de cada um dos últimos 12 meses
function crescimento() {
  const out = []; const h = new Date();
  for (let k = 11; k >= 0; k--) {
    const d = new Date(h.getFullYear(), h.getMonth() - k + 1, 0); const fim = isoDate(d);
    const n = alunos(false).filter(a => (a.cadastro.inicio || '0000') <= fim && (!a.inativoDesde || a.inativoDesde > fim)).length;
    out.push({ rotulo: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, n });
  }
  return out;
}
function graficoCrescimento() {
  const dados = crescimento(); const max = Math.max(1, ...dados.map(d => d.n));
  const W = 600, H = 200, base = 170, larg = W / dados.length, bw = Math.min(28, larg * 0.55);
  const barras = dados.map((d, i) => { const h = Math.round((d.n / max) * 140); const x = i * larg + (larg - bw) / 2; const y = base - h;
    return `<g class="barra-g"><title>${d.rotulo}: ${d.n} aluno${d.n === 1 ? '' : 's'} ativo${d.n === 1 ? '' : 's'}</title>
      <rect x="${i * larg}" y="0" width="${larg}" height="${H}" fill="transparent"></rect>
      ${h > 0 ? `<path d="M${x},${base} V${y + 4} Q${x},${y} ${x + 4},${y} H${x + bw - 4} Q${x + bw},${y} ${x + bw},${y + 4} V${base} Z" class="barra-r"></path>` : ''}
      <text x="${x + bw / 2}" y="${base + 18}" text-anchor="middle" class="eixo">${d.rotulo}</text>
      ${i === dados.length - 1 ? `<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" class="valor">${d.n}</text>` : ''}</g>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img" aria-label="Alunos ativos nos últimos 12 meses"><line x1="0" x2="${W}" y1="${base}" y2="${base}" class="base"></line>${barras}</svg>
    <details><summary class="muted small" style="cursor:pointer">Ver em tabela</summary><table class="small"><tbody>${dados.map(d => `<tr><td>${d.rotulo}</td><td>${d.n}</td></tr>`).join('')}</tbody></table></details>`;
}
function painelRelatorios(u) {
  const todos = alunos(false);
  const anos = [...new Set(todos.map(anoEntrada))].sort().reverse();
  const lista = alunosFiltrados();
  const ativos = lista.filter(x => x.ativo).length;
  const opt = (v, l, cur) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(l)}</option>`;
  const porAno = anos.map(ano => {
    const g = todos.filter(x => anoEntrada(x) === ano);
    const at = g.filter(x => x.ativo).length;
    return `<tr><td><b>${esc(ano)}</b></td><td>${g.length}</td><td>${at}</td><td>${g.length - at}</td><td>${g.length ? Math.round(at / g.length * 100) : 0}%</td></tr>`;
  }).join('');
  const porFaixa = FAIXAS.map(f => {
    const n = lista.filter(x => x.faixa === f.id).length;
    const pct = lista.length ? Math.round(n / lista.length * 100) : 0;
    return `<tr><td>${beltHTML(f.id)}</td><td><b>${n}</b></td><td style="width:45%"><div class="barra"><i style="width:${pct}%"></i></div></td></tr>`;
  }).join('');
  const linhas = lista.map(a => `<tr class="click" data-action="nav" data-href="#/painel/aluno/${a.id}"><td>${esc(a.cadastro.matricula || '—')}</td><td><b>${esc(a.nome)}</b></td><td>${beltHTML(a.faixa)}</td><td>${fmtDate(a.cadastro.inicio)}</td><td>${a.ativo ? 'Ativo' : `<span class="tag-inativo">Inativo${a.inativoDesde ? ' desde ' + fmtDate(a.inativoDesde) : ''}</span>`}</td><td>${esc(a.cadastro.telefone || '—')}</td></tr>`).join('');
  const aptos = alunos().filter(a => progresso(a).apto);
  const aniv = alunos().filter(a => a.cadastro.nascimento && +a.cadastro.nascimento.slice(5, 7) === +mesAniv).sort((x, y) => x.cadastro.nascimento.slice(8).localeCompare(y.cadastro.nascimento.slice(8)));
  const freq = alunos().map(a => ({ a, n: presencasDe(a.id, diasAtras(30)).length })).sort((x, y) => x.n - y.n);
  return `<div class="card"><h3>📊 Relatório de alunos</h3>
    <div class="form-grid filtros">
      <div class="field"><label for="rel-ano">Ano de entrada</label><select id="rel-ano" data-rel="ano">${opt('', 'Todos os anos', filtroRel.ano)}${anos.map(a => opt(a, a, filtroRel.ano)).join('')}</select></div>
      <div class="field"><label for="rel-sit">Situação</label><select id="rel-sit" data-rel="situacao">${opt('', 'Todos', filtroRel.situacao)}${opt('ativo', 'Ativos', filtroRel.situacao)}${opt('inativo', 'Inativos (saíram)', filtroRel.situacao)}</select></div>
      <div class="field"><label for="rel-faixa">Faixa</label><select id="rel-faixa" data-rel="faixa">${opt('', 'Todas as faixas', filtroRel.faixa)}${FAIXAS.map(f => opt(f.id, f.nome, filtroRel.faixa)).join('')}</select></div>
    </div>
    <div class="stats"><div><b>${lista.length}</b><span>alunos no filtro</span></div><div><b>${ativos}</b><span>ativos</span></div><div><b>${lista.length - ativos}</b><span>inativos</span></div></div>
    <div class="row no-print"><button class="btn btn-red" data-action="baixar-relatorio">⬇ Baixar planilha (Excel)</button><button class="btn btn-ghost" data-action="imprimir">🖨 Imprimir</button>
      ${isGestor(u) ? '<button class="btn btn-ghost" data-action="backup">💾 Baixar backup completo</button>' : ''}</div>
  </div>
  <div class="card" style="margin-top:18px"><h3>📈 Alunos ativos nos últimos 12 meses</h3><p class="muted small">Calculado pela data de início e pela data de saída. Passe o mouse (ou toque) nas barras para ver o número.</p>${graficoCrescimento()}</div>
  <div class="grid grid-2" style="margin-top:18px">
    <div class="card"><h3>Alunos por ano de entrada</h3><p class="muted small">Todos os alunos, sem filtro.</p><div class="table-wrap"><table><thead><tr><th>Ano</th><th>Entraram</th><th>Ativos</th><th>Saíram</th><th>Continuam</th></tr></thead><tbody>${porAno || '<tr><td colspan="5" class="empty">—</td></tr>'}</tbody></table></div></div>
    <div class="card"><h3>Alunos por faixa</h3><p class="muted small">Conforme o filtro acima.</p><div class="table-wrap"><table><tbody>${porFaixa}</tbody></table></div></div>
  </div>
  <div class="grid grid-2" style="margin-top:18px">
    <div class="card"><h3>🥋 Aptos para o próximo exame (${aptos.length})</h3><p class="muted small">Alunos ativos que já apresentaram todos os conteúdos da faixa atual.</p>
      <ul class="list">${aptos.map(a => `<li><div class="grow"><b>${esc(a.nome)}</b><p>Faixa ${esc(faixa(a.faixa).nome)} → ${esc(FAIXAS[faixaIdx(a.faixa) + 1]?.nome || '—')}</p></div><a class="btn btn-ghost btn-sm" href="#/painel/aluno/${a.id}">Abrir</a></li>`).join('') || '<li class="empty">Ninguém apto ainda.</li>'}</ul></div>
    <div class="card"><h3>🎂 Aniversariantes</h3>
      <div class="field" style="max-width:220px"><label for="rel-aniv">Mês</label><select id="rel-aniv" data-aniv="1">${MESES_LONGOS.map((m, i) => opt(i + 1, m[0].toUpperCase() + m.slice(1), mesAniv)).join('')}</select></div>
      <ul class="list">${aniv.map(a => { const l = waPara(a.cadastro.telefone, `Parabéns, ${primeiroNome(a.nome)}! 🎉🥋 Toda a equipe da ${CONFIG.nome} deseja um feliz aniversário!`); return `<li><div class="grow"><b>${esc(a.cadastro.nascimento.slice(8))}/${esc(a.cadastro.nascimento.slice(5, 7))} · ${esc(a.nome)}</b><p>Faz ${idade(a.cadastro.nascimento) + (new Date().getMonth() + 1 === +mesAniv && +a.cadastro.nascimento.slice(8) > new Date().getDate() ? 1 : 0)} anos</p></div>${l ? `<a class="btn btn-ghost btn-sm" href="${esc(l)}" target="_blank" rel="noopener">🎉 Parabéns</a>` : ''}</li>`; }).join('') || '<li class="empty">Nenhum aniversariante neste mês.</li>'}</ul></div>
  </div>
  <div class="card" style="margin-top:18px"><h3>📆 Frequência nos últimos 30 dias</h3><p class="muted small">Do menos frequente para o mais frequente — bom para ver quem está sumindo.</p>
    <div class="table-wrap"><table><thead><tr><th>Aluno</th><th>Turma</th><th>Aulas</th><th>Última presença</th></tr></thead><tbody>${freq.map(({ a, n }) => { const ult = presencasDe(a.id).map(p => p.data).sort().pop(); return `<tr class="click" data-action="nav" data-href="#/painel/aluno/${a.id}"><td><b>${esc(a.nome)}</b></td><td>${esc(turmaNome(a.turmaId) || '—')}</td><td>${n === 0 ? '<span class="st st-atrasado">0</span>' : n}</td><td>${ult ? fmtDate(ult) : '—'}</td></tr>`; }).join('') || '<tr><td colspan="4" class="empty">—</td></tr>'}</tbody></table></div></div>
  <div class="card" style="margin-top:18px"><h3>Lista (${lista.length})</h3><div class="table-wrap"><table><thead><tr><th>Matrícula</th><th>Nome</th><th>Faixa</th><th>Início</th><th>Situação</th><th>Telefone</th></tr></thead><tbody>${linhas || '<tr><td colspan="6" class="empty">Nenhum aluno com esses filtros.</td></tr>'}</tbody></table></div></div>`;
}
function baixarRelatorio() {
  const cols = ['Matrícula', 'Nome', 'Usuário', 'Faixa', 'Turma', 'Situação', 'Inativo desde', 'Treina desde', 'Nascimento', 'Responsável', 'Telefone', 'E-mail', 'Endereço', 'Aulas (30 dias)'];
  const d = v => v ? fmtDate(v) : '';
  const rows = alunosFiltrados().map(a => [a.cadastro.matricula, a.nome, a.login, faixa(a.faixa).nome, turmaNome(a.turmaId), a.ativo ? 'Ativo' : 'Inativo', d(a.inativoDesde), d(a.cadastro.inicio), d(a.cadastro.nascimento), a.cadastro.responsavel, a.cadastro.telefone, a.cadastro.email, a.cadastro.endereco, presencasDe(a.id, diasAtras(30)).length]);
  const nome = ['alunos', filtroRel.ano, filtroRel.situacao, filtroRel.faixa].filter(Boolean).join('-');
  baixarCsv(`${nome}-${today()}.csv`, cols, rows);
}

/* ---------- 12. AÇÕES ---------- */
async function trocarFoto(input) {
  const file = input.files?.[0]; if (!file) return;
  const alvo = input.dataset.foto === 'eu' ? meuId : input.dataset.foto;
  try {
    toast('Enviando foto…');
    const blob = await reduzirImagem(file, 600);
    const url = await subirArquivo(new File([blob], 'foto.jpg', { type: 'image/jpeg' }), 'fotos', alvo);
    const antigo = userById(alvo)?.foto;
    if (alvo === meuId && !isStaff(currentUser())) ok(await sb.rpc('definir_minha_foto', { url }));
    else ok(await sb.from('perfis').update({ foto_url: url }).eq('id', alvo));
    const p = caminhoDoArquivo(antigo, 'fotos'); if (p) await sb.storage.from('fotos').remove([p]);
    toast('Foto atualizada'); await recarregar();
  } catch (e) { toast(e.message, true); }
}
async function alternarPresenca(alunoId, marcar) {
  if (marcar) ok(await sb.from('presencas').upsert({ aluno_id: alunoId, data: presencaData, turma_id: userById(alunoId)?.turmaId || null }));
  else ok(await sb.from('presencas').delete().eq('aluno_id', alunoId).eq('data', presencaData));
  db.presencas = db.presencas.filter(p => !(p.aluno_id === alunoId && p.data === presencaData));
  if (marcar) db.presencas.push({ aluno_id: alunoId, data: presencaData, turma_id: userById(alunoId)?.turmaId || null });
}
const actions = {
  inicio() {
    const u = currentUser();
    go(u ? inicioDe(u) : '#/login/aluno');
  },
  async logout() {
    if (!demoAtivo) await sb.auth.signOut();
    demoAtivo = false; meuId = null; db = vazioDb(); auditoria = null; go('#/');
  },
  nav(d) { go(d.href); },
  'baixar-relatorio'() { baixarRelatorio(); },
  imprimir() { window.print(); },
  'fechar-acesso'() { ultimoAcesso = null; render(); },
  'open-event'(d) { go('#/evento/' + d.id); },
  async 'toggle-cont'(d, ev) {
    const cb = ev.target, marcado = cb.checked; cb.disabled = true;
    try {
      if (marcado) ok(await sb.from('apresentados').insert({ aluno_id: d.aluno, conteudo_id: d.id }));
      else ok(await sb.from('apresentados').delete().eq('aluno_id', d.aluno).eq('conteudo_id', d.id));
      const a = userById(d.aluno);
      a.apresentados = marcado ? [...a.apresentados, d.id] : a.apresentados.filter(x => x !== d.id);
      toast(marcado ? 'Marcado como apresentado' : 'Desmarcado');
    } catch (e) { cb.checked = !marcado; toast(e.message, true); }
    cb.disabled = false;
  },
  async presenca(d, ev) {
    const cb = ev.target; cb.disabled = true;
    try { await alternarPresenca(d.aluno, cb.checked); render(); }
    catch (e) { cb.checked = !cb.checked; cb.disabled = false; toast(e.message, true); }
  },
  async 'presenca-todos'(d, ev) {
    const btn = ev.target.closest('button'); btn.disabled = true;
    const lista = alunos().filter(a => !presencaTurma || a.turmaId === presencaTurma);
    try {
      if (d.on) ok(await sb.from('presencas').upsert(lista.map(a => ({ aluno_id: a.id, data: presencaData, turma_id: a.turmaId || null }))));
      else ok(await sb.from('presencas').delete().eq('data', presencaData).in('aluno_id', lista.map(a => a.id)));
      await recarregar(); toast(d.on ? 'Todos marcados' : 'Todos desmarcados');
    } catch (e) { btn.disabled = false; toast(e.message, true); }
  },
  async del(d, ev) {
    if (!confirmar(ev.target.closest('button'))) return;
    try {
      // Ao excluir um evento, apaga também o cartaz e os arquivos enviados
      const ev0 = d.col === 'eventos' ? db.eventos.find(e => e.id === d.id) : null;
      ok(await sb.from(d.col).delete().eq('id', d.id));
      if (ev0) {
        const paths = [ev0.cartaz_url, ...ev0.materiais.map(m => m.url)].map(u => caminhoDoArquivo(u, 'eventos')).filter(Boolean);
        if (paths.length) await sb.storage.from('eventos').remove(paths);
      }
      toast('Excluído'); if (d.col === 'depoimentos') await carregarPublico(); await recarregar();
    }
    catch (e) { toast(e.message, true); }
  },
  async 'del-foto'(d, ev) {
    if (!confirmar(ev.target.closest('button'))) return;
    try {
      const g = publico.galeria.find(x => x.id === d.id);
      ok(await sb.from('galeria').delete().eq('id', d.id));
      const p = caminhoDoArquivo(g?.url, 'galeria'); if (p) await sb.storage.from('galeria').remove([p]);
      await carregarPublico(); render(); toast('Foto excluída');
    } catch (e) { toast(e.message, true); }
  },
  async 'publicar-dep'(d) {
    try { ok(await sb.from('depoimentos').update({ publicado: !!d.on }).eq('id', d.id)); await carregarPublico(); render(); toast(d.on ? 'Publicado no site' : 'Ocultado do site'); }
    catch (e) { toast(e.message, true); }
  },
  async 'ativo-conta'(d, ev) {
    const a = userById(d.id); if (!a) return;
    const btn = ev.target.closest('button');
    if (a.ativo && !confirmar(btn, `Confirmar: desativar ${primeiroNome(a.nome)}?`)) return;
    btn.disabled = true;
    try { await funcaoAluno({ acao: a.ativo ? 'desativar' : 'reativar', id: d.id }); toast(a.ativo ? 'Conta desativada' : 'Conta reativada'); auditoria = null; await recarregar(); }
    catch (e) { toast(e.message, true); btn.disabled = false; }
  },
  async 'excluir-conta'(d, ev) {
    const a = userById(d.id); if (!a) return;
    if (!confirmar(ev.target.closest('button'), `Confirmar exclusão de ${primeiroNome(a.nome)}?`)) return;
    try {
      const foto = caminhoDoArquivo(a.foto, 'fotos');
      await funcaoAluno({ acao: 'excluir', id: d.id });
      if (foto) await sb.storage.from('fotos').remove([foto]);
      toast('Conta excluída'); auditoria = null; await carregar(); go(d.volta || '#/painel/alunos');
    } catch (e) { toast(e.message, true); }
  },
  async 'nova-senha'(d, ev) {
    const a = userById(d.id); if (!a) return;
    if (!confirmar(ev.target.closest('button'), 'Confirmar: gerar nova senha?')) return;
    try {
      const senha = gerarSenha();
      await funcaoAluno({ acao: 'senha', id: a.id, senha });
      ultimoAcesso = { nome: a.nome, login: a.login, senha, telefone: a.cadastro.telefone, onde: rota };
      toast('Nova senha gerada'); render(); window.scrollTo(0, 0);
    } catch (e) { toast(e.message, true); }
  },
  async desvincular(d, ev) {
    if (!confirmar(ev.target.closest('button'))) return;
    try { ok(await sb.from('responsaveis').delete().eq('responsavel_id', d.resp).eq('aluno_id', d.aluno)); toast('Acesso removido'); await recarregar(); }
    catch (e) { toast(e.message, true); }
  },
  async inscrever(d, ev) {
    const btn = ev.target.closest('button'); btn.disabled = true;
    try {
      if (d.on) ok(await sb.from('inscricoes').delete().eq('evento_id', d.evento).eq('aluno_id', d.aluno));
      else ok(await sb.from('inscricoes').insert({ evento_id: d.evento, aluno_id: d.aluno }));
      toast(d.on ? 'Inscrição cancelada' : 'Inscrição feita! 🎉'); await recarregar();
    } catch (e) { btn.disabled = false; toast(e.message, true); }
  },
  'csv-inscritos'(d) {
    const e = db.eventos.find(x => x.id === d.id); if (!e) return;
    const rows = db.inscricoes.filter(i => i.evento_id === e.id).map(i => userById(i.aluno_id)).filter(Boolean)
      .map(a => [a.cadastro.matricula, a.nome, faixa(a.faixa).nome, a.cadastro.nascimento ? idade(a.cadastro.nascimento) : '', a.cadastro.responsavel, a.cadastro.telefone]);
    baixarCsv(`inscritos-${e.data}.csv`, ['Matrícula', 'Nome', 'Faixa', 'Idade', 'Responsável', 'Telefone'], rows);
  },
  async pagar(d, ev) {
    const btn = ev.target.closest('button'); btn.disabled = true;
    const forma = document.querySelector(`[data-forma="${d.id}"]`)?.value || null;
    try { ok(await sb.from('cobrancas').update({ pago_em: today(), forma }).eq('id', d.id)); toast('Pagamento registrado'); auditoria = null; await recarregar(); }
    catch (e) { btn.disabled = false; toast(e.message, true); }
  },
  async 'desfazer-pago'(d, ev) {
    if (!confirmar(ev.target.closest('button'), 'Confirmar?')) return;
    try { ok(await sb.from('cobrancas').update({ pago_em: null, forma: null }).eq('id', d.id)); toast('Pagamento desfeito'); await recarregar(); }
    catch (e) { toast(e.message, true); }
  },
  async 'gerar-mensalidades'(d, ev) {
    const btn = ev.target.closest('button'); btn.disabled = true;
    const [y, m] = mesFin.split('-');
    const novas = alunos().filter(a => a.valorMensalidade > 0 && !db.cobrancas.some(c => c.aluno_id === a.id && c.tipo === 'mensalidade' && c.referencia === mesFin))
      .map(a => ({ aluno_id: a.id, tipo: 'mensalidade', referencia: mesFin, valor: a.valorMensalidade, vencimento: `${y}-${m}-${pad(a.diaVencimento || 10)}` }));
    try { if (novas.length) ok(await sb.from('cobrancas').insert(novas)); toast(`${novas.length} mensalidade(s) gerada(s)`); await recarregar(); }
    catch (e) { btn.disabled = false; toast(e.message, true); }
  },
  'csv-financeiro'() {
    const rows = db.cobrancas.filter(c => c.vencimento.slice(0, 7) === mesFin).map(c => { const a = userById(c.aluno_id); return [a?.cadastro.matricula, a?.nome, TIPOS_COB[c.tipo], c.referencia, c.descricao, String(c.valor).replace('.', ','), fmtDate(c.vencimento), STATUS_COB[statusCob(c)], c.pago_em ? fmtDate(c.pago_em) : '', c.forma]; });
    baixarCsv(`financeiro-${mesFin}.csv`, ['Matrícula', 'Aluno', 'Tipo', 'Referência', 'Descrição', 'Valor', 'Vencimento', 'Situação', 'Pago em', 'Forma'], rows);
  },
  backup() {
    const dados = { gerado_em: new Date().toISOString(), ...db, users: db.users, galeria: publico.galeria, depoimentos: publico.depoimentos };
    baixarArquivo(`backup-souza-taekwondo-${today()}.json`, JSON.stringify(dados, null, 2), 'application/json');
    toast('Backup baixado. Guarde em um lugar seguro (Google Drive, pendrive…).');
  },
};

const forms = {
  login: (f, fd) => ocupado(f, async () => {
    const login = String(fd.get('login')).trim().toLowerCase();
    const senha = String(fd.get('senha'));
    const acessoDemo = DEMO_ACESSOS[login];
    if (acessoDemo && senha === acessoDemo.senha) {
      carregarDemo(acessoDemo.id);
      go(inicioDe(currentUser()));
      return;
    }
    const email = login.includes('@') ? login : `${login}@${CONFIG.dominioLogin}`;
    const { error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) {
      $('#login-err').textContent = traduz(error.message);
      const fa = $('.faixa-anim'); if (fa) { fa.classList.remove('erro'); void fa.offsetWidth; fa.classList.add('erro'); }
      return;
    }
    await carregar();
    const u = currentUser();
    if (!u) { await sb.auth.signOut(); $('#login-err').textContent = 'Conta sem cadastro na academia. Fale com o mestre.'; return; }
    // A faixa "aperta" e ganha a cor da graduação antes de abrir a área
    const fa = $('.faixa-anim');
    if (fa && !semMovimento()) {
      const aluno = u.papel === 'aluno';
      fa.style.setProperty('--fx-cor', aluno ? faixa(u.faixa).cor : '#111');
      $('#fx-leg').textContent = `${aluno ? 'Faixa ' + faixa(u.faixa).nome + ' · ' : ''}Bem-vindo(a), ${primeiroNome(u.nome)}!`;
      fa.classList.add('apertar');
      await new Promise(r => setTimeout(r, 1200));
    }
    go(inicioDe(u));
  }),
  'minha-senha': (f, fd) => ocupado(f, async () => {
    if (fd.get('s1') !== fd.get('s2')) throw new Error('As duas senhas não são iguais.');
    ok(await sb.auth.updateUser({ password: String(fd.get('s1')) }));
    toast('Senha alterada'); f.reset();
  }),
  experimental: (f, fd) => {
    const nome = String(fd.get('nome')).trim(), id = String(fd.get('idade') || '').trim(), h = String(fd.get('horario') || '');
    const txt = `Olá! Gostaria de agendar uma aula experimental.\n\n👤 Nome: ${nome}${id ? `\n🎂 Idade: ${id} anos` : ''}${h ? `\n🕒 Horário de interesse: ${h}` : ''}`;
    window.open(waLink(txt), '_blank', 'noopener');
  },
  'novo-aluno': (f, fd) => ocupado(f, async () => {
    const login = String(fd.get('login')).trim().toLowerCase(), senha = String(fd.get('senha')), nome = String(fd.get('nome')).trim();
    const cad = { ...cadastroFrom(fd), turma_id: nul(fd.get('turma_id')), valor_mensalidade: nul(fd.get('valor_mensalidade')), dia_vencimento: nul(fd.get('dia_vencimento')) };
    const r = await funcaoAluno({ acao: 'criar', papel: 'aluno', login, senha, nome, faixa: fd.get('faixa'), cadastro: cad });
    ultimoAcesso = { nome, login, senha, telefone: cad.telefone, onde: '#/painel/aluno/' + r.id };
    toast(`Aluno cadastrado${r?.matricula ? ' — matrícula ' + r.matricula : ''}`); await carregar(); go('#/painel/aluno/' + r.id);
  }),
  'editar-aluno': (f, fd) => ocupado(f, async () => {
    const id = f.dataset.id;
    const dados = { nome: String(fd.get('nome')).trim(), turma_id: nul(fd.get('turma_id')), ...cadastroFrom(fd) };
    if (fd.has('valor_mensalidade')) { dados.valor_mensalidade = nul(fd.get('valor_mensalidade')); dados.dia_vencimento = nul(fd.get('dia_vencimento')); }
    ok(await sb.from('perfis').update(dados).eq('id', id));
    toast('Cadastro salvo'); await recarregar();
  }),
  promover: (f, fd) => ocupado(f, async () => {
    const a = userById(f.dataset.id); if (!a) return;
    const nova = fd.get('faixa');
    if (faixaIdx(nova) <= faixaIdx(a.faixa)) throw new Error('Escolha uma faixa superior à atual.');
    ok(await sb.from('perfis').update({ faixa: nova }).eq('id', a.id));
    ok(await sb.from('historico').insert({ aluno_id: a.id, faixa: nova, data: fd.get('data'), obs: nul(String(fd.get('obs') || '')) }));
    toast(`Parabéns! Nova faixa: ${faixa(nova).nome}. O certificado já está no histórico.`); auditoria = null; await recarregar();
  }),
  'novo-responsavel': (f, fd) => ocupado(f, async () => {
    const login = String(fd.get('login')).trim().toLowerCase(), senha = String(fd.get('senha')), nome = String(fd.get('nome')).trim(), telefone = nul(String(fd.get('telefone') || '').trim());
    await funcaoAluno({ acao: 'criar', papel: 'responsavel', login, senha, nome, cadastro: { telefone }, alunos: [f.dataset.aluno] });
    ultimoAcesso = { nome, login, senha, telefone, onde: rota };
    toast('Acesso do responsável criado'); await recarregar(); window.scrollTo(0, 0);
  }),
  vincular: (f, fd) => ocupado(f, async () => {
    ok(await sb.from('responsaveis').insert({ responsavel_id: fd.get('resp'), aluno_id: f.dataset.aluno }));
    toast('Responsável vinculado'); await recarregar();
  }),
  'nova-equipe': (f, fd) => ocupado(f, async () => {
    const login = String(fd.get('login')).trim().toLowerCase(), senha = String(fd.get('senha')), nome = String(fd.get('nome')).trim(), telefone = nul(String(fd.get('telefone') || '').trim());
    await funcaoAluno({ acao: 'criar', papel: fd.get('papel'), login, senha, nome, cadastro: { telefone } });
    ultimoAcesso = { nome, login, senha, telefone, onde: rota };
    toast('Conta criada'); await recarregar(); window.scrollTo(0, 0);
  }),
  'nova-turma': (f, fd) => ocupado(f, async () => {
    ok(await sb.from('turmas').insert({ nome: String(fd.get('nome')).trim(), horario: nul(String(fd.get('horario') || '').trim()) }));
    toast('Turma criada'); await recarregar();
  }),
  'novo-conteudo': (f, fd) => ocupado(f, async () => {
    faixaAberta = fd.get('faixa');
    ok(await sb.from('conteudos').insert({ faixa: fd.get('faixa'), titulo: String(fd.get('titulo')).trim(), descricao: nul(String(fd.get('descricao'))) }));
    toast('Conteúdo adicionado'); await recarregar();
    document.getElementById('nc-titulo-' + faixaAberta)?.focus();
  }),
  'novo-video': (f, fd) => ocupado(f, async () => {
    const url = safeUrl(fd.get('url')); if (!url) throw new Error('Cole um link que comece com https://');
    ok(await sb.from('videos').insert({ faixa: fd.get('faixa'), titulo: String(fd.get('titulo')).trim(), url, descricao: nul(String(fd.get('descricao'))) }));
    toast('Vídeo publicado'); await recarregar();
  }),
  'novo-evento': (f, fd) => ocupado(f, async () => {
    const cartaz_url = await subirArquivo(fd.get('cartaz'));
    const materiais = [];
    for (const file of fd.getAll('arquivos')) if (file && file.size) materiais.push({ nome: file.name, url: await subirArquivo(file) });
    String(fd.get('links') || '').split('\n').forEach(l => { const [n, ...r] = l.split('|'); const u = safeUrl(r.join('|')); if (n.trim() && u) materiais.push({ nome: n.trim(), url: u }); });
    ok(await sb.from('eventos').insert({ tipo: fd.get('tipo'), titulo: String(fd.get('titulo')).trim(), data: fd.get('data'), hora: nul(fd.get('hora')),
      local: String(fd.get('local')).trim(), descricao: nul(String(fd.get('descricao'))), cartaz_url: nul(cartaz_url), materiais }));
    toast('Publicado!'); await recarregar();
  }),
  'cobrar-inscritos': (f, fd) => ocupado(f, async () => {
    const e = db.eventos.find(x => x.id === f.dataset.id); const valor = Number(fd.get('valor'));
    const ids = db.inscricoes.filter(i => i.evento_id === e.id).map(i => i.aluno_id)
      .filter(id => !db.cobrancas.some(c => c.aluno_id === id && c.descricao === e.titulo && c.tipo === e.tipo));
    if (!ids.length) throw new Error('Todos os inscritos já têm essa cobrança.');
    ok(await sb.from('cobrancas').insert(ids.map(id => ({ aluno_id: id, tipo: e.tipo, descricao: e.titulo, valor, vencimento: e.data }))));
    toast(`${ids.length} cobrança(s) criada(s) — veja em Financeiro`); await recarregar();
  }),
  'nova-cobranca': (f, fd) => ocupado(f, async () => {
    ok(await sb.from('cobrancas').insert({ aluno_id: fd.get('aluno_id'), tipo: fd.get('tipo'), valor: Number(fd.get('valor')), vencimento: fd.get('vencimento'), descricao: nul(String(fd.get('descricao') || '').trim()) }));
    toast('Cobrança criada'); await recarregar();
  }),
  'nova-foto': (f, fd) => ocupado(f, async () => {
    const files = fd.getAll('fotos').filter(x => x && x.size); const legenda = nul(String(fd.get('legenda') || '').trim());
    let n = 0;
    for (const file of files) {
      toast(`Enviando foto ${++n} de ${files.length}…`);
      const blob = await reduzirImagem(file, 1600);
      const url = await subirArquivo(new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }), 'galeria');
      ok(await sb.from('galeria').insert({ url, legenda }));
    }
    toast(`${files.length} foto(s) publicada(s) no site`); await carregarPublico(); render();
  }),
  'novo-depoimento': (f, fd) => ocupado(f, async () => {
    ok(await sb.from('depoimentos').insert({ nome: String(fd.get('nome')).trim(), relacao: nul(String(fd.get('relacao') || '').trim()), texto: String(fd.get('texto')).trim() }));
    toast('Depoimento publicado no site'); await carregarPublico(); render();
  }),
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (el && el.tagName !== 'INPUT') { const fn = actions[el.dataset.action]; if (fn) fn(el.dataset, e); return; }
  // Links internos: "#/tela" troca de tela; "#secao" rola até a seção da página inicial
  const link = e.target.closest('a[href^="#"]'); if (!link) return;
  e.preventDefault();
  const h = link.getAttribute('href');
  if (h.startsWith('#/')) return go(h);
  if (!$('.hero')) go('#/');
  document.getElementById(h.slice(1))?.scrollIntoView({ behavior: 'smooth' });
});
document.addEventListener('change', e => {
  const t = e.target, d = t.dataset || {};
  if (t.tagName === 'INPUT' && t.type === 'checkbox' && d.action && actions[d.action]) return actions[d.action](d, e);
  if (d.foto) return trocarFoto(t);
  if (d.rel) { filtroRel[d.rel] = t.value; return render(); }
  if (d.aniv) { mesAniv = +t.value; return render(); }
  if (d.pres === 'data') { presencaData = t.value || today(); return render(); }
  if (d.pres === 'turma') { presencaTurma = t.value; return render(); }
  if (d.fin === 'mes') { mesFin = t.value || mesAtual(); return render(); }
});
document.addEventListener('input', e => {
  const d = e.target.dataset || {}; if (!d.busca) return;
  if (d.busca === 'aluno') buscaAluno = e.target.value; else filtroHist = e.target.value;
  const pos = e.target.selectionStart; render();
  const novo = document.querySelector(`[data-busca="${d.busca}"]`); if (novo) { novo.focus(); novo.setSelectionRange(pos, pos); }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault(); const fn = forms[f.dataset.form]; if (fn) fn(f, new FormData(f));
});

/* ---------- 13. ROTAS ---------- */
function render() {
  const [, r, a, b] = (rota.slice(1) || '/').split('/');
  let html;
  if (!r) {
    const u = currentUser();
    return go(u ? inicioDe(u) : '#/login/aluno', true);
  }
  else if (carregando) html = viewCarregando();
  else {
    const u = currentUser();
    if (r === 'login') { if (u) return go(inicioDe(u), true); html = viewLogin(a); }
    else if (!u) return go('#/login/aluno', true);
    else if (r === 'aluno') { if (isStaff(u)) return go('#/painel/alunos', true); html = viewAluno(u, a); }
    else if (r === 'evento') html = viewEvento(u, a);
    else if (r === 'senha') html = viewSenha(u);
    else if (r === 'carteirinha') html = viewCarteirinha(u, a);
    else if (r === 'certificado') html = viewCertificado(u, a);
    else if (r === 'painel') { if (!isStaff(u)) return go('#/aluno', true); html = viewPainel(u, a || 'alunos', b); }
    else return go(inicioDe(u), true);
  }
  const rolar = rota !== render._rota; render._rota = rota;
  $('#app').innerHTML = html;
  ativarEfeitos();
  if (rolar) window.scrollTo(0, 0);
}
window.addEventListener('popstate', () => { rota = location.hash.startsWith('#/') ? location.hash : '#/'; render(); });
sb.auth.onAuthStateChange((evt) => { if (!demoAtivo && evt === 'SIGNED_OUT' && meuId) { meuId = null; go('#/login/aluno'); } });

// Instalar como aplicativo (funciona sem internet só para abrir; os dados precisam de conexão)
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

// Equipamentos desenhados em SVG (traço dourado) para a abertura
const EQUIPAMENTOS = [
  ['Capacete', 'M22 54C22 28 36 12 50 12S78 28 78 54V70C78 80 71 86 63 86H61V60C61 50 56 45 50 45S39 50 39 60V86H37C29 86 22 80 22 70Z', 'M30 40H70'],
  ['Luva', 'M32 42C32 27 42 18 56 18C71 18 79 29 79 44V62C79 72 71 80 61 80H46V92H32Z', 'M32 50C23 50 19 58 23 64L32 66M46 80V70'],
  ['Protetor de peito', 'M24 18H76L83 33L80 70C72 84 61 90 50 90S28 84 20 70L17 33Z', 'M50 40A13 13 0 1 0 50.1 40ZM50 48A5 5 0 1 0 50.1 48Z'],
  ['Caneleira', 'M37 10C37 6 63 6 63 10L66 80C66 91 34 91 34 80Z', 'M36 30H64M35 58H65'],
  ['Dobok', 'M31 14L44 10L50 32L56 10L69 14L88 31L78 43L71 37V90H29V37L22 43L12 31Z', 'M50 32V90M29 60H71'],
  ['Faixa', 'M6 42H94V56H6Z', 'M40 36H60V62H40ZM44 62L32 90M56 62L68 90'],
];
// Abertura do site: os equipamentos voam dos cantos e se unem no centro, viram a logo
// dentro de um círculo dourado e o nome aparece letra por letra. Só na página inicial, uma vez por visita.
// Efeitos da página inicial (ativados depois de cada desenho da tela)
let observador = null;
function ativarEfeitos() {
  const itens = document.querySelectorAll('.revelar');
  if (!itens.length) return;
  if (semMovimento() || !('IntersectionObserver' in window)) { itens.forEach(e => e.classList.add('visivel')); return; }
  observador?.disconnect();
  observador = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visivel'); observador.unobserve(en.target); } }), { rootMargin: '0px 0px -10% 0px' });
  itens.forEach((e, i) => { e.style.setProperty('--atraso', `${(i % 4) * 0.06}s`); observador.observe(e); });
}
document.addEventListener('pointermove', e => {
  const b = e.target.closest?.('.brilho-mouse');
  if (b) { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', `${e.clientX - r.left}px`); b.style.setProperty('--my', `${e.clientY - r.top}px`); }
  const c = e.target.closest?.('.inclinar');
  if (c && innerWidth >= 900 && !semMovimento()) {
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    c.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) translateY(-4px)`;
  }
});
document.addEventListener('pointerout', e => { const c = e.target.closest?.('.inclinar'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });
addEventListener('scroll', () => {
  const p = $('#progresso'); if (p) p.style.width = `${(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)) * 100}%`;
  $('.topbar')?.classList.toggle('rolado', scrollY > 25);
}, { passive: true });

function abertura() {
  if (rota !== '#/' || semMovimento()) return;
  try { if (sessionStorage.getItem('stt-abertura')) return; sessionStorage.setItem('stt-abertura', '1'); } catch (e) {}
  document.body.classList.add('com-abertura');
  const nome = CONFIG.nome.toUpperCase().split('').map((c, i) => `<span style="--i:${i}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
  const el = document.createElement('div');
  el.id = 'abertura'; el.setAttribute('aria-hidden', 'true');
  const angulos = [-150, -90, -30, 30, 90, 150];
  const equips = EQUIPAMENTOS.map(([nomeEq, contorno, detalhe], i) => {
    const a = angulos[i] * Math.PI / 180, dist = Math.max(window.innerWidth, window.innerHeight) * 0.62;
    return `<svg class="ab-eq" viewBox="0 0 100 100" aria-label="${nomeEq}" style="--dx:${Math.round(Math.cos(a) * dist)}px;--dy:${Math.round(Math.sin(a) * dist)}px;--r:${i % 2 ? 140 : -140}deg;--d:${(i * 0.09).toFixed(2)}s"><path d="${contorno}"></path><path d="${detalhe}" class="ab-det"></path></svg>`;
  }).join('');
  el.innerHTML = `<div class="ab-centro">${equips}
      <svg class="ab-anel" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92"></circle><circle cx="100" cy="100" r="80" class="ab-anel2"></circle></svg>
      <img class="ab-logo" src="${CONFIG.logo}" alt="">
      <span class="ab-corte"></span>
    </div>
    <p class="ab-nome">${nome}</p>
    <p class="ab-lema">${esc(CONFIG.lema)}</p>
    <button type="button" class="ab-pular">Pular ›</button>`;
  document.body.appendChild(el);
  let fechou = false;
  const fechar = () => {
    if (fechou) return; fechou = true;
    // Os equipamentos saem do centro da logo e vão para o círculo do topo
    const centro = el.querySelector('.ab-centro')?.getBoundingClientRect();
    const cx = centro ? centro.left + centro.width / 2 : innerWidth / 2, cy = centro ? centro.top + centro.height / 2 : innerHeight / 2;
    document.querySelectorAll('.orb-item svg').forEach((svg, i) => {
      const r = svg.getBoundingClientRect();
      svg.style.setProperty('--sx', `${Math.round(cx - (r.left + r.width / 2))}px`);
      svg.style.setProperty('--sy', `${Math.round(cy - (r.top + r.height / 2))}px`);
      svg.style.setProperty('--sd', `${(i * 0.07).toFixed(2)}s`);
      svg.classList.add('chegando');
      svg.addEventListener('animationend', ev => { if (ev.animationName === 'orb-chega') svg.classList.remove('chegando'); });
    });
    el.classList.add('saindo'); document.body.classList.remove('com-abertura');
    setTimeout(() => el.remove(), 700);
  };
  el.addEventListener('click', fechar);
  setTimeout(fechar, 3700);
}

dadosParaGoogle();
render();
carregarPublico().then(() => { if (rota === '#/' || rota.startsWith('#/painel/site')) render(); }).catch(() => {});
carregar().catch(e => toast(e.message, true)).finally(() => { carregando = false; if (rota !== '#/') render(); });

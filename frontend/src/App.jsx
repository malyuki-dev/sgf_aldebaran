import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  // --- LÓGICA DO MODO QUIOSQUE (AUTOMÁTICA) ---
  // 1. Verifica se tem "?modo=totem" lá no endereço do navegador
  const isModoTotem = new URLSearchParams(window.location.search).get('modo') === 'totem'

  // 2. Estado da Tela: Começa sempre no totem
  const [tela, setTela] = useState('totem')
  
  // 3. Estado do Menu: 
  // Se for modo totem, começa FALSE (escondido). 
  // Se for acesso normal, começa TRUE (visível).
  const [menuVisivel, setMenuVisivel] = useState(!isModoTotem)

  // Login (Mantivemos a lógica de segurança)
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const salvo = localStorage.getItem('usuario_sgf')
    return salvo ? JSON.parse(salvo) : null
  })

  const sair = () => {
    setUsuarioLogado(null)
    localStorage.removeItem('usuario_sgf')
    setTela('totem')
  }

  // Função para trazer o menu de volta (clicar no Logo)
  const toggleMenu = () => {
    if (!menuVisivel) {
      setMenuVisivel(true)
    }
  }

  return (
    <div className="app-container">
      
      {/* CABEÇALHO (Agora ele serve como botão secreto também) */}
      <header 
        className="header" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: !menuVisivel ? 'pointer' : 'default', // Mostra mãozinha se menu estiver oculto
          userSelect: 'none' // Não deixa selecionar o texto
        }}
        onClick={toggleMenu} // <--- O SEGREDO ESTÁ AQUI
        title={!menuVisivel ? "Clique para abrir o menu" : ""}
      >
        <h1>💧 Aldebaran Águas</h1>
        
        {/* Info do Usuário (só aparece se menu estiver visível) */}
        {menuVisivel && usuarioLogado && (
          <div style={{ fontSize: '0.9rem' }}>
            Olá, {usuarioLogado.nome} | <button onClick={sair} style={{background:'none', border:'none', color:'white', cursor:'pointer', textDecoration:'underline'}}>Sair</button>
          </div>
        )}
      </header>

      <main className="main-content">
        {tela === 'totem' && <TelaTotem />}
        {tela === 'atendente' && (usuarioLogado ? <TelaAtendente usuario={usuarioLogado} /> : <TelaLogin aoLogar={setUsuarioLogado} />)}
        {tela === 'tv' && <TelaTV />}
        {tela === 'avaliacao' && <TelaAvaliacao />}
      </main>

      {/* RODAPÉ (Só aparece se menuVisivel for TRUE) */}
      {menuVisivel && (
        <footer className="footer" style={{background: '#333', color: 'white'}}>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{marginRight: 20, color: '#aaa', fontSize: '0.8rem'}}>MENU:</span>
            
            <button className="btn-trocar-tela" onClick={() => setTela('totem')}>🖥️ Totem</button>
            <button className="btn-trocar-tela" onClick={() => setTela('atendente')}>
               {usuarioLogado ? '👨‍💻 Atendente' : '🔒 Área Restrita'}
            </button>
            <button className="btn-trocar-tela" onClick={() => setTela('tv')}>📺 TV</button>
            <button className="btn-trocar-tela" onClick={() => setTela('avaliacao')}>⭐ Avaliar</button>

            {/* BOTÃO PARA ESCONDER TUDO */}
            <button 
              onClick={() => setMenuVisivel(false)}
              style={{
                marginLeft: 'auto', background: '#dc3545', color: 'white', border: 'none', 
                padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              ❌ Esconder Menu (Modo Totem)
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

// --- OUTROS COMPONENTES ---

function TelaLogin({ aoLogar }) {
  const [login, setLogin] = useState(''); const [senha, setSenha] = useState(''); const [erro, setErro] = useState('')
  const tentarLogin = () => { axios.post('http://localhost:3000/usuario/login', { login, senha }).then(res => { aoLogar(res.data); localStorage.setItem('usuario_sgf', JSON.stringify(res.data)) }).catch(() => setErro("Login inválido!")) }
  const criarAdmin = async () => { try { await axios.post('http://localhost:3000/usuario/setup'); alert("Criado admin/123456") } catch { alert("Erro") } }
  return ( <div style={{maxWidth:300, textAlign:'center'}}><h2>🔒 Acesso Restrito</h2><input placeholder="Usuário" value={login} onChange={e=>setLogin(e.target.value)} style={{width:'100%', padding:10, marginBottom:10}}/><input type="password" placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} style={{width:'100%', padding:10, marginBottom:10}}/>{erro && <p style={{color:'red'}}>{erro}</p>}<button onClick={tentarLogin} className="btn-servico" style={{width:'100%', fontSize:'1rem'}}>Entrar</button><div style={{marginTop:20}}><button onClick={criarAdmin} style={{background:'none', border:'none', color:'#999', fontSize:'0.8rem'}}>(Dev: Criar Admin)</button></div></div> )
}

function TelaTotem() {
  const [servicos, setServicos] = useState([]); const [senhaGerada, setSenhaGerada] = useState(null)
  useEffect(() => { axios.get('http://localhost:3000/fila/servicos').then(res => setServicos(res.data)).catch(console.error) }, [])
  const solicitar = (id) => { axios.post('http://localhost:3000/fila/solicitar_senha', { servico_id: id }).then(res => { setSenhaGerada(res.data.numeroDisplay); setTimeout(() => setSenhaGerada(null), 5000) }).catch(() => alert("Erro")) }
  return ( <div style={{width:'100%', display:'flex', flexDirection:'column', alignItems:'center'}}><div className="servicos-grid">{servicos.map(s => <button key={s.id} onClick={() => solicitar(s.id)} className="btn-servico">{s.nome}</button>)}</div>{senhaGerada && <div className="modal-senha"><h1>{senhaGerada}</h1><p>Aguarde</p></div>}</div> )
}

function TelaAtendente({ usuario }) {
  const [senhaAtual, setSenhaAtual] = useState(null); const guiche = 1
  const chamarProximo = () => { axios.post('http://localhost:3000/fila/chamar_proximo', { guiche }).then(res => setSenhaAtual(res.data.senha)).catch(err => { if(err.response?.status === 404) alert("Fila vazia! ☕"); else alert("Erro") }) }
  return ( <div className="painel-atendente"><div style={{marginBottom:10, color:'#28a745'}}>Operador: {usuario.nome}</div><h2>Guichê {guiche}</h2><div style={{margin:'30px 0'}}><p style={{color:'#666'}}>Em atendimento:</p><div className="senha-gigante">{senhaAtual || "---"}</div></div><button onClick={chamarProximo} className="btn-chamar">📢 Chamar Próximo</button></div> )
}

function TelaTV() {
  const [u, setU] = useState([]); useEffect(() => { const i = setInterval(() => axios.get('http://localhost:3000/fila/painel').then(r => setU(r.data)), 2000); return () => clearInterval(i) }, [])
  return <div style={{textAlign:'center'}}>{u[0] ? <div style={{background:'white', padding:'50px', borderRadius:30, borderLeft:'20px solid #d63384'}}><h1 style={{fontSize:'8rem', margin:0}}>{u[0].numeroDisplay}</h1><h2>GUICHÊ 1</h2></div> : <h1>Aguardando...</h1>}</div>
}

function TelaAvaliacao() {
  const [s, setS] = useState(''); const [n, setN] = useState(0)
  const env = () => { axios.post('http://localhost:3000/fila/avaliar', {numero:s.toUpperCase(), nota:n}).then(()=>alert("Obrigado!")).catch(()=>alert("Erro")) }
  return <div style={{textAlign:'center'}}><input value={s} onChange={e=>setS(e.target.value)} placeholder="Senha (ex: GER-001)" style={{padding:15, fontSize:'1.5rem', textAlign:'center', textTransform:'uppercase'}}/><br/><br/><div style={{display:'flex', gap:10, justifyContent:'center'}}>{[1,2,3,4,5].map(e=><button key={e} onClick={()=>setN(e)} style={{background:'none', border:'none', fontSize:'3rem', color:e<=n?'orange':'#ddd'}}>★</button>)}</div><br/><button onClick={env} className="btn-servico">Avaliar</button></div>
}

export default App
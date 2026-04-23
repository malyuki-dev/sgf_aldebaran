async function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function run() {
  const baseUrl = 'http://localhost:3000/fila';
  const filialId = 1;

  console.log('--- 🚀 [ SGF ALDEBARAN ] ---');
  console.log('--- AUTOMAÇÃO: FLUXO DE AGENDAMENTO (VIP) ---\n');

  try {
    // 1. Cliente agenda pela Internet (Gera no BD)
    console.log('1️⃣ [INTERNET]: Cliente ligou/acessou portal e agendou para Hoje às 10:00.');
    const randomHour = Math.floor(Math.random() * (17 - 8 + 1) + 8).toString().padStart(2, '0');
    const randomMinute = Math.random() > 0.5 ? '00' : '30';
    const agendamentoData = {
      nome: "Sr.VIP Almeida",
      documento: "123.456.789-00",
      email: "vip@aldebaran.com.br",
      telefone: "11988887777",
      data: new Date().toISOString().split('T')[0],
      hora: `${randomHour}:${randomMinute}`,
      servico_id: 2, // Retirada Pesada
      codigo: "VIP" + Math.floor(Math.random() * 1000),
      filial_id: filialId
    };

    let res = await fetch(`${baseUrl}/agendamento`, {
      method: 'POST', body: JSON.stringify(agendamentoData), headers: { 'Content-Type': 'application/json' }
    });
    let agend = await res.json();
    if (agend.message) throw new Error(agend.message);

    console.log(`   ✔️ Reserva Criada! Código do Check-in recebido no SMS: [ ${agend.codigo} ]`);

    await wait(2000);

    // 2. Cliente chega 10:00 na filial e vai no totem CHECK-IN
    console.log('\n2️⃣ [TOTEM CHECK-IN]: Cliente chega presencialmente e digita o código.');
    res = await fetch(`${baseUrl}/checkin/validar`, {
      method: 'POST', body: JSON.stringify({ codigo: agend.codigo, filialId }), headers: { 'Content-Type': 'application/json' }
    });
    let checkin = await res.json();
    if (checkin.valido === false) throw new Error(checkin.mensagem);
    n
    console.log(`   ✔️ Sucesso! Totem imprime Senha VIP com Bônus de Prioridade Adicionado: [ ${checkin.ticket.numeroDisplay} ]`);
    console.log(`   (A senha saltou na frente de usuários convencionais na base de dados!)`);

    await wait(1000);

    // 3. Operador chama da fila
    console.log('\n3️⃣ [OPERADOR]: Atendente clica "Chamar Próximo" (O Banco obedece a prioridade).');
    res = await fetch(`${baseUrl}/chamar_proximo`, {
      method: 'POST', body: JSON.stringify({ guiche: 1 }), headers: { 'Content-Type': 'application/json' }
    });
    let senha = await res.json();
    console.log(`   📣 TV Tocou: "Senha ${senha.numeroDisplay} - Guichê 1" (Furou a fila com louvor!)`);

    // Limpeza Mínima (Atendimento inicia e finaliza pra limpar a tela)
    await fetch(`${baseUrl}/iniciar_atendimento`, { method: 'POST', body: JSON.stringify({ senhaId: senha.id }), headers: { 'Content-Type': 'application/json' } });
    await fetch(`${baseUrl}/finalizar_atendimento`, { method: 'POST', body: JSON.stringify({ senhaId: senha.id }), headers: { 'Content-Type': 'application/json' } });

    console.log('\n--- 🎉 AGENDAMENTO COMPROVADO E FINALIZADO! ---\n');

  } catch (e) {
    console.error('❌ ERRO NA SIMULAÇÃO:', e.message);
  }
}

run();

async function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function run() {
  const baseUrl = 'http://localhost:3000/fila';
  const filialId = 1;

  console.log('--- 🚀 [ SGF ALDEBARAN ] ---');
  console.log('--- AUTOMAÇÃO: FLUXO TOTAL DA FILA PRESENCIAL ---\n');

  try {
    // 1. Emissão Totem
    console.log('1️⃣ [TOTEM]: Cliente chegou de surpresa e tocou na tela para "Retirada Pesada".');
    let res = await fetch(`${baseUrl}/totem/senha`, {
      method: 'POST', body: JSON.stringify({ tipo: 'Convencional', categoria: 'Retirada Pesada' }), headers: { 'Content-Type': 'application/json' }
    });
    let ticketData = await res.json();
    console.log(`   ✔️ Totem imprimiu a Senha Física: [ ${ticketData.numeroDisplay || ticketData.message} ]`);

    await wait(1000);

    // 2. Operador puxa o Próximo
    console.log('\n2️⃣ [OPERADOR]: Atendente do Guichê 1 aperta o botão "Chamar Próximo".');
    res = await fetch(`${baseUrl}/chamar_proximo`, {
      method: 'POST', body: JSON.stringify({ guiche: 1 }), headers: { 'Content-Type': 'application/json' }
    });
    let senha = await res.json();
    console.log(`   📣 TV e Alerta Sonoro Tocou: "Senha ${senha.numeroDisplay} - Guichê 1"`);

    await wait(1500);

    // 3. Iniciar Atendimento
    console.log('\n3️⃣ [OPERADOR]: Cliente sentou na cadeira. Operador clica em "Iniciar".');
    res = await fetch(`${baseUrl}/iniciar_atendimento`, {
      method: 'POST', body: JSON.stringify({ senhaId: senha.id }), headers: { 'Content-Type': 'application/json' }
    });
    let status = await res.json();
    console.log(`   ⏱️ Cronômetro disparado! O status interno virou: [ ${status.status} ]`);

    await wait(2000); // Simulando o tempo conversando

    // 4. Finalizar
    console.log('\n4️⃣ [OPERADOR]: Cliente foi embora satisfeito. Operador clica em "Finalizar".');
    res = await fetch(`${baseUrl}/finalizar_atendimento`, {
      method: 'POST', body: JSON.stringify({ senhaId: senha.id }), headers: { 'Content-Type': 'application/json' }
    });
    let finish = await res.json();
    console.log(`   💿 Banco de dados guardou o (Fim): [ ${finish.status} ]`);
    console.log('\n--- 🎉 SUCESSO! PAINEL DO SUPERVISOR CAPTUROU MAIS UM KPI COMPLETO! ---\n');

  } catch (e) {
    console.error('❌ ERRO NA SIMULAÇÃO:', e.message);
  }
}

run();

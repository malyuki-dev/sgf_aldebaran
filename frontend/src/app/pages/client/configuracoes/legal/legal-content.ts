export interface LegalSection {
  heading?: string;
  paragraphs: string[];
}

export interface LegalDocumentContent {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

export const TERMS_OF_USE_CONTENT: LegalDocumentContent = {
  title: 'Termos de Uso',
  updatedAt: 'Última atualização: 14/05/2026',
  sections: [
    {
      paragraphs: [
        'Ao acessar ou utilizar o sistema Aldebaran — seja como empresa contratante, supervisor, operador ou cliente final —, você declara que leu, compreendeu e concorda integralmente com os presentes Termos de Uso. Caso não concorde com qualquer disposição aqui prevista, solicitamos que não prossiga com a utilização do sistema.',
      ],
    },
    {
      heading: '1. Sobre o Sistema',
      paragraphs: [
        'O Aldebaran é uma plataforma digital de gestão de filas, agendamentos e atendimento ao público. O sistema é composto por diferentes interfaces destinadas a perfis distintos de usuários: o painel administrativo, utilizado para gerenciamento de usuários, filiais, serviços, motoristas, caminhões e registros de auditoria; o painel do supervisor, voltado ao monitoramento e gerenciamento em tempo real da fila de atendimento; o painel do operador, destinado ao atendimento de senhas nos guichês; o totem de autoatendimento, por meio do qual os clientes retiram senhas e realizam check-in de agendamentos; o painel TV, que exibe em tempo real as senhas chamadas; e a área do cliente, onde o usuário final realiza seu cadastro, login e gerenciamento de agendamentos.',
      ],
    },
    {
      heading: '2. Cadastro e Acesso',
      paragraphs: [
        'O acesso ao sistema é realizado mediante credenciais individuais, compostas por e-mail e senha. Cada usuário é integralmente responsável pela confidencialidade e pelo uso das suas credenciais de acesso. O compartilhamento de senhas entre usuários é expressamente vedado, e cada colaborador — seja operador, supervisor ou administrador — deve possuir conta própria e intransferível.',
        'A empresa contratante é responsável pelo cadastro correto de seus colaboradores e responde pelo uso adequado do sistema por parte de sua equipe. O cliente final realiza seu próprio cadastro diretamente pela Área do Cliente, sendo obrigado a fornecer informações verdadeiras, completas e atualizadas.',
        'Em caso de suspeita de acesso não autorizado, o usuário deve comunicar imediatamente o administrador responsável pelo sistema.',
      ],
    },
    {
      heading: '3. Uso Permitido',
      paragraphs: [
        'O sistema Aldebaran deve ser utilizado exclusivamente para as finalidades a que se destina, incluindo a gestão e organização de filas de atendimento, o agendamento e check-in de serviços, o gerenciamento de motoristas, caminhões e filiais, a geração de relatórios operacionais e o atendimento ao cliente nos guichês. Qualquer uso fora dessas finalidades poderá resultar na suspensão do acesso.',
      ],
    },
    {
      heading: '4. Usos Proibidos',
      paragraphs: [
        'É expressamente vedado ao usuário utilizar o sistema para fins ilícitos ou contrários à legislação brasileira; tentar acessar áreas restritas sem a devida autorização, como a tentativa de um operador de acessar o painel administrativo; manipular, falsificar ou adulterar dados de agendamentos, filas ou cadastros; realizar engenharia reversa, scraping ou qualquer forma de extração não autorizada de dados; e cadastrar informações falsas, seja como empresa contratante ou como cliente final.',
      ],
    },
    {
      heading: '5. Responsabilidades da Aldebaran',
      paragraphs: [
        'A Aldebaran se compromete a manter o sistema disponível e funcional, ressalvados períodos de manutenção programada ou eventos extraordinários fora do controle da empresa. A plataforma adota medidas técnicas e organizacionais adequadas para proteção dos dados armazenados, mantém registros de auditoria das ações realizadas e notificará os usuários em caso de incidentes de segurança que possam afetá-los.',
      ],
    },
    {
      heading: '6. Responsabilidades do Usuário e da Empresa Contratante',
      paragraphs: [
        'O usuário e a empresa contratante se comprometem a utilizar o sistema em conformidade com estes Termos e com a legislação vigente, a manter os dados cadastrais sempre atualizados e a não ceder, vender ou transferir o acesso ao sistema a terceiros não autorizados. A empresa contratante responde solidariamente por eventuais usos indevidos praticados por seus colaboradores.',
      ],
    },
    {
      heading: '7. Disponibilidade e Manutenção',
      paragraphs: [
        'O sistema pode ficar temporariamente indisponível para realização de manutenções programadas. A Aldebaran envidará esforços razoáveis para comunicar previamente essas janelas de manutenção. Não nos responsabilizamos por perdas ou danos decorrentes de indisponibilidade causada por fatores externos, como quedas de energia, falhas de conectividade ou casos de força maior.',
      ],
    },
    {
      heading: '8. Propriedade Intelectual',
      paragraphs: [
        'Todo o conteúdo do sistema Aldebaran — incluindo, sem limitação, o código-fonte, a interface, logotipos, fluxos e funcionalidades — é de propriedade exclusiva da Aldebaran e protegido pelas leis de propriedade intelectual vigentes. É proibida qualquer reprodução, distribuição ou uso não autorizado desses elementos.',
      ],
    },
    {
      heading: '9. Modificações dos Termos',
      paragraphs: [
        'A Aldebaran reserva-se o direito de atualizar estes Termos a qualquer momento. Alterações relevantes serão comunicadas por meio do próprio sistema. O uso continuado da plataforma após a notificação de alterações implica a aceitação automática das novas condições.',
      ],
    },
    {
      heading: '10. Suspensão e Rescisão',
      paragraphs: [
        'O acesso ao sistema poderá ser suspenso ou encerrado, a qualquer tempo, em caso de violação destes Termos, por decisão da empresa contratante ou em razão do encerramento do contrato de prestação de serviços firmado com a Aldebaran.',
      ],
    },
    {
      heading: '11. Legislação e Foro',
      paragraphs: [
        'Estes Termos de Uso são regidos exclusivamente pelas leis da República Federativa do Brasil. Para dirimir quaisquer controvérsias decorrentes deste instrumento, fica eleito o foro da comarca da sede da Aldebaran, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
      ],
    },
  ],
};

export const PRIVACY_POLICY_CONTENT: LegalDocumentContent = {
  title: 'Política de Privacidade e Proteção de Dados',
  updatedAt: 'Última atualização: 14/05/2026',
  sections: [
    {
      paragraphs: [
        'A Aldebaran está comprometida com a proteção da privacidade e dos dados pessoais de todos os seus usuários, em plena conformidade com a Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018 (LGPD). Esta Política descreve de forma clara e transparente quais dados coletamos, como os utilizamos, com quem os compartilhamos e quais são os direitos dos titulares.',
      ],
    },
    {
      heading: '1. Controlador dos Dados',
      paragraphs: [
        'O controlador dos dados pessoais tratados por meio do sistema Aldebaran é a própria Aldebaran. Para dúvidas, solicitações ou exercício de direitos relacionados à privacidade, o titular pode entrar em contato pelo e-mail privacidade@aldebaran.com.br ou pelo canal de atendimento disponível na plataforma.',
      ],
    },
    {
      heading: '2. Quais Dados Coletamos',
      paragraphs: [
        'Para clientes finais pessoa física, coletamos nome completo, CPF, endereço de e-mail e senha — armazenada de forma criptografada —, além do histórico de agendamentos, check-ins realizados e registros de acesso.',
        'Para clientes pessoa jurídica, coletamos razão social, CNPJ, e-mail corporativo e senha criptografada, além do histórico de agendamentos.',
        'Para colaboradores da empresa contratante — operadores, supervisores e administradores —, coletamos nome completo, e-mail, perfil de acesso, registros de login e logout, logs de ações realizadas no sistema para fins de auditoria, guichê selecionado e histórico de atendimentos.',
        'Para motoristas cadastrados, coletamos nome completo, dados de identificação profissional e vínculo com os caminhões cadastrados.',
        'O sistema também gera automaticamente dados operacionais, como logs de auditoria de ações, data e hora de cada operação e dados de sessão do usuário autenticado.',
      ],
    },
    {
      heading: '3. Para Quê Usamos os Dados',
      paragraphs: [
        'Os dados coletados são utilizados para as seguintes finalidades: autenticação e controle de acesso ao sistema, com base no legítimo interesse e na execução do contrato; gestão de filas, agendamentos e check-ins, com base na execução do contrato; identificação do cliente no check-in por CPF, com base na execução do contrato; registro de auditoria das ações dos usuários, com base no legítimo interesse e no cumprimento de obrigação legal; geração de relatórios operacionais, com base no legítimo interesse; envio de notificações do sistema, com base na execução do contrato; e cumprimento de obrigações legais e regulatórias, com base em obrigação legal.',
      ],
    },
    {
      heading: '4. Compartilhamento de Dados',
      paragraphs: [
        'A Aldebaran não vende dados pessoais a terceiros. Os dados poderão ser compartilhados com a empresa contratante, no âmbito da prestação do serviço de gestão de atendimento; com prestadores de serviços técnicos que atuam como operadores de dados — como empresas de hospedagem e banco de dados —, sempre mediante contrato com cláusulas de proteção de dados adequadas; e com autoridades públicas, quando exigido por lei, decisão judicial ou determinação de órgão regulador competente.',
      ],
    },
    {
      heading: '5. Armazenamento e Segurança',
      paragraphs: [
        'Os dados são armazenados em banco de dados PostgreSQL com controles de acesso segmentados por perfil de usuário. As senhas são armazenadas utilizando algoritmos de hash seguros e nunca são mantidas em texto puro. O sistema adota o modelo de exclusão lógica — soft delete —, de modo que registros inativados não são fisicamente removidos de imediato, preservando a integridade dos logs e do histórico de auditoria. Adotamos medidas técnicas e administrativas apropriadas para proteger os dados contra acesso não autorizado, perda, alteração, destruição ou divulgação indevida.',
      ],
    },
    {
      heading: '6. Retenção dos Dados',
      paragraphs: [
        'Os dados pessoais são mantidos pelo período necessário ao cumprimento das finalidades descritas nesta Política, ou pelo prazo mínimo exigido pela legislação aplicável. Após esse período, os dados serão eliminados de forma segura ou anonimizados, de modo que não permitam mais a identificação do titular.',
      ],
    },
    {
      heading: '7. Seus Direitos como Titular',
      paragraphs: [
        'Nos termos do artigo 18 da LGPD, você tem o direito de confirmar a existência de tratamento dos seus dados pessoais; acessar os dados que mantemos sobre você; solicitar a correção de dados incompletos, inexatos ou desatualizados; requerer a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade; solicitar a portabilidade dos seus dados a outro fornecedor de serviço; requerer a eliminação dos dados tratados com base em consentimento; obter informações sobre os compartilhamentos realizados; revogar o consentimento, quando aplicável; e se opor ao tratamento realizado em desconformidade com a LGPD.',
        'Para exercer qualquer um desses direitos, entre em contato pelo e-mail privacidade@aldebaran.com.br. Responderemos à sua solicitação dentro do prazo legal.',
      ],
    },
    {
      heading: '8. Dados de Sessão',
      paragraphs: [
        'O sistema utiliza dados de sessão para manter o usuário autenticado durante o uso da plataforma. Não utilizamos cookies de rastreamento para fins publicitários ou de monitoramento comportamental externo ao sistema.',
      ],
    },
    {
      heading: '9. Proteção de Menores',
      paragraphs: [
        'O sistema Aldebaran não é destinado a menores de 18 anos e não coleta intencionalmente dados de crianças ou adolescentes. Caso seja identificado o cadastro de um menor, os dados serão eliminados imediatamente.',
      ],
    },
    {
      heading: '10. Alterações nesta Política',
      paragraphs: [
        'Esta Política poderá ser atualizada periodicamente para refletir mudanças nas práticas de privacidade, em requisitos legais ou nas funcionalidades do sistema. A data da última atualização estará sempre indicada no topo do documento. O uso continuado da plataforma após qualquer alteração implica a aceitação das novas condições.',
      ],
    },
    {
      heading: '11. Contato e Encarregado de Dados (DPO)',
      paragraphs: [
        'Em caso de dúvidas, solicitações ou reclamações relacionadas à privacidade e à proteção de dados pessoais, entre em contato pelo e-mail privacidade@aldebaran.com.br. Você também pode contatar a Autoridade Nacional de Proteção de Dados (ANPD), órgão responsável por fiscalizar o cumprimento da LGPD no Brasil, pelo site www.gov.br/anpd.',
      ],
    },
  ],
};

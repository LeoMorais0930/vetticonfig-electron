# Documentacao tecnica do VettiConfig

Este diretorio concentra a documentacao de onboarding e manutencao do VettiConfig. O objetivo e permitir que um dev novo consiga rodar o projeto, entender a arquitetura, testar sem hardware, alterar telas com seguranca e gerar builds.

## Leitura recomendada

1. [Onboarding de devs](onboarding.md) - trilha inicial para clonar, rodar, testar e localizar as partes importantes.
2. [Arquitetura](architecture.md) - visao do Electron, main process, renderer, IPC, protocolo, persistencia e modulos.
3. [Setup local](setup.md) - prerequisitos, instalacao, simulador, central real e comandos de desenvolvimento.
4. [Configuracao, variaveis e persistencia](config-reference.md) - scripts, variaveis de ambiente, `userData`, `localStorage`, schemas JSON e chaves de storage.
5. [Fluxos da aplicacao](workflows.md) - descoberta, conexao local/remota, status, parametros, usuarios, agenda, feriados, backups, clones e relatorios.
6. [Deploy e distribuicao](deployment.md) - empacotamento por plataforma, saidas em `dist/`, assinatura, instalador Windows e release checklist.
7. [Troubleshooting](troubleshooting.md) - diagnostico de problemas comuns em instalacao, rede, protocolo, UI, build e dados persistidos.

## Documentos auxiliares existentes

- [audit-central-real.md](audit-central-real.md) - exemplo/resultado de auditoria contra central real.
- [backlog.md](backlog.md) - pendencias e evolucoes planejadas.
- [botoes-pendentes-firmware.md](botoes-pendentes-firmware.md) - botoes ou funcoes dependentes de firmware.
- [comandos-que-faltam.md](comandos-que-faltam.md) - mapa extenso de comandos/PARs ainda em aberto.
- [figma-fidelity-strategy.md](figma-fidelity-strategy.md) - estrategia de fidelidade visual com Figma.
- [mapeamento-versao-java.md](mapeamento-versao-java.md) - referencia da versao Java/Kotlin.
- [perguntas-pendentes.md](perguntas-pendentes.md) - duvidas em aberto para firmware/produto.
- [protocol-gaps.md](protocol-gaps.md) - lacunas conhecidas entre protocolo, firmware e UI.

## Regras de manutencao

- Documente somente comportamento confirmado no codigo, em teste real ou no protocolo. Quando algo depender de firmware, marque como pendente ou "a confirmar".
- Ao adicionar um fluxo novo, atualize pelo menos [architecture.md](architecture.md), [workflows.md](workflows.md) e [troubleshooting.md](troubleshooting.md) se houver risco operacional.
- Ao adicionar IPC, atualize a tabela em [architecture.md](architecture.md) e mencione o payload em [config-reference.md](config-reference.md) quando persistir dados.
- Ao adicionar script npm ou variavel de ambiente, atualize [setup.md](setup.md), [config-reference.md](config-reference.md) e [deployment.md](deployment.md), conforme o caso.


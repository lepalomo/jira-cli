function getSystemLocale() {
    // Tentar múltiplas fontes de locale em ordem de prioridade
    const sources = [
        process.env.LC_ALL,
        process.env.LC_MESSAGES, 
        process.env.LANG,
        process.env.LANGUAGE
    ];
    
    for (const source of sources) {
        if (source) {
            // Extrair código do idioma (ex: pt_BR.UTF-8 -> pt-BR)
            const match = source.match(/^([a-z]{2})(?:[_-]([A-Z]{2}))?/i);
            if (match) {
                return match[2] ? `${match[1]}-${match[2]}` : match[1];
            }
        }
    }
    
    // Fallback para Intl API (funciona em Windows/Mac/Linux)
    try {
        return Intl.DateTimeFormat().resolvedOptions().locale;
    } catch {
        return 'pt-BR'; // Fallback final
    }
}

const locale = getSystemLocale();

const messages = {
    'pt': {
        'searching_projects': 'Buscando projetos',
        'searching_workflows': 'Buscando workflows',
        'analyzing_cleanup': 'Analisando workflows para limpeza',
        'executing_cleanup': 'Executando limpeza de workflows',
        'no_workflows_found': 'Nenhum workflow inativo sem esquemas encontrado para limpeza.',
        'workflows_to_delete': 'Workflows inativos que seriam excluídos',
        'cleanup_results': 'Resultados da limpeza',
        'workflow_deleted': 'Workflow {0} excluído com sucesso.',
        'workflow_delete_error': 'Erro ao excluir workflow {0}: {1}',
        'project_archived': 'Projeto {0} arquivado com sucesso.',
        'project_deleted': 'Projeto {0} excluído com sucesso.',
        'category_updated': 'Categoria do projeto {0} alterada com sucesso.',
        'project_name_updated': 'Nome do projeto {0} alterado para: {1}',
        'missing_config': 'Configuração ausente. Use "set-config" para salvar credenciais ou forneça opções.',
        'specify_cleanup_type': 'Especifique o tipo de limpeza: --workflows',
        'specify_active_inactive': 'Deve especificar --active ou --inactive.',
        'cannot_specify_both': 'Não é possível especificar --active e --inactive. Escolha um.'
    },
    'en': {
        'searching_projects': 'Searching projects',
        'searching_workflows': 'Searching workflows', 
        'analyzing_cleanup': 'Analyzing workflows for cleanup',
        'executing_cleanup': 'Executing workflow cleanup',
        'no_workflows_found': 'No inactive workflows without schemes found for cleanup.',
        'workflows_to_delete': 'Inactive workflows that would be deleted',
        'cleanup_results': 'Cleanup results',
        'workflow_deleted': 'Workflow {0} deleted successfully.',
        'workflow_delete_error': 'Error deleting workflow {0}: {1}',
        'project_archived': 'Project {0} archived successfully.',
        'project_deleted': 'Project {0} deleted successfully.',
        'category_updated': 'Project {0} category updated successfully.',
        'project_name_updated': 'Project {0} name changed to: {1}',
        'missing_config': 'Missing configuration. Use "set-config" to save credentials or provide options.',
        'specify_cleanup_type': 'Specify cleanup type: --workflows',
        'specify_active_inactive': 'Must specify either --active or --inactive.',
        'cannot_specify_both': 'Cannot specify both --active and --inactive. Choose one.'
    }
};

function t(key, ...args) {
    const langCode = locale.split('-')[0];
    let message = messages[langCode]?.[key] || messages['pt'][key] || key;
    
    // Substituir placeholders {0}, {1}, etc.
    args.forEach((arg, index) => {
        message = message.replace(`{${index}}`, arg);
    });
    
    return message;
}

module.exports = { t, locale };
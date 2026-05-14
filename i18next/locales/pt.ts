const pt = {
  header: {
    home: { title: "Olá", subtitle: "Controle suas músicas em um único lugar" },
    playlists: { title: "Playlists", subtitle: "Suas playlists, do seu jeito" },
    albums: { title: "Álbuns", subtitle: "Crie e organize seus álbuns" },
    configurations: {
      title: "Configurações",
      subtitle: "Configurações gerais do app BlepPlay",
    },
    default: { title: "Bem-vindo", subtitle: "Bem-vindo ao app" },
  },

  greeting: {
    morning: "Bom dia 👋",
    afternoon: "Boa tarde 👋",
    night: "Boa noite 👋",
  },

  // Cada feature agrupa seus textos, feedbacks e ações
  playlist: {
    title: "Playlists",
    empty: "Nenhuma playlist encontrada",
    emptyMusics: "Nenhuma música nesta playlist",
    notFound: "Playlist não encontrada",
    actions: {
      create: "Criar Playlist",
      viewDetails: "Ver detalhes",
      delete: "Excluir",
      archive: "Arquivar",
    },
  },

  plalist: {
    title: "Playlists",
    empty: "Nenhuma playlist encontrada",
    emptyMusics: "Nenhuma música nesta playlist",
    notFound: "Playlist não encontrada",
    actions: {
      create: "Criar Playlist",
      viewDetails: "Ver detalhes",
      delete: "Excluir",
      deleteplaylis: "Deletar playlist",
      archive: "Arquivar",
    },
  },

  music: {
    title: "Música",
    notFound: "Música não encontrada",
    norecent: "Nenhuma música recente.",
    recent: "Músicas Recente",
    metadata: {
      title: "Título",
      artist: "Artista",
      album: "Álbum",
      genre: "Gênero",
      year: "Ano",
      track: "Faixa",
      filePath: "Pasta",
    },
    actions: {
      viewDetails: "Ver detalhes",
      back: "Voltar",
      file: "Arquivo",
    },
  },

  lyrics: {
    title: "Letra",
    unavailable: "Letra não disponível para esta música",
    unavailablelyrics: "Letra não disponível",
    actions: {
      view: "Ver letra",
      copy: "Copiar letra",
    },
    feedback: {
      copied: "Letra copiada para a área de transferência!",
      copyError: "Erro ao copiar letra",
      loading: "Buscando letra…",
    },
  },

  cover: {
    actions: {
      add: "Toque para adicionar capa",
      remove: "Remover capa",
      select: "Selecionar capa",
      ok: "Capa removida!",
      removecover: "Deseja remover a capa atual da playlist?",
    },
    feedback: {
      removed: "Capa removida com sucesso",
      error: "Não foi possível salvar a imagem",
      coverplaylist: "Capa da playlist atualizada!",
      errorcoverplaylist: "Não foi possível atualizar a capa playlist",
      erroupdate: "Ocorreu um erro ao atualizar a imagem",
    },
  },

  settings: {
    title: "Configurações",
    subtitle: "Configurações gerais do app BlepPlay",

    options: {
      localLibrary: {
        label: "Biblioteca local",
        description:
          "Gerencia todos os dados armazenado no cache do dispositivo e pasta local audios.",
      },
      privacy: {
        label: "Configuração de privacidade",
        description:
          "Gerencia suas configurações de privacidade e dados pessoais, notificações etc..",
      },
      appPreferences: {
        label: "Preferências App",
        description:
          "Gerencia suas preferências dentro app, linguagem, tema etc..",
      },
      cacheManager: {
        label: "Gerenciar dados em cache",
        description: "Gerencie todos os dados armazenado em caches.",
      },
      checkUpdate: {
        label: "Verifica atualização App",
        description: "Clique aqui para verificar se há novas atualizações",
      },
    },

    support: {
      sectionTitle: "Suporte",
      helpCenter: {
        label: "Central de ajuda",
        description: "Tire dúvidas e encontre soluções",
      },
      terms: {
        label: "Termos e políticas",
        description: "Leia nossos termos de uso e política de privacidade",
      },
    },

    footer: {
      currentVersion: "Versão atual do app:",
    },

    preferences: {
      title: "Preferências",
      theme: "Tema do App",
      language: "Idioma do App",
    },

    privacy: {
      title: "Configurações avançadas",
      bgUpdate: {
        label: "Verificar atualizações automaticamente",
        description: "Notifica quando uma nova versão estiver disponível",
      },
      notifications: {
        label: "Notificações",
        description: "Receber notificações no app?",
      },
      appCheck: {
        label: "Verificação de atualizações app",
        description: "Verifique automaticamente verificação de updates app",
      },
    },
  },

  player: {
    feedback: {
      current: "Tocando agora",
      pause: "Pausar",
      playe: "Tocar música",
    },
  },

  common: {
    back: "Voltar",
    delete: "Excluir",
    cancel: "Cancelar",
    confirm: "Confirmar",
    creater: "Criar",
    details: "Detalhes",
    file: "Arquivo",
    sucess: "Sucesso",
    error: "Error",
  },

  text: {
    feedback: {
      seeless: "Ver menos",
      seemore: "Ver mais",
      seeall: "Ver todos",
      viewdetails: "Ver detalhes",
      errorload: "Error ao carregar",
      refresh: "Tentar novamente",
      albumsload: "Carregando mais álbuns...",
      albumtitlehome: "Álbuns do Dispositivo",
      totalsongs: "Total musicas",
      allsongs: "Totas as musicas",
    },
    refeshpage: "Recarregar pagina",
  },

  tabs: {
    tabsselector: {
      label1: "Pagina Inicial",
      label2: "Lista musicas",
      label3: "Minhas playlists",
      label4: "Baixadas",
    },
  },

  search: {
    feedback: {
      getmusics: "Buscar músicas...",
      loading: "Buscando...",
      noresult: "Nenhum resultado encontrado",
      albumsearch: "Buscar album, artista...",
      tips: "Tente buscar por título, artista ou álbum",
    },
  },
};

export default pt;
export type Translations = typeof pt;

export type AppLocale = 'en' | 'tr' | 'fr' | 'de';

export const SUPPORTED_LOCALES: Array<{ code: AppLocale; label: string }> = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' }
];

export const DEFAULT_LOCALE: AppLocale = 'en';

export const MESSAGES = {
  en: {
    layout: {
      subtitle: 'Internal Transaction Operations',
      navigation: {
        transactions: 'Transactions'
      },
      language: 'Language'
    },
    auth: {
      meta: {
        title: 'User Access'
      },
      hero: {
        kicker: 'Access',
        title: 'Sign In To Operations Dashboard',
        description:
          'Use your work email to sign in or create a user profile. Registered users are used for advisor assignment in transactions.',
        notesTitle: 'How It Works',
        noteOne: 'Every registered user is stored in MongoDB with a unique ObjectId.',
        noteTwo: 'Advisor selection uses names in the UI and maps to ObjectId in the API payload.',
        noteThree: 'No manual ObjectId input is required in transaction creation.'
      },
      actions: {
        login: 'Sign In',
        loggingIn: 'Signing In...',
        register: 'Register',
        registering: 'Registering...',
        logout: 'Logout'
      },
      fields: {
        name: 'Full Name',
        email: 'Work Email'
      },
      placeholders: {
        name: 'Alex Johnson',
        email: 'name@company.com'
      }
    },
    transactions: {
      meta: {
        title: 'Transactions Dashboard'
      },
      header: {
        kicker: 'Operations Dashboard',
        title: 'Transactions',
        description:
          'Track deal progression, trigger stage updates, and review commission allocation in one place.'
      },
      actions: {
        refresh: 'Refresh Data',
        refreshing: 'Refreshing...',
        retry: 'Retry',
        clear: 'Clear',
        create: 'Create Transaction',
        creating: 'Creating...'
      },
      metrics: {
        totalTransactions: {
          label: 'Total Transactions',
          helper: 'All tracked deals in the system'
        },
        completedTransactions: {
          label: 'Completed Transactions',
          helper: 'Deals that reached the completed stage'
        },
        openTransactions: {
          label: 'Open Transactions',
          helper: 'All active deals not yet completed'
        },
        totalCommissionVolume: {
          label: 'Total Commission Volume',
          helper: 'Combined service fee volume across all transactions'
        },
        pendingClosings: {
          label: 'Pending Closings',
          helper: 'Currently in title deed stage'
        },
        commissionPipeline: {
          label: 'Commission Pipeline',
          helper: 'Total service fees across tracked deals'
        }
      },
      filters: {
        title: 'List Controls',
        searchLabel: 'Search',
        searchPlaceholder: 'Search by property or advisor name',
        stageLabel: 'Stage',
        allStages: 'All stages',
        sortLabel: 'Sort by',
        sortNewest: 'Newest',
        sortOldest: 'Oldest',
        sortHighestCommission: 'Highest commission'
      },
      errors: {
        syncTitle: 'Unable to sync transaction data'
      },
      list: {
        title: 'Transaction List',
        description: 'Stage progression and financial allocation for each transaction.',
        recordCount: '{count} records',
        emptyTitle: 'No Transactions Yet',
        emptyDescription: 'Use the create form to add the first record and begin stage tracking.'
      },
      item: {
        transactionId: 'Transaction ID',
        totalServiceFee: 'Total Service Fee',
        listingAgent: 'Listing Agent',
        sellingAgent: 'Selling Agent',
        agentsCount: '{count} agents',
        lastUpdated: 'Last Updated',
        stageAction: 'Stage Action',
        nextAllowedStage: 'Next allowed stage: {stage}',
        noFurtherAction: 'No further action. Transaction is completed.',
        updating: 'Updating...',
        viewDetails: 'View details',
        hideDetails: 'Hide details',
        advanceTo: 'Advance to {stage}',
        completed: 'Completed'
      },
      form: {
        title: 'Create Transaction',
        description:
          'Add a new deal record. Commission breakdown and lifecycle rules are handled by backend policies.',
        validationSummary:
          'Please review highlighted fields and correct validation issues before submitting.',
        sections: {
          dealDetails: 'Deal Details',
          agentAssignment: 'Agent Assignment'
        },
        fields: {
          propertyTitle: 'Property Title',
          totalServiceFee: 'Total Service Fee (USD)',
          initialStage: 'Initial Stage',
          listingAgentId: 'Listing Advisor',
          sellingAgentId: 'Selling Advisor'
        },
        placeholders: {
          propertyTitle: 'Sunset Villas #12',
          totalServiceFee: '100000',
          selectAgent: 'Select a registered advisor'
        },
        hints: {
          initialStage: 'All new transactions start at agreement and move forward only.',
          listingAgentId: 'Choose the listing advisor by name. ObjectId mapping is handled automatically.',
          sellingAgentId: 'Choose the selling advisor by name. ObjectId mapping is handled automatically.',
          noAgentsAvailable: 'No registered advisors found yet. Create a user account first.'
        },
        validation: {
          propertyTitleRequired: 'Property title is required.',
          totalServiceFeePositive: 'Total service fee must be greater than 0.',
          listingAgentIdRequired: 'Listing advisor selection is required.',
          sellingAgentIdRequired: 'Selling advisor selection is required.'
        }
      },
      financial: {
        title: 'Financial Breakdown',
        total: 'Total',
        agencyAmount: 'Agency Amount',
        agentPool: 'Agent Pool',
        ofTotalFee: '{percent} of total fee',
        agentId: 'Agent ID',
        noAllocations: 'Agent allocations are not available yet.',
        roles: {
          listing: 'Listing Agent',
          selling: 'Selling Agent',
          listing_and_selling: 'Listing + Selling Agent'
        }
      }
    },
    stages: {
      agreement: 'Agreement',
      earnest_money: 'Earnest Money',
      title_deed: 'Title Deed',
      completed: 'Completed'
    },
    common: {
      notAvailable: '-'
    }
  },
  tr: {
    layout: {
      subtitle: 'Dahili İşlem Operasyonları',
      navigation: {
        transactions: 'İşlemler'
      },
      language: 'Dil'
    },
    auth: {
      meta: {
        title: 'Kullanıcı Erişimi'
      },
      hero: {
        kicker: 'Erişim',
        title: 'Operasyon Paneline Giriş Yapın',
        description:
          'Kurumsal e-posta ile giriş yapın veya kullanıcı kaydı oluşturun. Kayıtlı kullanıcılar işlemde danışman atamasında kullanılır.',
        notesTitle: 'Nasıl Çalışır',
        noteOne: 'Her kayıtlı kullanıcı MongoDB içinde benzersiz bir ObjectId ile tutulur.',
        noteTwo: 'UI tarafında danışmanlar isimle seçilir, API payload tarafında ObjectId kullanılır.',
        noteThree: 'İşlem oluştururken manuel ObjectId girişi gerekmez.'
      },
      actions: {
        login: 'Giriş Yap',
        loggingIn: 'Giriş Yapılıyor...',
        register: 'Kayıt Ol',
        registering: 'Kaydediliyor...',
        logout: 'Çıkış Yap'
      },
      fields: {
        name: 'Ad Soyad',
        email: 'İş E-postası'
      },
      placeholders: {
        name: 'Ahmet Yılmaz',
        email: 'isim@sirket.com'
      }
    },
    transactions: {
      meta: {
        title: 'İşlem Paneli'
      },
      header: {
        kicker: 'Operasyon Paneli',
        title: 'İşlemler',
        description:
          'Süreç ilerleyişini takip edin, aşama güncellemelerini yönetin ve komisyon dağılımını tek ekranda inceleyin.'
      },
      actions: {
        refresh: 'Veriyi Yenile',
        refreshing: 'Yenileniyor...',
        retry: 'Tekrar Dene',
        clear: 'Temizle',
        create: 'İşlem Oluştur',
        creating: 'Oluşturuluyor...'
      },
      metrics: {
        openTransactions: {
          label: 'Açık İşlemler',
          helper: 'Henüz tamamlanmamış aktif işlemler'
        },
        pendingClosings: {
          label: 'Kapanış Bekleyenler',
          helper: 'Şu anda tapu devri aşamasında'
        },
        commissionPipeline: {
          label: 'Komisyon Hattı',
          helper: 'Takip edilen işlemlerdeki toplam hizmet bedeli'
        }
      },
      errors: {
        syncTitle: 'İşlem verisi eşitlenemedi'
      },
      list: {
        title: 'İşlem Listesi',
        description: 'Her işlem için aşama ilerleyişi ve finansal dağılım.',
        recordCount: '{count} kayıt',
        emptyTitle: 'Henüz İşlem Yok',
        emptyDescription: 'İlk kaydı oluşturmak ve aşama takibini başlatmak için formu kullanın.'
      },
      item: {
        transactionId: 'İşlem ID',
        totalServiceFee: 'Toplam Hizmet Bedeli',
        listingAgent: 'Listeleyen Danışman',
        sellingAgent: 'Satışı Yapan Danışman',
        agentsCount: '{count} danışman',
        lastUpdated: 'Son Güncelleme',
        stageAction: 'Aşama İşlemi',
        nextAllowedStage: 'Sonraki izinli aşama: {stage}',
        noFurtherAction: 'Başka işlem yok. İşlem tamamlandı.',
        updating: 'Güncelleniyor...',
        viewDetails: 'Detayları görüntüle',
        hideDetails: 'Detayları gizle',
        advanceTo: '{stage} aşamasına ilerlet',
        completed: 'Tamamlandı'
      },
      form: {
        title: 'İşlem Oluştur',
        description:
          'Yeni bir işlem kaydı ekleyin. Komisyon dağılımı ve yaşam döngüsü kuralları backend policy servislerinde çalışır.',
        validationSummary:
          'Lütfen vurgulanan alanları kontrol edin ve gönderim öncesi doğrulama hatalarını düzeltin.',
        sections: {
          dealDetails: 'İşlem Detayları',
          agentAssignment: 'Danışman Ataması'
        },
        fields: {
          propertyTitle: 'Mülk Başlığı',
          totalServiceFee: 'Toplam Hizmet Bedeli (USD)',
          initialStage: 'Başlangıç Aşaması',
          listingAgentId: 'Listeleyen Danışman',
          sellingAgentId: 'Satışı Yapan Danışman'
        },
        placeholders: {
          propertyTitle: 'Sunset Villas #12',
          totalServiceFee: '100000',
          selectAgent: 'Kayıtlı danışman seçin'
        },
        hints: {
          initialStage: 'Tüm yeni işlemler agreement aşamasında başlar ve yalnızca ileri gider.',
          listingAgentId: 'Listeleyen danışmanı isimle seçin. ObjectId eşlemesi otomatik yapılır.',
          sellingAgentId: 'Satışı yapan danışmanı isimle seçin. ObjectId eşlemesi otomatik yapılır.',
          noAgentsAvailable: 'Henüz kayıtlı danışman yok. Önce kullanıcı kaydı oluşturun.'
        },
        validation: {
          propertyTitleRequired: 'Mülk başlığı zorunludur.',
          totalServiceFeePositive: 'Toplam hizmet bedeli 0’dan büyük olmalıdır.',
          listingAgentIdRequired: 'Listeleyen danışman seçimi zorunludur.',
          sellingAgentIdRequired: 'Satışı yapan danışman seçimi zorunludur.'
        }
      },
      financial: {
        title: 'Finansal Dağılım',
        total: 'Toplam',
        agencyAmount: 'Ajans Payı',
        agentPool: 'Danışman Havuzu',
        ofTotalFee: 'Toplam ücretin {percent} kadarı',
        agentId: 'Danışman ID',
        noAllocations: 'Danışman dağılımı henüz mevcut değil.',
        roles: {
          listing: 'Listeleyen Danışman',
          selling: 'Satışı Yapan Danışman',
          listing_and_selling: 'Listeleyen + Satışı Yapan Danışman'
        }
      }
    },
    stages: {
      agreement: 'Sözleşme',
      earnest_money: 'Kapora',
      title_deed: 'Tapu Devri',
      completed: 'Tamamlandı'
    },
    common: {
      notAvailable: '-'
    }
  },
  fr: {
    layout: {
      subtitle: 'Opérations Internes de Transactions',
      navigation: {
        transactions: 'Transactions'
      },
      language: 'Langue'
    },
    auth: {
      meta: {
        title: 'Accès Utilisateur'
      },
      hero: {
        kicker: 'Accès',
        title: 'Connectez-Vous au Tableau de Bord',
        description:
          'Connectez-vous avec votre email professionnel ou créez un profil utilisateur. Les utilisateurs enregistrés sont utilisés pour l’affectation des conseillers.',
        notesTitle: 'Fonctionnement',
        noteOne: 'Chaque utilisateur enregistré est stocké dans MongoDB avec un ObjectId unique.',
        noteTwo: 'La sélection des conseillers se fait par nom dans l’UI et est convertie en ObjectId côté API.',
        noteThree: 'Aucune saisie manuelle d’ObjectId n’est nécessaire.'
      },
      actions: {
        login: 'Se Connecter',
        loggingIn: 'Connexion...',
        register: 'Créer un Compte',
        registering: 'Création...',
        logout: 'Déconnexion'
      },
      fields: {
        name: 'Nom Complet',
        email: 'Email Professionnel'
      },
      placeholders: {
        name: 'Alex Martin',
        email: 'nom@entreprise.com'
      }
    },
    transactions: {
      meta: {
        title: 'Tableau de Bord des Transactions'
      },
      header: {
        kicker: 'Tableau de Bord Opérations',
        title: 'Transactions',
        description:
          'Suivez la progression des dossiers, lancez les mises à jour d’étape et consultez la répartition des commissions.'
      },
      actions: {
        refresh: 'Rafraîchir les Données',
        refreshing: 'Rafraîchissement...',
        retry: 'Réessayer',
        clear: 'Effacer',
        create: 'Créer une Transaction',
        creating: 'Création...'
      },
      metrics: {
        openTransactions: {
          label: 'Transactions Ouvertes',
          helper: 'Tous les dossiers actifs non finalisés'
        },
        pendingClosings: {
          label: 'Clôtures en Attente',
          helper: 'Actuellement à l’étape acte de propriété'
        },
        commissionPipeline: {
          label: 'Pipeline de Commission',
          helper: 'Total des frais de service des dossiers suivis'
        }
      },
      errors: {
        syncTitle: 'Impossible de synchroniser les transactions'
      },
      list: {
        title: 'Liste des Transactions',
        description: 'Progression d’étape et répartition financière pour chaque transaction.',
        recordCount: '{count} enregistrements',
        emptyTitle: 'Aucune Transaction',
        emptyDescription:
          'Utilisez le formulaire de création pour ajouter le premier dossier et démarrer le suivi des étapes.'
      },
      item: {
        transactionId: 'ID Transaction',
        totalServiceFee: 'Frais de Service Totaux',
        listingAgent: 'Agent Mandataire',
        sellingAgent: 'Agent Vendeur',
        agentsCount: '{count} agents',
        lastUpdated: 'Dernière Mise à Jour',
        stageAction: 'Action d’Étape',
        nextAllowedStage: 'Prochaine étape autorisée : {stage}',
        noFurtherAction: 'Aucune autre action. La transaction est terminée.',
        updating: 'Mise à jour...',
        viewDetails: 'Voir les détails',
        hideDetails: 'Masquer les détails',
        advanceTo: 'Passer à {stage}',
        completed: 'Terminée'
      },
      form: {
        title: 'Créer une Transaction',
        description:
          'Ajoutez un nouveau dossier. La logique de commission et les règles de cycle de vie sont gérées côté backend.',
        validationSummary:
          'Veuillez vérifier les champs mis en évidence et corriger les erreurs de validation avant l’envoi.',
        sections: {
          dealDetails: 'Détails du Dossier',
          agentAssignment: 'Affectation des Agents'
        },
        fields: {
          propertyTitle: 'Titre du Bien',
          totalServiceFee: 'Frais de Service Totaux (USD)',
          initialStage: 'Étape Initiale',
          listingAgentId: 'Conseiller Mandataire',
          sellingAgentId: 'Conseiller Vendeur'
        },
        placeholders: {
          propertyTitle: 'Sunset Villas #12',
          totalServiceFee: '100000',
          selectAgent: 'Sélectionnez un conseiller enregistré'
        },
        hints: {
          initialStage:
            'Toutes les nouvelles transactions commencent à agreement et avancent uniquement vers l’avant.',
          listingAgentId: 'Choisissez le conseiller mandataire par nom. Le mapping ObjectId est automatique.',
          sellingAgentId: 'Choisissez le conseiller vendeur par nom. Le mapping ObjectId est automatique.',
          noAgentsAvailable: 'Aucun conseiller enregistré. Créez d’abord un compte utilisateur.'
        },
        validation: {
          propertyTitleRequired: 'Le titre du bien est requis.',
          totalServiceFeePositive: 'Les frais de service doivent être supérieurs à 0.',
          listingAgentIdRequired: 'La sélection du conseiller mandataire est requise.',
          sellingAgentIdRequired: 'La sélection du conseiller vendeur est requise.'
        }
      },
      financial: {
        title: 'Répartition Financière',
        total: 'Total',
        agencyAmount: 'Part Agence',
        agentPool: 'Part Agents',
        ofTotalFee: '{percent} du total',
        agentId: 'ID Agent',
        noAllocations: 'Les répartitions agents ne sont pas encore disponibles.',
        roles: {
          listing: 'Agent Mandataire',
          selling: 'Agent Vendeur',
          listing_and_selling: 'Agent Mandataire + Vendeur'
        }
      }
    },
    stages: {
      agreement: 'Accord',
      earnest_money: 'Dépôt de Garantie',
      title_deed: 'Acte de Propriété',
      completed: 'Terminée'
    },
    common: {
      notAvailable: '-'
    }
  },
  de: {
    layout: {
      subtitle: 'Interne Transaktionsabläufe',
      navigation: {
        transactions: 'Transaktionen'
      },
      language: 'Sprache'
    },
    auth: {
      meta: {
        title: 'Benutzerzugang'
      },
      hero: {
        kicker: 'Zugang',
        title: 'Beim Operations-Dashboard Anmelden',
        description:
          'Melden Sie sich mit Ihrer Firmen-E-Mail an oder erstellen Sie ein Benutzerprofil. Registrierte Benutzer werden für die Beraterzuordnung verwendet.',
        notesTitle: 'So Funktioniert Es',
        noteOne: 'Jeder registrierte Benutzer wird in MongoDB mit einer eindeutigen ObjectId gespeichert.',
        noteTwo: 'Berater werden in der UI per Name gewählt und im API-Payload auf ObjectId gemappt.',
        noteThree: 'Keine manuelle ObjectId-Eingabe bei der Transaktionserstellung.'
      },
      actions: {
        login: 'Anmelden',
        loggingIn: 'Anmeldung...',
        register: 'Registrieren',
        registering: 'Registrierung...',
        logout: 'Abmelden'
      },
      fields: {
        name: 'Vollständiger Name',
        email: 'Geschäftliche E-Mail'
      },
      placeholders: {
        name: 'Max Mustermann',
        email: 'name@firma.de'
      }
    },
    transactions: {
      meta: {
        title: 'Transaktions-Dashboard'
      },
      header: {
        kicker: 'Operations-Dashboard',
        title: 'Transaktionen',
        description:
          'Verfolgen Sie den Deal-Fortschritt, steuern Sie Stufenupdates und prüfen Sie die Provisionsverteilung an einem Ort.'
      },
      actions: {
        refresh: 'Daten Aktualisieren',
        refreshing: 'Wird aktualisiert...',
        retry: 'Erneut Versuchen',
        clear: 'Zurücksetzen',
        create: 'Transaktion Erstellen',
        creating: 'Wird erstellt...'
      },
      metrics: {
        openTransactions: {
          label: 'Offene Transaktionen',
          helper: 'Alle aktiven, noch nicht abgeschlossenen Deals'
        },
        pendingClosings: {
          label: 'Ausstehende Abschlüsse',
          helper: 'Aktuell in der Stufe Eigentumsübertragung'
        },
        commissionPipeline: {
          label: 'Provisions-Pipeline',
          helper: 'Gesamte Servicegebühren aller erfassten Deals'
        }
      },
      errors: {
        syncTitle: 'Transaktionsdaten konnten nicht synchronisiert werden'
      },
      list: {
        title: 'Transaktionsliste',
        description: 'Stufenfortschritt und finanzielle Verteilung pro Transaktion.',
        recordCount: '{count} Einträge',
        emptyTitle: 'Noch Keine Transaktionen',
        emptyDescription:
          'Nutzen Sie das Formular, um den ersten Datensatz anzulegen und die Stufenverfolgung zu starten.'
      },
      item: {
        transactionId: 'Transaktions-ID',
        totalServiceFee: 'Gesamte Servicegebühr',
        listingAgent: 'Listing-Agent',
        sellingAgent: 'Selling-Agent',
        agentsCount: '{count} Makler',
        lastUpdated: 'Zuletzt Aktualisiert',
        stageAction: 'Stufenaktion',
        nextAllowedStage: 'Nächste erlaubte Stufe: {stage}',
        noFurtherAction: 'Keine weitere Aktion. Die Transaktion ist abgeschlossen.',
        updating: 'Wird aktualisiert...',
        viewDetails: 'Details anzeigen',
        hideDetails: 'Details ausblenden',
        advanceTo: 'Weiter zu {stage}',
        completed: 'Abgeschlossen'
      },
      form: {
        title: 'Transaktion Erstellen',
        description:
          'Fügen Sie einen neuen Deal-Datensatz hinzu. Provisionslogik und Lifecycle-Regeln werden im Backend umgesetzt.',
        validationSummary:
          'Bitte prüfen Sie die markierten Felder und korrigieren Sie Validierungsfehler vor dem Absenden.',
        sections: {
          dealDetails: 'Deal-Details',
          agentAssignment: 'Agentenzuordnung'
        },
        fields: {
          propertyTitle: 'Objektbezeichnung',
          totalServiceFee: 'Gesamte Servicegebühr (USD)',
          initialStage: 'Startstufe',
          listingAgentId: 'Listing-Berater',
          sellingAgentId: 'Selling-Berater'
        },
        placeholders: {
          propertyTitle: 'Sunset Villas #12',
          totalServiceFee: '100000',
          selectAgent: 'Registrierten Berater auswählen'
        },
        hints: {
          initialStage: 'Alle neuen Transaktionen starten bei agreement und gehen nur vorwärts.',
          listingAgentId: 'Wählen Sie den Listing-Berater per Namen. Die ObjectId-Zuordnung erfolgt automatisch.',
          sellingAgentId: 'Wählen Sie den Selling-Berater per Namen. Die ObjectId-Zuordnung erfolgt automatisch.',
          noAgentsAvailable: 'Noch keine registrierten Berater. Bitte zuerst ein Benutzerkonto anlegen.'
        },
        validation: {
          propertyTitleRequired: 'Objektbezeichnung ist erforderlich.',
          totalServiceFeePositive: 'Die Servicegebühr muss größer als 0 sein.',
          listingAgentIdRequired: 'Die Auswahl des Listing-Beraters ist erforderlich.',
          sellingAgentIdRequired: 'Die Auswahl des Selling-Beraters ist erforderlich.'
        }
      },
      financial: {
        title: 'Finanzielle Aufteilung',
        total: 'Gesamt',
        agencyAmount: 'Agenturanteil',
        agentPool: 'Agentenanteil',
        ofTotalFee: '{percent} der Gesamtgebühr',
        agentId: 'Agenten-ID',
        noAllocations: 'Agentenaufteilungen sind noch nicht verfügbar.',
        roles: {
          listing: 'Listing-Agent',
          selling: 'Selling-Agent',
          listing_and_selling: 'Listing + Selling-Agent'
        }
      }
    },
    stages: {
      agreement: 'Vereinbarung',
      earnest_money: 'Sicherheitsleistung',
      title_deed: 'Eigentumsübertragung',
      completed: 'Abgeschlossen'
    },
    common: {
      notAvailable: '-'
    }
  }
} as const;

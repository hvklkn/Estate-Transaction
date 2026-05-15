export type AppLocale = 'en' | 'tr';

export const SUPPORTED_LOCALES: Array<{ code: AppLocale; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' }
];

export const DEFAULT_LOCALE: AppLocale = 'en';

export const MESSAGES = {
  en: {
    layout: {
      subtitle: 'Internal Transaction Operations',
      navigation: {
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        clients: 'Clients',
        properties: 'Properties',
        tasks: 'Tasks',
        reports: 'Reports',
        balance: 'Balance',
        team: 'Agents',
        profile: 'Profile',
        settings: 'Settings',
        auth: 'User Access'
      },
      language: 'Language',
      workspace: 'Workspace',
      signIn: 'Sign in',
      noOrganization: 'No organization',
      noRole: 'No role',
      product: 'Product',
      support: 'Support',
      footerDescription:
        'A focused operating layer for transaction lifecycle tracking, client context, property inventory, tasks, and commission visibility.',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      cookiePolicy: 'Cookie Policy',
      menu: {
        open: 'Open menu',
        close: 'Close menu'
      },
      theme: {
        switchToLight: 'Switch to light mode',
        switchToDark: 'Switch to dark mode'
      }
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
      verification: {
        emailTitle: 'Email Verification',
        emailDescription: 'Verify your email with the code sent to your inbox before registration.',
        sendCode: 'Send Verification Code',
        resendCode: 'Resend Code',
        verifyCode: 'Verify Code',
        statusVerified: 'Verified',
        statusPending: 'Pending verification',
        codeSentInfo: 'Verification code sent. Demo code:',
        codePlaceholder: 'Enter 6-digit code',
        invalidCode: 'Incorrect verification code.',
        requiredBeforeRegister: 'You must verify your email before creating an account.'
      },
      fields: {
        name: 'Full Name',
        email: 'Work Email'
      },
      placeholders: {
        name: 'Alex Johnson',
        email: 'name@example.com'
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
        creating: 'Creating...',
        sendSummaryEmail: 'Send Summary Email',
        summaryEmailSubject: 'Daily Transaction Summary',
        summaryEmailIntro: 'Here is your current transaction summary:'
      },
      notifications: {
        createdTitle: 'Transaction Created',
        createdBody: '{propertyTitle} was added successfully.',
        stageChangedTitle: 'Stage Updated',
        stageChangedBody: '{propertyTitle} moved to {stage}.'
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
        completedAgencyEarnings: {
          label: 'Completed Agency Earnings',
          helper: 'Agency share across completed transactions'
        },
        completedAgentEarnings: {
          label: 'Completed Agent Earnings',
          helper: 'Agent share across completed transactions'
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
        description: 'Search, stage, type, and sort controls for the transaction workspace.',
        searchLabel: 'Search',
        searchPlaceholder: 'Search by property or advisor name',
        stageLabel: 'Stage',
        allStages: 'All stages',
        transactionTypeLabel: 'Transaction Type',
        allTypes: 'All types',
        sortLabel: 'Sort by',
        sortNewest: 'Newest',
        sortOldest: 'Oldest',
        sortRecentlyUpdated: 'Recently updated',
        sortHighestCommission: 'Highest commission',
        sortLowestCommission: 'Lowest commission',
        sortPropertyAZ: 'Property A-Z',
        clearFilters: 'Clear filters',
        includeDeleted: 'Include deleted'
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
        editing: 'Editing...',
        deleting: 'Deleting...',
        viewDetails: 'View details',
        hideDetails: 'Hide details',
        advanceTo: 'Advance to {stage}',
        completed: 'Completed'
      },
      detail: {
        currentStage: 'Current Stage',
        totalServiceFee: 'Total Service Fee',
        listingAgent: 'Listing Agent',
        sellingAgent: 'Selling Agent',
        listingRole: 'Listing role',
        sellingRole: 'Selling role',
        createdBy: 'Created By',
        lastEditedBy: 'Last Edited By',
        lastEditedAt: 'Last Edited At',
        transactionType: 'Transaction Type',
        deletedBy: 'Deleted By',
        deletedAt: 'Deleted At',
        unknownAgent: 'Unknown Agent',
        unknown: 'Unknown',
        notAvailable: 'Not available',
        balanceDistribution: 'Balance Distribution',
        commissionCredited: 'Commission credited to agent balances',
        creditedBy: 'Credited by',
        pendingBalanceDistribution: 'Transaction is completed but balance distribution is pending.',
        notesActivity: 'Notes & Activity',
        notesCount: '{count} notes',
        addNotePlaceholder: 'Add a deal note...',
        addingNote: 'Adding...',
        addNote: 'Add Note',
        unknownAuthor: 'Unknown author',
        noNotes: 'No notes yet.',
        relatedTasks: 'Related Tasks',
        noRelatedTasks: 'No tasks are linked to this transaction.'
      },
      edit: {
        title: 'Edit Transaction',
        description: 'Update core details. After agreement stage, workflow-critical fields are locked.',
        lockedNotice:
          'This transaction is beyond agreement stage. Only property title and optional resource links can be edited.',
        saveChanges: 'Save Changes'
      },
      history: {
        title: 'Stage History',
        changedBy: 'Changed by',
        createdAtStage: 'Created at {stage}',
        empty: 'No stage history is available.'
      },
      form: {
        title: 'Create Transaction',
        description:
          'Add a new deal record. Commission breakdown and lifecycle rules are handled by backend policies.',
        validationSummary:
          'Please review highlighted fields and correct validation issues before submitting.',
        sections: {
          dealDetails: 'Deal Details',
          agentAssignment: 'Agent Assignment',
          clientLinks: 'Client Links'
        },
        fields: {
          propertyTitle: 'Property Title',
          linkedProperty: 'Linked Property',
          totalServiceFee: 'Total Service Fee',
          initialStage: 'Initial Stage',
          transactionType: 'Transaction Type',
          listingAgentId: 'Listing Advisor',
          sellingAgentId: 'Selling Advisor',
          clients: 'Clients'
        },
        placeholders: {
          propertyTitle: 'Sunset Villas #12',
          totalServiceFee: '100000',
          noLinkedProperty: 'No linked property',
          selectType: 'Select Type',
          selectAgent: 'Select a registered advisor'
        },
        hints: {
          initialStage: 'All new transactions start at agreement and move forward only.',
          linkedProperty: 'Optional. The text title remains available for legacy transactions.',
          linkedPropertyEdit: 'Optional. This does not replace the legacy property title field.',
          clients: 'Optional. Hold Command or Ctrl to select multiple clients.',
          listingAgentId: 'Choose the listing advisor by name. ObjectId mapping is handled automatically.',
          sellingAgentId: 'Choose the selling advisor by name. ObjectId mapping is handled automatically.',
          noAgentsAvailable: 'No registered advisors found yet. Create a user account first.',
          noCity: 'No city',
          registerAgentFirst: 'Register at least one active agent before creating a transaction.'
        },
        validation: {
          propertyTitleRequired: 'Property title is required.',
          propertyTitleMinLength: 'Property title must be at least 3 characters.',
          totalServiceFeePositive: 'Total service fee must be greater than 0.',
          listingAgentIdRequired: 'Listing advisor selection is required.',
          sellingAgentIdRequired: 'Selling advisor selection is required.',
          transactionTypeRequired: 'Please select a transaction type.',
          noChangesDetected: 'No changes detected.'
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
    settings: {
      meta: {
        title: 'Settings'
      },
      header: {
        kicker: 'Workspace Preferences',
        title: 'Settings',
        description: 'Manage dashboard behavior and visual theme preferences for daily operations.',
        meta: 'Workspace display preferences are stored locally for this browser session.'
      },
      profile: {
        title: 'Profile',
        description: 'User identity and payout details used by operations.',
        status: {
          verified: 'Verified',
          pending: 'Pending verification'
        },
        fields: {
          name: 'Full Name',
          email: 'Email Address',
          phone: 'Phone Number',
          iban: 'IBAN'
        },
        placeholders: {
          name: 'Alex Johnson',
          email: 'name@example.com',
          phone: '+90 5XX XXX XX XX',
          iban: 'TR00 0000 0000 0000 0000 0000 00'
        },
        actions: {
          verify: 'Mark Verified',
          sendSms: 'Send SMS Code',
          confirmSms: 'Confirm SMS Code'
        },
        sms: {
          codeSent: 'An SMS verification code has been sent.',
          demoCode: 'Demo code',
          codePlaceholder: 'Enter 6-digit SMS code',
          invalidCode: 'Invalid code. Please check and try again.',
          verified: 'Phone number verified successfully.'
        }
      },
      preferences: {
        title: 'Workflow Preferences',
        description: 'Tune how dense the workspace feels and which operational updates should reach you.',
        compactCardsLabel: 'Use compact transaction cards',
        compactCardsHint: 'Shows denser cards on the dashboard to fit more items on smaller screens.',
        pushNotificationsLabel: 'Enable mobile push notifications',
        pushNotificationsHint: 'Receive instant updates for stage transitions and assignment actions.',
        emailSummariesLabel: 'Send daily email summaries',
        emailSummariesHint: 'Get a single summary email including open deals and pending stage actions.'
      },
      appearance: {
        title: 'Appearance',
        description: 'Choose a visual mode for your workspace.',
        themeLabel: 'Theme',
        languageLabel: 'Language',
        currencyLabel: 'Currency',
        currencyHint: 'Used for transaction, commission, report, and balance displays.',
        light: 'Light',
        dark: 'Dark'
      }
    },
    balance: {
      meta: {
        title: 'My Balance'
      },
      header: {
        kicker: 'Balance Center',
        title: 'My Balance',
        description: 'Track your commission credits, audit trail entries, and balance timeline.'
      },
      metrics: {
        currentBalance: 'Current Balance',
        currentBalanceHelper: 'Available commission balance',
        totalEarned: 'Total Earned',
        totalEarnedHelper: 'Commission credit total',
        recentMovements: 'Recent Movements',
        recentMovementsHelper: 'Last 8 rows from ledger'
      },
      ledgerTypes: {
        commission_credit: 'Commission Credit',
        manual_adjustment: 'Manual Adjustment',
        reversal: 'Reversal'
      }
    },
    reports: {
      meta: {
        title: 'Reports'
      },
      header: {
        kicker: 'Office Analytics',
        title: 'Reports',
        description: 'Review organization-scoped production, commission, task, and activity trends.',
        meta: 'Executive reporting for transactions, properties, tasks, and commission movement.'
      },
      metrics: {
        monthlyServiceFee: 'Monthly Service Fee',
        agencyTotal: 'Agency Total',
        agentEarnings: 'Agent Earnings',
        overdueTasks: 'Overdue Tasks'
      }
    },
    stages: {
      agreement: 'Agreement',
      earnest_money: 'Earnest Money',
      title_deed: 'Title Deed',
      completed: 'Completed'
    },
    transactionTypes: {
      sold: 'Sold',
      rented: 'Rented'
    },
    property: {
      listingTypes: {
        sale: 'Sale',
        rent: 'Rent'
      },
      statuses: {
        draft: 'Draft',
        active: 'Active',
        reserved: 'Reserved',
        sold: 'Sold',
        rented: 'Rented',
        archived: 'Archived'
      }
    },
    tasks: {
      statuses: {
        todo: 'To Do',
        in_progress: 'In Progress',
        done: 'Done',
        cancelled: 'Cancelled'
      }
    },
    common: {
      notAvailable: '-',
      language: 'Language',
      currency: 'Currency',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      search: 'Search',
      exportCsv: 'Export CSV',
      status: 'Status',
      stage: 'Stage',
      totalAmount: 'Total Amount',
      completed: 'Completed',
      pending: 'Pending',
      refresh: 'Refresh',
      refreshing: 'Refreshing...',
      loading: 'Loading...',
      clear: 'Clear',
      apply: 'Apply',
      retry: 'Retry',
      previous: 'Previous',
      next: 'Next',
      dismiss: 'Dismiss',
      all: 'All'
    }
  },
  tr: {
    layout: {
      subtitle: 'Dahili İşlem Operasyonları',
      navigation: {
        dashboard: 'Panel',
        transactions: 'İşlemler',
        clients: 'Müşteriler',
        properties: 'Gayrimenkuller',
        tasks: 'Görevler',
        reports: 'Raporlar',
        balance: 'Bakiye',
        team: 'Temsilciler',
        profile: 'Profil',
        settings: 'Ayarlar',
        auth: 'Kullanıcı Erişimi'
      },
      language: 'Dil',
      workspace: 'Çalışma Alanı',
      signIn: 'Giriş yap',
      noOrganization: 'Organizasyon yok',
      noRole: 'Rol yok',
      product: 'Ürün',
      support: 'Destek',
      footerDescription:
        'İşlem yaşam döngüsü, müşteri bilgileri, gayrimenkul envanteri, görevler ve komisyon görünürlüğü için odaklı bir operasyon katmanı.',
      privacyPolicy: 'Gizlilik Politikası',
      termsOfService: 'Kullanım Şartları',
      cookiePolicy: 'Çerez Politikası',
      menu: {
        open: 'Menüyü aç',
        close: 'Menüyü kapat'
      },
      theme: {
        switchToLight: 'Açık temaya geç',
        switchToDark: 'Koyu temaya geç'
      }
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
      verification: {
        emailTitle: 'E-posta Doğrulama',
        emailDescription: 'Kayıt olmadan önce gelen kod ile e-postanızı doğrulayın.',
        sendCode: 'Doğrulama Kodu Gönder',
        resendCode: 'Kodu Tekrar Gönder',
        verifyCode: 'Kodu Doğrula',
        statusVerified: 'Onaylandı',
        statusPending: 'Onaylanmayı bekliyor',
        codeSentInfo: 'Doğrulama kodu gönderildi. Demo kod:',
        codePlaceholder: '6 haneli kodu girin',
        invalidCode: 'Doğrulama kodu hatalı.',
        requiredBeforeRegister: 'Hesap oluşturmadan önce e-posta doğrulaması zorunludur.'
      },
      fields: {
        name: 'Ad Soyad',
        email: 'İş E-postası'
      },
      placeholders: {
        name: 'Ahmet Yılmaz',
        email: 'name@example.com'
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
        creating: 'Oluşturuluyor...',
        sendSummaryEmail: 'Özet E-postası Gönder',
        summaryEmailSubject: 'Günlük İşlem Özeti',
        summaryEmailIntro: 'Mevcut işlem özetiniz aşağıdadır:'
      },
      notifications: {
        createdTitle: 'İşlem Oluşturuldu',
        createdBody: '{propertyTitle} başarıyla eklendi.',
        stageChangedTitle: 'Aşama Güncellendi',
        stageChangedBody: '{propertyTitle}, {stage} aşamasına geçti.'
      },
      metrics: {
        totalTransactions: {
          label: 'Toplam İşlem',
          helper: 'Sistemde takip edilen tüm işlemler'
        },
        completedTransactions: {
          label: 'Tamamlanan İşlemler',
          helper: 'Tamamlandı aşamasına ulaşan işlemler'
        },
        openTransactions: {
          label: 'Açık İşlemler',
          helper: 'Henüz tamamlanmamış aktif işlemler'
        },
        totalCommissionVolume: {
          label: 'Toplam Komisyon Hacmi',
          helper: 'Tüm işlemler genelindeki toplam hizmet bedeli'
        },
        completedAgencyEarnings: {
          label: 'Tamamlanan Ajans Kazancı',
          helper: 'Tamamlanan işlemlerde ajans payı'
        },
        completedAgentEarnings: {
          label: 'Tamamlanan Temsilci Kazancı',
          helper: 'Tamamlanan işlemlerde temsilci payı'
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
      filters: {
        title: 'Liste Kontrolleri',
        description: 'İşlem çalışma alanı için arama, aşama, tür ve sıralama kontrolleri.',
        searchLabel: 'Ara',
        searchPlaceholder: 'Gayrimenkul veya temsilci adına göre ara',
        stageLabel: 'Aşama',
        allStages: 'Tüm aşamalar',
        transactionTypeLabel: 'İşlem Türü',
        allTypes: 'Tüm türler',
        sortLabel: 'Sıralama',
        sortNewest: 'En Yeni',
        sortOldest: 'En Eski',
        sortRecentlyUpdated: 'Son Güncellenen',
        sortHighestCommission: 'En Yüksek Komisyon',
        sortLowestCommission: 'En Düşük Komisyon',
        sortPropertyAZ: 'Gayrimenkul A-Z',
        clearFilters: 'Filtreleri Temizle',
        includeDeleted: 'Silinenleri dahil et'
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
        editing: 'Düzenleniyor...',
        deleting: 'Siliniyor...',
        viewDetails: 'Detayları görüntüle',
        hideDetails: 'Detayları gizle',
        advanceTo: '{stage} aşamasına ilerlet',
        completed: 'Tamamlandı'
      },
      detail: {
        currentStage: 'Geçerli Aşama',
        totalServiceFee: 'Toplam Hizmet Bedeli',
        listingAgent: 'Listeleyen Temsilci',
        sellingAgent: 'Satışı Yapan Temsilci',
        listingRole: 'Listeleyen rolü',
        sellingRole: 'Satış rolü',
        createdBy: 'Oluşturan',
        lastEditedBy: 'Son Düzenleyen',
        lastEditedAt: 'Son Düzenleme Tarihi',
        transactionType: 'İşlem Türü',
        deletedBy: 'Silen',
        deletedAt: 'Silinme Tarihi',
        unknownAgent: 'Bilinmeyen Temsilci',
        unknown: 'Bilinmiyor',
        notAvailable: 'Mevcut değil',
        balanceDistribution: 'Bakiye Dağıtımı',
        commissionCredited: 'Komisyon temsilci bakiyelerine işlendi',
        creditedBy: 'İşleyen',
        pendingBalanceDistribution: 'İşlem tamamlandı ancak bakiye dağıtımı bekliyor.',
        notesActivity: 'Notlar ve Aktivite',
        notesCount: '{count} not',
        addNotePlaceholder: 'İşlem notu ekleyin...',
        addingNote: 'Ekleniyor...',
        addNote: 'Not Ekle',
        unknownAuthor: 'Bilinmeyen yazar',
        noNotes: 'Henüz not yok.',
        relatedTasks: 'İlgili Görevler',
        noRelatedTasks: 'Bu işleme bağlı görev yok.'
      },
      edit: {
        title: 'İşlemi Düzenle',
        description: 'Temel bilgileri güncelleyin. Sözleşme aşamasından sonra iş akışı açısından kritik alanlar kilitlenir.',
        lockedNotice:
          'Bu işlem sözleşme aşamasını geçti. Yalnızca gayrimenkul başlığı ve isteğe bağlı kaynak bağlantıları düzenlenebilir.',
        saveChanges: 'Değişiklikleri Kaydet'
      },
      history: {
        title: 'Aşama Geçmişi',
        changedBy: 'Değiştiren',
        createdAtStage: '{stage} aşamasında oluşturuldu',
        empty: 'Aşama geçmişi bulunmuyor.'
      },
      form: {
        title: 'İşlem Oluştur',
        description:
          'Yeni bir işlem kaydı ekleyin. Komisyon dağılımı ve yaşam döngüsü kuralları backend policy servislerinde çalışır.',
        validationSummary:
          'Lütfen vurgulanan alanları kontrol edin ve gönderim öncesi doğrulama hatalarını düzeltin.',
        sections: {
          dealDetails: 'İşlem Detayları',
          agentAssignment: 'Danışman Ataması',
          clientLinks: 'Müşteri Bağlantıları'
        },
        fields: {
          propertyTitle: 'Gayrimenkul Başlığı',
          linkedProperty: 'Bağlı Gayrimenkul',
          totalServiceFee: 'Toplam Hizmet Bedeli',
          initialStage: 'Başlangıç Aşaması',
          transactionType: 'İşlem Türü',
          listingAgentId: 'Listeleyen Temsilci',
          sellingAgentId: 'Satışı Yapan Temsilci',
          clients: 'Müşteriler'
        },
        placeholders: {
          propertyTitle: 'Sunset Villas #12',
          totalServiceFee: '100000',
          noLinkedProperty: 'Bağlı gayrimenkul yok',
          selectType: 'Tür seçin',
          selectAgent: 'Kayıtlı danışman seçin'
        },
        hints: {
          initialStage: 'Tüm yeni işlemler agreement aşamasında başlar ve yalnızca ileri gider.',
          linkedProperty: 'İsteğe bağlı. Metin başlığı eski işlemler için kullanılmaya devam eder.',
          linkedPropertyEdit: 'İsteğe bağlı. Bu alan eski gayrimenkul başlığı alanının yerine geçmez.',
          clients: 'İsteğe bağlı. Birden fazla müşteri seçmek için Command veya Ctrl tuşunu kullanın.',
          listingAgentId: 'Listeleyen danışmanı isimle seçin. ObjectId eşlemesi otomatik yapılır.',
          sellingAgentId: 'Satışı yapan danışmanı isimle seçin. ObjectId eşlemesi otomatik yapılır.',
          noAgentsAvailable: 'Henüz kayıtlı danışman yok. Önce kullanıcı kaydı oluşturun.',
          noCity: 'Şehir yok',
          registerAgentFirst: 'İşlem oluşturmadan önce en az bir aktif temsilci kaydedin.'
        },
        validation: {
          propertyTitleRequired: 'Gayrimenkul başlığı zorunludur.',
          propertyTitleMinLength: 'Gayrimenkul başlığı en az 3 karakter olmalıdır.',
          totalServiceFeePositive: 'Toplam hizmet bedeli 0’dan büyük olmalıdır.',
          listingAgentIdRequired: 'Listeleyen danışman seçimi zorunludur.',
          sellingAgentIdRequired: 'Satışı yapan danışman seçimi zorunludur.',
          transactionTypeRequired: 'Lütfen işlem türü seçin.',
          noChangesDetected: 'Değişiklik bulunamadı.'
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
    settings: {
      meta: {
        title: 'Ayarlar'
      },
      header: {
        kicker: 'Çalışma Alanı Tercihleri',
        title: 'Ayarlar',
        description: 'Günlük operasyon için panel davranışını, görünümü ve dil seçeneklerini yönetin.',
        meta: 'Çalışma alanı görünüm tercihleri bu tarayıcı oturumu için yerel olarak saklanır.'
      },
      profile: {
        title: 'Profil',
        description: 'Operasyonlarda kullanılan kullanıcı kimliği ve ödeme bilgileri.',
        status: {
          verified: 'Onaylandı',
          pending: 'Onaylanmayı bekliyor'
        },
        fields: {
          name: 'Ad Soyad',
          email: 'E-posta Adresi',
          phone: 'Telefon Numarası',
          iban: 'IBAN'
        },
        placeholders: {
          name: 'Ahmet Yılmaz',
          email: 'name@example.com',
          phone: '+90 5XX XXX XX XX',
          iban: 'TR00 0000 0000 0000 0000 0000 00'
        },
        actions: {
          verify: 'Onayla',
          sendSms: 'SMS Kodu Gönder',
          confirmSms: 'SMS Kodunu Doğrula'
        },
        sms: {
          codeSent: 'SMS doğrulama kodu gönderildi.',
          demoCode: 'Demo kod',
          codePlaceholder: '6 haneli SMS kodunu girin',
          invalidCode: 'Kod geçersiz. Kontrol edip tekrar deneyin.',
          verified: 'Telefon numarası başarıyla onaylandı.'
        }
      },
      preferences: {
        title: 'Çalışma Tercihleri',
        description: 'Çalışma alanının yoğunluğunu ve hangi operasyon güncellemelerinin size ulaşacağını ayarlayın.',
        compactCardsLabel: 'Kompakt işlem kartlarını kullan',
        compactCardsHint: 'Küçük ekranlarda daha fazla kayıt görmek için daha sıkı kart görünümü kullanır.',
        pushNotificationsLabel: 'Mobil anlık bildirimleri aç',
        pushNotificationsHint: 'Aşama geçişleri ve atama işlemleri için anında bildirim alırsınız.',
        emailSummariesLabel: 'Günlük e-posta özetleri gönder',
        emailSummariesHint: 'Açık işlemler ve bekleyen aksiyonlar için günlük tek özet e-posta alın.'
      },
      appearance: {
        title: 'Görünüm ve Dil',
        description: 'Çalışma alanınız için tema, arayüz dili ve para birimini seçin.',
        themeLabel: 'Tema',
        languageLabel: 'Dil',
        currencyLabel: 'Para Birimi',
        currencyHint: 'İşlem, komisyon, rapor ve bakiye gösterimlerinde kullanılır.',
        light: 'Açık',
        dark: 'Koyu'
      }
    },
    balance: {
      meta: {
        title: 'Bakiyem'
      },
      header: {
        kicker: 'Bakiye Merkezi',
        title: 'Bakiyem',
        description: 'Komisyon alacaklarınızı, denetim kayıtlarını ve bakiye hareketlerini takip edin.'
      },
      metrics: {
        currentBalance: 'Güncel Bakiye',
        currentBalanceHelper: 'Kullanılabilir komisyon bakiyesi',
        totalEarned: 'Toplam Kazanç',
        totalEarnedHelper: 'Toplam komisyon alacağı',
        recentMovements: 'Son Hareketler',
        recentMovementsHelper: 'Defterdeki son 8 satır'
      },
      ledgerTypes: {
        commission_credit: 'Komisyon Alacağı',
        manual_adjustment: 'Manuel Düzeltme',
        reversal: 'Ters Kayıt'
      }
    },
    reports: {
      meta: {
        title: 'Raporlar'
      },
      header: {
        kicker: 'Ofis Analitiği',
        title: 'Raporlar',
        description: 'Organizasyon kapsamındaki üretim, komisyon, görev ve aktivite trendlerini inceleyin.',
        meta: 'İşlemler, gayrimenkuller, görevler ve komisyon hareketleri için yönetici raporlaması.'
      },
      metrics: {
        monthlyServiceFee: 'Aylık Hizmet Bedeli',
        agencyTotal: 'Ajans Toplamı',
        agentEarnings: 'Temsilci Kazancı',
        overdueTasks: 'Geciken Görevler'
      }
    },
    stages: {
      agreement: 'Sözleşme',
      earnest_money: 'Kapora',
      title_deed: 'Tapu Devri',
      completed: 'Tamamlandı'
    },
    transactionTypes: {
      sold: 'Satıldı',
      rented: 'Kiralandı'
    },
    property: {
      listingTypes: {
        sale: 'Satılık',
        rent: 'Kiralık'
      },
      statuses: {
        draft: 'Taslak',
        active: 'Aktif',
        reserved: 'Rezerve',
        sold: 'Satıldı',
        rented: 'Kiralandı',
        archived: 'Arşivlendi'
      }
    },
    tasks: {
      statuses: {
        todo: 'Yapılacak',
        in_progress: 'Devam Ediyor',
        done: 'Tamamlandı',
        cancelled: 'İptal Edildi'
      }
    },
    common: {
      notAvailable: '-',
      language: 'Dil',
      currency: 'Para Birimi',
      create: 'Oluştur',
      edit: 'Düzenle',
      delete: 'Sil',
      save: 'Kaydet',
      cancel: 'İptal',
      search: 'Ara',
      exportCsv: 'CSV Dışa Aktar',
      status: 'Durum',
      stage: 'Aşama',
      totalAmount: 'Toplam Tutar',
      completed: 'Tamamlandı',
      pending: 'Beklemede',
      refresh: 'Yenile',
      refreshing: 'Yenileniyor...',
      loading: 'Yükleniyor...',
      clear: 'Temizle',
      apply: 'Uygula',
      retry: 'Tekrar Dene',
      previous: 'Önceki',
      next: 'Sonraki',
      dismiss: 'Kapat',
      all: 'Tümü'
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
        email: 'name@example.com'
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
          totalServiceFee: 'Frais de Service Totaux',
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
        email: 'name@example.com'
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
          totalServiceFee: 'Gesamte Servicegebühr',
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

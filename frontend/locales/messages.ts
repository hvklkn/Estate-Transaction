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
        team: 'Team',
        agents: 'Agents',
        profile: 'Profile',
        settings: 'Settings',
        auth: 'User Access'
      },
      language: 'Language',
      primaryNavigation: 'Primary navigation',
      mobilePrimaryNavigation: 'Mobile primary navigation',
      workspace: 'Workspace',
      environment: 'ENV',
      signIn: 'Sign in',
      noOrganization: 'No organization',
      noRole: 'No role',
      product: 'Product',
      support: 'Support',
      footerDescription:
        'A focused operating layer for transaction lifecycle tracking, client context, property inventory, tasks, and commission visibility.',
      brandTagline: 'Real estate operations dashboard',
      allRightsReserved: 'All rights reserved.',
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
        logout: 'Sign out',
        createWorkspace: 'Create Workspace',
        forgotPassword: 'Forgot password?',
        back: 'Back',
        sendVerificationCode: 'Send verification code',
        resetPassword: 'Reset password'
      },
      marketing: {
        valueBullets: {
          stageTraceability: 'Stage traceability from intake to close',
          crmInventory: 'CRM clients and inventory in the same workspace',
          commissionVisibility: 'Commission and balance visibility without spreadsheet drift'
        },
        stats: {
          lifecycleVisibility: 'Lifecycle visibility',
          sourceOfTruth: 'Operational source of truth',
          balanceTracking: 'Balance tracking'
        },
        heroKicker: 'Estate operations platform',
        heroTitle: 'Run every property deal from one calm operating system.',
        heroDescription:
          'Estate Transaction brings lifecycle stages, CRM clients, property inventory, tasks, and commission visibility into a single workspace built for modern real estate teams.',
        previewTitle: 'Live workspace preview',
        previewSubtitle: 'Transaction Command Center',
        live: 'Live',
        operational: 'Operational',
        pipelineStage: 'Pipeline stage',
        activeDeals: '{count} active deals',
        offer: 'Offer',
        contract: 'Contract',
        closing: 'Closing',
        commissionPipeline: 'Commission pipeline',
        overdueTasks: 'Overdue tasks',
        secureAccess: 'Secure access',
        welcomeBack: 'Welcome back',
        createWorkspace: 'Create your workspace',
        loginDescription: 'Sign in to continue managing transactions, tasks, inventory, and balances.',
        registerDescription:
          'Public registration is for the first workspace owner. Team members are created inside the app.',
        registrationNotice:
          'Public registration creates the initial office owner workspace. Existing teams are managed from Team after sign-in.',
        platformValue: 'Platform value',
        platformTitle: 'Built for the real estate transaction office.',
        platformDescription:
          'A focused operating layer for teams that need cleaner stage control, client context, property visibility, and financial clarity.',
        workflowKicker: 'Workflow',
        workflowTitle: 'From workspace setup to operational control.',
        workflowDescription:
          'The public page starts the workspace. The authenticated app handles team creation, permissions, transaction activity, and reporting.'
      },
      recovery: {
        kicker: 'Account recovery',
        title: 'Reset password',
        description: 'Use a verification code to securely regain access to your workspace.',
        emailSent: 'Verification code has been sent to your e-mail address.',
        passwordUpdated: 'Password updated. You can now sign in with your new password.',
        developmentCode: 'Development code: {code}'
      },
      features: {
        lifecycle: {
          eyebrow: 'Lifecycle',
          title: 'Transaction Lifecycle',
          description: 'Track every deal through centralized stages, participant assignments, notes, and operational status.',
          metric: 'Pipeline, closings, and completed deals stay visible.'
        },
        crm: {
          eyebrow: 'CRM',
          title: 'CRM Clients',
          description: 'Keep buyer, seller, tenant, and landlord records connected to transactions and property workflows.',
          metric: 'Client context follows the deal.'
        },
        inventory: {
          eyebrow: 'Inventory',
          title: 'Property Inventory',
          description: 'Manage listings, owner links, pricing, and availability from the same workspace as transactions.',
          metric: 'Properties become reusable operational assets.'
        },
        finance: {
          eyebrow: 'Finance',
          title: 'Commission & Balance Visibility',
          description: 'Make agency and advisor earnings easier to review with clear balance and ledger-style visibility.',
          metric: 'Less reconciliation work at closing.'
        },
        operations: {
          eyebrow: 'Operations',
          title: 'Reports & Tasks',
          description: 'Monitor workload, overdue tasks, stage distribution, and performance signals with focused dashboards.',
          metric: 'Daily operations become easier to scan.'
        }
      },
      workflowSteps: {
        createWorkspace: {
          title: 'Create a workspace or sign in',
          description: 'The first account creates the office workspace. Team members are added later from the authenticated Team area.'
        },
        operatingBase: {
          title: 'Build your operating base',
          description: 'Add clients, properties, agents, and transaction records with organization-aware permissions.'
        },
        transactionFlow: {
          title: 'Run the transaction flow',
          description: 'Move deals through stages, assign tasks, and keep balance visibility aligned with the operational record.'
        }
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
        email: 'Work Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        organizationName: 'Organization Name',
        organizationSlug: 'Organization Slug',
        authenticatorCode: 'Authenticator Code',
        smsCode: 'SMS Code',
        verificationCode: 'Verification Code',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password'
      },
      placeholders: {
        name: 'Alex Johnson',
        email: 'name@example.com',
        organizationName: 'Kalkan Estate',
        organizationSlug: 'kalkan-estate-demo',
        sixDigitCode: '6-digit code',
        recoveryEmail: 'you@example.com'
      },
      validation: {
        passwordMinLength: 'Password must be at least 8 characters.',
        passwordMismatch: 'Password confirmation does not match.',
        twoFactorAuthenticatorHint: 'Enter the 6-digit code from your authenticator app.',
        twoFactorSmsHint: 'Enter the 6-digit SMS verification code.'
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
      dashboard: {
        showingMeta: 'Showing {range} of {total} records',
        serverPaginatedCount: 'Server-side paginated count',
        completedCurrentPage: 'Completed in current page',
        openCurrentPage: 'Open in current page',
        stageMix: 'Stage Mix',
        stageMixDescription: 'Lifecycle distribution for the current dashboard scope.',
        noStageData: 'No stage data yet.',
        revenueSignal: 'Revenue signal from completed and active workflows.',
        topAgents: 'Top Agents',
        topAgentsDescription: 'Closed deal leaders in the current summary.',
        closedCount: '{count} closed',
        closedRankingsEmpty: 'Closed deal rankings will appear here.',
        taskSnapshot: 'Task Snapshot',
        taskSnapshotDescription: 'Open tasks across the office.',
        openTasks: 'Open Tasks',
        overdue: 'Overdue',
        today: 'Today',
        week: 'Week',
        recentActivity: 'Recent Transaction Activity',
        recentActivityDescription: 'Latest notes and operational updates.',
        transactionNote: 'Transaction note',
        noRecentNotes: 'No recent transaction notes yet',
        noRecentNotesDescription: 'Activity will appear here once the team starts adding workflow notes.',
        latestBalanceMovements: 'Latest credits, adjustments, and reversals.',
        noBalanceMovements: 'No balance movements yet',
        noBalanceMovementsDescription: 'Completed transactions will generate commission credits here.',
        emptyFilteredTitle: 'No transactions match current filters',
        emptyFilteredDescription: 'Try clearing search, stage, or transaction type filters to widen the result set.',
        updated: 'Transaction updated successfully.',
        deleted: 'Transaction deleted successfully.',
        deleteConfirm: 'Are you sure you want to delete this transaction? This will perform a soft delete and keep audit history.'
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
        completed: 'Completed',
        deleted: 'Deleted',
        workflowClosed: 'Workflow closed',
        balanceCredited: 'Balance credited',
        balancePending: 'Balance pending',
        linkedProperty: 'Linked property',
        clients: 'Clients',
        createdBy: 'Created by',
        lastEditedBy: 'Last edited by',
        lastEditedAt: 'Last edited at',
        deletedBy: 'Deleted by',
        deletedAt: 'Deleted at',
        deletedReadOnly: 'Deleted transactions are read-only for audit traceability.'
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
        createMeta: 'Create the deal record first, then advance lifecycle stages from the transaction workspace.',
        checklist: {
          title: 'Creation Checklist',
          description: 'The form validates deal details, linked records, and agent assignment before saving.',
          propertyContext: 'Property context',
          propertyContextDescription:
            'Link an inventory property when available, or use a standalone title for legacy records.',
          commissionSource: 'Commission source',
          commissionSourceDescription:
            'The service fee becomes the basis for the stage-driven financial breakdown.',
          agentAssignment: 'Agent assignment',
          agentAssignmentDescription:
            'Listing and selling agents are required while the transaction is created in agreement stage.'
        },
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
    profilePage: {
      meta: {
        title: 'Profile'
      },
      header: {
        eyebrow: 'User Profile',
        title: 'Profile',
        description: 'Manage your account details, security settings, and active sessions.',
        signedInAs: 'Signed in as {name}',
        signedInAsWithEmail: 'Signed in as {name} ({email})'
      },
      organization: {
        title: 'Organization',
        description: 'Your current workspace and access level for this session.',
        organization: 'Organization',
        slug: 'Slug',
        noOrganization: 'No organization assigned',
        notAvailable: 'Not available',
        noRole: 'No role'
      },
      profile: {
        title: 'Profile Information',
        description: 'Update your account details, email address, phone number, and IBAN.',
        fields: {
          fullName: 'Full Name',
          email: 'Email',
          phone: 'Phone Number',
          iban: 'IBAN'
        }
      },
      password: {
        title: 'Change Password',
        description: 'Update your password by entering your current password and confirming the new one.',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        updatePassword: 'Update Password',
        updating: 'Updating...'
      },
      twoFactor: {
        title: 'Two-Factor Authentication (2FA)',
        description: 'Add an extra security layer to sign-in with authenticator-based 2FA.',
        method: '2FA Method',
        authenticatorApp: 'Authenticator App',
        smsProvider: 'SMS (requires provider)',
        authenticatorSecret: 'Authenticator Secret',
        verificationCode: '2FA Verification Code',
        enabled: 'Enabled',
        disabled: 'Disabled',
        verifiedAt: 'Verified: {date}',
        preparing: 'Preparing...',
        startSetup: 'Start 2FA Setup',
        verifying: 'Verifying...',
        verify: 'Verify 2FA',
        disabling: 'Disabling...',
        disable: 'Disable 2FA',
        codePlaceholder: '6-digit code'
      },
      sessions: {
        title: 'Session Management',
        description: 'View active sessions and sign out from other devices.',
        signOutOtherDevices: 'Sign Out Other Devices',
        emptyTitle: 'No active sessions',
        emptyDescription: 'Signed-in sessions will appear here after profile data loads.',
        lastActive: 'Last active: {date}',
        currentSession: 'Current Session',
        active: 'Active',
        revokeSession: 'Revoke Session',
        currentSessionId: 'Current session ID'
      },
      actions: {
        saveProfile: 'Save Profile'
      },
      messages: {
        sessionMissing: 'Session token not found. Please sign in again.',
        profileUpdated: 'Profile updated successfully.',
        passwordChanged: 'Password changed successfully.',
        twoFactorSecretGenerated:
          '2FA secret generated. Scan this key in your authenticator app and verify with a 6-digit code.',
        twoFactorEnabled: '2FA enabled at {date}.',
        twoFactorDisabled: '2FA disabled successfully.',
        sessionRevoked: 'Session revoked successfully.',
        otherSessionsRevoked: 'All other sessions were revoked.',
        signInRequired: 'You need to sign in again to manage profile and security settings.'
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
      },
      sections: {
        salesRecords: 'Sales Records',
        salesRecordsDescription: 'Transactions where you are assigned as the selling agent are listed here.',
        totalSales: 'Total Sales',
        completed: 'Completed',
        volume: 'Volume',
        earnings: 'Earnings',
        transactionId: 'Transaction ID',
        serviceFee: 'Service Fee',
        yourEarning: 'Your Earning',
        createdAt: 'Created At',
        summaryError: 'Could not load balance summary',
        ledgerHistory: 'Ledger History',
        ledgerMeta: 'Showing {range} of {total} entries',
        backToTransactions: 'Back to Transactions',
        ledgerError: 'Could not load ledger entries'
      },
      filters: {
        type: 'Type',
        dateFrom: 'Date From',
        dateTo: 'Date To'
      },
      table: {
        date: 'Date',
        type: 'Type',
        amount: 'Amount',
        newBalance: 'New Balance',
        relatedTransaction: 'Related Transaction',
        description: 'Description'
      },
      empty: {
        noSales: 'No sales found',
        noSalesDescription: 'Your assigned sales transactions will appear here.',
        noLedgerRowsFiltered: 'No ledger rows match your filters',
        noBalanceMovements: 'No balance movements yet',
        ledgerFilteredDescription: 'Try clearing type/date filters to see a wider result set.',
        noBalanceMovementsDescription: 'Your commission credits and adjustments will appear here once activity starts.'
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
      },
      helpers: {
        currentCalendarMonth: 'Current calendar month',
        completedDeals: 'Completed deals',
        commissionAllocations: 'Commission allocations',
        openTasksBeforeToday: 'Open tasks before today'
      },
      filters: {
        title: 'Report Filters',
        description: 'Scope analytics by date, deal type, lifecycle stage, property listing, or status.',
        dateFrom: 'Date From',
        dateTo: 'Date To',
        type: 'Type',
        stage: 'Stage',
        listing: 'Listing',
        status: 'Status',
        applyFilters: 'Apply Filters',
        clearFilters: 'Clear Filters'
      },
      sections: {
        transactionsByStage: 'Transactions by Stage',
        transactionsByStageDescription: 'Lifecycle visibility across filtered transactions.',
        serviceFeeTrend: 'Service Fee Trend',
        serviceFeeTrendDescription: 'Monthly service fee movement for the active filter set.',
        agentPerformance: 'Agent Performance',
        agentPerformanceDescription: 'Closed-deal output and commission earnings by agent.',
        recentActivity: 'Recent Activity',
        recentActivityDescription: 'Latest reportable movement in the workspace.',
        exports: 'Exports',
        exportsDescription: 'CSV files respect the active report filters and organization scope.'
      },
      table: {
        agent: 'Agent',
        closedDeals: 'Closed Deals',
        commission: 'Commission'
      },
      empty: {
        noTransactionData: 'No transaction data',
        noTransactionDataDescription: 'Adjust report filters to widen the stage view.',
        noFeeTrend: 'No fee trend yet',
        noFeeTrendDescription: 'Trend bars will appear after transactions carry service fee data.',
        noAgentPerformance: 'No agent performance data yet',
        noAgentPerformanceDescription: 'Closed transactions will populate this leaderboard.',
        noRecentActivity: 'No recent activity yet',
        noRecentActivityDescription: 'Recent transactions, tasks, and property updates will appear here.'
      },
      export: {
        transactions: 'Transactions',
        clients: 'Clients',
        properties: 'Properties',
        tasks: 'Tasks',
        commissions: 'Commissions',
        exporting: 'Exporting...'
      }
    },
    roles: {
      super_admin: 'Super Admin',
      office_owner: 'Office Owner',
      admin: 'Admin',
      manager: 'Manager',
      agent: 'Agent',
      assistant: 'Assistant',
      finance: 'Finance'
    },
    userStatuses: {
      active: 'Active',
      inactive: 'Inactive'
    },
    clients: {
      meta: {
        title: 'Clients'
      },
      header: {
        kicker: 'CRM',
        title: 'Clients',
        description: 'Manage buyer, seller, landlord, tenant, and investor contacts inside your organization.',
        meta: '{count} active CRM records'
      },
      directory: {
        title: 'Client Directory',
        description: '{count} active records across your CRM workspace.',
        emptyTitle: 'No clients yet',
        emptyDescription: 'Create your first client to connect people to properties and transactions.'
      },
      form: {
        createTitle: 'Create Client',
        editTitle: 'Edit Client',
        description: 'Capture contact details once and reuse them across properties and transactions.',
        cannotCreate: 'Your role can view clients, but cannot create or edit them.',
        fullName: 'Full Name',
        phone: 'Phone',
        email: 'Email',
        type: 'Type',
        notes: 'Notes',
        saveClient: 'Save Client',
        createClient: 'Create Client'
      },
      messages: {
        created: 'Client created.',
        updated: 'Client updated.',
        archived: 'Client archived.',
        archiveConfirm: 'Archive {name}? This keeps audit history.',
        noEmail: 'No email'
      },
      types: {
        buyer: 'Buyer',
        seller: 'Seller',
        landlord: 'Landlord',
        tenant: 'Tenant',
        investor: 'Investor',
        other: 'Other'
      }
    },
    propertiesPage: {
      meta: {
        title: 'Properties'
      },
      header: {
        kicker: 'Inventory',
        title: 'Properties',
        description: 'Maintain sale and rental inventory, owner links, status, and pricing for transaction workflows.',
        sessionRole: 'Session role',
        organization: 'Organization'
      },
      debug: {
        role: 'Role',
        organization: 'Organization',
        organizationId: 'Organization ID',
        permissions: 'canCreate/canManage',
        isCreating: 'isCreating',
        storeError: 'Store error',
        submit: 'Submit',
        lastRefreshCount: 'Last refresh count',
        none: 'none',
        notLoaded: 'not loaded'
      },
      inventory: {
        title: 'Property Inventory',
        description: '{count} active records ready for transaction workflows.',
        emptyTitle: 'No properties yet',
        emptyDescription: 'Create property inventory to connect listings to transactions.',
        cityNotSet: 'City not set',
        owner: 'Owner'
      },
      form: {
        createTitle: 'Create Property',
        editTitle: 'Edit Property',
        description: 'Keep listing details, owner links, pricing, and status ready for deal intake.',
        title: 'Title',
        type: 'Property Type',
        listingType: 'Listing Type',
        ownerClient: 'Owner Client',
        noOwnerLinked: 'No owner linked',
        address: 'Address',
        city: 'City',
        district: 'District',
        price: 'Price',
        currency: 'Currency',
        status: 'Status',
        descriptionLabel: 'Description',
        saveProperty: 'Save Property',
        createProperty: 'Create Property',
        ownerMissing: 'Owner client is not in the active client list for this organization.'
      },
      messages: {
        created: 'Property created: {title}.',
        updated: 'Property updated.',
        archived: 'Property archived.',
        archiveConfirm: 'Archive {title}? This keeps audit history.',
        priceNotSet: 'Price not set',
        priceInvalid: 'Price must be a valid number.',
        priceMin: 'Price must be zero or greater.',
        noSession: 'Session is not loaded. Please sign in again.',
        missingToken: 'Session token is missing. Please sign in again.',
        noUpdatePermission: 'You do not have permission to update properties.',
        noCreatePermission: 'You do not have permission to create properties.',
        titleRequired: 'Title is required.',
        titleMin: 'Title must be at least 2 characters.',
        ownerRequired: "Owner client must be selected from this organization's active clients.",
        createOnlyPermission: 'Your role can create and view properties, but cannot edit or archive them.',
        viewOnlyPermission: 'Your role can view properties, but cannot create, edit, or archive them.'
      }
    },
    team: {
      meta: {
        title: 'Team'
      },
      header: {
        kicker: 'Access',
        title: 'Team',
        description: 'Create and review users for {organization}.',
        meta: 'Public registration starts a workspace. Existing teams add members here after sign-in.'
      },
      users: {
        title: 'Users',
        description: '{count} team members in this workspace.',
        emptyTitle: 'No team members found',
        emptyDescription: 'Create the first user for this workspace.',
        cannotManage: 'Your role can view your own profile, but cannot create or list team members.',
        noOrganization: 'No organization',
        currentOrganization: 'Current organization'
      },
      form: {
        title: 'Create User',
        description: 'New users are added to {organization}.',
        name: 'Name',
        email: 'Email',
        temporaryPassword: 'Temporary Password',
        role: 'Role',
        active: 'Active',
        activeHint: 'Allow sign-in immediately.',
        createUser: 'Create User',
        creating: 'Creating...'
      },
      messages: {
        invalid: 'Enter a valid name, email, password, and allowed role.',
        added: '{name} was added to {organization}.'
      }
    },
    tasksPage: {
      meta: {
        title: 'Tasks'
      },
      header: {
        kicker: 'Operations',
        title: 'Tasks',
        description: 'Track follow-ups, assignments, and deal work across transactions, clients, and properties.',
        meta: '{count} records in the current task view'
      },
      metrics: {
        pendingTasks: 'Pending Tasks',
        pendingHelper: 'Todo and in progress',
        overdue: 'Overdue',
        overdueHelper: 'Open tasks before today',
        dueToday: 'Due Today',
        dueTodayHelper: 'Open tasks due today',
        dueThisWeek: 'Due This Week',
        dueThisWeekHelper: 'Next 7 days'
      },
      controls: {
        title: 'Task Controls',
        description: 'Filter by status, priority, assignee, and due window.',
        allStatuses: 'All statuses',
        allPriorities: 'All priorities',
        assignedUser: 'Assigned User',
        anyone: 'Anyone',
        due: 'Due',
        anyDueDate: 'Any due date'
      },
      list: {
        title: 'Task List',
        description: '{count} records prioritized for the operations queue.',
        emptyFilteredTitle: 'No tasks match filters',
        emptyFilteredDescription: 'Try clearing filters to widen the list.',
        emptyTitle: 'No tasks yet',
        emptyDescription: 'Create a task to start tracking follow-up work.',
        noDueDate: 'No due date',
        assignedTo: 'Assigned to',
        unassigned: 'Unassigned',
        transaction: 'Transaction',
        client: 'Client',
        property: 'Property'
      },
      form: {
        createTitle: 'Create Task',
        editTitle: 'Edit Task',
        description: 'Assign work, due dates, and related records without leaving the operations queue.',
        cannotCreate: 'Your role can view tasks, but cannot create or update them.',
        title: 'Title',
        descriptionLabel: 'Description',
        dueDate: 'Due Date',
        assignedTo: 'Assigned To',
        status: 'Status',
        priority: 'Priority',
        transaction: 'Transaction',
        noTransaction: 'No transaction',
        client: 'Client',
        noClient: 'No client',
        property: 'Property',
        noProperty: 'No property',
        saveTask: 'Save Task',
        createTask: 'Create Task'
      },
      messages: {
        created: 'Task created.',
        updated: 'Task updated.',
        archived: 'Task archived.',
        archiveConfirm: 'Archive "{title}"? This keeps task history.'
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
      types: {
        apartment: 'Apartment',
        house: 'House',
        land: 'Land',
        office: 'Office',
        shop: 'Shop',
        building: 'Building',
        other: 'Other'
      },
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
      },
      priorities: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent'
      },
      dueFilters: {
        overdue: 'Overdue',
        today: 'Due today',
        week: 'Due this week'
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
      filter: 'Filter',
      exportCsv: 'Export CSV',
      status: 'Status',
      stage: 'Stage',
      type: 'Type',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      title: 'Title',
      description: 'Description',
      date: 'Date',
      amount: 'Amount',
      totalAmount: 'Total Amount',
      completed: 'Completed',
      pending: 'Pending',
      active: 'Active',
      inactive: 'Inactive',
      refresh: 'Refresh',
      refreshing: 'Refreshing...',
      loading: 'Loading...',
      clear: 'Clear',
      apply: 'Apply',
      applyFilters: 'Apply Filters',
      clearFilters: 'Clear Filters',
      retry: 'Retry',
      previous: 'Previous',
      next: 'Next',
      dismiss: 'Dismiss',
      all: 'All',
      archive: 'Archive',
      archiving: 'Archiving...',
      saving: 'Saving...',
      pageOf: 'Page {page} of {total}',
      open: 'Open',
      view: 'View',
      back: 'Back'
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
        balance: 'Finansal Özet',
        team: 'Ekip',
        agents: 'Temsilciler',
        profile: 'Profil',
        settings: 'Ayarlar',
        auth: 'Kullanıcı Erişimi'
      },
      language: 'Dil',
      primaryNavigation: 'Ana navigasyon',
      mobilePrimaryNavigation: 'Mobil ana navigasyon',
      workspace: 'Çalışma Alanı',
      environment: 'ORTAM',
      signIn: 'Giriş yap',
      noOrganization: 'Organizasyon yok',
      noRole: 'Rol yok',
      product: 'Ürün',
      support: 'Destek',
      footerDescription:
        'İşlem yaşam döngüsü, müşteri bilgileri, gayrimenkul envanteri, görevler ve komisyon görünürlüğü için odaklı bir operasyon katmanı.',
      brandTagline: 'Gayrimenkul operasyon paneli',
      allRightsReserved: 'Tüm hakları saklıdır.',
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
        logout: 'Çıkış Yap',
        createWorkspace: 'Çalışma Alanı Oluştur',
        forgotPassword: 'Şifremi unuttum?',
        back: 'Geri',
        sendVerificationCode: 'Doğrulama kodu gönder',
        resetPassword: 'Şifreyi sıfırla'
      },
      marketing: {
        valueBullets: {
          stageTraceability: 'Başlangıçtan kapanışa kadar aşama izlenebilirliği',
          crmInventory: 'CRM müşterileri ve envanter aynı çalışma alanında',
          commissionVisibility: 'Elektronik tablo karmaşası olmadan komisyon ve bakiye görünürlüğü'
        },
        stats: {
          lifecycleVisibility: 'Yaşam döngüsü görünürlüğü',
          sourceOfTruth: 'Operasyonel tek gerçek kaynak',
          balanceTracking: 'Bakiye takibi'
        },
        heroKicker: 'Gayrimenkul operasyon platformu',
        heroTitle: 'Her gayrimenkul işlemini sakin bir operasyon sistemiyle yönetin.',
        heroDescription:
          'Estate Transaction; işlem aşamalarını, CRM müşterilerini, gayrimenkul envanterini, görevleri ve komisyon görünürlüğünü modern emlak ekipleri için tek çalışma alanında toplar.',
        previewTitle: 'Canlı çalışma alanı önizlemesi',
        previewSubtitle: 'İşlem Komuta Merkezi',
        live: 'Canlı',
        operational: 'Operasyonel',
        pipelineStage: 'Hat aşaması',
        activeDeals: '{count} aktif işlem',
        offer: 'Teklif',
        contract: 'Sözleşme',
        closing: 'Kapanış',
        commissionPipeline: 'Komisyon hattı',
        overdueTasks: 'Geciken görevler',
        secureAccess: 'Güvenli erişim',
        welcomeBack: 'Tekrar hoş geldiniz',
        createWorkspace: 'Çalışma alanınızı oluşturun',
        loginDescription: 'İşlemler, görevler, envanter ve bakiyeleri yönetmeye devam etmek için giriş yapın.',
        registerDescription:
          'Genel kayıt ilk çalışma alanı sahibi içindir. Ekip üyeleri uygulama içinden oluşturulur.',
        registrationNotice:
          'Genel kayıt ilk ofis sahibi çalışma alanını oluşturur. Mevcut ekipler girişten sonra Ekip bölümünden yönetilir.',
        platformValue: 'Platform değeri',
        platformTitle: 'Gayrimenkul işlem ofisi için tasarlandı.',
        platformDescription:
          'Daha net aşama kontrolü, müşteri bağlamı, gayrimenkul görünürlüğü ve finansal netlik isteyen ekipler için odaklı bir operasyon katmanı.',
        workflowKicker: 'İş Akışı',
        workflowTitle: 'Çalışma alanı kurulumundan operasyonel kontrole.',
        workflowDescription:
          'Genel sayfa çalışma alanını başlatır. Kimlik doğrulamalı uygulama ekip oluşturma, yetkiler, işlem aktivitesi ve raporlamayı yönetir.'
      },
      recovery: {
        kicker: 'Hesap kurtarma',
        title: 'Şifreyi sıfırla',
        description: 'Çalışma alanınıza güvenli biçimde tekrar erişmek için doğrulama kodu kullanın.',
        emailSent: 'Doğrulama kodu e-posta adresinize gönderildi.',
        passwordUpdated: 'Şifre güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
        developmentCode: 'Geliştirme kodu: {code}'
      },
      features: {
        lifecycle: {
          eyebrow: 'Yaşam Döngüsü',
          title: 'İşlem Yaşam Döngüsü',
          description: 'Her işlemi merkezi aşamalar, katılımcı atamaları, notlar ve operasyonel durumla takip edin.',
          metric: 'Hat, kapanışlar ve tamamlanan işlemler görünür kalır.'
        },
        crm: {
          eyebrow: 'CRM',
          title: 'CRM Müşterileri',
          description: 'Alıcı, satıcı, kiracı ve ev sahibi kayıtlarını işlemler ve gayrimenkul akışlarıyla bağlantılı tutun.',
          metric: 'Müşteri bağlamı işlemi takip eder.'
        },
        inventory: {
          eyebrow: 'Envanter',
          title: 'Gayrimenkul Envanteri',
          description: 'İlanları, sahip bağlantılarını, fiyatlandırmayı ve uygunluğu işlemlerle aynı çalışma alanında yönetin.',
          metric: 'Gayrimenkuller yeniden kullanılabilir operasyonel varlıklara dönüşür.'
        },
        finance: {
          eyebrow: 'Finans',
          title: 'Komisyon ve Bakiye Görünürlüğü',
          description: 'Ajans ve danışman kazançlarını net bakiye ve defter görünürlüğüyle daha kolay inceleyin.',
          metric: 'Kapanışta daha az mutabakat işi.'
        },
        operations: {
          eyebrow: 'Operasyon',
          title: 'Raporlar ve Görevler',
          description: 'İş yükünü, geciken görevleri, aşama dağılımını ve performans sinyallerini odaklı panellerle izleyin.',
          metric: 'Günlük operasyonlar daha kolay taranır.'
        }
      },
      workflowSteps: {
        createWorkspace: {
          title: 'Çalışma alanı oluşturun veya giriş yapın',
          description: 'İlk hesap ofis çalışma alanını oluşturur. Ekip üyeleri daha sonra kimlik doğrulamalı Ekip alanından eklenir.'
        },
        operatingBase: {
          title: 'Operasyon tabanınızı kurun',
          description: 'Organizasyon kapsamlı yetkilerle müşteriler, gayrimenkuller, temsilciler ve işlem kayıtları ekleyin.'
        },
        transactionFlow: {
          title: 'İşlem akışını yürütün',
          description: 'İşlemleri aşamalar arasında ilerletin, görev atayın ve bakiye görünürlüğünü operasyon kaydıyla uyumlu tutun.'
        }
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
        email: 'İş E-postası',
        password: 'Şifre',
        confirmPassword: 'Şifreyi Onayla',
        organizationName: 'Organizasyon Adı',
        organizationSlug: 'Organizasyon Slug',
        authenticatorCode: 'Authenticator Kodu',
        smsCode: 'SMS Kodu',
        verificationCode: 'Doğrulama Kodu',
        newPassword: 'Yeni Şifre',
        confirmNewPassword: 'Yeni Şifreyi Onayla'
      },
      placeholders: {
        name: 'Ahmet Yılmaz',
        email: 'name@example.com',
        organizationName: 'Kalkan Estate',
        organizationSlug: 'kalkan-estate-demo',
        sixDigitCode: '6 haneli kod',
        recoveryEmail: 'siz@example.com'
      },
      validation: {
        passwordMinLength: 'Şifre en az 8 karakter olmalıdır.',
        passwordMismatch: 'Şifre onayı eşleşmiyor.',
        twoFactorAuthenticatorHint: 'Authenticator uygulamanızdaki 6 haneli kodu girin.',
        twoFactorSmsHint: '6 haneli SMS doğrulama kodunu girin.'
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
      dashboard: {
        showingMeta: '{total} kayıttan {range} gösteriliyor',
        serverPaginatedCount: 'Sunucu tarafında sayfalanmış sayı',
        completedCurrentPage: 'Geçerli sayfada tamamlanan',
        openCurrentPage: 'Geçerli sayfada açık',
        stageMix: 'Aşama Dağılımı',
        stageMixDescription: 'Geçerli panel kapsamı için yaşam döngüsü dağılımı.',
        noStageData: 'Henüz aşama verisi yok.',
        revenueSignal: 'Tamamlanan ve aktif akışlardan gelir sinyali.',
        topAgents: 'En İyi Temsilciler',
        topAgentsDescription: 'Geçerli özette kapanan işlem liderleri.',
        closedCount: '{count} kapandı',
        closedRankingsEmpty: 'Kapanan işlem sıralaması burada görünecek.',
        taskSnapshot: 'Görev Özeti',
        taskSnapshotDescription: 'Ofis genelindeki açık görevler.',
        openTasks: 'Görevleri Aç',
        overdue: 'Geciken',
        today: 'Bugün',
        week: 'Hafta',
        recentActivity: 'Son İşlem Aktivitesi',
        recentActivityDescription: 'Son notlar ve operasyonel güncellemeler.',
        transactionNote: 'İşlem notu',
        noRecentNotes: 'Henüz son işlem notu yok',
        noRecentNotesDescription: 'Ekip iş akışı notları ekledikçe aktivite burada görünecek.',
        latestBalanceMovements: 'Son alacaklar, düzeltmeler ve ters kayıtlar.',
        noBalanceMovements: 'Henüz bakiye hareketi yok',
        noBalanceMovementsDescription: 'Tamamlanan işlemler burada komisyon alacakları oluşturur.',
        emptyFilteredTitle: 'Geçerli filtrelerle eşleşen işlem yok',
        emptyFilteredDescription: 'Sonuçları genişletmek için arama, aşama veya işlem türü filtrelerini temizleyin.',
        updated: 'İşlem başarıyla güncellendi.',
        deleted: 'İşlem başarıyla silindi.',
        deleteConfirm: 'Bu işlemi silmek istediğinizden emin misiniz? Bu işlem soft delete yapar ve denetim geçmişini korur.'
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
        completed: 'Tamamlandı',
        deleted: 'Silindi',
        workflowClosed: 'İş akışı kapandı',
        balanceCredited: 'Bakiye işlendi',
        balancePending: 'Bakiye bekliyor',
        linkedProperty: 'Bağlı gayrimenkul',
        clients: 'Müşteriler',
        createdBy: 'Oluşturan',
        lastEditedBy: 'Son düzenleyen',
        lastEditedAt: 'Son düzenleme tarihi',
        deletedBy: 'Silen',
        deletedAt: 'Silinme tarihi',
        deletedReadOnly: 'Silinen işlemler denetim izi için salt okunurdur.'
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
        createMeta: 'Önce işlem kaydını oluşturun, ardından işlem çalışma alanından yaşam döngüsü aşamalarını ilerletin.',
        checklist: {
          title: 'Oluşturma Kontrol Listesi',
          description: 'Form, kaydetmeden önce işlem detaylarını, bağlı kayıtları ve danışman atamasını doğrular.',
          propertyContext: 'Gayrimenkul bağlamı',
          propertyContextDescription:
            'Uygun olduğunda envanterdeki bir gayrimenkule bağlayın veya eski kayıtlar için bağımsız bir başlık kullanın.',
          commissionSource: 'Komisyon kaynağı',
          commissionSourceDescription:
            'Hizmet bedeli, aşama odaklı finansal dağılımın temelini oluşturur.',
          agentAssignment: 'Danışman ataması',
          agentAssignmentDescription:
            'İşlem sözleşme aşamasında oluşturulurken listeleyen ve satış danışmanları zorunludur.'
        },
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
    profilePage: {
      meta: {
        title: 'Profil'
      },
      header: {
        eyebrow: 'Kullanıcı Profili',
        title: 'Profil',
        description: 'Hesap bilgilerinizi, güvenlik ayarlarınızı ve aktif oturumlarınızı yönetin.',
        signedInAs: '{name} olarak giriş yapıldı',
        signedInAsWithEmail: '{name} ({email}) olarak giriş yapıldı'
      },
      organization: {
        title: 'Organizasyon',
        description: 'Bu oturum için geçerli çalışma alanınız ve erişim düzeyiniz.',
        organization: 'Organizasyon',
        slug: 'Slug',
        noOrganization: 'Organizasyon atanmamış',
        notAvailable: 'Mevcut değil',
        noRole: 'Rol yok'
      },
      profile: {
        title: 'Profil Bilgileri',
        description: 'Hesap bilgilerinizi, e-posta adresinizi, telefon numaranızı ve IBAN bilginizi güncelleyin.',
        fields: {
          fullName: 'Ad Soyad',
          email: 'E-posta',
          phone: 'Telefon Numarası',
          iban: 'IBAN'
        }
      },
      password: {
        title: 'Şifre Değiştir',
        description: 'Mevcut şifrenizi girip yeni şifreyi onaylayarak şifrenizi güncelleyin.',
        currentPassword: 'Mevcut Şifre',
        newPassword: 'Yeni Şifre',
        confirmNewPassword: 'Yeni Şifreyi Onayla',
        updatePassword: 'Şifreyi Güncelle',
        updating: 'Güncelleniyor...'
      },
      twoFactor: {
        title: 'İki Aşamalı Doğrulama (2FA)',
        description: 'Authenticator tabanlı 2FA ile girişe ek güvenlik katmanı ekleyin.',
        method: '2FA Yöntemi',
        authenticatorApp: 'Authenticator Uygulaması',
        smsProvider: 'SMS (sağlayıcı gerektirir)',
        authenticatorSecret: 'Authenticator Gizli Anahtarı',
        verificationCode: '2FA Doğrulama Kodu',
        enabled: 'Etkin',
        disabled: 'Devre dışı',
        verifiedAt: 'Doğrulandı: {date}',
        preparing: 'Hazırlanıyor...',
        startSetup: '2FA Kurulumunu Başlat',
        verifying: 'Doğrulanıyor...',
        verify: '2FA Doğrula',
        disabling: 'Devre dışı bırakılıyor...',
        disable: '2FA Devre Dışı Bırak',
        codePlaceholder: '6 haneli kod'
      },
      sessions: {
        title: 'Oturum Yönetimi',
        description: 'Aktif oturumları görüntüleyin ve diğer cihazlardan çıkış yapın.',
        signOutOtherDevices: 'Diğer Cihazlardan Çıkış Yap',
        emptyTitle: 'Aktif oturum yok',
        emptyDescription: 'Profil verisi yüklendikten sonra giriş yapılmış oturumlar burada görünür.',
        lastActive: 'Son aktif: {date}',
        currentSession: 'Geçerli Oturum',
        active: 'Aktif',
        revokeSession: 'Oturumu İptal Et',
        currentSessionId: 'Geçerli oturum ID'
      },
      actions: {
        saveProfile: 'Profili Kaydet'
      },
      messages: {
        sessionMissing: 'Oturum tokenı bulunamadı. Lütfen tekrar giriş yapın.',
        profileUpdated: 'Profil başarıyla güncellendi.',
        passwordChanged: 'Şifre başarıyla değiştirildi.',
        twoFactorSecretGenerated:
          '2FA gizli anahtarı oluşturuldu. Bu anahtarı authenticator uygulamanızda tarayın ve 6 haneli kod ile doğrulayın.',
        twoFactorEnabled: '2FA {date} tarihinde etkinleştirildi.',
        twoFactorDisabled: '2FA başarıyla devre dışı bırakıldı.',
        sessionRevoked: 'Oturum başarıyla iptal edildi.',
        otherSessionsRevoked: 'Diğer tüm oturumlar iptal edildi.',
        signInRequired: 'Profil ve güvenlik ayarlarını yönetmek için tekrar giriş yapmanız gerekiyor.'
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
      },
      sections: {
        salesRecords: 'Satış Kayıtları',
        salesRecordsDescription: 'Satış temsilcisi olarak atandığınız işlemler burada listelenir.',
        totalSales: 'Toplam Satış',
        completed: 'Tamamlandı',
        volume: 'Hacim',
        earnings: 'Kazanç',
        transactionId: 'İşlem ID',
        serviceFee: 'Hizmet Bedeli',
        yourEarning: 'Kazancınız',
        createdAt: 'Oluşturulma Tarihi',
        summaryError: 'Bakiye özeti yüklenemedi',
        ledgerHistory: 'Defter Geçmişi',
        ledgerMeta: '{total} kayıt içinden {range} gösteriliyor',
        backToTransactions: 'İşlemlere Dön',
        ledgerError: 'Defter kayıtları yüklenemedi'
      },
      filters: {
        type: 'Tür',
        dateFrom: 'Başlangıç Tarihi',
        dateTo: 'Bitiş Tarihi'
      },
      table: {
        date: 'Tarih',
        type: 'Tür',
        amount: 'Tutar',
        newBalance: 'Yeni Bakiye',
        relatedTransaction: 'İlgili İşlem',
        description: 'Açıklama'
      },
      empty: {
        noSales: 'Satış bulunamadı',
        noSalesDescription: 'Size atanmış satış işlemleri burada görünecek.',
        noLedgerRowsFiltered: 'Filtrelerle eşleşen defter satırı yok',
        noBalanceMovements: 'Henüz bakiye hareketi yok',
        ledgerFilteredDescription: 'Daha geniş sonuç için tür/tarih filtrelerini temizleyin.',
        noBalanceMovementsDescription: 'Komisyon alacaklarınız ve düzeltmeleriniz aktivite başladığında burada görünür.'
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
      },
      helpers: {
        currentCalendarMonth: 'Geçerli takvim ayı',
        completedDeals: 'Tamamlanan işlemler',
        commissionAllocations: 'Komisyon dağılımları',
        openTasksBeforeToday: 'Bugünden önceki açık görevler'
      },
      filters: {
        title: 'Rapor Filtreleri',
        description: 'Analitiği tarih, işlem türü, yaşam döngüsü aşaması, ilan türü veya duruma göre sınırlayın.',
        dateFrom: 'Başlangıç Tarihi',
        dateTo: 'Bitiş Tarihi',
        type: 'Tür',
        stage: 'Aşama',
        listing: 'İlan',
        status: 'Durum',
        applyFilters: 'Filtreleri Uygula',
        clearFilters: 'Filtreleri Temizle'
      },
      sections: {
        transactionsByStage: 'Aşamaya Göre İşlemler',
        transactionsByStageDescription: 'Filtrelenmiş işlemler genelinde yaşam döngüsü görünürlüğü.',
        serviceFeeTrend: 'Hizmet Bedeli Trendi',
        serviceFeeTrendDescription: 'Aktif filtre seti için aylık hizmet bedeli hareketi.',
        agentPerformance: 'Temsilci Performansı',
        agentPerformanceDescription: 'Temsilci bazında kapanan işlem ve komisyon kazancı.',
        recentActivity: 'Son Aktivite',
        recentActivityDescription: 'Çalışma alanındaki son raporlanabilir hareket.',
        exports: 'Dışa Aktarımlar',
        exportsDescription: 'CSV dosyaları aktif rapor filtrelerine ve organizasyon kapsamına uyar.'
      },
      table: {
        agent: 'Temsilci',
        closedDeals: 'Kapanan İşlemler',
        commission: 'Komisyon'
      },
      empty: {
        noTransactionData: 'İşlem verisi yok',
        noTransactionDataDescription: 'Aşama görünümünü genişletmek için rapor filtrelerini değiştirin.',
        noFeeTrend: 'Henüz ücret trendi yok',
        noFeeTrendDescription: 'İşlemlerde hizmet bedeli verisi oluştuğunda trend çubukları burada görünür.',
        noAgentPerformance: 'Henüz temsilci performans verisi yok',
        noAgentPerformanceDescription: 'Kapanan işlemler bu lider tablosunu doldurur.',
        noRecentActivity: 'Henüz son aktivite yok',
        noRecentActivityDescription: 'Son işlemler, görevler ve gayrimenkul güncellemeleri burada görünür.'
      },
      export: {
        transactions: 'İşlemler',
        clients: 'Müşteriler',
        properties: 'Gayrimenkuller',
        tasks: 'Görevler',
        commissions: 'Komisyonlar',
        exporting: 'Dışa aktarılıyor...'
      }
    },
    roles: {
      super_admin: 'Süper Yönetici',
      office_owner: 'Ofis Sahibi',
      admin: 'Yönetici',
      manager: 'Müdür',
      agent: 'Temsilci',
      assistant: 'Asistan',
      finance: 'Finans'
    },
    userStatuses: {
      active: 'Aktif',
      inactive: 'Pasif'
    },
    clients: {
      meta: {
        title: 'Müşteriler'
      },
      header: {
        kicker: 'CRM',
        title: 'Müşteriler',
        description: 'Alıcı, satıcı, ev sahibi, kiracı ve yatırımcı kişilerini organizasyonunuz içinde yönetin.',
        meta: '{count} aktif CRM kaydı'
      },
      directory: {
        title: 'Müşteri Dizini',
        description: 'CRM çalışma alanınızda {count} aktif kayıt.',
        emptyTitle: 'Henüz müşteri yok',
        emptyDescription: 'Kişileri gayrimenkuller ve işlemlerle ilişkilendirmek için ilk müşteriyi oluşturun.'
      },
      form: {
        createTitle: 'Müşteri Oluştur',
        editTitle: 'Müşteriyi Düzenle',
        description: 'İletişim bilgilerini bir kez kaydedin ve gayrimenkuller ile işlemlerde tekrar kullanın.',
        cannotCreate: 'Rolünüz müşterileri görüntüleyebilir, ancak oluşturamaz veya düzenleyemez.',
        fullName: 'Ad Soyad',
        phone: 'Telefon',
        email: 'E-posta',
        type: 'Tür',
        notes: 'Notlar',
        saveClient: 'Müşteriyi Kaydet',
        createClient: 'Müşteri Oluştur'
      },
      messages: {
        created: 'Müşteri oluşturuldu.',
        updated: 'Müşteri güncellendi.',
        archived: 'Müşteri arşivlendi.',
        archiveConfirm: '{name} arşivlensin mi? Bu işlem denetim geçmişini korur.',
        noEmail: 'E-posta yok'
      },
      types: {
        buyer: 'Alıcı',
        seller: 'Satıcı',
        landlord: 'Ev Sahibi',
        tenant: 'Kiracı',
        investor: 'Yatırımcı',
        other: 'Diğer'
      }
    },
    propertiesPage: {
      meta: {
        title: 'Gayrimenkuller'
      },
      header: {
        kicker: 'Envanter',
        title: 'Gayrimenkuller',
        description: 'İşlem akışları için satış ve kiralama envanterini, sahip bağlantılarını, durumu ve fiyatı yönetin.',
        sessionRole: 'Oturum rolü',
        organization: 'Organizasyon'
      },
      debug: {
        role: 'Rol',
        organization: 'Organizasyon',
        organizationId: 'Organizasyon ID',
        permissions: 'canCreate/canManage',
        isCreating: 'isCreating',
        storeError: 'Store hatası',
        submit: 'Gönderim',
        lastRefreshCount: 'Son yenileme sayısı',
        none: 'yok',
        notLoaded: 'yüklenmedi'
      },
      inventory: {
        title: 'Gayrimenkul Envanteri',
        description: 'İşlem akışları için hazır {count} aktif kayıt.',
        emptyTitle: 'Henüz gayrimenkul yok',
        emptyDescription: 'İlanları işlemlere bağlamak için gayrimenkul envanteri oluşturun.',
        cityNotSet: 'Şehir belirtilmedi',
        owner: 'Sahip'
      },
      form: {
        createTitle: 'Gayrimenkul Oluştur',
        editTitle: 'Gayrimenkulü Düzenle',
        description: 'İşlem alımı için ilan detaylarını, sahip bağlantılarını, fiyatı ve durumu hazır tutun.',
        title: 'Başlık',
        type: 'Gayrimenkul Türü',
        listingType: 'İlan Türü',
        ownerClient: 'Sahip Müşteri',
        noOwnerLinked: 'Sahip bağlantısı yok',
        address: 'Adres',
        city: 'Şehir',
        district: 'İlçe',
        price: 'Fiyat',
        currency: 'Para Birimi',
        status: 'Durum',
        descriptionLabel: 'Açıklama',
        saveProperty: 'Gayrimenkulü Kaydet',
        createProperty: 'Gayrimenkul Oluştur',
        ownerMissing: 'Sahip müşteri bu organizasyonun aktif müşteri listesinde değil.'
      },
      messages: {
        created: 'Gayrimenkul oluşturuldu: {title}.',
        updated: 'Gayrimenkul güncellendi.',
        archived: 'Gayrimenkul arşivlendi.',
        archiveConfirm: '{title} arşivlensin mi? Bu işlem denetim geçmişini korur.',
        priceNotSet: 'Fiyat belirtilmedi',
        priceInvalid: 'Fiyat geçerli bir sayı olmalıdır.',
        priceMin: 'Fiyat sıfır veya daha büyük olmalıdır.',
        noSession: 'Oturum yüklenmedi. Lütfen tekrar giriş yapın.',
        missingToken: 'Oturum anahtarı eksik. Lütfen tekrar giriş yapın.',
        noUpdatePermission: 'Gayrimenkulleri güncelleme yetkiniz yok.',
        noCreatePermission: 'Gayrimenkul oluşturma yetkiniz yok.',
        titleRequired: 'Başlık zorunludur.',
        titleMin: 'Başlık en az 2 karakter olmalıdır.',
        ownerRequired: 'Sahip müşteri bu organizasyonun aktif müşterileri arasından seçilmelidir.',
        createOnlyPermission: 'Rolünüz gayrimenkul oluşturup görüntüleyebilir, ancak düzenleyemez veya arşivleyemez.',
        viewOnlyPermission: 'Rolünüz gayrimenkulleri görüntüleyebilir, ancak oluşturamaz, düzenleyemez veya arşivleyemez.'
      }
    },
    team: {
      meta: {
        title: 'Ekip'
      },
      header: {
        kicker: 'Erişim',
        title: 'Ekip',
        description: '{organization} için kullanıcıları oluşturun ve inceleyin.',
        meta: 'Genel kayıt bir çalışma alanı başlatır. Mevcut ekipler girişten sonra buradan üye ekler.'
      },
      users: {
        title: 'Kullanıcılar',
        description: 'Bu çalışma alanında {count} ekip üyesi var.',
        emptyTitle: 'Ekip üyesi bulunamadı',
        emptyDescription: 'Bu çalışma alanı için ilk kullanıcıyı oluşturun.',
        cannotManage: 'Rolünüz kendi profilinizi görüntüleyebilir, ancak ekip üyesi oluşturamaz veya listeleyemez.',
        noOrganization: 'Organizasyon yok',
        currentOrganization: 'Geçerli organizasyon'
      },
      form: {
        title: 'Kullanıcı Oluştur',
        description: 'Yeni kullanıcılar {organization} organizasyonuna eklenir.',
        name: 'Ad Soyad',
        email: 'E-posta',
        temporaryPassword: 'Geçici Şifre',
        role: 'Rol',
        active: 'Aktif',
        activeHint: 'Hemen giriş yapmasına izin ver.',
        createUser: 'Kullanıcı Oluştur',
        creating: 'Oluşturuluyor...'
      },
      messages: {
        invalid: 'Geçerli bir ad, e-posta, şifre ve izin verilen rol girin.',
        added: '{name}, {organization} organizasyonuna eklendi.'
      }
    },
    tasksPage: {
      meta: {
        title: 'Görevler'
      },
      header: {
        kicker: 'Operasyon',
        title: 'Görevler',
        description: 'İşlemler, müşteriler ve gayrimenkuller genelinde takipleri, atamaları ve işlem işlerini yönetin.',
        meta: 'Geçerli görev görünümünde {count} kayıt'
      },
      metrics: {
        pendingTasks: 'Bekleyen Görevler',
        pendingHelper: 'Yapılacak ve devam eden',
        overdue: 'Geciken',
        overdueHelper: 'Bugünden önceki açık görevler',
        dueToday: 'Bugün Biten',
        dueTodayHelper: 'Bugün bitmesi gereken açık görevler',
        dueThisWeek: 'Bu Hafta Biten',
        dueThisWeekHelper: 'Sonraki 7 gün'
      },
      controls: {
        title: 'Görev Kontrolleri',
        description: 'Durum, öncelik, atanan kişi ve bitiş penceresine göre filtreleyin.',
        allStatuses: 'Tüm durumlar',
        allPriorities: 'Tüm öncelikler',
        assignedUser: 'Atanan Kullanıcı',
        anyone: 'Herkes',
        due: 'Bitiş',
        anyDueDate: 'Herhangi bir bitiş tarihi'
      },
      list: {
        title: 'Görev Listesi',
        description: 'Operasyon kuyruğu için önceliklendirilmiş {count} kayıt.',
        emptyFilteredTitle: 'Filtrelerle eşleşen görev yok',
        emptyFilteredDescription: 'Listeyi genişletmek için filtreleri temizleyin.',
        emptyTitle: 'Henüz görev yok',
        emptyDescription: 'Takip işlerini izlemeye başlamak için görev oluşturun.',
        noDueDate: 'Bitiş tarihi yok',
        assignedTo: 'Atanan',
        unassigned: 'Atanmamış',
        transaction: 'İşlem',
        client: 'Müşteri',
        property: 'Gayrimenkul'
      },
      form: {
        createTitle: 'Görev Oluştur',
        editTitle: 'Görevi Düzenle',
        description: 'Operasyon kuyruğundan ayrılmadan iş, bitiş tarihi ve ilişkili kayıtları atayın.',
        cannotCreate: 'Rolünüz görevleri görüntüleyebilir, ancak oluşturamaz veya güncelleyemez.',
        title: 'Başlık',
        descriptionLabel: 'Açıklama',
        dueDate: 'Bitiş Tarihi',
        assignedTo: 'Atanan Kişi',
        status: 'Durum',
        priority: 'Öncelik',
        transaction: 'İşlem',
        noTransaction: 'İşlem yok',
        client: 'Müşteri',
        noClient: 'Müşteri yok',
        property: 'Gayrimenkul',
        noProperty: 'Gayrimenkul yok',
        saveTask: 'Görevi Kaydet',
        createTask: 'Görev Oluştur'
      },
      messages: {
        created: 'Görev oluşturuldu.',
        updated: 'Görev güncellendi.',
        archived: 'Görev arşivlendi.',
        archiveConfirm: '"{title}" arşivlensin mi? Bu işlem görev geçmişini korur.'
      }
    },
    stages: {
      agreement: 'Sözleşme',
      earnest_money: 'Kapora',
      title_deed: 'Tapu',
      completed: 'Tamamlandı'
    },
    transactionTypes: {
      sold: 'Satış',
      rented: 'Kiralama'
    },
    property: {
      types: {
        apartment: 'Daire',
        house: 'Ev',
        land: 'Arsa',
        office: 'Ofis',
        shop: 'Dükkan',
        building: 'Bina',
        other: 'Diğer'
      },
      listingTypes: {
        sale: 'Satış',
        rent: 'Kiralama'
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
      },
      priorities: {
        low: 'Düşük',
        medium: 'Orta',
        high: 'Yüksek',
        urgent: 'Acil'
      },
      dueFilters: {
        overdue: 'Geciken',
        today: 'Bugün biten',
        week: 'Bu hafta biten'
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
      filter: 'Filtrele',
      exportCsv: 'CSV Dışa Aktar',
      status: 'Durum',
      stage: 'Aşama',
      type: 'Tür',
      name: 'Ad Soyad',
      email: 'E-posta',
      role: 'Rol',
      title: 'Başlık',
      description: 'Açıklama',
      date: 'Tarih',
      amount: 'Tutar',
      totalAmount: 'Toplam Tutar',
      completed: 'Tamamlandı',
      pending: 'Beklemede',
      active: 'Aktif',
      inactive: 'Pasif',
      refresh: 'Yenile',
      refreshing: 'Yenileniyor...',
      loading: 'Yükleniyor...',
      clear: 'Temizle',
      apply: 'Uygula',
      applyFilters: 'Filtreleri Uygula',
      clearFilters: 'Filtreleri Temizle',
      retry: 'Tekrar Dene',
      previous: 'Önceki',
      next: 'Sonraki',
      dismiss: 'Kapat',
      all: 'Tümü',
      archive: 'Arşivle',
      archiving: 'Arşivleniyor...',
      saving: 'Kaydediliyor...',
      pageOf: 'Sayfa {page} / {total}',
      open: 'Aç',
      view: 'Görüntüle',
      back: 'Geri'
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

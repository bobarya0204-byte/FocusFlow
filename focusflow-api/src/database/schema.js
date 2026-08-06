/** @readonly */
export const TABLE_NAMES = [
  'Users',
  'Workspace',
  'Projects',
  'Tasks',
  'FocusSessions',
  'UserPreferences',
]

/** @readonly */
export const INDEX_NAMES = [
  'IX_Users_Email',
  'IX_Users_EntraObjectId',
  'IX_Projects_WorkspaceId',
  'IX_Tasks_OwnerId',
  'IX_Tasks_ProjectId',
  'IX_Tasks_SeriesId',
  'IX_FocusSessions_OwnerId',
]

export const CREATE_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS Users (
    Id TEXT PRIMARY KEY NOT NULL,
    EntraObjectId TEXT,
    Email TEXT,
    DisplayName TEXT NOT NULL,
    TenantId TEXT,
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS Workspace (
    Id TEXT PRIMARY KEY NOT NULL,
    Name TEXT NOT NULL,
    TenantId TEXT,
    OwnerUserId TEXT NOT NULL,
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (OwnerUserId) REFERENCES Users (Id)
  )`,

  `CREATE TABLE IF NOT EXISTS Projects (
    Id TEXT PRIMARY KEY NOT NULL,
    WorkspaceId TEXT NOT NULL,
    Name TEXT NOT NULL,
    Description TEXT NOT NULL DEFAULT '',
    Color TEXT,
    Icon TEXT,
    IsSystem INTEGER NOT NULL DEFAULT 0,
    Archived INTEGER NOT NULL DEFAULT 0,
    Deleted INTEGER NOT NULL DEFAULT 0,
    DeletedAt TEXT,
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (WorkspaceId) REFERENCES Workspace (Id)
  )`,

  `CREATE TABLE IF NOT EXISTS Tasks (
    Id TEXT PRIMARY KEY NOT NULL,
    OwnerId TEXT NOT NULL,
    ProjectId TEXT NOT NULL,
    Title TEXT NOT NULL,
    Description TEXT NOT NULL DEFAULT '',
    Notes TEXT NOT NULL DEFAULT '',
    Priority TEXT NOT NULL DEFAULT 'Medium',
    Status TEXT NOT NULL DEFAULT 'Open',
    DueDate TEXT,
    PlannedDate TEXT,
    EstimatedMinutes INTEGER,
    CompletedAt TEXT,
    SeriesId TEXT,
    OccurrenceDate TEXT,
    RecurrenceJson TEXT,
    RecurrenceStateJson TEXT,
    Deleted INTEGER NOT NULL DEFAULT 0,
    DeletedAt TEXT,
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (OwnerId) REFERENCES Users (Id),
    FOREIGN KEY (ProjectId) REFERENCES Projects (Id)
  )`,

  `CREATE TABLE IF NOT EXISTS FocusSessions (
    Id TEXT PRIMARY KEY NOT NULL,
    OwnerId TEXT NOT NULL,
    TaskId TEXT,
    Mode TEXT NOT NULL DEFAULT 'Timer',
    Status TEXT NOT NULL DEFAULT 'Completed',
    DurationMinutes REAL NOT NULL DEFAULT 0,
    DurationSeconds INTEGER NOT NULL DEFAULT 0,
    TaskTitle TEXT,
    CompletedAt TEXT NOT NULL,
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (OwnerId) REFERENCES Users (Id),
    FOREIGN KEY (TaskId) REFERENCES Tasks (Id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS UserPreferences (
    Id TEXT PRIMARY KEY NOT NULL,
    UserId TEXT NOT NULL,
    WorkspaceId TEXT NOT NULL,
    PreferencesJson TEXT NOT NULL DEFAULT '{}',
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (UserId) REFERENCES Users (Id),
    FOREIGN KEY (WorkspaceId) REFERENCES Workspace (Id),
    UNIQUE (UserId, WorkspaceId)
  )`,
]

export const CREATE_INDEX_STATEMENTS = [
  'CREATE INDEX IF NOT EXISTS IX_Users_Email ON Users (Email)',
  'CREATE INDEX IF NOT EXISTS IX_Users_EntraObjectId ON Users (EntraObjectId)',
  'CREATE INDEX IF NOT EXISTS IX_Projects_WorkspaceId ON Projects (WorkspaceId)',
  'CREATE INDEX IF NOT EXISTS IX_Tasks_OwnerId ON Tasks (OwnerId)',
  'CREATE INDEX IF NOT EXISTS IX_Tasks_ProjectId ON Tasks (ProjectId)',
  'CREATE INDEX IF NOT EXISTS IX_Tasks_SeriesId ON Tasks (SeriesId)',
  'CREATE INDEX IF NOT EXISTS IX_FocusSessions_OwnerId ON FocusSessions (OwnerId)',
]

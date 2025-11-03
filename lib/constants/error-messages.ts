/**
 * Standardized error messages for the application
 *
 * This file centralizes all error messages to ensure consistency in tone and formatting.
 * All messages should be user-friendly and provide actionable information when possible.
 */

export const ERROR_MESSAGES = {
  /** Filter-related errors */
  FILTER: {
    APPLY_FAILED: "フィルタの適用に失敗しました。もう一度お試しください。",
    UPDATE_FAILED: "フィルタの更新に失敗しました。もう一度お試しください。",
    CLEAR_FAILED: "フィルタのクリアに失敗しました。もう一度お試しください。",
  },

  /** Save operation errors */
  SAVE: {
    FAILED: (details?: string) =>
      `保存に失敗しました${details ? `。${details}` : "。もう一度お試しください。"}`,
    VALIDATION_FAILED: (errors: string[]) =>
      `入力内容にエラーがあります:\n${errors.join("\n")}`,
    PARTIAL_FAILURE: (successCount: number, failureCount: number) =>
      `${successCount}件の保存に成功しましたが、${failureCount}件の保存に失敗しました。`,
    NO_CHANGES: "変更がないため、保存する内容がありません。",
  },

  /** Grid operation errors */
  GRID: {
    NOT_INITIALIZED:
      "グリッドが初期化されていません。ページを再読み込みしてください。",
    NO_DATA: "表示するデータがありません。",
    LOAD_FAILED: "データの読み込みに失敗しました。もう一度お試しください。",
    SELECTION_REQUIRED: (operation: string) =>
      `${operation}する行を選択してください。`,
  },

  /** Batch operation errors */
  BATCH: {
    MODE_REQUIRED: "一括編集モードを有効にしてください。",
    SAVE_FAILED: "一括保存に失敗しました。個別のエラーを確認してください。",
    CANCEL_CONFIRMATION: "編集内容を破棄してもよろしいですか？",
  },

  /** Clipboard operation errors */
  CLIPBOARD: {
    COPY_FAILED: "コピーに失敗しました。もう一度お試しください。",
    PASTE_FAILED: "貼り付けに失敗しました。もう一度お試しください。",
    READ_FAILED:
      "クリップボードの読み取りに失敗しました。ブラウザの権限を確認してください。",
    NOT_SUPPORTED:
      "このブラウザではクリップボード機能がサポートされていません。",
  },

  /** Row operation errors */
  ROW: {
    ADD_FAILED: "行の追加に失敗しました。もう一度お試しください。",
    DELETE_FAILED: "行の削除に失敗しました。もう一度お試しください。",
    DUPLICATE_FAILED: "行の複製に失敗しました。もう一度お試しください。",
    UPDATE_FAILED: "行の更新に失敗しました。もう一度お試しください。",
    NOT_FOUND: "対象の行が見つかりません。",
  },

  /** Cell editing errors */
  CELL: {
    NOT_EDITABLE: "このセルは編集できません。",
    VALIDATION_FAILED: (fieldName: string, reason: string) =>
      `${fieldName}の入力が正しくありません: ${reason}`,
  },

  /** Network/API errors */
  NETWORK: {
    CONNECTION_FAILED:
      "ネットワークに接続できません。インターネット接続を確認してください。",
    TIMEOUT: "リクエストがタイムアウトしました。もう一度お試しください。",
    SERVER_ERROR:
      "サーバーエラーが発生しました。しばらく待ってから再度お試しください。",
    UNAUTHORIZED: "この操作を実行する権限がありません。",
  },

  /** Undo/Redo errors */
  HISTORY: {
    NO_UNDO: "元に戻す操作がありません。",
    NO_REDO: "やり直す操作がありません。",
  },
} as const;

/**
 * Success messages for operations
 */
export const SUCCESS_MESSAGES = {
  SAVE: {
    SUCCESS: (count?: number) =>
      count ? `${count}件のデータを保存しました。` : "データを保存しました。",
    BATCH_SUCCESS: (count: number) => `${count}件のデータを保存しました。`,
  },

  ROW: {
    ADDED: "行を追加しました。編集後に保存してください。",
    DUPLICATED: "行を複製しました。編集後に保存してください。",
    DELETED: (count: number) => `${count}行を削除しました。`,
  },

  CLIPBOARD: {
    COPIED: (preview: string) =>
      `セル値をコピーしました: "${preview.length > 20 ? `${preview.substring(0, 20)}...` : preview}"`,
    PASTED: "セルに貼り付けました。",
  },

  FILTER: {
    APPLIED: "フィルタを適用しました。",
    CLEARED: "フィルタをクリアしました。",
  },

  HISTORY: {
    UNDO: "操作を元に戻しました。",
    REDO: "操作をやり直しました。",
  },
} as const;

/**
 * Info/Warning messages
 */
export const INFO_MESSAGES = {
  BATCH: {
    MODE_ENABLED: "一括編集モードを有効にしました。",
    MODE_DISABLED: "一括編集モードを無効にしました。",
  },

  SELECTION: {
    REQUIRED: (operation: string) => `${operation}する行を選択してください。`,
    MULTIPLE_REQUIRED: (operation: string) =>
      `${operation}するには複数の行を選択してください。`,
  },

  UNSAVED_CHANGES: "保存されていない変更があります。",
} as const;

export const useStorage = () => {
  const { $storage } = useNuxtApp();

  const THREAD_VIEW_HISTORY_KEY = 'thread_view_history';
  const COMMENT_SORT_ORDER = 'comment_sort_order';
  const COMMENT_LIMIT = 'comment_limit';
  const THEME = 'theme';
  const LAST_COMMENT_TIME = 'last_comment_time';

  const getTheme = (): 'dark' | 'light' => {
    return $storage.getItem<'dark' | 'light'>(THEME) || 'light';
  };

  const setTheme = (theme: 'dark' | 'light'): void => {
    $storage.setItem(THEME, theme);
  };

  const getCommentLimit = (): number => {
    return $storage.getItem<number>(COMMENT_LIMIT) || 50;
  };

  const setCommentLimit = (limit: number): void => {
    $storage.setItem(COMMENT_LIMIT, limit);
  };

  const getCommentOrder = (): 'asc' | 'desc' => {
    return $storage.getItem<'asc' | 'desc'>(COMMENT_SORT_ORDER) || 'desc';
  };

  const setCommentOrder = (order: 'asc' | 'desc'): void => {
    $storage.setItem(COMMENT_SORT_ORDER, order);
  };

  const getThreadViewHistory = (): number[] => {
    return $storage.getItem(THREAD_VIEW_HISTORY_KEY) || [];
  };

  const setThreadViewHistory = (threadId: number): void => {
    let history = getThreadViewHistory() || [];
    const existingIndex = history.indexOf(threadId);
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }
    history.unshift(threadId);
    $storage.setItem(THREAD_VIEW_HISTORY_KEY, history);
  };

  const clearThreadViewHistory = (): void => {
    if (confirm('本当にスレッドの閲覧履歴を削除しますか？')) {
      $storage.removeItem(THREAD_VIEW_HISTORY_KEY);
    }
  };

  const setLastCommentTime = (): void => {
    const timestamp = Date.now();
    $storage.setItem(LAST_COMMENT_TIME, timestamp);
  };

  const canComment = (): boolean => {
    const lastCommentTime = $storage.getItem<number>(LAST_COMMENT_TIME);
    if (!lastCommentTime) {
      return true; // 初回コメント
    }
    const now = Date.now();
    const tenMinutes = 3 * 60 * 1000; // 10分
    return now - lastCommentTime > tenMinutes;
  };

  const timeUntilNextComment = (): { minutes: number; seconds: number } | null => {
    const lastCommentTime = $storage.getItem<number>(LAST_COMMENT_TIME);
    if (!lastCommentTime) {
      return null; // 初回コメント
    }
    const now = Date.now();
    const tenMinutes = 3 * 60 * 1000; // 10分
    const remainingTime = tenMinutes - (now - lastCommentTime);

    if (remainingTime <= 0) {
      return null; // すでにコメント可能
    }

    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    return { minutes, seconds };
  };

  return {
    getThreadViewHistory,
    setThreadViewHistory,
    clearThreadViewHistory,
    getCommentOrder,
    setCommentOrder,
    getCommentLimit,
    setCommentLimit,
    getTheme,
    setTheme,
    setLastCommentTime,
    canComment,
    timeUntilNextComment,
  };
};

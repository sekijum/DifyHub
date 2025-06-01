import { supabase } from '~/utils/supabase';

/**
 * Supabase Storage操作用のcomposable
 * 参考: https://github.com/supabase/supabase
 */
export function useSupabaseStorage() {
  // ランタイム設定からバケット名を取得
  const config = useRuntimeConfig();
  const defaultBucketName = config.public.supabaseBucketName;

  /**
   * 現在の日付から年月日のフォルダパスを生成
   * @returns 年月日のフォルダパス（例: "2024/12/01"）
   */
  const generateDateFolderPath = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  /**
   * ファイルをSupabase StorageにアップロードしてパブリックURLを返す
   * @param file アップロードするファイル
   * @returns アップロード後のパブリックURL
   */
  const uploadFile = async (file: File): Promise<string> => {
    try {
      // ファイルサイズチェック（5MB制限）
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('ファイルサイズは5MB以下である必要があります');
      }

      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('JPEG、PNG、GIF、WebP形式のファイルのみアップロード可能です');
      }

      // ファイルパスを自動生成（常に年月日フォルダを使用）
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const datePath = generateDateFolderPath();
      const filePath = `${datePath}/${fileName}`;

      // Supabase Storageにアップロード
      const { data, error } = await supabase.storage
        .from(defaultBucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // 同じ名前のファイルがある場合は上書きしない
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`アップロードに失敗しました: ${error.message}`);
      }

      // パブリックURLを取得
      const { data: urlData } = supabase.storage
        .from(defaultBucketName)
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('アップロード後のURL取得に失敗しました');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  /**
   * ファイルを削除
   * @param filePath 削除するファイルのパス
   */
  const deleteFile = async (filePath: string): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from(defaultBucketName)
        .remove([filePath]);

      if (error) {
        console.error('File delete error:', error);
        // 削除エラーは致命的ではないのでログのみ
      }
    } catch (error) {
      console.error('File delete error:', error);
      // 削除エラーは致命的ではないのでログのみ
    }
  };

  /**
   * ファイルが画像かどうかをチェック
   * @param file チェックするファイル
   * @returns 画像ファイルかどうか
   */
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  /**
   * ファイルサイズが制限内かどうかをチェック
   * @param file チェックするファイル
   * @param maxSizeMB 最大サイズ（MB）
   * @returns サイズが制限内かどうか
   */
  const isValidFileSize = (file: File, maxSizeMB: number = 5): boolean => {
    const maxSize = maxSizeMB * 1024 * 1024;
    return file.size <= maxSize;
  };

  /**
   * ファイルのプレビューURLを生成
   * @param file プレビューするファイル
   * @returns プレビュー用のURL
   */
  const createFilePreviewUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * ファイルを検証
   * @param file 検証するファイル
   * @param options 検証オプション
   * @returns 検証結果とエラーメッセージ
   */
  const validateFile = (
    file: File, 
    options: {
      allowedTypes?: string[];
      maxSizeMB?: number;
    } = {}
  ): { isValid: boolean; error?: string } => {
    const { 
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 
      maxSizeMB = 5 
    } = options;

    if (!allowedTypes.includes(file.type)) {
      const typeNames = allowedTypes.map(type => type.split('/')[1].toUpperCase()).join('、');
      return { isValid: false, error: `${typeNames}形式のファイルのみアップロード可能です` };
    }

    if (!isValidFileSize(file, maxSizeMB)) {
      return { isValid: false, error: `ファイルサイズは${maxSizeMB}MB以下である必要があります` };
    }

    return { isValid: true };
  };

  /**
   * SupabaseのパブリックURLからファイルパスを抽出
   * @param publicUrl SupabaseのパブリックURL
   * @returns ファイルパス（例: "avatars/2025/05/31/123-timestamp.jpg"）
   */
  const extractFilePathFromUrl = (publicUrl: string): string | null => {
    try {
      const url = new URL(publicUrl);
      const pathParts = url.pathname.split('/');
      
      // URLの形式: /storage/v1/object/public/{bucket}/{filepath}
      // bucket名以降のパスを取得
      const bucketIndex = pathParts.findIndex(part => part === defaultBucketName);
      if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
        return null;
      }
      
      // bucket名以降の部分を結合してファイルパスを作成
      return pathParts.slice(bucketIndex + 1).join('/');
    } catch (error) {
      console.error('Failed to extract file path from URL:', error);
      return null;
    }
  };

  return {
    uploadFile,
    deleteFile,
    isImageFile,
    isValidFileSize,
    createFilePreviewUrl,
    validateFile,
    generateDateFolderPath,
    extractFilePathFromUrl
  };
} 

import axios from 'axios';
import type { IThreadCommentAttachment } from '~/types/thread-comment-attachment';

export const useActions = () => {
  const { $api } = useNuxtApp();
  const config = useRuntimeConfig();

  async function fetchListPresignedUrl(objectNameList: string[]): Promise<string[]> {
    const response = await $api.post<{ urls: string[] }>('/files/urls-for-upload', { objectNameList });
    return response.data.urls;
  }

  async function uploadFilesToS3(presignedUrl: string, file: File): Promise<string> {
    const response = await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
    if (response.status !== 200) {
      throw new Error('Failed to upload file to S3');
    }

    if (config.public.appEnv === 'production') {
      return presignedUrl.replace(/^https?:\/\/[^\/]+/, config.public.staticUrl).split('?')[0];
    } else {
      return presignedUrl.split('?')[0];
    }
  }

  async function uploadFilesToImgur(files: File[]): Promise<IThreadCommentAttachment[]> {
    const config = useRuntimeConfig();

    const uploadedAttachments: IThreadCommentAttachment[] = [];
    const clientId = config.public.clientId;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      const type = file.type.startsWith('video') ? 'video' : 'image';

      let uploadUrl = 'https://api.imgur.com/3/image';
      if (type === 'video') {
        formData.append('video', file);
        uploadUrl = 'https://api.imgur.com/3/upload';
      } else {
        formData.append('image', file);
      }

      try {
        const response = await axios.post(uploadUrl, formData, {
          headers: {
            Authorization: `Client-ID ${clientId}`,
          },
        });
        const data = response.data;
        if (data.success) {
          uploadedAttachments.push({
            url: data.data.link,
            displayOrder: i,
            type: type,
          });
        } else {
          console.error(`Failed to upload file: ${file.name}`, data);
        }
      } catch (error) {
        console.error(`Error uploading file: ${file.name}`, error);
      }
    }

    return uploadedAttachments;
  }

  return { fetchListPresignedUrl, uploadFilesToS3, uploadFilesToImgur };
};

const filenameForLook = (): string => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `styleshift-look-${stamp}.png`;
};

export const dataUrlToFile = async (
  src: string,
  filename = filenameForLook()
): Promise<File> => {
  const response = await fetch(src);
  const blob = await response.blob();
  const type = blob.type || 'image/png';
  return new File([blob], filename, { type });
};

export const downloadLook = async (src: string): Promise<void> => {
  const file = await dataUrlToFile(src);
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const shareLook = async (src: string): Promise<'shared' | 'downloaded'> => {
  const file = await dataUrlToFile(src);

  const payload = {
    files: [file],
    title: 'My StyleShift look',
    text: 'Look created in StyleShift',
  };

  if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(payload))) {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return 'shared';
      }
    }
  }

  await downloadLook(src);
  return 'downloaded';
};

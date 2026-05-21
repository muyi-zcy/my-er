/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

/**
 * @param {FileList | File[]} files
 * @returns {Promise<string>}
 */
export async function readSqlFiles(files) {
  const list = [...files];
  if (list.length === 0) return '';

  const parts = await Promise.all(
    list.map(async (file) => {
      const text = await readTextFile(file);
      return `-- @file ${file.name}\n${text}`;
    }),
  );
  return parts.join('\n\n');
}

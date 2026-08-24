export const JSON_EMPTY_ERROR = '请输入需要处理的 JSON 内容。';

function transformJson(source, indent) {
  if (!source.trim()) return { ok: false, error: JSON_EMPTY_ERROR, position: null };

  try {
    return { ok: true, output: JSON.stringify(JSON.parse(source), null, indent) };
  } catch (error) {
    const match = error.message.match(/(?:position|字符)\s*(\d+)/i);
    return {
      ok: false,
      error: `JSON 解析失败：${error.message}`,
      position: match ? Number(match[1]) : null
    };
  }
}

export const formatJson = (source, indent = 2) =>
  transformJson(source, indent === 'tab' ? '\t' : Number(indent));

export const minifyJson = source => transformJson(source, 0);

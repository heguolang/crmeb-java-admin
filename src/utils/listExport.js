// 列表导出工具：拉取全量数据后在浏览器生成 Excel（不依赖后台文件下载地址）
import { Loading, Message } from 'element-ui';
import exportExcel from '@/utils/newToExcel';

export function normalizeListResult(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.list)) return res.list;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

/** 按字段过滤时间段（dateLimit: start,end） */
export function filterByDateField(list, dateLimit, field) {
  if (!dateLimit || !field || !Array.isArray(list)) return list || [];
  const parts = String(dateLimit).split(',');
  if (parts.length < 2 || !parts[0] || !parts[1]) return list;
  const startTs = new Date(`${parts[0]} 00:00:00`).getTime();
  const endTs = new Date(`${parts[1]} 23:59:59`).getTime();
  if (Number.isNaN(startTs) || Number.isNaN(endTs)) return list;
  return list.filter((item) => {
    const raw = item[field];
    if (raw == null || raw === '') return false;
    let ts;
    if (typeof raw === 'number') {
      ts = raw < 1e12 ? raw * 1000 : raw;
    } else {
      ts = new Date(raw).getTime();
    }
    if (Number.isNaN(ts)) return false;
    return ts >= startTs && ts <= endTs;
  });
}

export async function fetchExportList(apiFn, params = {}) {
  const res = await apiFn({
    ...params,
    page: 1,
    limit: 99999,
  });
  return normalizeListResult(res);
}

/**
 * 统一导出流程
 * @param {Object} options
 * @param {Function} options.apiFn 列表接口
 * @param {Object} options.params 查询参数（可含 dateLimit）
 * @param {Array} options.header 表头中文
 * @param {Array} options.filterVal 字段名
 * @param {String} options.filename 文件名（不含扩展名）
 * @param {Function} [options.mapRow] 行映射
 * @param {String} [options.clientDateField] 前端按该字段二次过滤时间（接口不支持 dateLimit 时用）
 * @param {String} [options.dateLimit] 时间段
 */
export async function runListExport(options) {
  const {
    apiFn,
    params = {},
    header,
    filterVal,
    filename,
    mapRow,
    clientDateField,
    dateLimit,
  } = options;

  const loading = Loading.service({
    lock: true,
    text: '正在导出，请稍候...',
    spinner: 'el-icon-loading',
    background: 'rgba(0, 0, 0, 0.2)',
  });

  try {
    const query = { ...params };
    if (dateLimit) {
      query.dateLimit = dateLimit;
    }
    let list = await fetchExportList(apiFn, query);
    if (clientDateField && dateLimit) {
      list = filterByDateField(list, dateLimit, clientDateField);
    }
    if (!list.length) {
      Message.warning('没有可导出的数据');
      return false;
    }
    const rows = mapRow ? list.map(mapRow) : list;
    exportExcel(header, filterVal, filename, rows);
    Message.success(`导出成功，共 ${rows.length} 条`);
    return true;
  } catch (e) {
    Message.error((e && e.message) || '导出失败');
    return false;
  } finally {
    loading.close();
  }
}

export function resolveLevelName(levelId) {
  try {
    const arrayList = JSON.parse(localStorage.getItem('single-admin-levelKey') || '[]');
    const hit = (arrayList || []).find((item) => item.id === levelId);
    return hit ? hit.name : '';
  } catch (e) {
    return '';
  }
}

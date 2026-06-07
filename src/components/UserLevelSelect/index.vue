<template>
  <el-select
    :value="value"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :filterable="filterable"
    :loading="loading"
    :size="size"
    :style="selectStyle"
    popper-class="user-level-select-dropdown"
    @change="handleChange"
  >
    <el-option
      v-for="item in optionList"
      :key="item.id"
      :label="formatOptionLabel(item)"
      :value="item.id"
    >
      <span class="opt-main">{{ item.name }}</span>
      <span v-if="showGrade && item.grade != null" class="opt-sub">（序号 {{ item.grade }}）</span>
    </el-option>
  </el-select>
</template>

<script>
import { levelAllApi } from '@/api/user';

/** 同页多实例共享一次全量等级请求 */
let cachedLevels = null;
let loadingPromise = null;

function ensureLevelList() {
  if (cachedLevels) return Promise.resolve(cachedLevels);
  if (!loadingPromise) {
    loadingPromise = levelAllApi()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        cachedLevels = list;
        return list;
      })
      .catch((e) => {
        loadingPromise = null;
        return Promise.reject(e);
      });
  }
  return loadingPromise;
}

export function clearUserLevelSelectCache() {
  cachedLevels = null;
  loadingPromise = null;
}

/**
 * 会员等级下拉（全量列表 GET /admin/system/user/level/all）
 * v-model 绑定等级 id；@change 第二参为完整等级对象
 */
export default {
  name: 'UserLevelSelect',
  props: {
    value: {
      type: [Number, String],
      default: null,
    },
    placeholder: {
      type: String,
      default: '请选择会员等级',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: true,
    },
    filterable: {
      type: Boolean,
      default: true,
    },
    size: {
      type: String,
      default: '',
    },
    width: {
      type: String,
      default: '100%',
    },
    showGrade: {
      type: Boolean,
      default: true,
    },
    excludeDeleted: {
      type: Boolean,
      default: true,
    },
    onlyVisible: {
      type: Boolean,
      default: true,
    },
    /** 为 false 时不自动请求，需主动调用 reload() */
    fetchOnMount: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      loading: false,
      rawList: [],
    };
  },
  computed: {
    selectStyle() {
      return { width: this.width };
    },
    optionList() {
      return this.rawList.filter((row) => {
        if (!row || row.id == null) return false;
        if (this.excludeDeleted && row.isDel === true) return false;
        if (this.onlyVisible && row.isShow === false) return false;
        return true;
      });
    },
  },
  mounted() {
    if (this.fetchOnMount) {
      this.fetchList();
    }
  },
  methods: {
    formatOptionLabel(item) {
      if (!item) return '';
      if (this.showGrade && item.grade != null) {
        return `${item.name}（${item.grade}）`;
      }
      return item.name || '';
    },
    fetchList() {
      this.loading = true;
      return ensureLevelList()
        .then((list) => {
          this.rawList = list;
          this.$emit('loaded', this.optionList);
        })
        .catch(() => {
          this.rawList = [];
          this.$emit('load-error');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    reload() {
      clearUserLevelSelectCache();
      return this.fetchList();
    },
    handleChange(id) {
      const normalized = id === '' || id === undefined ? null : id;
      this.$emit('input', normalized);
      const row =
        normalized == null ? null : this.optionList.find((x) => String(x.id) === String(normalized)) || null;
      this.$emit('change', normalized, row);
    },
    matchIdByName(name) {
      if (!name || !this.optionList.length) return null;
      const n = String(name).trim();
      const hit = this.optionList.find((x) => (x.name || '').trim() === n);
      return hit ? hit.id : null;
    },
  },
};
</script>

<style scoped lang="scss">
.opt-main {
  margin-right: 4px;
}
.opt-sub {
  font-size: 12px;
  color: #909399;
}
</style>

<template>
  <el-dialog title="导出数据" :visible.sync="dialogVisible" width="480px" :close-on-click-modal="false" @closed="onClosed">
    <el-form label-width="90px" size="small">
      <el-form-item label="时间段：">
        <el-date-picker
          v-model="timeVal"
          type="daterange"
          value-format="yyyy-MM-dd"
          format="yyyy-MM-dd"
          unlink-panels
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 100%"
        />
      </el-form-item>
      <p class="tip">选择时间段后按该区间导出；不选则导出当前筛选条件下的全部数据。</p>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" size="small" :loading="loading" @click="onConfirm">确定导出</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'ExportDateDialog',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    /** 初始时间段，格式 ['yyyy-MM-dd','yyyy-MM-dd'] 或 dateLimit 字符串 */
    value: {
      type: [Array, String],
      default: () => [],
    },
  },
  data() {
    return {
      timeVal: [],
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit('update:visible', val);
      },
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.syncValue();
      }
    },
  },
  methods: {
    syncValue() {
      if (Array.isArray(this.value) && this.value.length === 2) {
        this.timeVal = [...this.value];
      } else if (typeof this.value === 'string' && this.value.includes(',')) {
        this.timeVal = this.value.split(',');
      } else {
        this.timeVal = [];
      }
    },
    onConfirm() {
      const dateLimit = this.timeVal && this.timeVal.length === 2 ? this.timeVal.join(',') : '';
      this.$emit('confirm', dateLimit, this.timeVal || []);
    },
    onClosed() {
      this.$emit('closed');
    },
  },
};
</script>

<style scoped>
.tip {
  margin: 0 0 0 90px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}
</style>

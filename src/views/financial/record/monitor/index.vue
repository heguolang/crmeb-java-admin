<template>
  <div class="financial-flow">
    <!-- 顶部：页标题 + 操作 -->
    <div class="page-head">
      <div class="page-head__title">资金流水</div>
      <div class="page-head__actions">
        <el-button type="primary" size="small" icon="el-icon-download" @click="handleExportAll">导出全部数据</el-button>
      </div>
    </div>

    <!-- 筛选区：第一行=高频条件（账户类型/项目类型）+ 操作按钮；第二行=等宽栅格 -->
    <el-card class="filter-card" :bordered="false" shadow="never" :body-style="{ padding: 0 }">
      <el-form :model="tableFrom" size="small" label-position="top" class="filter-form">
        <!-- 第一行：账户类型 + 项目类型 + 操作按钮同排 -->
        <div class="filter-top">
          <div class="filter-top__main">
            <span class="filter-top__label">账户类型</span>
            <el-radio-group v-model="tableFrom.category" size="small" class="filter-segment" @change="onChangeCategory">
              <el-radio-button label="all">不限</el-radio-button>
              <el-radio-button label="brokerage_price">佣金</el-radio-button>
              <el-radio-button label="integral">信用值</el-radio-button>
              <el-radio-button label="now_money">余额</el-radio-button>
            </el-radio-group>
          </div>

          <div class="filter-top__side">
            <el-form-item label="项目类型" class="filter-type-item">
              <el-select v-model="tableFrom.title" size="small" clearable placeholder="全部" @change="onChangeTitle">
                <el-option v-for="item in titleOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <div class="filter-actions">
              <el-button type="primary" size="small" icon="el-icon-search" @click="getList(1)">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
            </div>
          </div>
        </div>

        <!-- 第二行：低频条件等宽三列 -->
        <div class="filter-group filter-group--grid">
          <div class="filter-grid">
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="timeVal"
                type="datetimerange"
                value-format="yyyy-MM-dd HH:mm:ss"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 100%"
                @change="onchangeTime"
              />
            </el-form-item>
            <el-form-item label="用户搜索">
              <UserSearchInput ref="userSearchInput" v-model="tableFrom" />
            </el-form-item>
            <el-form-item label="订单号">
              <el-input
                v-model="tableFrom.linkId"
                size="small"
                clearable
                placeholder="订单号 / 关联单号"
                @keyup.enter.native="getList(1)"
              />
            </el-form-item>
          </div>
        </div>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card class="list-card" :bordered="false" shadow="never">
      <div class="list-table" :style="tableStyle">
        <div class="list-head">
          <div class="list-head__cell">用户信息</div>
          <div class="list-head__cell">订单</div>
          <div class="list-head__cell">资金</div>
          <div class="list-head__cell">来源</div>
          <div class="list-head__cell">资金类型</div>
        </div>
        <div class="list-body" v-loading="listLoading">
          <div v-if="!listLoading && tableData.data.length === 0" class="list-empty">
            <i class="el-icon-document"></i>
            <p>暂无资金流水记录</p>
          </div>
          <div v-for="(row, idx) in tableData.data" :key="idx" class="list-row">
            <!-- 用户信息 -->
            <div class="list-cell list-cell--user">
              <div class="user-info">
                <div class="user-info__avatar">
                  <el-avatar :src="row.avatar || defaultAvatar" :size="32">{{ initialChar(row.nickName) }}</el-avatar>
                </div>
                <div class="user-info__detail">
                  <div class="user-info__name">
                    <span class="kv__v">{{ row.nickName || '-' }}</span>
                    <span class="kv__uid">ID:{{ row.uid }}</span>
                  </div>
                  <div class="kv">
                    <span class="kv__k">会员账号：</span>
                    <span class="kv__v kv__v--num">{{ row.phone || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- 订单 -->
            <div class="list-cell">
              <div class="kv">
                <span class="kv__k">订单号：</span>
                <span class="kv__v kv__v--num">{{ row.linkId && row.linkId !== '0' ? row.linkId : '—' }}</span>
                <span v-if="row.linkId && row.linkId !== '0'" class="kv__copy" @click="copyText(row.linkId)">
                  <i class="el-icon-document-copy"></i>
                </span>
              </div>
              <div class="kv">
                <span class="kv__k">时间：</span>
                <span class="kv__v kv__v--num">{{ row.createTime || '—' }}</span>
              </div>
            </div>
            <!-- 资金 -->
            <div class="list-cell">
              <div class="kv">
                <span class="kv__k">资金增减：</span>
                <span :class="['kv__v', 'kv__v--num', row.pm == 1 ? 'money-up' : 'money-down']">
                  {{ row.pm == 1 ? '+' : '-' }}{{ formatNumber(row.number) }}
                </span>
              </div>
              <div class="kv">
                <span class="kv__k">剩余资金：</span>
                <span class="kv__v kv__v--num">{{ formatNumber(row.balance) }}</span>
              </div>
            </div>
            <!-- 来源 -->
            <div class="list-cell">
              <div class="kv">
                <span class="kv__k">来源业务：</span>
                <span class="kv__v">{{ row.title || '—' }}</span>
              </div>
              <div class="kv">
                <span class="kv__k">备注：</span>
                <span class="kv__v kv__v--wrap">{{ row.mark || '—' }}</span>
              </div>
            </div>
            <!-- 资金类型 -->
            <div class="list-cell list-cell--last">
              <div class="status-tag" :class="categoryTagClass(row.category)">
                {{ categoryLabel(row.category) }}
              </div>
              <div class="status-tag status-tag--info type-tag">
                {{ row.title || '—' }}
              </div>
              <div class="kv" style="margin-top: 6px">
                <span class="status-tag" :class="row.pm == 1 ? 'status-tag--success' : 'status-tag--danger'">
                  {{ row.pm == 1 ? '增加' : '扣减' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 分页 -->
      <div class="list-pager">
        <el-pagination
          :page-sizes="[20, 40, 60, 80]"
          :page-size="tableFrom.limit"
          :current-page="tableFrom.page"
          layout="total, sizes, prev, pager, next, jumper"
          :total="tableData.total"
          background
          @size-change="handleSizeChange"
          @current-change="pageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { monitorListApi } from '@/api/financial';
import UserSearchInput from '@/components/base/UserSearchInput';

export default {
  name: 'AccountsCapital',
  components: { UserSearchInput },
  data() {
    return {
      defaultAvatar: '',
      timeVal: [],
      listLoading: false,
      tableFrom: {
        category: 'all',
        title: '',
        linkId: '',
        dateLimit: '',
        content: '',
        searchType: 'all',
        page: 1,
        limit: 20,
      },
      tableData: {
        data: [],
        total: 0,
      },
      // 项目类型下拉：根据当前账户类型 tab 动态切换（对应 xml168 实际业务数据）
      titleOptionsByCategory: {
        all: [
          { value: 'recharge', label: '余额充值' },
          { value: 'payProduct', label: '购买商品' },
          { value: 'productRefund', label: '商品退款' },
          { value: 'admin', label: '后台操作' },
          { value: 'order', label: '订单佣金' },
          { value: 'orderDistribution', label: '分销佣金' },
          { value: 'orderTeamGap', label: '团队级差奖' },
          { value: 'orderTeamPeer', label: '团队平级奖' },
          { value: 'withdraw', label: '佣金提现' },
        ],
        now_money: [
          { value: 'recharge', label: '余额充值' },
          { value: 'payProduct', label: '购买商品' },
          { value: 'productRefund', label: '商品退款' },
          { value: 'admin', label: '后台操作' },
        ],
        brokerage_price: [
          { value: 'order', label: '订单佣金' },
          { value: 'orderDistribution', label: '分销佣金' },
          { value: 'orderTeamGap', label: '团队级差奖' },
          { value: 'orderTeamPeer', label: '团队平级奖' },
          { value: 'withdraw', label: '佣金提现' },
          { value: 'admin', label: '后台操作' },
        ],
        integral: [
          { value: 'admin', label: '后台操作' },
          { value: 'order', label: '下单赠送' },
        ],
      },
    };
  },
  computed: {
    titleOptions() {
      return this.titleOptionsByCategory[this.tableFrom.category] || this.titleOptionsByCategory.all;
    },
    tableStyle() {
      // 5 列：用户信息 / 订单 / 资金 / 来源 / 资金类型
      return {
        '--list-cols':
          'minmax(220px, 1.2fr) minmax(220px, 1.1fr) minmax(200px, 1fr) minmax(220px, 1.2fr) minmax(160px, 0.8fr)',
      };
    },
  },
  mounted() {
    this.getList();
  },
  methods: {
    // 切换账户类型 tab：清掉项目类型，避免枚举不匹配
    onChangeCategory() {
      this.tableFrom.title = '';
      this.getList(1);
    },
    onChangeTitle() {
      this.getList(1);
    },
    // 重置
    handleReset() {
      this.tableFrom.title = '';
      this.tableFrom.linkId = '';
      this.tableFrom.dateLimit = '';
      this.tableFrom.content = '';
      this.tableFrom.searchType = 'all';
      this.tableFrom.category = 'all';
      this.timeVal = [];
      this.getList(1);
    },
    onchangeTime(e) {
      this.timeVal = e || [];
      this.tableFrom.dateLimit = e && e.length === 2 ? `${e[0]},${e[1]}` : '';
      this.getList(1);
    },
    // 拉列表
    getList(num) {
      this.listLoading = true;
      this.tableFrom.page = num || this.tableFrom.page;
      // 'all' 不传 category 给后端
      const params = { ...this.tableFrom };
      if (params.category === 'all') delete params.category;
      monitorListApi(params)
        .then((res) => {
          this.tableData.data = res.list || [];
          this.tableData.total = res.total || 0;
          this.listLoading = false;
        })
        .catch((err) => {
          this.$message.error(err && err.message ? err.message : '加载失败');
          this.listLoading = false;
        });
    },
    pageChange(page) {
      this.tableFrom.page = page;
      this.getList();
    },
    handleSizeChange(val) {
      this.tableFrom.limit = val;
      this.getList(1);
    },
    handleExportAll() {
      this.$message.info('导出全部数据待后端提供导出接口');
    },
    copyText(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => this.$message.success('已复制'));
      } else {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        this.$message.success('已复制');
      }
    },
    formatNumber(n) {
      if (n === null || n === undefined) return '0';
      const num = Number(n);
      if (Number.isNaN(num)) return n;
      if (Math.abs(num - Math.round(num)) < 1e-6) return String(Math.round(num));
      return num.toFixed(2);
    },
    initialChar(name) {
      if (!name) return '?';
      return name.slice(0, 1).toUpperCase();
    },
    categoryLabel(c) {
      return { now_money: '余额', integral: '信用值', brokerage_price: '佣金' }[c] || '其他';
    },
    categoryTagClass(c) {
      return (
        {
          now_money: 'status-tag--primary',
          integral: 'status-tag--warning',
          brokerage_price: 'status-tag--success',
        }[c] || 'status-tag--info'
      );
    },
  },
};
</script>

<style lang="scss" scoped>
/* ==================== 列表页基座样式（自包含，取自 java3.0 list-page.scss 基座） ==================== */
.filter-form {
  padding: 16px 20px 0;
}

.filter-group {
  & + & {
    margin-top: 6px;
    padding-top: 14px;
    border-top: 1px dashed #ebeef5;
  }
}

/* 组内网格：本页 3 列 */
.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 18px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .el-form-item {
    margin-bottom: 14px;
    margin-right: 0;
  }

  .el-form-item__label {
    padding: 0 0 6px !important;
    line-height: 20px;
    font-size: 13px;
    color: #909399;
  }

  .el-form-item__content {
    line-height: 32px;
  }

  .el-select,
  .el-cascader,
  .el-input {
    width: 100%;
  }

  /* UserSearchInput 内部输入框带全局 .selWidth（width:260px !important），覆盖为撑满列宽 */
  ::v-deep .selWidth {
    width: 100% !important;
  }
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0;
  border-top: none;

  .el-button + .el-button {
    margin-left: 10px;
  }
}

/* 列表表格 */
.list-table {
  --list-cols: 1fr;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  background: #fff;
}

.list-head {
  display: grid;
  grid-template-columns: var(--list-cols);
  align-items: center;
  height: 46px;
  padding: 0 16px;
  background: #ecf3fd;
  border-bottom: 1px solid #dbe7f8;

  &__cell {
    min-width: 0;
    font-size: 14px;
    font-weight: 600;
    color: #2c3e50;
    letter-spacing: 0.01em;
  }
}

.list-body {
  min-height: 180px;
}

.list-row {
  display: grid;
  grid-template-columns: var(--list-cols);
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f2f5;
  transition: background-color 0.18s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #fafcff;
  }
}

.list-cell {
  min-width: 0;
  padding-right: 16px;
}

.list-cell--last {
  padding-right: 0;
}

.list-empty {
  padding: 60px 0;
  text-align: center;
  color: #c0c4cc;

  i {
    font-size: 36px;
  }

  p {
    margin-top: 8px;
    font-size: 14px;
  }
}

/* 键值行 */
.kv {
  display: flex;
  align-items: center;
  font-size: 13px;
  line-height: 24px;

  &__k {
    flex-shrink: 0;
    margin-right: 2px;
    color: #909399;
  }

  &__v {
    min-width: 0;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__v--num {
    font-variant-numeric: tabular-nums;
  }

  &__uid {
    flex-shrink: 0;
    margin-left: 6px;
    padding: 0 5px;
    border-radius: 2px;
    font-size: 12px;
    line-height: 18px;
    color: #2f7de1;
    background: #ecf5ff;
    font-variant-numeric: tabular-nums;
  }

  &__copy {
    flex-shrink: 0;
    margin-left: 6px;
    font-size: 13px;
    color: #b4bcc8;
    cursor: pointer;
    transition: color 0.16s ease;

    &:hover {
      color: #409eff;
    }
  }
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  height: 20px;
  line-height: 20px;
  padding: 0 7px;
  margin: 0 4px 4px 0;
  border-radius: 3px;
  font-size: 12px;
  background: #f0f2f5;
  color: #909399;

  &--primary {
    background: #ecf5ff;
    color: #2f7de1;
  }

  &--warning {
    background: #fdf6ec;
    color: #d98b1f;
  }

  &--info {
    background: #f4f4f5;
    color: #7d838c;
  }

  &--danger {
    background: #fef0f0;
    color: #e04c4c;
  }

  &--success {
    background: #f0f9eb;
    color: #52a832;
  }
}

/* ==================== 页面局部 ==================== */
.financial-flow {
  padding: 14px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 0 4px;

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    line-height: 24px;
  }
}

.filter-card {
  margin-bottom: 14px;
}

/* 第一行：高频条件与操作按钮同排 */
.filter-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f2f5;

  @media (max-width: 980px) {
    flex-wrap: wrap;
    gap: 12px;

    &__side {
      width: 100%;
      justify-content: flex-end;
    }
  }

  &__main {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  &__label {
    flex-shrink: 0;
    padding-right: 12px;
    color: #606266;
    line-height: 32px;
  }

  &__side {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

.filter-segment {
  ::v-deep .el-radio-button__inner {
    min-width: 76px;
    text-align: center;
  }
}

/* 项目类型：标签拉回控件左侧 */
.filter-type-item {
  display: flex;
  align-items: center;
  margin-bottom: 0 !important;

  ::v-deep .el-form-item__label {
    flex-shrink: 0;
    padding: 0 8px 0 0 !important;
    line-height: 32px;
  }

  ::v-deep .el-form-item__content {
    line-height: 32px;
  }

  ::v-deep .el-select {
    width: 220px;
  }
}

.filter-group--grid {
  margin-top: 14px;
}

.list-pager {
  margin-top: 14px;
  text-align: right;
}

/* 用户信息列 */
.list-cell--user {
  .user-info {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    &__avatar {
      flex-shrink: 0;
    }

    &__detail {
      min-width: 0;
      flex: 1;
    }

    &__name {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
  }
}

/* 金额增/减色（中国惯例：增加=红，减少=绿） */
.money-up {
  color: #e04c4c;
  font-weight: 600;
}

.money-down {
  color: #52a832;
  font-weight: 600;
}

/* 资金类型列的明细标签 */
.type-tag {
  display: inline-block;
  margin-top: 6px;
}

/* 长备注允许换行 */
.kv__v--wrap {
  white-space: normal;
  word-break: break-all;
  line-height: 20px;
}
</style>

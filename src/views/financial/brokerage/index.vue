<template>
  <div class="divBox">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: 0 }">
      <div class="padding-add">
        <el-form label-width="75px" :inline="true">
          <el-form-item label="变动类型：">
            <el-select @change="onTypeChange" class="selWidth" v-model="tableFrom.type" clearable placeholder="请选择">
              <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="tableFrom.type === 1" label="返佣细分：">
            <el-select
              @change="getList(1)"
              class="selWidth"
              v-model="tableFrom.brokerageLevel"
              clearable
              placeholder="全部订单返佣"
            >
              <el-option
                v-for="item in brokerageLevelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态：">
            <el-select
              @change="getList(1)"
              class="selWidth"
              v-model="tableFrom.status"
              clearable
              placeholder="全部状态"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    <el-card class="box-card mt14">
      <el-table
        v-loading="listLoading"
        :data="tableData.data"
        style="width: 100%"
        size="mini"
        class="table"
        highlight-current-row
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="佣金变动" min-width="100">
          <template slot-scope="scope">
            <span :class="scope.row.type == 1 ? 'color_red' : 'color_green'"
              >{{ scope.row.type == 1 ? '+' : '-' }}{{ scope.row.price }}</span
            >
          </template>
        </el-table-column>
        <el-table-column prop="mark" label="变动信息" min-width="200" show-overflow-tooltip />
        <el-table-column label="佣金类型" min-width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.linkType === 'order'" size="mini" :type="getBrokerageLevelTagType(scope.row.brokerageLevel)">
              {{ getBrokerageLevelLabel(scope.row.brokerageLevel) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="变动类型" min-width="130" prop="title" />
        <el-table-column label="状态" min-width="100">
          <template slot-scope="scope">
            <el-tag size="mini" :type="statusTagType(scope.row.status)">
              {{ statusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="用户信息" min-width="150" />
        <el-table-column label="时间" width="170" prop="updateTime"> </el-table-column>
      </el-table>
      <div class="block">
        <el-pagination
          :page-sizes="[20, 40, 60, 80]"
          :page-size="tableFrom.limit"
          :current-page="tableFrom.page"
          layout="total, sizes, prev, pager, next, jumper"
          :total="tableData.total"
          @size-change="handleSizeChange"
          @current-change="pageChange"
          background
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { brokerageListApi } from '@/api/financial';
import { getBrokerageLevelLabel, getBrokerageLevelTagType } from '@/utils/brokerage';
export default {
  name: 'AccountsCapital',
  data() {
    return {
      timeVal: [],
      tableData: {
        data: [],
        total: 0,
      },
      listLoading: true,
      tableFrom: {
        type: '',
        brokerageLevel: undefined,
        status: undefined,
        page: 1,
        limit: 20,
      },
      userTableFrom: {
        page: 1,
        limit: 10,
        dateLimit: '',
      },
      fromList: this.$constants.fromList,
      options: [],
      typeOptions: [
        { value: 1, label: '订单返佣' },
        { value: 2, label: '申请提现' },
        { value: 3, label: '提现失败' },
        { value: 4, label: '提现成功' },
        { value: 5, label: '佣金转余额' },
      ],
      statusOptions: [
        { value: 1, label: '待入账' },
        { value: 2, label: '冻结中' },
        { value: 3, label: '已完成' },
        { value: 4, label: '已失效' },
        { value: 5, label: '提现申请' },
      ],
      // 团队奖不在此页展示，请到「分销-团队奖资金记录」
      brokerageLevelOptions: [
        { value: 1, label: '一级推广' },
        { value: 2, label: '二级推广' },
        { value: 0, label: '自购返佣' },
      ],
    };
  },
  mounted() {
    // this.getTypes()
    this.getList();
  },
  methods: {
    getBrokerageLevelLabel,
    getBrokerageLevelTagType,
    statusLabel(status) {
      const map = { 1: '待入账', 2: '冻结中', 3: '已完成', 4: '已失效', 5: '提现申请' };
      return map[status] || '-';
    },
    statusTagType(status) {
      const map = { 1: 'info', 2: 'warning', 3: 'success', 4: 'danger', 5: '' };
      return map[status] || 'info';
    },
    onTypeChange() {
      if (this.tableFrom.type !== 1) {
        this.tableFrom.brokerageLevel = undefined;
      }
      this.getList(1);
    },
    // 列表
    getList(num) {
      this.listLoading = true;
      this.tableFrom.page = num ? num : this.tableFrom.page;
      const params = { ...this.tableFrom };
      if (params.status === '' || params.status === null) {
        delete params.status;
      }
      brokerageListApi(params)
        .then((res) => {
          this.tableData.data = res.list;
          this.tableData.total = res.total;
          this.listLoading = false;
        })
        .catch((res) => {
          this.listLoading = false;
        });
    },
    pageChange(page) {
      this.tableFrom.page = page;
      this.getList();
    },
    handleSizeChange(val) {
      this.tableFrom.limit = val;
      this.getList();
    },
    getTypes() {
      billTypeApi()
        .then((res) => {
          this.options = res.data;
          localStorage.setItem('CashKey', JSON.stringify(res.data));
        })
        .catch((res) => {
          this.$message.error(res.message);
        });
    },
  },
};
</script>

<style scoped lang="scss">
.dashboard-workplace {
  &-header {
    &-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      margin-right: 16px;
      font-weight: 600;
    }

    &-tip {
      width: 82%;
      display: inline-block;
      vertical-align: middle;
      margin-top: -12px;
      &-title {
        font-size: 13px;
        color: #000000;
        margin-bottom: 12px;
      }

      &-desc {
        width: 100%;
        &-sp {
          width: 32%;
          color: #17233d;
          font-size: 13px;
          display: inline-block;
          line-height: 25px;
        }
      }
    }

    &-extra {
      .ivu-col {
        p {
          text-align: right;
        }

        p:first-child {
          span:first-child {
            margin-right: 4px;
          }

          span:last-child {
            color: #808695;
          }
        }

        p:last-child {
          font-size: 22px;
        }
      }
    }
  }
}
.selWidth {
  width: 300px;
}
.color_red {
  color: #f5222d;
}
.color_green {
  color: #7abe5c;
}
</style>

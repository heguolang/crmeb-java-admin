<template>
  <div class="divBox">
    <el-card class="box-card">
      <div class="clearfix">
        <div class="container">
          <el-form size="small" label-width="90px" inline>
            <el-form-item label="时间选择：">
              <el-date-picker
                v-model="timeVal"
                value-format="yyyy-MM-dd"
                format="yyyy-MM-dd"
                size="small"
                type="daterange"
                placement="bottom-end"
                style="width: 250px"
                @change="onchangeTime"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
              />
            </el-form-item>
            <el-form-item label="处理状态：">
              <el-select class="selWidth" v-model="tableFrom.status" placeholder="请选择" clearable @change="getList(1)">
                <el-option label="全部" value="" />
                <el-option label="待处理" :value="0" />
                <el-option label="已处理" :value="1" />
              </el-select>
            </el-form-item>
            <el-form-item label="兑换方式：">
              <el-select class="selWidth" v-model="tableFrom.payType" placeholder="请选择" clearable @change="getList(1)">
                <el-option label="全部" value="" />
                <el-option label="积分兑权证" value="integral" />
                <el-option label="消费券兑权证" value="voucher" />
              </el-select>
            </el-form-item>
            <el-form-item label="用户UID：">
              <el-input v-model="tableFrom.uid" placeholder="用户ID" class="selWidth" size="small" clearable />
            </el-form-item>
            <el-form-item label="关键字：">
              <el-input v-model="tableFrom.keywords" placeholder="昵称/地址/UID" class="selWidth" size="small" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="getList(1)">搜索</el-button>
              <el-button size="small" @click="handleReset">重置</el-button>
              <el-button size="small" @click="openExportDialog">导出</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
    <export-date-dialog
      :visible.sync="exportDialogVisible"
      :loading="exportLoading"
      :value="timeVal"
      @confirm="onExportConfirm"
    />
    <el-card class="box-card mt14">
      <el-table v-loading="listLoading" :data="tableData.data" style="width: 100%" size="mini" highlight-current-row>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户名" min-width="160">
          <template slot-scope="scope">
            <div>{{ scope.row.nickname || '-' }}</div>
            <div>UID: {{ scope.row.uid }}</div>
          </template>
        </el-table-column>
        <el-table-column label="兑换方式" min-width="120">
          <template slot-scope="scope">
            <span>{{ scope.row.payType === 'voucher' ? '消费券兑权证' : '积分兑权证' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="消耗数量" min-width="100" />
        <el-table-column prop="warrantAmount" label="兑换权证数量" min-width="120" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag size="mini" type="warning" v-if="scope.row.status === 0">待处理</el-tag>
            <el-tag size="mini" type="success" v-else-if="scope.row.status === 1">已处理</el-tag>
            <span v-else>{{ scope.row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.status === 0"
              type="text"
              size="small"
              @click="onUpdateStatus(scope.row.id, 1)"
            >标记已处理</el-button>
            <el-button
              v-if="scope.row.status === 1"
              type="text"
              size="small"
              @click="onUpdateStatus(scope.row.id, 0)"
            >改回待处理</el-button>
          </template>
        </el-table-column>
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
import { warrantExchangeListApi, warrantExchangeStatusApi } from '@/api/financial';
import ExportDateDialog from '@/components/ExportDateDialog';
import { runListExport } from '@/utils/listExport';

export default {
  name: 'WarrantExchangeApply',
  components: { ExportDateDialog },
  data() {
    return {
      exportDialogVisible: false,
      exportLoading: false,
      timeVal: [],
      listLoading: false,
      tableData: {
        data: [],
        total: 0,
      },
      tableFrom: {
        uid: '',
        status: '',
        payType: '',
        keywords: '',
        dateLimit: '',
        page: 1,
        limit: 20,
      },
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    openExportDialog() {
      this.exportDialogVisible = true;
    },
    async onExportConfirm(dateLimit) {
      this.exportLoading = true;
      const statusMap = { 0: '待处理', 1: '已处理' };
      const ok = await runListExport({
        apiFn: warrantExchangeListApi,
        params: {
          keywords: this.tableFrom.keywords || undefined,
          payType: this.tableFrom.payType || undefined,
          uid: this.tableFrom.uid ? Number(this.tableFrom.uid) : undefined,
          status:
            this.tableFrom.status === '' || this.tableFrom.status === null || this.tableFrom.status === undefined
              ? undefined
              : Number(this.tableFrom.status),
        },
        dateLimit: dateLimit || this.tableFrom.dateLimit,
        filename: '权证兑换导出',
        header: ['ID', 'UID', '用户名', '兑换方式', '消耗数量', '兑换权证数量', '地址', '状态', '申请时间'],
        filterVal: ['id', 'uid', 'nickname', 'payTypeText', 'payAmount', 'warrantAmount', 'address', 'statusText', 'createTime'],
        mapRow: (row) => ({
          id: row.id,
          uid: row.uid,
          nickname: row.nickname || '',
          payTypeText: row.payType === 'voucher' ? '消费券兑权证' : '积分兑权证',
          payAmount: row.payAmount,
          warrantAmount: row.warrantAmount,
          address: row.address || '',
          statusText: statusMap[row.status] != null ? statusMap[row.status] : row.status,
          createTime: row.createTime || '',
        }),
      });
      this.exportLoading = false;
      if (ok) this.exportDialogVisible = false;
    },
    handleReset() {
      this.tableFrom.uid = '';
      this.tableFrom.status = '';
      this.tableFrom.payType = '';
      this.tableFrom.keywords = '';
      this.tableFrom.dateLimit = '';
      this.timeVal = [];
      this.getList(1);
    },
    onchangeTime(e) {
      this.timeVal = e;
      this.tableFrom.dateLimit = e ? this.timeVal.join(',') : '';
      this.getList(1);
    },
    getList(page) {
      this.listLoading = true;
      this.tableFrom.page = page || this.tableFrom.page;
      const params = {
        page: this.tableFrom.page,
        limit: this.tableFrom.limit,
        dateLimit: this.tableFrom.dateLimit || undefined,
        keywords: this.tableFrom.keywords || undefined,
        payType: this.tableFrom.payType || undefined,
        uid: this.tableFrom.uid ? Number(this.tableFrom.uid) : undefined,
        status: this.tableFrom.status === '' || this.tableFrom.status === null || this.tableFrom.status === undefined
          ? undefined
          : Number(this.tableFrom.status),
      };
      warrantExchangeListApi(params)
        .then((res) => {
          this.tableData.data = (res && res.list) || [];
          this.tableData.total = (res && res.total) || 0;
        })
        .catch(() => {
          this.tableData.data = [];
          this.tableData.total = 0;
        })
        .finally(() => {
          this.listLoading = false;
        });
    },
    pageChange(page) {
      this.getList(page);
    },
    handleSizeChange(val) {
      this.tableFrom.limit = val;
      this.getList(1);
    },
    onUpdateStatus(id, status) {
      const tip = status === 1 ? '确认标记为已处理？' : '确认改回待处理？';
      this.$confirm(tip, '提示', { type: 'warning' })
        .then(() => warrantExchangeStatusApi({ id, status }))
        .then(() => {
          this.$message.success('操作成功');
          this.getList();
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.selWidth {
  width: 180px;
}
.mt14 {
  margin-top: 14px;
}
</style>

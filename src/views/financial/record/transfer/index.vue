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
            <el-form-item label="转出UID：">
              <el-input v-model="tableFrom.fromUid" placeholder="转出用户ID" class="selWidth" size="small" clearable />
            </el-form-item>
            <el-form-item label="转入UID：">
              <el-input v-model="tableFrom.toUid" placeholder="转入用户ID" class="selWidth" size="small" clearable />
            </el-form-item>
            <el-form-item label="用户UID：">
              <el-input v-model="tableFrom.uid" placeholder="任一侧用户ID" class="selWidth" size="small" clearable />
            </el-form-item>
            <el-form-item label="转账单号：">
              <el-input v-model="tableFrom.transferNo" placeholder="转账单号" class="selWidth" size="small" clearable />
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
        <el-table-column prop="transferNo" label="转账单号" min-width="180" />
        <el-table-column label="转出用户" min-width="140">
          <template slot-scope="scope">
            <div>UID: {{ scope.row.fromUid }}</div>
            <div>{{ scope.row.fromNickname || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="转入用户" min-width="140">
          <template slot-scope="scope">
            <div>UID: {{ scope.row.toUid }}</div>
            <div>{{ scope.row.toNickname || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="转账金额" min-width="100" />
        <el-table-column prop="fromBalance" label="转出后余额" min-width="110" />
        <el-table-column prop="toBalance" label="转入后余额" min-width="110" />
        <el-table-column prop="mark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template slot-scope="scope">
            <el-tag size="mini" type="success" v-if="scope.row.status === 1">成功</el-tag>
            <span v-else>{{ scope.row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="转账时间" width="170" />
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
import { moneyTransferListApi } from '@/api/financial';
import ExportDateDialog from '@/components/ExportDateDialog';
import { runListExport } from '@/utils/listExport';

export default {
  name: 'MoneyTransferRecord',
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
        fromUid: '',
        toUid: '',
        uid: '',
        transferNo: '',
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
      const ok = await runListExport({
        apiFn: moneyTransferListApi,
        params: {
          transferNo: this.tableFrom.transferNo || undefined,
          fromUid: this.tableFrom.fromUid ? Number(this.tableFrom.fromUid) : undefined,
          toUid: this.tableFrom.toUid ? Number(this.tableFrom.toUid) : undefined,
          uid: this.tableFrom.uid ? Number(this.tableFrom.uid) : undefined,
        },
        dateLimit: dateLimit || this.tableFrom.dateLimit,
        filename: '余额转账导出',
        header: [
          'ID',
          '转账单号',
          '转出UID',
          '转出昵称',
          '转入UID',
          '转入昵称',
          '转账金额',
          '转出后余额',
          '转入后余额',
          '备注',
          '状态',
          '转账时间',
        ],
        filterVal: [
          'id',
          'transferNo',
          'fromUid',
          'fromNickname',
          'toUid',
          'toNickname',
          'amount',
          'fromBalance',
          'toBalance',
          'mark',
          'statusText',
          'createTime',
        ],
        mapRow: (row) => ({
          id: row.id,
          transferNo: row.transferNo,
          fromUid: row.fromUid,
          fromNickname: row.fromNickname || '',
          toUid: row.toUid,
          toNickname: row.toNickname || '',
          amount: row.amount,
          fromBalance: row.fromBalance,
          toBalance: row.toBalance,
          mark: row.mark || '',
          statusText: row.status === 1 ? '成功' : row.status,
          createTime: row.createTime || '',
        }),
      });
      this.exportLoading = false;
      if (ok) this.exportDialogVisible = false;
    },
    handleReset() {
      this.tableFrom.fromUid = '';
      this.tableFrom.toUid = '';
      this.tableFrom.uid = '';
      this.tableFrom.transferNo = '';
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
        transferNo: this.tableFrom.transferNo || undefined,
        fromUid: this.tableFrom.fromUid ? Number(this.tableFrom.fromUid) : undefined,
        toUid: this.tableFrom.toUid ? Number(this.tableFrom.toUid) : undefined,
        uid: this.tableFrom.uid ? Number(this.tableFrom.uid) : undefined,
      };
      moneyTransferListApi(params)
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

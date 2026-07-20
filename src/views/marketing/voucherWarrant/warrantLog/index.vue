<template>
  <div class="divBox">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: 0 }">
      <div class="padding-add">
        <el-form inline size="small" label-width="75px">
          <el-form-item label="时间选择：">
            <el-date-picker
              v-model="timeVal"
              value-format="yyyy-MM-dd"
              format="yyyy-MM-dd"
              size="small"
              type="daterange"
              placement="bottom-end"
              style="width: 260px"
              @change="onchangeTime"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
            />
          </el-form-item>
          <el-form-item label="微信昵称：">
            <el-input v-model="tableFrom.keywords" placeholder="请输入用户昵称" class="selWidth" size="small" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="getList(1)">搜索</el-button>
            <el-button size="small" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    <el-card class="box-card mt14">
      <el-table v-loading="listLoading" :data="tableData.data" size="mini" highlight-current-row>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="130" />
        <el-table-column prop="warrant" label="变动权证" min-width="120" />
        <el-table-column prop="balance" label="剩余权证" min-width="120" />
        <el-table-column prop="mark" label="备注" min-width="180" />
        <el-table-column prop="nickname" label="用户昵称" min-width="120" />
        <el-table-column prop="updateTime" label="时间" width="170" />
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
import { warrantRecordListApi } from '@/api/marketing';

export default {
  name: 'WarrantLog',
  data() {
    return {
      listLoading: false,
      tableData: { data: [], total: 0 },
      tableFrom: { page: 1, limit: 20, dateLimit: '', keywords: '' },
      timeVal: [],
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    handleReset() {
      this.timeVal = [];
      this.tableFrom.dateLimit = '';
      this.tableFrom.keywords = '';
      this.getList(1);
    },
    onchangeTime(e) {
      this.timeVal = e;
      this.tableFrom.dateLimit = e ? e.join(',') : '';
    },
    getList(page) {
      this.listLoading = true;
      this.tableFrom.page = page || this.tableFrom.page;
      warrantRecordListApi({ page: this.tableFrom.page, limit: this.tableFrom.limit }, this.tableFrom)
        .then((res) => {
          this.tableData.data = res.list || [];
          this.tableData.total = res.total || 0;
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

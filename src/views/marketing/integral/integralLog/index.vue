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
              placeholder="自定义时间"
              style="width: 260px"
              @change="onchangeTime"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
            />
          </el-form-item>
          <el-form-item label="微信昵称：">
            <el-input
              v-model="tableFrom.keywords"
              placeholder="请输入用户昵称"
              class="selWidth"
              size="small"
            ></el-input>
          </el-form-item>
          <el-form-item label="状态：">
            <el-select
              v-model="tableFrom.status"
              placeholder="全部状态"
              clearable
              class="selWidth"
              size="small"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="getList(1)">搜索</el-button>
            <el-button size="small" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    <el-card class="box-card mt14">
      <el-table v-loading="listLoading" :data="tableData.data" size="mini" class="table" highlight-current-row>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="130" />
        <el-table-column
          sortable
          prop="balance"
          label="积分余量"
          min-width="120"
          :sort-method="
            (a, b) => {
              return a.balance - b.balance;
            }
          "
        />
        <el-table-column
          sortable
          label="明细数字"
          min-width="120"
          prop="integral"
          :sort-method="
            (a, b) => {
              return a.integral - b.integral;
            }
          "
        />
        <el-table-column label="备注" min-width="120" prop="mark" />
        <el-table-column label="状态" min-width="100">
          <template slot-scope="scope">
            <el-tag size="mini" :type="statusTagType(scope.row.status)">
              {{ statusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户昵称" min-width="120" prop="nickName" />
        <el-table-column prop="updateTime" label="	添加时间" width="170" />
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
import { integralListApi } from '@/api/marketing';
import cardsData from '@/components/cards/index';
export default {
  components: { cardsData },
  data() {
    return {
      loading: false,
      options: [],
      fromList: this.$constants.fromList,
      listLoading: false,
      tableData: {
        data: [],
        total: 0,
      },
      tableFrom: {
        page: 1,
        limit: 20,
        dateLimit: '',
        keywords: '',
        status: undefined,
      },
      statusOptions: [
        { value: 1, label: '创建' },
        { value: 2, label: '冻结中' },
        { value: 3, label: '已完成' },
        { value: 4, label: '已失效' },
      ],
      userIdList: [],
      userList: [],
      timeVal: [],
      values: [],
    };
  },
  mounted() {
    this.getList();
    // this.getUserList()
  },
  methods: {
    statusLabel(status) {
      const map = { 1: '创建', 2: '冻结中', 3: '已完成', 4: '已失效' };
      return map[status] || '-';
    },
    statusTagType(status) {
      const map = { 1: 'info', 2: 'warning', 3: 'success', 4: 'danger' };
      return map[status] || 'info';
    },
    //重置
    handleReset() {
      this.timeVal = [];
      this.tableFrom.dateLimit = '';
      this.tableFrom.keywords = '';
      this.tableFrom.status = undefined;
      this.getList();
    },
    seachList() {
      this.tableFrom.page = 1;
      this.getList();
    },
    // 选择时间
    selectChange(tab) {
      this.tableFrom.dateLimit = tab;
      this.tableFrom.page = 1;
      this.timeVal = [];
      this.getList();
    },
    // 具体日期
    onchangeTime(e) {
      this.timeVal = e;
      this.tableFrom.dateLimit = e ? this.timeVal.join(',') : '';
      this.tableFrom.page = 1;
      this.getList();
    },
    // 列表
    getList(num) {
      this.listLoading = true;
      if (num) {
        this.tableFrom.page = num;
      }
      const params = { ...this.tableFrom };
      if (params.status === '' || params.status === null) {
        delete params.status;
      }
      integralListApi({ limit: params.limit, page: params.page }, params)
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
  },
};
</script>

<style lang="sass" scoped></style>

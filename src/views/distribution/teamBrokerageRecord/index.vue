<template>
  <div class="divBox">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: 0 }">
      <div class="padding-add">
        <el-form inline size="small" :model="tableFrom" label-width="90px">
          <el-form-item label="关键字：">
            <el-input
              v-model="tableFrom.keywords"
              placeholder="UID/昵称/手机号/订单号"
              clearable
              class="selWidth"
              @keyup.enter.native="searchList"
            />
          </el-form-item>
          <el-form-item label="奖项类型：">
            <el-select v-model="tableFrom.brokerageLevel" placeholder="全部团队奖" clearable class="selWidth">
              <el-option
                v-for="item in teamBrokerageLevelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态：">
            <el-select v-model="tableFrom.status" placeholder="全部状态" clearable class="selWidth">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间：">
            <el-date-picker
              v-model="timeVal"
              type="daterange"
              value-format="yyyy-MM-dd"
              format="yyyy-MM-dd"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              align="right"
              @change="onDateChange"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchList">搜索</el-button>
            <el-button @click="resetList">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    <el-row :gutter="12" class="mt14">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">团队奖发放合计</div>
          <div class="stat-value color_red">￥{{ stats.totalAmount }}</div>
          <div class="stat-sub">共 {{ stats.totalCount }} 笔</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">团队极差奖</div>
          <div class="stat-value color_red">￥{{ stats.diffAmount }}</div>
          <div class="stat-sub">共 {{ stats.diffCount }} 笔</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">团队平级奖</div>
          <div class="stat-value color_red">￥{{ stats.peerAmount }}</div>
          <div class="stat-sub">共 {{ stats.peerCount }} 笔</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">状态分布</div>
          <div class="stat-sub stat-status">
            <span>待入账 {{ stats.statusCount[1] || 0 }}</span>
            <span>冻结中 {{ stats.statusCount[2] || 0 }}</span>
            <span>已完成 {{ stats.statusCount[3] || 0 }}</span>
            <span>已失效 {{ stats.statusCount[4] || 0 }}</span>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-card class="box-card mt14">
      <div class="table-toolbar">
        <el-button
          v-hasPermi="['admin:system:team:level:brokerage:record']"
          type="primary"
          size="small"
          @click="openReissue"
        >
          漏发补发
        </el-button>
        <el-button
          v-hasPermi="['admin:system:team:level:brokerage:record']"
          size="small"
          @click="openAudit"
        >
          漏发检测
        </el-button>
      </div>
      <el-table v-loading="listLoading" :data="tableData.data" style="width: 100%" size="mini" highlight-current-row>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" min-width="150">
          <template slot-scope="scope">
            <div>{{ scope.row.userName || '-' }}</div>
            <div class="sub-text">UID: {{ scope.row.uid }}</div>
          </template>
        </el-table-column>
        <el-table-column label="金额" min-width="100">
          <template slot-scope="scope">
            <span class="color_red">+{{ scope.row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="奖项类型" min-width="120">
          <template slot-scope="scope">
            <el-tag size="mini" :type="getBrokerageLevelTagType(scope.row.brokerageLevel)">
              {{ getBrokerageLevelLabel(scope.row.brokerageLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="130" />
        <el-table-column prop="linkId" label="关联订单" min-width="160" show-overflow-tooltip />
        <el-table-column prop="mark" label="备注" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" min-width="90">
          <template slot-scope="scope">
            <el-tag size="mini" :type="statusTagType(scope.row.status)">
              {{ statusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
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
    <el-dialog
      title="团队奖漏发补发"
      :visible.sync="reissueDialog"
      width="640px"
      :close-on-click-modal="false"
      @closed="resetReissue"
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="按当前团队等级配置重放该订单的团队奖计算，与已有记录按「用户+奖项」去重后仅补发缺失部分，已发放的不会重复发放。"
      />
      <el-form inline size="small" class="mt14">
        <el-form-item label="订单号：">
          <el-input
            v-model="reissueOrderNo"
            placeholder="请输入订单号"
            clearable
            style="width: 380px"
            @keyup.enter.native="doReissue"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="reissueLoading" @click="doReissue">确认补发</el-button>
        </el-form-item>
      </el-form>
      <div v-if="reissueResult !== null">
        <div v-if="reissueRecords.length === 0" class="reissue-empty">
          未发现漏发。该订单已有团队奖记录 {{ reissueResult.existingCount || 0 }} 条<template
            v-if="reissueResult.invalidCount > 0"
          >（其中已失效 {{ reissueResult.invalidCount }} 条）</template>。
        </div>
        <el-table v-else :data="reissueRecords" size="mini" border max-height="320">
          <el-table-column label="用户" min-width="130">
            <template slot-scope="scope">
              <div>{{ scope.row.userName || '-' }}</div>
              <div class="sub-text">UID: {{ scope.row.uid }}</div>
            </template>
          </el-table-column>
          <el-table-column label="奖项" width="110">
            <template slot-scope="scope">
              <el-tag size="mini" :type="getBrokerageLevelTagType(scope.row.brokerageLevel)">
                {{ getBrokerageLevelLabel(scope.row.brokerageLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="100">
            <template slot-scope="scope">
              <span class="color_red">+{{ scope.row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="mark" label="说明" min-width="240" show-overflow-tooltip />
        </el-table>
        <div v-if="reissueRecords.length > 0" class="reissue-total">
          本次补发 {{ reissueRecords.length }} 条，合计 ￥{{ reissueResult.totalAmount }}
        </div>
      </div>
      <span slot="footer">
        <el-button @click="reissueDialog = false">关闭</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="团队奖漏发检测"
      :visible.sync="auditDialog"
      width="1000px"
      :close-on-click-modal="false"
      @closed="resetAudit"
    >
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="扫描时间段内已支付、未退款的订单，按当前团队等级配置试算团队奖并与实际发放记录比对，只读不改数据。"
      />
      <el-form inline size="small" class="mt14">
        <el-form-item label="支付时间：">
          <el-date-picker
            v-model="auditTimeVal"
            type="daterange"
            value-format="yyyy-MM-dd"
            format="yyyy-MM-dd"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            align="right"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="auditLoading" @click="doAudit">开始检测</el-button>
        </el-form-item>
      </el-form>
      <div v-if="auditDone">
        <div v-if="auditList.length === 0" class="reissue-empty">未检测到漏发订单。</div>
        <template v-else>
          <el-table v-loading="auditLoading" :data="auditList" size="mini" border max-height="360">
            <el-table-column prop="orderNo" label="订单号" min-width="200" show-overflow-tooltip />
            <el-table-column label="买家" min-width="120">
              <template slot-scope="scope">
                <div>{{ scope.row.userName || '-' }}</div>
                <div class="sub-text">UID: {{ scope.row.uid }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="payPrice" label="实付" width="90" />
            <el-table-column prop="payTime" label="支付时间" width="160" />
            <el-table-column prop="missingDetail" label="漏发明细" min-width="200" show-overflow-tooltip />
            <el-table-column label="漏发金额" width="100">
              <template slot-scope="scope">
                <span class="color_red">￥{{ scope.row.missingAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="mini" @click="reissueOne(scope.row)">补发</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="reissue-total">
            共 {{ auditList.length }} 单存在漏发，合计 ￥{{ auditTotalAmount }}
            <el-button
              type="primary"
              size="mini"
              class="ml10"
              :loading="batchLoading"
              @click="reissueAll"
            >
              一键全部补发
            </el-button>
          </div>
        </template>
      </div>
      <span slot="footer">
        <el-button @click="auditDialog = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  teamBrokerageRecordListApi,
  teamBrokerageRecordStatsApi,
  teamBrokerageRecordReissueApi,
  teamBrokerageRecordAuditApi,
} from '@/api/teamLevel';
import {
  BROKERAGE_LEVEL_TEAM_DIFF,
  BROKERAGE_LEVEL_TEAM_PEER,
  getBrokerageLevelLabel,
  getBrokerageLevelTagType,
} from '@/utils/brokerage';

export default {
  name: 'TeamBrokerageRecord',
  data() {
    return {
      listLoading: false,
      timeVal: [],
      tableFrom: {
        page: 1,
        limit: 20,
        keywords: '',
        brokerageLevel: undefined,
        status: undefined,
        dateLimit: '',
      },
      tableData: {
        data: [],
        total: 0,
      },
      stats: {
        totalAmount: '0.00',
        totalCount: 0,
        diffAmount: '0.00',
        diffCount: 0,
        peerAmount: '0.00',
        peerCount: 0,
        statusCount: {},
      },
      reissueDialog: false,
      reissueLoading: false,
      reissueOrderNo: '',
      reissueResult: null,
      auditDialog: false,
      auditLoading: false,
      auditDone: false,
      auditTimeVal: [],
      auditList: [],
      batchLoading: false,
      teamBrokerageLevelOptions: [
        { value: BROKERAGE_LEVEL_TEAM_DIFF, label: '团队极差奖' },
        { value: BROKERAGE_LEVEL_TEAM_PEER, label: '团队平级奖' },
      ],
      statusOptions: [
        { value: 1, label: '待入账' },
        { value: 2, label: '冻结中' },
        { value: 3, label: '已完成' },
        { value: 4, label: '已失效' },
      ],
    };
  },
  mounted() {
    this.getList();
  },
  computed: {
    reissueRecords() {
      if (!this.reissueResult || !this.reissueResult.records) return [];
      return this.reissueResult.records;
    },
    auditTotalAmount() {
      return this.auditList
        .reduce((sum, item) => sum + Number(item.missingAmount || 0), 0)
        .toFixed(2);
    },
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
    onDateChange(val) {
      if (!val || val.length !== 2) {
        this.tableFrom.dateLimit = '';
        return;
      }
      this.tableFrom.dateLimit = `${val[0]},${val[1]}`;
    },
    searchList() {
      this.tableFrom.page = 1;
      this.getList();
    },
    resetList() {
      this.timeVal = [];
      this.tableFrom = {
        page: 1,
        limit: 20,
        keywords: '',
        brokerageLevel: undefined,
        status: undefined,
        dateLimit: '',
      };
      this.getList();
    },
    getList() {
      this.listLoading = true;
      const params = this.buildParams();
      teamBrokerageRecordListApi(params)
        .then((res) => {
          this.tableData.data = (res && res.list) || [];
          this.tableData.total = (res && res.total) || 0;
          this.listLoading = false;
        })
        .catch(() => {
          this.listLoading = false;
        });
      this.getStats(params);
    },
    buildParams() {
      const params = { ...this.tableFrom };
      if (params.brokerageLevel === '' || params.brokerageLevel === null) {
        delete params.brokerageLevel;
      }
      if (params.status === '' || params.status === null) {
        delete params.status;
      }
      if (!params.dateLimit) {
        delete params.dateLimit;
      }
      if (!params.keywords) {
        delete params.keywords;
      }
      return params;
    },
    getStats(params) {
      const query = { ...(params || this.buildParams()) };
      delete query.page;
      delete query.limit;
      teamBrokerageRecordStatsApi(query).then((res) => {
        this.stats = {
          totalAmount: (res && res.totalAmount) || '0.00',
          totalCount: (res && res.totalCount) || 0,
          diffAmount: (res && res.diffAmount) || '0.00',
          diffCount: (res && res.diffCount) || 0,
          peerAmount: (res && res.peerAmount) || '0.00',
          peerCount: (res && res.peerCount) || 0,
          statusCount: (res && res.statusCount) || {},
        };
      });
    },
    openReissue() {
      this.reissueResult = null;
      this.reissueOrderNo = '';
      this.reissueDialog = true;
    },
    resetReissue() {
      this.reissueResult = null;
      this.reissueOrderNo = '';
    },
    doReissue() {
      const orderNo = (this.reissueOrderNo || '').trim();
      if (!orderNo) {
        this.$message.warning('请输入订单号');
        return;
      }
      this.reissueLoading = true;
      teamBrokerageRecordReissueApi(orderNo)
        .then((res) => {
          this.reissueLoading = false;
          this.reissueResult = res || { records: [], totalAmount: '0.00', existingCount: 0, invalidCount: 0 };
          const records = (this.reissueResult && this.reissueResult.records) || [];
          if (records.length === 0) {
            this.$message.info('未发现漏发');
          } else {
            this.$message.success(`已补发 ${records.length} 条团队奖记录，合计 ￥${this.reissueResult.totalAmount}`);
            this.getList();
          }
        })
        .catch(() => {
          this.reissueLoading = false;
        });
    },
    openAudit() {
      this.auditDone = false;
      this.auditList = [];
      this.auditDialog = true;
    },
    resetAudit() {
      this.auditDone = false;
      this.auditList = [];
      this.auditTimeVal = [];
    },
    doAudit() {
      const params = {};
      if (this.auditTimeVal && this.auditTimeVal.length === 2) {
        params.startTime = this.auditTimeVal[0];
        params.endTime = this.auditTimeVal[1];
      }
      this.auditLoading = true;
      teamBrokerageRecordAuditApi(params)
        .then((res) => {
          this.auditLoading = false;
          this.auditList = res || [];
          this.auditDone = true;
          if (this.auditList.length === 0) {
            this.$message.success('未检测到漏发订单');
          } else {
            this.$message.warning(`检测到 ${this.auditList.length} 单存在漏发`);
          }
        })
        .catch(() => {
          this.auditLoading = false;
        });
    },
    reissueOne(row) {
      teamBrokerageRecordReissueApi(row.orderNo)
        .then((res) => {
          const records = (res && res.records) || [];
          if (records.length === 0) {
            this.$message.info('该订单已无漏发');
          } else {
            this.$message.success(`已补发 ${records.length} 条，合计 ￥${res.totalAmount}`);
          }
          this.auditList = this.auditList.filter((item) => item.orderNo !== row.orderNo);
          this.getList();
        })
        .catch(() => {});
    },
    reissueAll() {
      if (this.auditList.length === 0) return;
      this.$confirm(`确认补发列表中全部 ${this.auditList.length} 单的漏发团队奖？`, '提示', {
        confirmButtonText: '确认补发',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          const orderNos = this.auditList.map((item) => item.orderNo);
          this.batchLoading = true;
          let done = 0;
          let amount = 0;
          const step = (index) => {
            if (index >= orderNos.length) {
              this.batchLoading = false;
              this.$message.success(`批量补发完成：${done} 单，合计 ￥${amount.toFixed(2)}`);
              this.auditList = [];
              this.auditDone = true;
              this.getList();
              return;
            }
            teamBrokerageRecordReissueApi(orderNos[index])
              .then((res) => {
                const records = (res && res.records) || [];
                done += records.length;
                amount += Number((res && res.totalAmount) || 0);
                step(index + 1);
              })
              .catch(() => {
                step(index + 1);
              });
          };
          step(0);
        })
        .catch(() => {});
    },
    pageChange(page) {
      this.tableFrom.page = page;
      this.getList();
    },
    handleSizeChange(val) {
      this.tableFrom.limit = val;
      this.tableFrom.page = 1;
      this.getList();
    },
  },
};
</script>

<style scoped lang="scss">
.selWidth {
  width: 220px;
}
.sub-text {
  color: #999;
  font-size: 12px;
}
.color_red {
  color: #f5222d;
}
.stat-card {
  background: #fff;
  border-radius: 4px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.stat-label {
  color: #666;
  font-size: 13px;
}
.stat-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.8;
}
.stat-sub {
  color: #999;
  font-size: 12px;
}
.stat-status span {
  display: inline-block;
  margin-right: 10px;
}
.table-toolbar {
  margin-bottom: 10px;
}
.reissue-empty {
  padding: 12px 0;
  color: #67c23a;
  font-size: 13px;
}
.reissue-total {
  margin-top: 10px;
  text-align: right;
  font-size: 13px;
  color: #333;
}
.ml10 {
  margin-left: 10px;
}
</style>

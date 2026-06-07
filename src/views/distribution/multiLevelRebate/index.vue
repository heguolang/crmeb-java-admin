<template>
  <div class="divBox differential-rebate-page">
    <!-- 主体：卡片式标签页切换三块政策 -->
    <el-tabs v-model="activeTab" type="card" class="policy-tabs">
      <el-tab-pane label="   极差级目" name="levels">
        <el-card class="panel-card tab-inner-card" shadow="never">
          <div class="panel-head">
            <h3 class="panel-title">多层级直属直推与差额返佣政策（极差级目）</h3>
          </div>
          <p class="panel-desc">
            <strong>极差计算原理：</strong>下级先按自身职级拿走对应直推比例；剩余差额按极差规则向上归集，由更高职级的上级领取，直至分配完毕。
          </p>

          <div class="level-list">
            <div v-for="(row, index) in form.levels" :key="index" class="level-row">
              <el-tag type="primary" effect="dark" class="lv-badge">LV{{ index + 1 }}</el-tag>
            <div class="level-name-wrap">
              <UserLevelSelect
                v-model="row.levelId"
                placeholder="请选择会员等级"
                @change="(id, lv) => onRowLevelChange(row, id, lv)"
                @loaded="handleLevelListLoaded"
              />
            </div>
              <div class="level-ratio-wrap">
                <span class="field-label">直推比例</span>
                <el-input-number
                  v-model="row.ratio"
                  :min="0"
                  :max="100"
                  :step="0.1"
                  :precision="1"
                  controls-position="right"
                  class="ratio-num"
                />
                <span class="pct">%</span>
              </div>
              <el-button
                v-if="form.levels.length > 1"
                type="text"
                icon="el-icon-delete"
                class="btn-del"
                @click="removeLevel(index)"
              />
            </div>
          </div>

          <div class="add-level-bar">
            <span class="add-placeholder">新增职等</span>
            <div class="add-name-wrap">
              <UserLevelSelect
                v-model="newRank.levelId"
                placeholder="请选择新增职等等级"
                @change="(id, lv) => onNewRankLevelChange(id, lv)"
              />
            </div>
            <div class="add-ratio-wrap">
              <span class="field-label">直推奖金比例</span>
              <el-input-number
                v-model="newRank.ratio"
                :min="0"
                :max="100"
                :step="0.1"
                :precision="1"
                controls-position="right"
                class="ratio-num"
              />
              <span class="pct">%</span>
            </div>
            <el-button type="primary" icon="el-icon-plus" @click="commitNewLevel">录入新增等级</el-button>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="等代奖政策" name="peer">
        <el-card class="panel-card tab-inner-card" shadow="never">
          <div class="panel-head panel-head--switch">
            <h3 class="panel-title">平级保护利益分配奖（等代奖政策）</h3>
            <el-switch v-model="form.peer.enabled" active-color="#409EFF" />
          </div>
          <p class="panel-desc">
            当直属下级晋升至与上级<strong>同一职级</strong>时，启用「平级堵截保底奖」，避免上级在该单上出现 0 佣金；按代际向下追溯发放等代奖。
          </p>
          <template v-if="form.peer.enabled">
            <div class="form-block">
              <div class="block-label">计算基准</div>
              <el-radio-group v-model="form.peer.baseType" class="radio-stack">
                <el-radio label="subCommission">拿取下级获得佣金的名义比例 %</el-radio>
                <el-radio label="orderFlow">拿取该单交易总流水的比例 %</el-radio>
              </el-radio-group>
            </div>
            <div class="form-block">
              <div class="block-label">代际分配</div>
              <div v-for="(g, gi) in form.peer.generations" :key="gi" class="gen-row">
                <span class="gen-label">第 {{ gi + 1 }} 代同级佣金</span>
                <el-input-number
                  v-model="g.ratio"
                  :min="0"
                  :max="100"
                  :step="0.1"
                  :precision="1"
                  controls-position="right"
                  class="ratio-num ratio-num--sm"
                />
                <span class="pct">%</span>
              </div>
              <div class="gen-actions">
                <el-button size="small" type="danger" plain @click="shrinkPeerGen">缩减一级平级代</el-button>
                <el-button size="small" type="primary" @click="addPeerGen">增加下一代平级追溯</el-button>
              </div>
            </div>
          </template>
          <p v-else class="panel-muted">已关闭平级保护；开启后可配置等代奖比例。</p>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="越级伯乐奖" name="skip">
        <el-card class="panel-card tab-inner-card" shadow="never">
          <div class="panel-head panel-head--switch">
            <h3 class="panel-title">越级反超保底奖（伯乐永久提携）</h3>
            <el-switch v-model="form.skip.enabled" active-color="#409EFF" />
          </div>
          <p class="panel-desc">
            当下级职级<strong>超越</strong>上级时，上级仍可获得「伯乐提携保底奖」，保障长期推荐关系下的激励连续性。
          </p>
          <template v-if="form.skip.enabled">
            <div class="form-block">
              <div class="block-label">计算基准</div>
              <el-radio-group v-model="form.skip.baseType" class="radio-stack">
                <el-radio label="surpassDirect">拿超越人直推佣金比例 %</el-radio>
                <el-radio label="orderSales">拿本次订单销售流水额 %</el-radio>
              </el-radio-group>
            </div>
            <div class="form-block">
              <div class="block-label">越级档差</div>
              <div v-for="(gap, gi) in form.skip.gaps" :key="gi" class="gap-row">
                <div class="gap-title">下线恰好越 {{ gap.levels }} 级时获得</div>
                <p class="gap-example">{{ gap.example }}</p>
                <div class="gap-input-line">
                  <el-input-number
                    v-model="gap.ratio"
                    :min="0"
                    :max="100"
                    :step="0.1"
                    :precision="1"
                    controls-position="right"
                    class="ratio-num ratio-num--sm"
                  />
                  <span class="pct">%</span>
                </div>
              </div>
              <div class="gen-actions">
                <el-button size="small" type="danger" plain :disabled="form.skip.gaps.length <= 1" @click="shrinkSkipGap">
                  删减一档越级差
                </el-button>
                <el-button size="small" type="primary" @click="addSkipGap">增加越级档差</el-button>
              </div>
            </div>
          </template>
          <p v-else class="panel-muted">已关闭越级反超保底；开启后可按超越级差配置伯乐奖。</p>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-card class="panel-card footer-actions" shadow="never">
      <el-button type="primary" :loading="fakeSaving" @click="handleSave">保存配置（模拟）</el-button>
      <el-button @click="handleReset">恢复默认示例</el-button>
    </el-card>
  </div>
</template>

<script>
import UserLevelSelect from '@/components/UserLevelSelect';

const defaultForm = () => ({
  levels: [
    { levelId: null, name: 'V1 体验代理', ratio: 10 },
    { levelId: null, name: 'V2 白金会员', ratio: 18 },
    { levelId: null, name: 'V3 核心合伙人', ratio: 25 },
    { levelId: null, name: 'V4 城市合伙人', ratio: 32 },
    { levelId: null, name: 'V5 联创大使', ratio: 40 },
  ],
  peer: {
    enabled: true,
    baseType: 'subCommission',
    generations: [{ ratio: 10 }, { ratio: 5 }],
  },
  skip: {
    enabled: true,
    baseType: 'surpassDirect',
    gaps: [
      {
        levels: 1,
        example: '例如：直属为 V3，成团领袖为 V4',
        ratio: 6,
      },
      {
        levels: 2,
        example: '例如：直属为 V2，超越领袖为 V4',
        ratio: 4,
      },
    ],
  },
});

export default {
  name: 'MultiLevelRebateConfig',
  components: { UserLevelSelect },
  data() {
    return {
      activeTab: 'levels',
      form: defaultForm(),
      newRank: { levelId: null, name: '', ratio: 10 },
      fakeSaving: false,
      _didSyncLevelIds: false,
    };
  },
  computed: {
    /** 展示用：最高直推档 + 等代合计 + 越级档合计，封顶 100，保留一位小数 */
    maxTheoreticalPayout() {
      const ratios = this.form.levels.map((l) => Number(l.ratio) || 0);
      const maxLv = ratios.length ? Math.max(...ratios) : 0;
      let peerSum = 0;
      if (this.form.peer.enabled) {
        peerSum = this.form.peer.generations.reduce((s, g) => s + (Number(g.ratio) || 0), 0);
      }
      let skipSum = 0;
      if (this.form.skip.enabled) {
        skipSum = this.form.skip.gaps.reduce((s, g) => s + (Number(g.ratio) || 0), 0);
      }
      const v = Math.min(100, maxLv + peerSum + skipSum);
      return (Math.round(v * 10) / 10).toFixed(1);
    },
  },
  methods: {
    onRowLevelChange(row, id, lv) {
      row.levelId = id;
      row.name = lv && lv.name ? String(lv.name).trim() : '';
    },
    onNewRankLevelChange(id, lv) {
      this.newRank.levelId = id;
      this.newRank.name = lv && lv.name ? String(lv.name).trim() : '';
    },
    handleLevelListLoaded(list) {
      if (this._didSyncLevelIds || !list || !list.length) return;
      this._didSyncLevelIds = true;
      this.form.levels.forEach((row) => {
        if (row.levelId != null && row.levelId !== '') return;
        const hint = (row.name || '').trim();
        if (!hint) return;
        const hit = list.find((x) => (x.name || '').trim() === hint);
        if (hit) {
          row.levelId = hit.id;
          row.name = (hit.name || '').trim();
        }
      });
    },
    removeLevel(index) {
      if (this.form.levels.length <= 1) return;
      this.form.levels.splice(index, 1);
    },
    commitNewLevel() {
      if (this.newRank.levelId == null || this.newRank.levelId === '') {
        this.$message.warning('请先选择会员等级');
        return;
      }
      const ratio = Number(this.newRank.ratio);
      const name = (this.newRank.name || '').trim() || `等级#${this.newRank.levelId}`;
      this.form.levels.push({
        levelId: this.newRank.levelId,
        name,
        ratio: Number.isFinite(ratio) ? ratio : 0,
      });
      this.newRank = { levelId: null, name: '', ratio: 10 };
      this.$message.success('已添加等级（本地）');
    },
    addPeerGen() {
      this.form.peer.generations.push({ ratio: 0 });
    },
    shrinkPeerGen() {
      if (this.form.peer.generations.length <= 1) {
        this.$message.warning('至少保留一代平级追溯');
        return;
      }
      this.form.peer.generations.pop();
    },
    addSkipGap() {
      const next = this.form.skip.gaps.length + 1;
      this.form.skip.gaps.push({
        levels: next,
        example: `例如：直属与领袖相差 ${next} 个职级`,
        ratio: 0,
      });
    },
    shrinkSkipGap() {
      if (this.form.skip.gaps.length <= 1) return;
      this.form.skip.gaps.pop();
    },
    handleReset() {
      this.$confirm('确定恢复为页面内置的默认示例数据？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          this.form = defaultForm();
          this.newRank = { levelId: null, name: '', ratio: 10 };
          this._didSyncLevelIds = false;
          this.$message.success('已重置为默认示例');
        })
        .catch(() => {});
    },
    handleSave() {
      this.fakeSaving = true;
      setTimeout(() => {
        this.fakeSaving = false;
        this.$message.success('模拟保存成功（未请求后端）');
      }, 600);
    },
  },
};
</script>

<style scoped lang="scss">
.differential-rebate-page {
  background: #f5f7fa;
  margin: -20px -20px 0;
  padding: 16px 20px 24px;
  min-height: calc(100vh - 84px);
}

.page-head-tags {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 16px;
  padding: 12px 16px;
  margin-bottom: 14px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.title-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
}

.tag-health {
  margin-left: 4px;

  strong {
    color: #67c23a;
  }
}

.head-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-name {
  font-size: 14px;
  color: #606266;
}

.admin-avatar {
  background: #409eff;
  color: #fff;
}

.policy-tabs {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  overflow: hidden;

  ::v-deep .el-tabs__header {
    margin: 0;
    border-bottom: 1px solid #e4e7ed;
  }

  ::v-deep .el-tabs__nav {
    border: none;
  }

  ::v-deep .el-tabs__item {
    height: 44px;
    line-height: 44px;
    padding: 0 22px;
    font-size: 14px;
  }

  ::v-deep .el-tabs__content {
    padding: 16px;
    background: #f5f7fa;
  }
}

.tab-inner-card {
  border: 1px solid #ebeef5;
}

.panel-card {
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.panel-head {
  margin-bottom: 10px;

  &--switch {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.panel-desc {
  margin: 0 0 16px;
  font-size: 13px;
  color: #606266;
  line-height: 1.65;
}

.panel-muted {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.level-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.level-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 12px;
  padding: 12px 14px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;

  &:last-of-type {
    border-bottom: none;
  }
}

.lv-badge {
  min-width: 44px;
  text-align: center;
  border-radius: 4px;
}

.level-name-wrap,
.add-name-wrap {
  flex: 1;
  min-width: 160px;
}

.level-name-wrap {
  max-width: 320px;
}

.add-name-wrap {
  max-width: 280px;
}

.level-ratio-wrap,
.add-ratio-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

.ratio-num {
  width: 130px;

  &--sm {
    width: 120px;
  }
}

.pct {
  font-size: 14px;
  color: #606266;
}

.btn-del {
  color: #f56c6c;
  padding: 8px;
  margin-left: auto;
}

.add-level-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 12px;
  margin-top: 14px;
  padding: 12px 14px;
  background: #fafafa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.add-placeholder {
  font-size: 13px;
  color: #c0c4cc;
  min-width: 72px;
}

.form-block {
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }
}

.block-label {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.radio-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;

  ::v-deep .el-radio {
    margin-right: 0;
    line-height: 1.6;
    white-space: normal;
  }
}

.gen-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  margin-bottom: 10px;
}

.gen-label {
  min-width: 132px;
  font-size: 13px;
  color: #606266;
}

.gen-actions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.gap-row {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.gap-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.gap-example {
  margin: 6px 0 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.gap-input-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-actions {
  margin-top: 16px;
}
</style>

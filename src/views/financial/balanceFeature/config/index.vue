<template>
  <div class="divBox">
    <el-card shadow="never" v-loading="loading">
      <div slot="header">余额功能设置</div>
      <el-form ref="form" :model="form" label-width="180px" style="max-width: 720px">
        <el-form-item label="余额互转">
          <el-switch v-model="form.balanceTransferSwitch" active-value="1" inactive-value="0" />
          <div class="form-tip">关闭后 APP「我的账户」不展示转账入口，且无法发起余额互转</div>
        </el-form-item>
        <el-form-item label="佣金转余额">
          <el-switch v-model="form.brokerageToYueSwitch" active-value="1" inactive-value="0" />
          <div class="form-tip">关闭后 APP 充值页不展示「佣金转入」Tab，且无法将佣金转入余额</div>
        </el-form-item>
        <el-form-item label="余额充值">
          <el-switch v-model="form.balanceRechargeSwitch" active-value="1" inactive-value="0" />
          <div class="form-tip">关闭后 APP 不展示账户充值入口与「账户充值」Tab，且无法在线充值</div>
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          title="以上开关仅控制 APP 展示与对应接口；关闭后用户端立即生效（需重新进入页面或刷新用户信息）。"
          style="margin-bottom: 16px"
        />
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSave" v-hasPermi="['admin:finance:balance:feature:config']">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { balanceFeatureConfigGetApi, balanceFeatureConfigSaveApi } from '@/api/financial';

export default {
  name: 'BalanceFeatureConfig',
  data() {
    return {
      loading: false,
      saving: false,
      form: {
        balanceTransferSwitch: '1',
        brokerageToYueSwitch: '1',
        balanceRechargeSwitch: '1',
      },
    };
  },
  mounted() {
    this.loadConfig();
  },
  methods: {
    loadConfig() {
      this.loading = true;
      balanceFeatureConfigGetApi()
        .then((res) => {
          this.form = Object.assign({}, this.form, res || {});
        })
        .finally(() => {
          this.loading = false;
        });
    },
    onSave() {
      this.saving = true;
      balanceFeatureConfigSaveApi(this.form)
        .then(() => {
          this.$message.success('保存成功');
          this.loadConfig();
        })
        .finally(() => {
          this.saving = false;
        });
    },
  },
};
</script>

<style scoped>
.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>

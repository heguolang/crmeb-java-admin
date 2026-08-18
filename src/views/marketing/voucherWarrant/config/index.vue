<template>
  <div class="divBox">
    <el-card shadow="never">
      <div slot="header">CCEA / CEA配置</div>
      <el-form ref="form" :model="form" :rules="rules" label-width="220px" v-loading="loading" style="max-width: 720px">
        <el-form-item label="兑换开关">
          <el-switch v-model="form.voucherWarrantSwitch" active-value="1" inactive-value="0" />
          <div class="form-tip">关闭后 APP 端无法进行信用值/CCEA/CEA 兑换</div>
        </el-form-item>
        <el-form-item label="释放开关">
          <el-switch v-model="form.integralDailyReleaseSwitch" active-value="1" inactive-value="0" />
          <div class="form-tip">关闭后定时任务不再执行每日信用值强制释放</div>
        </el-form-item>
        <el-form-item label="多少信用值 = 1 CCEA（主动兑换）" prop="integralToVoucherRatio">
          <el-input v-model="form.integralToVoucherRatio" placeholder="例如 100，仅主动兑换使用" />
        </el-form-item>
        <el-form-item label="每日释放：多少信用值 = 1 CCEA" prop="integralDailyReleaseExchangeRatio">
          <el-input v-model="form.integralDailyReleaseExchangeRatio" placeholder="例如 1，与主动兑换比例独立" />
        </el-form-item>
        <el-form-item label="每日强制释放信用值百分比(%)" prop="integralDailyReleaseRatio">
          <el-input v-model="form.integralDailyReleaseRatio" placeholder="例如 1，范围 0~100" />
        </el-form-item>
        <el-form-item label="多少CCEA = 1 元余额" prop="voucherToBalanceRatio">
          <el-input v-model="form.voucherToBalanceRatio" placeholder="例如 10" />
        </el-form-item>
        <el-form-item label="多少CCEA = 1 CEA" prop="warrantNeedVoucher">
          <el-input v-model="form.warrantNeedVoucher" placeholder="例如 5，仅用CCEA兑换" />
        </el-form-item>
        <el-form-item label="多少信用值 = 1 CEA" prop="warrantNeedIntegral">
          <el-input v-model="form.warrantNeedIntegral" placeholder="例如 100，仅用信用值兑换" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { voucherWarrantConfigGetApi, voucherWarrantConfigSaveApi } from '@/api/marketing';

const positiveNumber = (rule, value, callback) => {
  if (value === undefined || value === null || value === '') {
    callback(new Error('请输入数值'));
    return;
  }
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) {
    callback(new Error('必须是大于0的数字'));
    return;
  }
  callback();
};

const percentNumber = (rule, value, callback) => {
  if (value === undefined || value === null || value === '') {
    callback(new Error('请输入百分比'));
    return;
  }
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0 || num > 100) {
    callback(new Error('需在0到100之间（不含0）'));
    return;
  }
  callback();
};

export default {
  name: 'VoucherWarrantConfig',
  data() {
    return {
      loading: false,
      saving: false,
      form: {
        voucherWarrantSwitch: '1',
        integralDailyReleaseSwitch: '1',
        integralToVoucherRatio: '100',
        integralDailyReleaseExchangeRatio: '1',
        integralDailyReleaseRatio: '1',
        voucherToBalanceRatio: '10',
        warrantNeedVoucher: '5',
        warrantNeedIntegral: '100',
      },
      rules: {
        integralToVoucherRatio: [{ validator: positiveNumber, trigger: 'blur' }],
        integralDailyReleaseExchangeRatio: [{ validator: positiveNumber, trigger: 'blur' }],
        integralDailyReleaseRatio: [{ validator: percentNumber, trigger: 'blur' }],
        voucherToBalanceRatio: [{ validator: positiveNumber, trigger: 'blur' }],
        warrantNeedVoucher: [{ validator: positiveNumber, trigger: 'blur' }],
        warrantNeedIntegral: [{ validator: positiveNumber, trigger: 'blur' }],
      },
    };
  },
  mounted() {
    this.loadConfig();
  },
  methods: {
    loadConfig() {
      this.loading = true;
      voucherWarrantConfigGetApi()
        .then((res) => {
          this.form = Object.assign({}, this.form, res || {});
        })
        .finally(() => {
          this.loading = false;
        });
    },
    onSave() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        this.saving = true;
        voucherWarrantConfigSaveApi(this.form)
          .then(() => {
            this.$message.success('保存成功');
            this.loadConfig();
          })
          .finally(() => {
            this.saving = false;
          });
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
